import { corsHeaders, originOf, protectedResourceMetadata } from "@/lib/ai/oauth";

// RFC 9728: tells MCP clients which authorization server guards /api/mcp.
export function GET(request: Request) {
  return Response.json(protectedResourceMetadata(originOf(request.headers)), { headers: corsHeaders });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
