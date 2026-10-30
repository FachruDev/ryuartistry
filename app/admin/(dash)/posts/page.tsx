import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { formatDate } from "@/lib/i18n";
import { EmptyState, PageHeader, StatusBadge } from "@/components/admin/page-header";
import { buttonClass } from "@/components/admin/styles";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Lab" };
export const instant = false;

export default async function PostsPage() {
  await requireUser();
  const rows = await db.query.posts.findMany({
    with: { category: true },
    orderBy: [desc(schema.posts.createdAt)],
  });

  return (
    <>
      <PageHeader
        title="Lab"
        description="Artikel, devlog, dan catatan eksperimen."
        actions={
          <Link href="/admin/posts/new" className={buttonClass()}>
            Catatan baru
          </Link>
        }
      />
      {rows.length === 0 ? (
        <EmptyState>Belum ada catatan. Tulis eksperimen atau devlog pertama Anda.</EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper-raised">
          {rows.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/posts/${p.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-paper">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.title.id || p.title.en}</p>
                  <p className="truncate text-sm text-muted">
                    {[p.category?.name.id, p.publishedAt ? formatDate(p.publishedAt, "id") : null].filter(Boolean).join(", ")}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
