import { corsHeaders, oauthError, registerClient } from "@/lib/ai/oauth";

// RFC 7591 dynamic client registration. Registering grants nothing by itself:
// every client still needs an admin to approve it on /admin/authorize.
export async function POST(request: Request) {
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
