import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { EmptyState, PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/admin/styles";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Tim" };
export const instant = false;

export default async function TeamPage() {
  await requireUser();
  const rows = await db.query.teamMembers.findMany({
    with: { photo: true },
    orderBy: [asc(schema.teamMembers.sortOrder)],
  });
  return (
    <>
      <PageHeader
        title="Tim"
        description="Orang-orang di balik Ryuartistry."
        actions={
          <Link href="/admin/team/new" className={buttonClass()}>
            Tambah anggota
          </Link>
        }
      />
      {rows.length === 0 ? (
        <EmptyState>Belum ada anggota tim. Tambahkan profil untuk halaman Tentang.</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((m) => (
            <li key={m.id}>
              <Link href={`/admin/team/${m.id}`} className="flex items-center gap-3 rounded-lg border border-line bg-paper-raised p-3 hover:border-ink/30">
                <div className="size-12 shrink-0 overflow-hidden rounded-full bg-line">
                  {m.photo && (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                    <img src={m.photo.url} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{m.name}</p>
                  <p className="truncate text-sm text-muted">{m.role.id || m.role.en}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
