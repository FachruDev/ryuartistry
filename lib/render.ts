import "server-only";
import { generateHTML } from "@tiptap/html/server";
import type { JSONContent } from "@tiptap/core";
import { richTextExtensions } from "@/lib/tiptap";

const SAFE_URL = /^(https?:|mailto:|\/|#)/i;

/** Drops link/image URLs with unexpected schemes (e.g. `javascript:`) before rendering. */
function sanitize(node: JSONContent): JSONContent {
  const attrs = node.attrs ? { ...node.attrs } : undefined;
  if (attrs && node.type === "image" && typeof attrs.src === "string" && !SAFE_URL.test(attrs.src)) {
    attrs.src = "";
  }
  const marks = node.marks?.filter(
    (m) => m.type !== "link" || (typeof m.attrs?.href === "string" && SAFE_URL.test(m.attrs.href)),
  );
  return { ...node, attrs, marks, content: node.content?.map(sanitize) };
}

export function renderRichText(doc: JSONContent | null | undefined): string {
  if (!doc) return "";
  return generateHTML(sanitize(doc), richTextExtensions);
}
