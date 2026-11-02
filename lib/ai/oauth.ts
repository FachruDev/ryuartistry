import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { issueToken } from "@/lib/ai/tokens";

// A small OAuth 2.1 authorization server so Claude can add /api/mcp as a custom connector:
// dynamic client registration, authorization code + PKCE (S256), and a token endpoint that
// hands out the same `ryu_` tokens the CMS already lists and revokes.

export const SCOPE = "cms";
const CODE_TTL_MS = 10 * 60_000;

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

/** Origin the request came in on, so metadata matches whichever domain the client used. */
export function originOf(headers: Headers) {
  const host = headers.get("x-forwarded-host") ?? headers.get("host") ?? "localhost:3000";
  const proto = headers.get("x-forwarded-proto") ?? (isLoopback(host.split(":")[0]) ? "http" : "https");
  return `${proto}://${host}`;
}

export function authorizationServerMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/admin/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    scopes_supported: [SCOPE],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
  };
}

export function protectedResourceMetadata(origin: string) {
  return {
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    scopes_supported: [SCOPE],
    bearer_methods_supported: ["header"],
    resource_name: "Ryuartistry CMS",
  };
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Protocol-Version",
};

/** OAuth error response (RFC 6749 §5.2). */
export function oauthError(error: string, description: string, status = 400) {
  return Response.json({ error, error_description: description }, { status, headers: corsHeaders });
}

function isLoopback(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/** https anywhere, plain http only on this machine, and app schemes like `cursor://`. */
export function isAllowedRedirectUri(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.hash) return false;
  if (url.protocol === "https:") return true;
  if (url.protocol === "http:") return isLoopback(url.hostname);
  return !["javascript:", "data:", "file:", "vbscript:", "blob:", "about:"].includes(url.protocol);
}

type Registration = { client_name?: unknown; redirect_uris?: unknown; token_endpoint_auth_method?: unknown };

export async function registerClient(body: Registration) {
  const redirectUris = body.redirect_uris;
  if (!Array.isArray(redirectUris) || !redirectUris.length || redirectUris.length > 10) {
    return { error: "invalid_redirect_uri", description: "redirect_uris harus berisi 1–10 URL." } as const;
  }
  if (!redirectUris.every((uri) => typeof uri === "string" && isAllowedRedirectUri(uri))) {
    return { error: "invalid_redirect_uri", description: "Gunakan https, atau http hanya untuk localhost." } as const;
  }
  const method = typeof body.token_endpoint_auth_method === "string" ? body.token_endpoint_auth_method : "none";
  if (!["none", "client_secret_post", "client_secret_basic"].includes(method)) {
    return { error: "invalid_client_metadata", description: `token_endpoint_auth_method ${method} tidak didukung.` } as const;
  }
  const name = typeof body.client_name === "string" && body.client_name.trim() ? body.client_name.trim().slice(0, 80) : "Aplikasi tanpa nama";

  const clientId = `ryuc_${randomBytes(16).toString("base64url")}`;
  const secret = method === "none" ? null : `ryus_${randomBytes(24).toString("base64url")}`;
  await db.insert(schema.oauthClients).values({
    id: clientId,
    name,
    redirectUris: redirectUris as string[],
    secretHash: secret ? hash(secret) : null,
  });
  return {
    client: {
      client_id: clientId,
      ...(secret ? { client_secret: secret, client_secret_expires_at: 0 } : {}),
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: name,
      redirect_uris: redirectUris,
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: method,
    },
  } as const;
}

export async function getClient(clientId: string) {
  if (!clientId) return null;
  const [client] = await db.select().from(schema.oauthClients).where(eq(schema.oauthClients.id, clientId));
  return client ?? null;
}

export type AuthorizeRequest = {
  client: schema.OAuthClient;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  scope: string;
};

/** Checks /admin/authorize parameters. Errors are shown on the page, never sent to an unverified redirect URI. */
export async function validateAuthorizeRequest(params: Record<string, string | undefined>) {
  const client = await getClient(params.client_id ?? "");
  if (!client) return { error: "Aplikasi ini belum terdaftar (client_id tidak dikenal). Coba hubungkan ulang dari Claude." };
  const redirectUri = params.redirect_uri ?? (client.redirectUris.length === 1 ? client.redirectUris[0] : "");
  if (!client.redirectUris.includes(redirectUri)) return { error: "Alamat kembali (redirect_uri) tidak cocok dengan pendaftaran aplikasi." };
  if (params.response_type !== "code") return { error: "Hanya response_type=code yang didukung." };
  if (!params.code_challenge || params.code_challenge_method !== "S256") {
    return { error: "Permintaan harus memakai PKCE dengan code_challenge_method=S256." };
  }
  return {
    request: {
      client,
      redirectUri,
      codeChallenge: params.code_challenge,
      state: params.state ?? "",
      scope: SCOPE,
    } satisfies AuthorizeRequest,
  };
}

export async function createCode(request: AuthorizeRequest, userId: string) {
  const code = randomBytes(32).toString("base64url");
  await db.insert(schema.oauthCodes).values({
    codeHash: hash(code),
    clientId: request.client.id,
    userId,
    redirectUri: request.redirectUri,
    codeChallenge: request.codeChallenge,
    scope: request.scope,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });
  return code;
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Resolves the client from `client_secret_basic`, `client_secret_post`, or a bare client_id (public clients). */
export async function authenticateClient(form: URLSearchParams, authorization: string | null) {
  let clientId = form.get("client_id") ?? "";
  let secret = form.get("client_secret");
  const basic = authorization?.match(/^Basic\s+(.+)$/i)?.[1];
  if (basic) {
    const [id, pass] = Buffer.from(basic, "base64").toString().split(":");
    clientId = decodeURIComponent(id ?? "");
    secret = decodeURIComponent(pass ?? "");
  }
  const client = await getClient(clientId);
  if (!client) return null;
  if (client.secretHash) {
    if (!secret || !safeEqual(hash(secret), client.secretHash)) return null;
  }
  return client;
}

/** Trades a code for an access token. The code is deleted on first use, valid or not. */
export async function exchangeCode(client: schema.OAuthClient, form: URLSearchParams) {
  const code = form.get("code") ?? "";
  const verifier = form.get("code_verifier") ?? "";
  const [row] = await db
    .delete(schema.oauthCodes)
    .where(and(eq(schema.oauthCodes.codeHash, hash(code)), gt(schema.oauthCodes.expiresAt, new Date())))
    .returning();
  if (!row || row.clientId !== client.id) return { error: "Kode otorisasi tidak valid atau kedaluwarsa." };
  if (form.get("redirect_uri") && form.get("redirect_uri") !== row.redirectUri) return { error: "redirect_uri tidak cocok." };
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  if (!verifier || !safeEqual(challenge, row.codeChallenge)) return { error: "code_verifier tidak cocok (PKCE)." };

  // Reconnecting the same app replaces its old token instead of piling up live ones.
  await db
    .update(schema.apiTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(schema.apiTokens.oauthClientId, client.id),
        eq(schema.apiTokens.createdBy, row.userId),
        isNull(schema.apiTokens.revokedAt),
      ),
    );
  const token = await issueToken(`${client.name} (connector)`, row.userId, client.id);
  return { token, scope: row.scope ?? SCOPE };
}
