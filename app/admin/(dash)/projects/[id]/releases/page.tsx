import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteRelease, saveRelease } from "@/lib/actions/releases";
import { getProjectReleases } from "@/lib/releases";
import { KEEP_BUILDS, PLATFORMS, changelogLines, formatBytes, platformInfo } from "@/lib/release-platforms";
import { PageHeader, StatusBadge, EmptyState } from "@/components/admin/page-header";
import { Card } from "@/components/admin/cards";
import { DeleteButton } from "@/components/admin/delete-button";
import { BuildUploader, DeleteBuildButton, ReleaseForm } from "@/components/admin/releases";

export const metadata = { title: "Rilis & unduhan" };
export const instant = false;
// Finalizing an upload hashes the whole build, which takes a while for large files.
export const maxDuration = 300;

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" });

export default async function ReleasesPage({ params }: PageProps<"/admin/projects/[id]/releases">) {
  await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const [project] = await db
    .select({ id: schema.projects.id, title: schema.projects.title, slug: schema.projects.slug, status: schema.projects.status })
    .from(schema.projects)
    .where(eq(schema.projects.id, id));
  if (!project) notFound();

  const releases = await getProjectReleases(id);
  const files = releases.flatMap((r) => r.files);
  const stored = files.filter((f) => f.key);
  const downloads = files.reduce((sum, f) => sum + f.downloads, 0);
  const title = project.title.id || project.title.en;

  return (
    <>
      <PageHeader
        title={`Rilis · ${title}`}
        description={`File APK/EXE yang bisa diunduh pengunjung dari halaman karya. Hanya ${KEEP_BUILDS} build terbaru per platform yang disimpan; file yang lebih lama dihapus otomatis, catatan versinya tetap tampil.`}
        back={{ href: `/admin/projects/${id}`, label: title }}
        actions={
          project.status === "published" && (
            <a href={`/id/work/${project.slug}#unduh`} target="_blank" className="text-sm text-muted underline-offset-4 hover:underline">
              Lihat di situs
            </a>
          )
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Rilis", value: releases.length.toString() },
          { label: "File tersimpan", value: stored.length ? `${stored.length} · ${formatBytes(stored.reduce((sum, f) => sum + f.size, 0))}` : "0" },
          { label: "Total unduhan", value: downloads.toLocaleString("id-ID") },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-paper-raised px-5 py-4">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <details className="group mb-8 rounded-2xl border border-line bg-paper-raised" open={releases.length === 0}>
        <summary className="cursor-pointer list-none px-5 py-4 font-semibold">
          <span className="mr-2 inline-block transition-transform group-open:rotate-90">›</span>
          Rilis baru
        </summary>
        <div className="border-t border-line p-5">
          <ReleaseForm action={saveRelease.bind(null, id, null)} />
        </div>
      </details>

      {releases.length === 0 ? (
        <EmptyState>Belum ada rilis. Buat rilis dulu, lalu unggah file APK/EXE-nya.</EmptyState>
      ) : (
        <div className="space-y-5">
          {releases.map((release, index) => {
            const changes = changelogLines(release.changelog.id || release.changelog.en);
            const byPlatform = PLATFORMS.map((p) => release.files.find((f) => f.platform === p)).filter((f) => f !== undefined);
            return (
              <Card
                key={release.id}
                title={`Versi ${release.version}`}
                description={`${dateFmt.format(release.releasedAt)}${index === 0 ? " · terbaru" : ""}`}
                action={<StatusBadge status={release.status} />}
              >
                {changes.length > 0 ? (
                  <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-ink/80 marker:text-muted">
                    {changes.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mb-4 text-sm text-muted">Belum ada catatan perubahan.</p>
                )}

                {byPlatform.length > 0 && (
                  <ul className="mb-4 divide-y divide-line rounded-xl border border-line">
                    {byPlatform.map((f) => (
                      <li key={f.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                        <span className="w-20 font-semibold">{platformInfo[f.platform].label}</span>
                        <span className="min-w-0 flex-1 truncate font-mono text-xs" title={f.sha256 ? `SHA-256 ${f.sha256}` : undefined}>
                          {f.filename}
                        </span>
                        <span className="tabular-nums text-muted">{formatBytes(f.size)}</span>
                        <span className="tabular-nums text-muted">{f.downloads.toLocaleString("id-ID")} unduhan</span>
                        {f.key ? (
                          <a href={`/api/download/${f.id}`} className="font-semibold text-glow hover:underline">
                            Unduh
                          </a>
                        ) : (
                          <span className="rounded-full bg-line px-2 py-0.5 text-xs font-semibold text-muted">Diarsipkan</span>
                        )}
                        <DeleteBuildButton fileId={f.id} label={`${platformInfo[f.platform].label} ${release.version}`} />
                      </li>
                    ))}
                  </ul>
                )}

                <BuildUploader releaseId={release.id} taken={release.files.map((f) => f.platform)} />

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-muted hover:text-text">Edit rilis</summary>
                  <div className="mt-4 space-y-5">
                    <ReleaseForm action={saveRelease.bind(null, id, release.id)} release={release} />
                    <DeleteButton
                      action={deleteRelease.bind(null, release.id)}
                      label="Hapus rilis"
                      confirmText={`Hapus versi ${release.version} beserta semua filenya secara permanen?`}
                    />
                  </div>
                </details>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
