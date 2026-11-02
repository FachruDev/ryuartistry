import { authenticateClient, corsHeaders, exchangeCode, oauthError } from "@/lib/ai/oauth";

export async function POST(request: Request) {
  const form = new URLSearchParams(await request.text());
  const client = await authenticateClient(form, request.headers.get("authorization"));
  if (!client) return oauthError("invalid_client", "Client tidak dikenal atau secret salah.", 401);

  if (form.get("grant_type") !== "authorization_code") {
    return oauthError("unsupported_grant_type", "Hanya grant_type=authorization_code yang didukung.");
  }
  const result = await exchangeCode(client, form);
  if ("error" in result) return oauthError("invalid_grant", result.error ?? "Kode tidak valid.");

  // Tokens do not expire; they stay valid until revoked in CMS → Asisten AI.
  return Response.json(
    { access_token: result.token, token_type: "Bearer", scope: result.scope },
    { headers: { ...corsHeaders, "Cache-Control": "no-store" } },
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
