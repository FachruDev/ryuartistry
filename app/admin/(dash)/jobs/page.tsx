import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { EmptyState, PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/admin/styles";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Karier" };
export const instant = false;

export default async function JobsPage() {
  await requireUser();
  const rows = await db.select().from(schema.jobs).orderBy(asc(schema.jobs.sortOrder));
  return (
    <>
      <PageHeader
        title="Karier"
        description="Lowongan yang tampil di halaman Karier."
        actions={
          <Link href="/admin/jobs/new" className={buttonClass()}>
            Lowongan baru
          </Link>
        }
      />
      {rows.length === 0 ? (
        <EmptyState>Belum ada lowongan.</EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper-raised">
          {rows.map((j) => (
            <li key={j.id}>
              <Link href={`/admin/jobs/${j.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-paper">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{j.title.id || j.title.en}</p>
                  <p className="text-sm text-muted">
                    {j.location}, {j.employmentType}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    j.isOpen ? "bg-success/15 text-success" : "bg-line text-muted"
                  }`}
                >
                  {j.isOpen ? "Dibuka" : "Ditutup"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
