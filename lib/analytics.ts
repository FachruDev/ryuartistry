import "server-only";
import { and, count, eq, gte, lt, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";

// Reports use Western Indonesia Time, which has no daylight saving: a fixed UTC+7.
export const TZ = "Asia/Jakarta";
const OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const RANGES = { "7d": 7, "30d": 30, "90d": 90 } as const;
export type RangeKey = keyof typeof RANGES;

export function parseRange(value: unknown): RangeKey {
  return typeof value === "string" && value in RANGES ? (value as RangeKey) : "30d";
}

/** Today (Jakarta) and the `days - 1` days before it, plus the same-length period before that. */
export function rangeBounds(days: number, now = new Date()) {
  const todayStart = Math.floor((now.getTime() + OFFSET_MS) / DAY_MS) * DAY_MS - OFFSET_MS;
  const from = new Date(todayStart - (days - 1) * DAY_MS);
  const prevFrom = new Date(from.getTime() - days * DAY_MS);
  return { from, to: now, prevFrom };
}

export type Totals = {
  views: number;
  visitors: number;
  sessions: number;
  bounceRate: number;
  avgDurationMs: number;
  inquiries: number;
};

async function totals(from: Date, to: Date): Promise<Totals> {
  const inRange = and(gte(schema.pageViews.createdAt, from), lt(schema.pageViews.createdAt, to));
  const [[row], [bounce], [inq]] = await Promise.all([
    db
      .select({
        views: count(),
        visitors: sql<number>`count(distinct ${schema.pageViews.visitorId})`.mapWith(Number),
        sessions: sql<number>`count(distinct ${schema.pageViews.sessionId})`.mapWith(Number),
        avgDurationMs: sql<number>`coalesce(avg(${schema.pageViews.durationMs}), 0)`.mapWith(Number),
      })
      .from(schema.pageViews)
      .where(inRange),
    db
      .select({
        single: sql<number>`count(*) filter (where n = 1)`.mapWith(Number),
        all: count(),
      })
      .from(
        db
          .select({ n: sql<number>`count(*)`.as("n") })
          .from(schema.pageViews)
          .where(inRange)
          .groupBy(schema.pageViews.sessionId)
          .as("s"),
      ),
    db
      .select({ value: count() })
      .from(schema.inquiries)
      .where(and(gte(schema.inquiries.createdAt, from), lt(schema.inquiries.createdAt, to))),
  ]);
  return {
    views: row.views,
    visitors: row.visitors,
    sessions: row.sessions,
    avgDurationMs: Math.round(row.avgDurationMs),
    bounceRate: bounce.all ? bounce.single / bounce.all : 0,
    inquiries: inq.value,
  };
}

export type DayPoint = { day: string; views: number; visitors: number };

async function daily(from: Date, days: number): Promise<DayPoint[]> {
  const rows = await db
    .select({
      day: sql<string>`to_char(${schema.pageViews.createdAt} at time zone ${TZ}, 'YYYY-MM-DD')`,
      views: count(),
      visitors: sql<number>`count(distinct ${schema.pageViews.visitorId})`.mapWith(Number),
    })
    .from(schema.pageViews)
    .where(gte(schema.pageViews.createdAt, from))
    .groupBy(sql`1`);
  const byDay = new Map(rows.map((r) => [r.day, r]));
  // Fill the gaps so the chart has one point per day.
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(from.getTime() + OFFSET_MS + i * DAY_MS).toISOString().slice(0, 10);
    const r = byDay.get(day);
    return { day, views: r?.views ?? 0, visitors: r?.visitors ?? 0 };
  });
}

export type Row = { key: string; visitors: number; views: number };

