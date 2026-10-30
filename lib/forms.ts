import type { JSONContent } from "@tiptap/core";
import type { LinkItem, Localized, LocalizedDoc } from "@/lib/db/schema";

/** Result shape every admin Server Action returns to `useActionState`. */
export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean };

export function str(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function optionalStr(form: FormData, name: string): string | null {
  return str(form, name) || null;
}

export function int(form: FormData, name: string, fallback = 0): number {
  const n = Number.parseInt(str(form, name), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function optionalInt(form: FormData, name: string): number | null {
  const n = Number.parseInt(str(form, name), 10);
  return Number.isFinite(n) ? n : null;
}

export function bool(form: FormData, name: string): boolean {
  return form.get(name) === "on" || form.get(name) === "true";
}

/** Reads `<name>.id` and `<name>.en` inputs. */
export function localized(form: FormData, name: string): Localized {
  return { id: str(form, `${name}.id`), en: str(form, `${name}.en`) };
}

function parseDoc(raw: string): JSONContent | null {
  if (!raw) return null;
  try {
    const doc = JSON.parse(raw) as JSONContent;
    return doc && doc.type === "doc" ? doc : null;
  } catch {
    return null;
  }
}

/** Reads the hidden JSON inputs written by the rich-text editor. */
export function localizedDoc(form: FormData, name: string): LocalizedDoc {
  return { id: parseDoc(str(form, `${name}.id`)), en: parseDoc(str(form, `${name}.en`)) };
}

/** Comma- or newline-separated list, trimmed and de-duplicated. */
export function list(form: FormData, name: string): string[] {
  return [
    ...new Set(
      str(form, name)
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}

/** JSON array of ids written by the media picker. */
export function idList(form: FormData, name: string): string[] {
  try {
    const value = JSON.parse(str(form, name) || "[]");
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** One link per line: `Label | https://url`. */
export function links(form: FormData, name: string): LinkItem[] {
  return str(form, name)
    .split("\n")
    .map((line) => {
      const [label, url] = line.split("|").map((s) => s.trim());
      return url ? { label: label || url, url } : null;
    })
    .filter((l): l is LinkItem => l !== null && /^https?:\/\//.test(l.url));
}

export function linksToText(items: LinkItem[]): string {
  return items.map((l) => `${l.label} | ${l.url}`).join("\n");
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Postgres unique-violation code, used to turn slug clashes into a field error. */
export function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

/** Rough reading time from a Tiptap document. */
export function readingTime(doc: JSONContent | null): number {
  if (!doc) return 1;
  let words = 0;
  const walk = (node: JSONContent) => {
    if (node.text) words += node.text.split(/\s+/).filter(Boolean).length;
    node.content?.forEach(walk);
  };
  walk(doc);
  return Math.max(1, Math.round(words / 220));
}
