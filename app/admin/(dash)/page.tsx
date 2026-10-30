import Link from "next/link";
import { count, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/admin/styles";

export const metadata = { title: "Ringkasan" };
export const instant = false;

async function countWhere(table: typeof schema.projects | typeof schema.posts) {
  const [row] = await db
    .select({
      all: count(),
      published: sql<number>`count(*) filter (where ${table.status} = 'published')`.mapWith(Number),
    })
    .from(table);
  return row;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [projects, posts, [services], [newMessages], latest] = await Promise.all([
    countWhere(schema.projects),
    countWhere(schema.posts),
    db.select({ value: count() }).from(schema.services),
    db.select({ value: count() }).from(schema.inquiries).where(eq(schema.inquiries.status, "new")),
    db.select().from(schema.inquiries).orderBy(desc(schema.inquiries.createdAt)).limit(5),
  ]);

  const stats = [
    { label: "Karya terbit", value: projects.published, detail: `${projects.all - projects.published} draf`, href: "/admin/projects" },
    { label: "Catatan Lab terbit", value: posts.published, detail: `${posts.all - posts.published} draf`, href: "/admin/posts" },
    { label: "Layanan", value: services.value, detail: "di halaman Layanan", href: "/admin/services" },
    { label: "Pesan baru", value: newMessages.value, detail: "belum dibaca", href: "/admin/inbox" },
  ];

  return (
    <>
      <PageHeader
        title={`Halo, ${user.name.split(" ")[0]}`}
        description="Kelola karya, catatan Lab, dan pesan dari calon klien."
        actions={
          <>
            <Link href="/admin/posts/new" className={buttonClass("ghost")}>
              Tulis catatan
            </Link>
            <Link href="/admin/projects/new" className={buttonClass()}>
              Tambah karya
            </Link>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-lg border border-line bg-paper-raised p-5 hover:border-ink/30">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.detail}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Pesan terbaru</h2>
        {latest.length === 0 ? (
          <p className="mt-3 text-muted">Belum ada pesan. Pesan dari form kontak akan muncul di sini.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper-raised">
            {latest.map((m) => (
              <li key={m.id}>
                <Link href="/admin/inbox" className="flex items-center gap-3 px-4 py-3 hover:bg-paper">
                  {m.status === "new" && <span className="size-2 shrink-0 rounded-full bg-scale" aria-label="Belum dibaca" />}
                  <span className="font-semibold">{m.name}</span>
                  <span className="truncate text-sm text-muted">{m.message}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