async function breakdown(column: SQL, from: Date, limit = 8): Promise<Row[]> {
  return db
    .select({
      key: sql<string>`coalesce(${column}, '')`,
      visitors: sql<number>`count(distinct ${schema.pageViews.visitorId})`.mapWith(Number),
      views: count(),
    })
    .from(schema.pageViews)
    .where(gte(schema.pageViews.createdAt, from))
    .groupBy(sql`1`)
    .orderBy(sql`2 desc`, sql`3 desc`)
    .limit(limit);
}

export type PageRow = Row & { avgDurationMs: number; title: string };

async function topPages(from: Date, limit = 10): Promise<PageRow[]> {
  const rows = await db
    .select({
      key: schema.pageViews.path,
      visitors: sql<number>`count(distinct ${schema.pageViews.visitorId})`.mapWith(Number),
      views: count(),
      avgDurationMs: sql<number>`coalesce(avg(${schema.pageViews.durationMs}), 0)`.mapWith(Number),
    })
    .from(schema.pageViews)
    .where(gte(schema.pageViews.createdAt, from))
    .groupBy(schema.pageViews.path)
    .orderBy(sql`3 desc`)
    .limit(limit);
  const titles = await pageTitles(rows.map((r) => r.key));
  return rows.map((r) => ({ ...r, avgDurationMs: Math.round(r.avgDurationMs), title: titles.get(r.key) ?? r.key }));
}

const SECTION: Record<string, string> = {
  "": "Beranda",
  work: "Karya",
  lab: "Lab",
  services: "Layanan",
  about: "Tentang",
  contact: "Kontak",
};

/** Human names for public paths: section pages by name, detail pages by their CMS title. */
export async function pageTitles(paths: string[]): Promise<Map<string, string>> {
  const parsed = paths.map((path) => {
    const [, , section = "", slug] = path.split("/");
    return { path, section, slug };
  });
  const projectSlugs = parsed.filter((p) => p.section === "work" && p.slug).map((p) => p.slug!);
  const postSlugs = parsed.filter((p) => p.section === "lab" && p.slug).map((p) => p.slug!);
  const [projects, posts] = await Promise.all([
    projectSlugs.length
      ? db.select({ slug: schema.projects.slug, title: schema.projects.title }).from(schema.projects)
      : [],
    postSlugs.length ? db.select({ slug: schema.posts.slug, title: schema.posts.title }).from(schema.posts) : [],
  ]);
  const projectTitle = new Map(projects.map((p) => [p.slug, p.title.id || p.title.en]));
  const postTitle = new Map(posts.map((p) => [p.slug, p.title.id || p.title.en]));

  return new Map(
    parsed.map(({ path, section, slug }) => {
      if (slug && section === "work") return [path, projectTitle.get(slug) ?? slug];
      if (slug && section === "lab") return [path, postTitle.get(slug) ?? slug];
      return [path, SECTION[section] ?? path];
    }),
  );
}

export type HeatCell = { dow: number; hour: number; views: number };

async function heatmap(from: Date): Promise<HeatCell[]> {
  return db
    .select({
      dow: sql<number>`extract(isodow from ${schema.pageViews.createdAt} at time zone ${TZ})`.mapWith(Number),
      hour: sql<number>`extract(hour from ${schema.pageViews.createdAt} at time zone ${TZ})`.mapWith(Number),
      views: count(),
    })
    .from(schema.pageViews)
    .where(gte(schema.pageViews.createdAt, from))
    .groupBy(sql`1`, sql`2`);
}

