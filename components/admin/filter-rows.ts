// Plain helper (not a Client Component) so list pages can filter on the server.

/** Server-side counterpart of ListToolbar: applies `q` and `status` to already-loaded rows. */
export function filterRows<T extends { status: string; slug: string; title: { id: string; en: string } }>(
  rows: T[],
  { q, status }: { q?: string | string[]; status?: string | string[] },
) {
  const query = typeof q === "string" ? q.trim().toLowerCase() : "";
  const counts = {
    all: rows.length,
    published: rows.filter((r) => r.status === "published").length,
    draft: rows.filter((r) => r.status === "draft").length,
  };
  const filtered = rows.filter(
    (r) =>
      (status !== "published" && status !== "draft" ? true : r.status === status) &&
      (!query || `${r.title.id} ${r.title.en} ${r.slug}`.toLowerCase().includes(query)),
  );
  return { filtered, counts };
}
