import type { Icon } from "@phosphor-icons/react";
import { AndroidLogo, AppleLogo, DownloadSimple, LinuxLogo, WindowsLogo } from "@phosphor-icons/react/ssr";
import type { Dictionary } from "@/lib/dictionaries";
import type { Localized } from "@/lib/db/schema";
import { formatDate, pick, type Locale } from "@/lib/i18n";
import { changelogLines, formatBytes, platformInfo, type Platform } from "@/lib/release-platforms";
import { Reveal } from "./reveal";

type ReleaseView = {
  id: string;
  version: string;
  changelog: Localized;
  releasedAt: Date;
  files: { id: string; platform: Platform; filename: string; size: number; sha256: string | null; available: boolean }[];
};

const icons: Record<Platform, Icon> = { android: AndroidLogo, windows: WindowsLogo, macos: AppleLogo, linux: LinuxLogo };

const href = (fileId: string) => `/api/download/${fileId}`;
const extension = (filename: string) => filename.split(".").pop()?.toUpperCase() ?? "";

/** Download buttons for the newest available build per platform, then the full changelog. */
export function Downloads({ releases, lang, dict }: { releases: ReleaseView[]; lang: Locale; dict: Dictionary["downloads"] }) {
  const latest = releases.find((r) => r.files.some((f) => f.available));
  if (!releases.length) return null;
  const files = latest?.files.filter((f) => f.available) ?? [];

  return (
    <Reveal className="px-4 sm:px-8">
      <section id="unduh" aria-labelledby="unduh-title" className="mx-auto max-w-[1240px] scroll-mt-28 border-b border-line py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
          <div>
            <h2 id="unduh-title" className="display text-[clamp(2.2rem,4.6vw,3.6rem)] text-ink">
              {dict.title}
            </h2>
            {latest && (
              <p className="mt-3 text-muted">
                {dict.version} {latest.version} · {formatDate(latest.releasedAt, lang)}
              </p>
            )}
            {files.length > 0 && (
              <div className="mt-7 flex flex-col items-start gap-3">
                {files.map((f) => {
                  const PlatformIcon = icons[f.platform];
                  return (
                    <a
                      key={f.id}
                      href={href(f.id)}
                      className="group inline-flex items-center gap-3 rounded-full bg-ink py-3 pl-4 pr-6 text-paper transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 active:scale-[0.97]"
                    >
                      <span className="grid size-9 place-items-center rounded-full bg-paper/15">
                        <PlatformIcon weight="fill" className="size-5" />
                      </span>
                      <span className="text-left leading-tight">
                        <span className="block font-semibold">
                          {dict.for} {platformInfo[f.platform].label}
                        </span>
                        <span className="block text-xs opacity-70">
                          {extension(f.filename)} · {formatBytes(f.size)}
                        </span>
                      </span>
                      <DownloadSimple weight="bold" className="ml-2 size-4 transition-transform duration-500 group-hover:translate-y-0.5" />
                    </a>
                  );
                })}
              </div>
            )}
            {files.length > 0 && (
              <ul className="mt-6 space-y-2 text-sm leading-relaxed text-muted">
                {files.map((f) => (
                  <li key={f.id}>{dict.notes[f.platform]}</li>
                ))}
              </ul>
            )}
            {files.some((f) => f.sha256) && (
              <details className="mt-5 text-sm text-muted">
                <summary className="cursor-pointer font-semibold">{dict.checksum}</summary>
                <dl className="mt-2 space-y-2">
                  {files
                    .filter((f) => f.sha256)
                    .map((f) => (
                      <div key={f.id}>
                        <dt className="text-xs">{f.filename}</dt>
                        <dd className="break-all font-mono text-xs text-ink/80">{f.sha256}</dd>
                      </div>
                    ))}
                </dl>
              </details>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">{dict.history}</h3>
            <ol className="mt-5 space-y-7">
              {releases.map((r) => {
                const changes = changelogLines(pick(r.changelog, lang));
                return (
                  <li key={r.id} className="relative border-l-2 border-line pl-5">
                    <span aria-hidden className={`absolute -left-[7px] top-1.5 size-3 rounded-full ${r === latest ? "bg-accent" : "bg-line"}`} />
                    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-lg font-bold text-ink">{r.version}</span>
                      <span className="text-sm text-muted">{formatDate(r.releasedAt, lang)}</span>
                      {r === latest && <span className="rounded-full bg-yuzu px-2 py-0.5 text-xs font-bold text-on-pastel">{dict.latest}</span>}
                    </p>
                    {changes.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed text-ink/80 marker:text-accent">
                        {changes.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-muted">{dict.noNotes}</p>
                    )}
                    {r !== latest && r.files.length > 0 && (
                      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        {r.files.map((f) =>
                          f.available ? (
                            <a key={f.id} href={href(f.id)} className="link-grow font-semibold text-ink">
                              {platformInfo[f.platform].label} · {formatBytes(f.size)}
                            </a>
                          ) : (
                            <span key={f.id} className="text-muted">
                              {platformInfo[f.platform].label} · {dict.archived}
                            </span>
                          ),
                        )}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
