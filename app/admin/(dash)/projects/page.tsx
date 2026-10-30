import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { formatDate } from "@/lib/i18n";
import { EmptyState, PageHeader, StatusBadge } from "@/components/admin/page-header";
import { buttonClass } from "@/components/admin/styles";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Karya" };
export const instant = false;

export default async function ProjectsPage() {
  await requireUser();
  const rows = await db.query.projects.findMany({
    with: { cover: true, category: true },
    orderBy: [asc(schema.projects.sortOrder), desc(schema.projects.createdAt)],
  });

  return (
    <>
      <PageHeader
        title="Karya"
        description="Portofolio proyek AI, game, software, dan kreatif."
        actions={
          <Link href="/admin/projects/new" className={buttonClass()}>
            Karya baru
          </Link>
        }
      />
      {rows.length === 0 ? (
        <EmptyState>Belum ada karya. Tambahkan proyek pertama untuk mengisi portofolio.</EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper-raised">
          {rows.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/projects/${p.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-paper">
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-line">
                  {p.cover && (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                    <img src={p.cover.url} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.title.id || p.title.en}</p>
                  <p className="truncate text-sm text-muted">
                    {[p.category?.name.id, p.year, p.featured ? "Di beranda" : null].filter(Boolean).join(", ")}
                  </p>
                </div>
                <span className="hidden text-sm text-muted sm:block">{formatDate(p.updatedAt, "id")}</span>
                <StatusBadge status={p.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