/** Sessions with a page view in the last five minutes. */
export async function liveVisitors(): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(distinct ${schema.pageViews.sessionId})`.mapWith(Number) })
    .from(schema.pageViews)
    .where(gte(schema.pageViews.createdAt, new Date(Date.now() - 5 * 60 * 1000)));
  return row.value;
}

/** Published projects and posts nobody opened in the period. */
async function unseenContent(from: Date) {
  // Paths look like /<lang>/<section>/<slug>.
  const v = schema.pageViews;
  const seen = (section: string) =>
    sql`(select distinct split_part(${v.path}, '/', 4) from ${v} where ${v.createdAt} >= ${from} and split_part(${v.path}, '/', 3) = ${section})`;
  const [projects, posts] = await Promise.all([
    db
      .select({ slug: schema.projects.slug, title: schema.projects.title })
      .from(schema.projects)
      .where(and(eq(schema.projects.status, "published"), sql`${schema.projects.slug} not in ${seen("work")}`)),
    db
      .select({ slug: schema.posts.slug, title: schema.posts.title })
      .from(schema.posts)
      .where(and(eq(schema.posts.status, "published"), sql`${schema.posts.slug} not in ${seen("lab")}`)),
  ]);
  return [
    ...projects.map((p) => ({ kind: "project" as const, slug: p.slug, title: p.title.id || p.title.en })),
    ...posts.map((p) => ({ kind: "post" as const, slug: p.slug, title: p.title.id || p.title.en })),
  ];
}

export type Insight = { tone: "up" | "down" | "info" | "tip"; text: string };

const DAYS_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const pct = (n: number) => `${Math.round(n * 100)}%`;

export function change(current: number, previous: number): number | null {
  if (!previous) return current ? null : 0;
  return (current - previous) / previous;
}

function buildInsights(report: Omit<AnalyticsReport, "insights">): Insight[] {
  const out: Insight[] = [];
  const { current, previous, days } = report;

  if (current.views === 0) {
    out.push({
      tone: "info",
      text: "Belum ada kunjungan tercatat pada periode ini. Data mulai terkumpul otomatis begitu situs dibuka pengunjung.",
    });
    return out;
  }

  const delta = change(current.visitors, previous.visitors);
  if (delta === null) {
    out.push({ tone: "up", text: `${current.visitors} pengunjung pada ${days} hari terakhir; periode sebelumnya belum ada data.` });
  } else if (Math.abs(delta) >= 0.05) {
    out.push({
      tone: delta > 0 ? "up" : "down",
      text: `Pengunjung ${delta > 0 ? "naik" : "turun"} ${pct(Math.abs(delta))} dibanding ${days} hari sebelumnya (${previous.visitors} → ${current.visitors}).`,
    });
  } else {
    out.push({ tone: "info", text: `Jumlah pengunjung stabil dibanding ${days} hari sebelumnya.` });
  }

  const top = report.pages[0];
  if (top) out.push({ tone: "info", text: `Halaman paling ramai: ${top.title} (${top.views} tayangan dari ${top.visitors} pengunjung).` });

  const external = report.referrers.filter((r) => r.key);
  const referred = external.reduce((sum, r) => sum + r.visitors, 0);
  if (external[0]) {
    out.push({
      tone: "info",
      text: `Sumber rujukan terbesar: ${external[0].key} (${external[0].visitors} pengunjung). Sisanya datang langsung atau dari tautan tanpa rujukan.`,
    });
  } else if (referred === 0) {
    out.push({ tone: "tip", text: "Hampir semua pengunjung datang langsung. Bagikan tautan karya di media sosial untuk menambah sumber trafik." });
  }

  const peak = [...report.heatmap].sort((a, b) => b.views - a.views)[0];
  if (peak && peak.views >= 3) {
    out.push({
      tone: "tip",
      text: `Jam tersibuk: ${DAYS_ID[peak.dow - 1]} sekitar pukul ${String(peak.hour).padStart(2, "0")}.00 WIB. Waktu yang baik untuk menerbitkan atau membagikan konten baru.`,
    });
  }

  const mobile = report.devices.find((d) => d.key === "mobile");
  const deviceTotal = report.devices.reduce((sum, d) => sum + d.visitors, 0);
  if (mobile && deviceTotal && mobile.visitors / deviceTotal >= 0.5) {
    out.push({ tone: "tip", text: `${pct(mobile.visitors / deviceTotal)} pengunjung memakai ponsel. Pastikan gambar sampul tetap jelas di layar kecil.` });
  }

  const en = report.locales.find((l) => l.key === "en");
  const localeTotal = report.locales.reduce((sum, l) => sum + l.visitors, 0);
  if (en && localeTotal && en.visitors / localeTotal >= 0.25) {
    out.push({ tone: "tip", text: `${pct(en.visitors / localeTotal)} pengunjung membaca versi Inggris. Lengkapi terjemahan EN di setiap karya dan catatan.` });
  }

  if (current.sessions >= 10 && current.bounceRate >= 0.7) {
    out.push({
      tone: "down",
      text: `${pct(current.bounceRate)} kunjungan hanya membuka satu halaman. Tambahkan tautan ke karya terkait atau ajakan menghubungi di akhir halaman.`,
    });
  }

  if (current.visitors >= 20) {
    const rate = current.inquiries / current.visitors;
    out.push({
      tone: current.inquiries ? "up" : "tip",
      text: current.inquiries
        ? `${current.inquiries} pesan masuk dari ${current.visitors} pengunjung (konversi ${(rate * 100).toFixed(1)}%).`
        : "Belum ada pesan masuk dari pengunjung periode ini. Pertimbangkan ajakan kontak yang lebih menonjol di halaman karya.",
    });
  }

  if (report.unseen.length) {
    const names = report.unseen.slice(0, 3).map((c) => `"${c.title}"`).join(", ");
    out.push({
      tone: "tip",
      text: `${report.unseen.length} konten terbit belum dibuka sama sekali (${names}${report.unseen.length > 3 ? ", …" : ""}). Coba tampilkan di beranda atau bagikan ulang.`,
    });
  }

  return out;
}

export type AnalyticsReport = {
  range: RangeKey;
  days: number;
  from: string;
  current: Totals;
  previous: Totals;
  series: DayPoint[];
  previousSeries: DayPoint[];
  pages: PageRow[];
  referrers: Row[];
  countries: Row[];
  devices: Row[];
  browsers: Row[];
  locales: Row[];
  heatmap: HeatCell[];
  unseen: { kind: "project" | "post"; slug: string; title: string }[];
  live: number;
  insights: Insight[];
};

export async function getAnalytics(range: RangeKey): Promise<AnalyticsReport> {
  const days = RANGES[range];
  const { from, to, prevFrom } = rangeBounds(days);
  const v = schema.pageViews;

  const [current, previous, series, previousSeries, pages, referrers, countries, devices, browsers, locales, heat, unseen, live] =
    await Promise.all([
      totals(from, to),
      totals(prevFrom, from),
      daily(from, days),
      daily(prevFrom, days),
      topPages(from),
      breakdown(sql`${v.referrer}`, from),
      breakdown(sql`${v.country}`, from),
      breakdown(sql`${v.device}`, from, 3),
      breakdown(sql`${v.browser}`, from, 6),
      breakdown(sql`${v.locale}`, from, 2),
      heatmap(from),
      unseenContent(from),
      liveVisitors(),
    ]);

  const base = { range, days, from: from.toISOString(), current, previous, series, previousSeries, pages, referrers, countries, devices, browsers, locales, heatmap: heat, unseen, live };
  return { ...base, insights: buildInsights(base) };
}

/** Small summary for the dashboard: last 14 days of visitors plus today vs yesterday. */
export async function getTrafficSnapshot() {
  const { from } = rangeBounds(14);
  const series = await daily(from, 14);
  const [week, prevWeek] = [series.slice(7), series.slice(0, 7)];
  const sum = (points: DayPoint[], key: "views" | "visitors") => points.reduce((s, p) => s + p[key], 0);
  return {
    series,
    visitors: sum(week, "visitors"),
    views: sum(week, "views"),
    visitorsChange: change(sum(week, "visitors"), sum(prevWeek, "visitors")),
    live: await liveVisitors(),
  };
}
