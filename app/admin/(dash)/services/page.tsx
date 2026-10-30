import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { EmptyState, PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/admin/styles";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Layanan" };
export const instant = false;

export default async function ServicesPage() {
  await requireUser();
  const rows = await db.select().from(schema.services).orderBy(asc(schema.services.sortOrder));
  return (
    <>
      <PageHeader
        title="Layanan"
        description="Apa yang Ryuartistry tawarkan ke klien."
        actions={
          <Link href="/admin/services/new" className={buttonClass()}>
            Layanan baru
          </Link>
        }
      />
      {rows.length === 0 ? (
        <EmptyState>Belum ada layanan.</EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper-raised">
          {rows.map((s) => (
            <li key={s.id}>
              <Link href={`/admin/services/${s.id}`} className="block px-4 py-3 hover:bg-paper">
                <p className="font-semibold">{s.title.id || s.title.en}</p>
                <p className="line-clamp-1 text-sm text-muted">{s.description.id || s.description.en}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
