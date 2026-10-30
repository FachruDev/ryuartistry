import { z } from "zod";
import { verifyBearer } from "@/lib/ai/tokens";
import { ToolError, tools } from "@/lib/mcp/tools";

// A stateless MCP server over Streamable HTTP: every request is a JSON-RPC message
// answered with plain JSON, so it runs as an ordinary serverless function.

const SUPPORTED_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS = `CMS Ryuartistry: studio kreatif (AI, game, software, kreatif). Situs dua bahasa, Indonesia (id) dan Inggris (en).
- Panggil cms_overview dulu untuk melihat kategori, jumlah konten, dan hal yang perlu diperbaiki.
- Semua teks yang tampil di situs diisi dua bahasa { id, en }. Tulis Indonesia yang natural, bukan terjemahan kaku.
- Konten baru dibuat sebagai draft kecuali pengguna meminta langsung terbit. Sebutkan adminUrl hasil simpan agar pengguna bisa meninjau.
- Untuk gambar: upload_media_from_url dulu, lalu pakai id-nya di coverId/gallery/photoId. Isi alt dua bahasa.
- Perubahan tampil di situs segera setelah disimpan. Hapus permanen hanya setelah pengguna setuju.`;

const toolList = tools.map((t) => ({
  name: t.name,
  title: t.title,
  description: t.description,
  inputSchema: z.toJSONSchema(t.input, { io: "input" }),
  ...(t.annotations ? { annotations: t.annotations } : {}),
}));

type RpcRequest = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };

const ok = (id: RpcRequest["id"], result: unknown) => ({ jsonrpc: "2.0", id, result });
const fail = (id: RpcRequest["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
const text = (value: unknown, isError = false) => ({
  content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value) }],
  ...(isError ? { isError: true } : {}),
});

async function callTool(params: Record<string, unknown> | undefined, actorName: string) {
  const tool = tools.find((t) => t.name === params?.name);
  if (!tool) return text(`Tool tidak dikenal: ${String(params?.name)}`, true);
  const parsed = tool.input.safeParse(params?.arguments ?? {});
  if (!parsed.success) {
    return text(`Argumen tidak valid:\n${z.prettifyError(parsed.error)}`, true);
  }
  try {
    const result = await tool.run(parsed.data as never, { actor: { type: "ai", name: actorName } });
    return text(result ?? { ok: true });
  } catch (error) {
    if (error instanceof ToolError) return text(error.message, true);
    console.error(`mcp tool ${tool.name} failed`, error);
    return text("Terjadi kesalahan di server saat menjalankan tool ini.", true);
  }
}

async function handle(message: RpcRequest, actorName: string) {
  const { id, method, params } = message;
  switch (method) {
    case "initialize": {
      const requested = typeof params?.protocolVersion === "string" ? params.protocolVersion : "";
      return ok(id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[1],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "ryuartistry-cms", title: "Ryuartistry CMS", version: "1.0.0" },
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: toolList });
    case "tools/call":
      return ok(id, await callTool(params, actorName));
    case "resources/list":
      return ok(id, { resources: [] });
    case "prompts/list":
      return ok(id, { prompts: [] });
    default:
      return fail(id, -32601, `Method tidak didukung: ${method}`);
  }
}

export async function POST(request: Request) {
  const token = await verifyBearer(request.headers.get("authorization"));
  if (!token) {
    return Response.json(fail(null, -32001, "Token tidak valid atau sudah dicabut. Buat token di CMS → Asisten AI."), {
      status: 401,
      headers: { "WWW-Authenticate": 'Bearer realm="ryuartistry-cms"' },
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(fail(null, -32700, "JSON tidak valid."), { status: 400 });
  }

  const messages = (Array.isArray(payload) ? payload : [payload]) as RpcRequest[];
  const actorName = `Claude · ${token.name}`;
  const responses = [];
  for (const message of messages) {
    if (!message || typeof message.method !== "string") {
      responses.push(fail(null, -32600, "Request JSON-RPC tidak valid."));
      continue;
    }
    // Notifications (no id) need no answer.
    if (message.id === undefined || message.id === null) continue;
    responses.push(await handle(message, actorName));
  }

  if (!responses.length) return new Response(null, { status: 202 });
  return Response.json(Array.isArray(payload) ? responses : responses[0]);
}

// No server-initiated stream and no sessions to end.
export function GET() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}

export function DELETE() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
