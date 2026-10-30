import Link from "next/link";
import { count, desc, eq, sql } from "drizzle-orm";
import { ArrowRight, CheckCircle, Plus, Robot, User, Warning, Info } from "@phosphor-icons/react/ssr";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getTrafficSnapshot } from "@/lib/analytics";
import { getContentHealth } from "@/lib/cms-health";
import { entityLabel, type Entity } from "@/lib/activity";
import { buttonClass } from "@/components/admin/styles";
import { Card, LiveDot, StatTile } from "@/components/admin/cards";
import { TrendChart } from "@/components/admin/charts";

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

const relative = new Intl.RelativeTimeFormat("id", { numeric: "auto" });
function ago(date: Date) {
  const minutes = Math.round((date.getTime() - Date.now()) / 60000);
  if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, "hour");
  return relative.format(Math.round(hours / 24), "day");
}

const actionVerb = { create: "membuat", update: "memperbarui", delete: "menghapus" } as const;
const dayLabel = new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", timeZone: "UTC" });

function greeting() {
  const hour = (new Date().getUTCHours() + 7) % 24;
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [projects, posts, [newMessages], latest, traffic, health, activity] = await Promise.all([
    countWhere(schema.projects),
    countWhere(schema.posts),
    db.select({ value: count() }).from(schema.inquiries).where(eq(schema.inquiries.status, "new")),
    db.select().from(schema.inquiries).orderBy(desc(schema.inquiries.createdAt)).limit(4),
    getTrafficSnapshot(),
    getContentHealth(),
    db.select().from(schema.activityLog).orderBy(desc(schema.activityLog.createdAt)).limit(8),
  ]);

  const week = traffic.series.slice(7);
  const points = week.map((d, i) => ({
    label: dayLabel.format(new Date(d.day)),
    value: d.visitors,
    previous: traffic.series[i].visitors,
    detail: `${d.views} tayangan`,
  }));
  const warnings = health.filter((h) => h.severity === "warn").length;

  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{greeting()},</p>
          <h1 className="display mt-1 text-4xl sm:text-5xl">{user.name.split(" ")[0]}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/posts/new" className={buttonClass("ghost")}>
            <Plus size={16} weight="bold" /> Catatan Lab
          </Link>
          <Link href="/admin/projects/new" className={buttonClass()}>
            <Plus size={16} weight="bold" /> Karya baru
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Pengunjung 7 hari"
          value={traffic.visitors.toLocaleString("id-ID")}
          delta={traffic.visitorsChange}
          hint="vs minggu lalu"
          trend={traffic.series.map((d) => d.visitors)}
          href="/admin/analytics?range=7d"
        />
        <StatTile label="Karya terbit" value={String(projects.published)} hint={`${projects.all - projects.published} draf`} href="/admin/projects" />
        <StatTile label="Catatan Lab terbit" value={String(posts.published)} hint={`${posts.all - posts.published} draf`} href="/admin/posts" />
        <StatTile label="Pesan baru" value={String(newMessages.value)} hint="belum dibaca" href="/admin/inbox" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card
          title="Trafik minggu ini"
          description={`${traffic.views.toLocaleString("id-ID")} tayangan halaman`}
          action={
            <div className="flex items-center gap-3">
              <LiveDot count={traffic.live} />
              <Link href="/admin/analytics" className="hidden text-sm font-semibold text-ink/70 hover:text-ink sm:inline">
                Detail →
              </Link>
            </div>
          }
        >
          <TrendChart points={points} name="Pengunjung" previousName="Minggu lalu" height={220} />
        </Card>

        <Card
          title="Kesehatan konten"
          description={health.length ? `${health.length} hal perlu perhatian` : "Semua beres"}
          action={
            warnings > 0 ? (
              <span className="rounded-full bg-sakura/70 px-2 py-0.5 text-xs font-bold text-on-pastel">{warnings} penting</span>
            ) : undefined
          }
        >
          {health.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted">
              <CheckCircle size={32} weight="duotone" className="text-success" />
              Tidak ada konten yang kurang lengkap.
            </div>
          ) : (
            <ul className="space-y-2">
              {health.map((issue) => (
                <li key={issue.text}>
                  <details className="group rounded-xl border border-line bg-paper px-3 py-2.5">
                    <summary className="flex cursor-pointer list-none items-center gap-2.5 text-sm">
                      {issue.severity === "warn" ? (
                        <Warning size={16} weight="fill" className="shrink-0 text-accent" aria-label="Penting" />
                      ) : (
                        <Info size={16} weight="fill" className="shrink-0 text-glow" aria-label="Info" />
                      )}
                      <span className="flex-1 font-medium">{issue.text}</span>
                      {issue.items.length > 0 && <span className="text-xs font-semibold text-muted">{issue.items.length}</span>}
                    </summary>
                    <ul className="mt-2 space-y-1 border-t border-line pt-2">
                      {issue.items.slice(0, 6).map((item) => (
                        <li key={item.href + item.title}>
                          <Link href={item.href} className="flex items-center gap-2 rounded-md px-1 py-1 text-sm text-ink/80 hover:text-ink">
                            <ArrowRight size={12} /> <span className="truncate">{item.title}</span>
                          </Link>
                        </li>
                      ))}
                      {issue.items.length === 0 && (
                        <li>
                          <Link href={issue.href} className="text-sm font-semibold text-ink underline underline-offset-2">
                            Perbaiki sekarang
                          </Link>
                        </li>
                      )}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Pesan terbaru" action={<Link href="/admin/inbox" className="text-sm font-semibold text-ink/70 hover:text-ink">Inbox →</Link>}>
          {latest.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Belum ada pesan. Pesan dari form kontak akan muncul di sini.</p>
          ) : (
            <ul className="-mx-2 divide-y divide-line">
              {latest.map((m) => (
                <li key={m.id}>
                  <Link href="/admin/inbox" className="flex items-start gap-3 rounded-lg px-2 py-3 hover:bg-paper">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mizu text-sm font-bold text-on-pastel">
                      {m.name[0]?.toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-semibold">{m.name}</span>
                        {m.status === "new" && <span className="size-2 shrink-0 rounded-full bg-accent" aria-label="Belum dibaca" />}
                        <span className="ml-auto shrink-0 text-xs text-muted">{ago(m.createdAt)}</span>
                      </span>
                      <span className="line-clamp-1 text-sm text-muted">{m.message}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Aktivitas terbaru" description="Perubahan oleh tim dan asisten AI">
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Perubahan konten akan tercatat di sini.</p>
          ) : (
            <ol className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full ${a.actorType === "ai" ? "bg-wisteria text-on-pastel" : "bg-paper text-muted"}`}
                    title={a.actorType === "ai" ? "Asisten AI" : "Anggota tim"}
                  >
                    {a.actorType === "ai" ? <Robot size={14} weight="bold" /> : <User size={14} weight="bold" />}
                  </span>
                  <p className="min-w-0 flex-1 pt-0.5 leading-snug">
                    <span className="font-semibold">{a.actorName}</span> {actionVerb[a.action]} {entityLabel[a.entity as Entity] ?? a.entity}{" "}
                    <span className="font-medium">“{a.label}”</span>
                    <span className="block text-xs text-muted">{ago(a.createdAt)}</span>
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  );
}
