import Link from "next/link";
import { Desktop, DeviceMobile, DeviceTablet, Sparkle } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/auth";
import { change, getAnalytics, parseRange, RANGES, type RangeKey } from "@/lib/analytics";
import { PageHeader } from "@/components/admin/page-header";
import { Card, InsightList, LiveDot, StatTile } from "@/components/admin/cards";
import { BarList, HourHeatmap, TrendChart } from "@/components/admin/charts";

export const metadata = { title: "Analitik" };
export const instant = false;

const rangeLabel: Record<RangeKey, string> = { "7d": "7 hari", "30d": "30 hari", "90d": "90 hari" };

const dayLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
const regionName = new Intl.DisplayNames(["id"], { type: "region" });

function duration(ms: number) {
  if (!ms) return "–";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} dtk` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} mnt`;
}

function country(code: string) {
  if (!code) return "Tidak diketahui";
  try {
    return regionName.of(code) ?? code;
  } catch {
    return code;
  }
}

const deviceMeta = {
  desktop: { label: "Desktop", icon: Desktop },
  mobile: { label: "Ponsel", icon: DeviceMobile },
  tablet: { label: "Tablet", icon: DeviceTablet },
} as const;

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  await requireUser();
  const range = parseRange((await searchParams).range);
  const r = await getAnalytics(range);
  const { current: c, previous: p } = r;

  const points = r.series.map((d, i) => ({
    label: dayLabel.format(new Date(d.day)),
    value: d.visitors,
    previous: r.previousSeries[i]?.visitors ?? 0,
    detail: `${d.views} tayangan halaman`,
  }));
  const pagesPerVisit = c.sessions ? c.views / c.sessions : 0;
  const prevPagesPerVisit = p.sessions ? p.views / p.sessions : 0;
  const conversion = c.visitors ? c.inquiries / c.visitors : 0;
  const deviceTotal = r.devices.reduce((s, d) => s + d.visitors, 0);

  return (
    <>
      <PageHeader
        title="Analitik"
        description="Kunjungan situs publik tanpa cookie. Kunjungan admin yang sedang masuk tidak dihitung."
        actions={<LiveDot count={r.live} />}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Rentang waktu">
        {(Object.keys(RANGES) as RangeKey[]).map((key) => (
          <Link
            key={key}
            href={`/admin/analytics?range=${key}`}
            aria-current={key === range ? "true" : undefined}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              key === range ? "bg-ink text-paper" : "border border-line bg-paper-raised text-ink/75 hover:border-ink/30"
            }`}
          >
            {rangeLabel[key]} terakhir
          </Link>
        ))}
        <span className="ml-auto text-xs text-muted">Dibandingkan dengan {rangeLabel[range]} sebelumnya · zona waktu WIB</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Pengunjung unik" value={c.visitors.toLocaleString("id-ID")} delta={change(c.visitors, p.visitors)} />
        <StatTile label="Tayangan halaman" value={c.views.toLocaleString("id-ID")} delta={change(c.views, p.views)} />
        <StatTile
          label="Halaman per kunjungan"
          value={pagesPerVisit.toFixed(1)}
          delta={change(pagesPerVisit, prevPagesPerVisit)}
        />
        <StatTile
          label="Rata-rata waktu baca"
          value={duration(c.avgDurationMs)}
          delta={change(c.avgDurationMs, p.avgDurationMs)}
        />
        <StatTile
          label="Pesan masuk"
          value={c.inquiries.toLocaleString("id-ID")}
          delta={change(c.inquiries, p.inquiries)}
          hint={c.visitors ? `konversi ${(conversion * 100).toFixed(1)}%` : undefined}
          href="/admin/inbox"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card title="Pengunjung per hari" description={`Bounce rate ${Math.round(c.bounceRate * 100)}% · ${c.sessions} kunjungan`}>
          <TrendChart points={points} name="Pengunjung" />
        </Card>
        <Card
          title="Wawasan otomatis"
          description="Dibaca dari data periode ini"
          action={<Sparkle size={18} weight="fill" className="text-accent" aria-hidden />}
        >
          <InsightList insights={r.insights} />
          <p className="mt-5 rounded-lg bg-paper px-3 py-2.5 text-xs leading-relaxed text-muted">
            Ingin analisis lebih dalam? Minta Claude: <em>“Analisis trafik ryuartistry 30 hari terakhir dan beri saran konten.”</em>{" "}
            <Link href="/admin/ai" className="font-semibold text-ink underline underline-offset-2">
              Hubungkan AI
            </Link>
          </p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Halaman teratas" description="Berdasarkan tayangan">
          <BarList
            valueLabel="Tayangan"
            rows={r.pages.map((pg) => ({
              key: pg.key,
              label: (
                <>
                  <span className="font-medium">{pg.title}</span> <span className="text-xs text-muted">{pg.key}</span>
                </>
              ),
              value: pg.views,
              detail: duration(pg.avgDurationMs),
              href: pg.key,
            }))}
          />
        </Card>
        <Card title="Sumber kunjungan" description="Situs yang merujuk pengunjung">
          <BarList
            valueLabel="Pengunjung"
            rows={r.referrers.map((ref) => ({ key: ref.key || "direct", label: ref.key || "Langsung / tanpa rujukan", value: ref.visitors }))}
          />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Negara">
          <BarList
            valueLabel="Pengunjung"
            empty="Lokasi terbaca setelah situs berjalan di Vercel."
            rows={r.countries.map((x) => ({ key: x.key || "unknown", label: country(x.key), value: x.visitors }))}
          />
        </Card>
        <Card title="Perangkat & bahasa">
          <ul className="space-y-3">
            {r.devices.map((d) => {
              const meta = deviceMeta[d.key as keyof typeof deviceMeta] ?? deviceMeta.desktop;
              const share = deviceTotal ? d.visitors / deviceTotal : 0;
              return (
                <li key={d.key}>
                  <div className="flex items-center gap-2 text-sm">
                    <meta.icon size={16} aria-hidden />
                    <span className="flex-1">{meta.label}</span>
                    <span className="font-semibold tabular-nums">{Math.round(share * 100)}%</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-mizu/40">
                    <div className="h-2 rounded-full bg-glow" style={{ width: `${share * 100}%` }} />
                  </div>
                </li>
              );
            })}
            {r.devices.length === 0 && <p className="py-6 text-center text-sm text-muted">Belum ada data.</p>}
          </ul>
          {r.locales.length > 0 && (
            <div className="mt-5 flex gap-2 border-t border-line pt-4">
              {r.locales.map((l) => (
                <span key={l.key} className="rounded-full bg-paper px-3 py-1 text-sm">
                  <span className="font-semibold">{l.key ? l.key.toUpperCase() : "?"}</span>{" "}
                  <span className="text-muted">{l.visitors} pengunjung</span>
                </span>
              ))}
            </div>
          )}
        </Card>
        <Card title="Browser">
          <BarList valueLabel="Pengunjung" rows={r.browsers.map((b) => ({ key: b.key || "other", label: b.key || "Lainnya", value: b.visitors }))} />
        </Card>
      </div>

      <Card title="Jam ramai" description="Tayangan per hari dan jam (WIB)" className="mt-4">
        <HourHeatmap cells={r.heatmap} />
      </Card>
    </>
  );
}
