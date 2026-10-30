import { headers } from "next/headers";
import { desc } from "drizzle-orm";
import { ChatCircleText, Key, Plugs, ShieldCheck } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { revokeApiToken } from "@/lib/actions/ai";
import { tools } from "@/lib/mcp/tools";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/admin/cards";
import { CodeBlock, CopyButton, TokenCreator } from "@/components/admin/ai-connect";
import { connectCommands } from "@/lib/ai/connect";
import { DeleteButton } from "@/components/admin/delete-button";

export const metadata = { title: "Asisten AI" };
export const instant = false;

const examples = [
  "Lihat ringkasan CMS ryuartistry dan sebutkan konten yang perlu dibenahi.",
  "Buat 3 karya contoh untuk kategori game, lengkap dua bahasa, simpan sebagai draft.",
  "Tulis catatan Lab tentang proses membuat chatbot untuk klien UMKM, sekitar 600 kata, draft.",
  "Lengkapi semua terjemahan bahasa Inggris yang masih kosong di karya dan catatan Lab.",
  "Isi teks alt dua bahasa untuk semua gambar yang belum punya alt.",
  "Analisis trafik 30 hari terakhir, lalu sarankan 5 ide konten berdasarkan halaman terpopuler.",
  "Rangkum pesan inbox yang belum dibaca dan tandai yang sudah kamu rangkum sebagai dibaca.",
];

const steps = [
  { icon: Key, title: "Buat token", text: "Satu token untuk tiap perangkat atau orang. Bisa dicabut kapan saja." },
  { icon: Plugs, title: "Hubungkan Claude", text: "Tempel satu perintah di Claude Code, atau konfigurasi di Claude Desktop." },
  { icon: ChatCircleText, title: "Minta dalam bahasa sehari-hari", text: "Claude membaca, menulis, dan merapikan konten langsung di CMS." },
];

const dateTime = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

export default async function AiPage() {
  const user = await requireUser();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const endpoint = `${proto}://${host}/api/mcp`;
  const tokens = await db.select().from(schema.apiTokens).orderBy(desc(schema.apiTokens.createdAt));
  const active = tokens.filter((t) => !t.revokedAt);
  const sample = connectCommands(endpoint, "ryu_TOKEN_ANDA");

  return (
    <>
      <PageHeader
        title="Asisten AI"
        description="Hubungkan Claude ke CMS ini lewat MCP. Claude memakai langganan Anda (Pro/Max) di aplikasi Claude atau Claude Code, jadi tidak ada API berbayar per pemakaian."
      />

      <section className="relative overflow-hidden rounded-3xl bg-ink p-6 text-paper sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-wisteria/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-mizu/20 blur-3xl" />
        <p className="relative text-sm font-semibold text-paper/70">Cara kerjanya</p>
        <ol className="relative mt-4 grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
              <span className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-paper text-ink">
                  <Icon size={16} weight="bold" />
                </span>
                <span className="text-xs font-bold text-paper/50">0{i + 1}</span>
              </span>
              <p className="mt-3 font-semibold">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-paper/70">{text}</p>
            </li>
          ))}
        </ol>
        <p className="relative mt-5 text-sm text-paper/70">
          Alamat MCP: <code className="rounded bg-white/10 px-1.5 py-0.5 text-paper">{endpoint}</code>
          {host.startsWith("localhost") && " · hanya aktif selama server lokal berjalan. Setelah deploy, buat token dari CMS produksi."}
        </p>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4">
          <Card title="Token akses" description={`${active.length} token aktif. Token memberi akses penuh untuk mengubah konten, simpan seperti password.`}>
            <TokenCreator endpoint={endpoint} canManage={user.role === "admin"} />
            {tokens.length > 0 && (
              <ul className="mt-5 divide-y divide-line border-t border-line">
                {tokens.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-3 py-3">
                    <Key size={16} className={t.revokedAt ? "text-muted/50" : "text-ink"} />
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold ${t.revokedAt ? "text-muted line-through" : ""}`}>{t.name}</p>
                      <p className="text-xs text-muted">
                        <code>{t.prefix}…</code> · dibuat {dateTime.format(t.createdAt)} ·{" "}
                        {t.revokedAt
                          ? `dicabut ${dateTime.format(t.revokedAt)}`
                          : t.lastUsedAt
                            ? `terakhir dipakai ${dateTime.format(t.lastUsedAt)}`
                            : "belum pernah dipakai"}
                      </p>
                    </div>
                    {!t.revokedAt && user.role === "admin" && (
                      <DeleteButton action={revokeApiToken.bind(null, t.id)} label="Cabut" confirmText={`Cabut token “${t.name}”? Claude yang memakai token ini tidak bisa mengakses CMS lagi.`} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Cara menghubungkan" description="Ganti ryu_TOKEN_ANDA dengan token yang Anda buat.">
            <div className="space-y-4">
              <CodeBlock title="Claude Code (disarankan)" code={sample.claudeCode} />
              <p className="text-sm text-muted">
                Setelah itu ketik <code className="rounded bg-paper px-1">/mcp</code> di Claude Code untuk memastikan <strong>ryuartistry</strong> terhubung.
              </p>
              <details className="rounded-xl border border-line bg-paper px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold">Claude Desktop (tab Chat)</summary>
                <div className="mt-3 space-y-3 text-sm text-muted">
                  <p>Buka Settings → Developer → Edit Config, tempel konfigurasi berikut, lalu mulai ulang Claude Desktop. Membutuhkan Node.js.</p>
                  <CodeBlock title="claude_desktop_config.json" code={sample.claudeDesktop} />
                </div>
              </details>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Contoh perintah" description="Salin lalu tempel ke Claude">
            <ul className="space-y-2">
              {examples.map((ex) => (
                <li key={ex} className="flex items-start gap-2 rounded-xl border border-line bg-paper p-3 text-sm">
                  <span className="flex-1 leading-relaxed">{ex}</span>
                  <CopyButton value={ex} />
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Keamanan">
            <ul className="space-y-2.5 text-sm text-ink/80">
              {[
                "Hanya hash token yang disimpan. Token yang hilang tidak bisa dilihat ulang, cukup buat baru.",
                "Setiap perubahan oleh AI tercatat di Aktivitas terbaru dengan nama token.",
                "Konten baru dari AI disimpan sebagai draf kecuali Anda meminta langsung terbit.",
                "Claude meminta izin Anda sebelum menjalankan tool yang mengubah atau menghapus data.",
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <ShieldCheck size={16} weight="fill" className="mt-0.5 shrink-0 text-success" />
                  {line}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card title="Yang bisa dilakukan Claude" description={`${tools.length} tool tersedia lewat MCP`} className="mt-4">
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((t) => (
            <li key={t.name} className="rounded-xl border border-line bg-paper p-3.5">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{t.title}</p>
                {t.annotations?.readOnlyHint && <span className="rounded-full bg-mizu/60 px-2 text-[11px] font-semibold text-on-pastel">baca</span>}
                {t.annotations?.destructiveHint && <span className="rounded-full bg-sakura/70 px-2 text-[11px] font-semibold text-on-pastel">hapus</span>}
              </div>
              <code className="text-xs text-muted">{t.name}</code>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/75">{t.description}</p>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
