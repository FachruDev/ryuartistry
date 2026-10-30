import Link from "next/link";
import { ViewTransition } from "react";
import type { WorkCard as WorkCardData } from "@/lib/cards";
import { disciplineClay } from "@/lib/clay";
import { pick, type Locale } from "@/lib/i18n";
import { ParallaxImage } from "./parallax-image";

/** A project card: double-bezel image that morphs into the case-study hero on navigation. */
export function WorkCard({
  item,
  lang,
  aspect = "aspect-[4/3]",
  cursorLabel,
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: {
  item: WorkCardData;
  lang: Locale;
  aspect?: string;
  cursorLabel: string;
  sizes?: string;
}) {
  const title = pick(item.title, lang);
  const clay = disciplineClay[item.category?.slug ?? ""] ?? "var(--butter)";
  return (
    <Link href={`/${lang}/work/${item.slug}`} data-cursor={cursorLabel} className="group block">
      <div className="bezel transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-1.5">
        <ViewTransition name={`work-${item.slug}`} share="morph" default="none">
          <div className="bezel-core">
            {item.cover ? (
              <ParallaxImage src={item.cover.url} alt={pick(item.cover.alt, lang) || title} sizes={sizes} className={aspect} />
            ) : (
              <div className={`clay ${aspect} rounded-none`} style={{ ["--clay" as string]: clay }} />
            )}
          </div>
        </ViewTransition>
      </div>
      <div className="mt-5 flex items-start justify-between gap-4 px-1">
        <div>
          <h3 className="display text-[clamp(1.7rem,2.6vw,2.4rem)] text-plum">{title}</h3>
          {pick(item.summary, lang) && <p className="mt-2 max-w-[46ch] text-plum-soft">{pick(item.summary, lang)}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 pt-1">
          {item.category && (
            <span className="clay rounded-full px-3 py-1 text-xs font-bold text-plum" style={{ ["--clay" as string]: clay }}>
              {pick(item.category.name, lang)}
            </span>
          )}
          {item.year && <span className="text-sm font-medium text-plum-soft">{item.year}</span>}
        </div>
      </div>
    </Link>
  );
}
