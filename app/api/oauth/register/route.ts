import { corsHeaders, oauthError, registerClient } from "@/lib/ai/oauth";
import { clientIp, hashed, hit } from "@/lib/rate-limit";

// RFC 7591 dynamic client registration. Registering grants nothing by itself:
// every client still needs an admin to approve it on /admin/authorize.
export async function POST(request: Request) {
  if (await hit({ key: `oauth-register:ip:${hashed(clientIp(request.headers))}`, max: 20, windowMs: 60 * 60_000 })) {
    return oauthError("slow_down", "Terlalu banyak pendaftaran dari jaringan ini. Coba lagi nanti.", 429);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return oauthError("invalid_client_metadata", "Body harus JSON.");
  }
  if (!body || typeof body !== "object") return oauthError("invalid_client_metadata", "Body harus objek JSON.");

  const result = await registerClient(body);
  if (!("client" in result)) return oauthError(result.error, result.description);
  return Response.json(result.client, { status: 201, headers: corsHeaders });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
