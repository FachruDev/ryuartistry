import { authorizationServerMetadata, corsHeaders, originOf } from "@/lib/ai/oauth";

// RFC 8414: how Claude finds the authorize, token, and registration endpoints.
export function GET(request: Request) {
  return Response.json(authorizationServerMetadata(originOf(request.headers)), { headers: corsHeaders });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
