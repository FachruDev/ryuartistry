import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import type { WorkCard as WorkCardData } from "@/lib/cards";
import { pick, type Locale } from "@/lib/i18n";
import { toneFor } from "@/lib/tones";
import { ArrowIcon } from "./ui";

const spring = "duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]";

/**
 * Two cards per row, alternating narrow/wide then wide/narrow. A card left alone on the last row
 * takes the full width with a centred frame.
 */
export function workSlot(index: number, total: number) {
  const alone = index === total - 1 && index % 2 === 0;
  if (alone) return { className: "md:col-span-12", layout: "center" as const, sizes: "(min-width: 1240px) 1100px, 100vw" };
  const wide = Math.floor(index / 2) % 2 === 0 ? index % 2 === 1 : index % 2 === 0;
  return wide
    ? { className: "md:col-span-7", layout: "bleed" as const, sizes: "(min-width: 768px) 58vw, 100vw" }
    : { className: "md:col-span-5", layout: "bleed" as const, sizes: "(min-width: 768px) 42vw, 100vw" };
}

/** Browser-window frame around a cover image; also the morph source/target for the case-study hero. */
export function CoverFrame({ slug, src, alt, sizes, priority }: { slug: string; src?: string; alt: string; sizes: string; priority?: boolean }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-t-[1.25rem] bg-frame shadow-[0_24px_50px_-24px_rgb(23_26_51/0.45)]">
      <div aria-hidden className="flex shrink-0 items-center gap-1.5 bg-frame-bar px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#ff6b5f]" />
        <span className="size-2.5 rounded-full bg-[#ffc23d]" />
        <span className="size-2.5 rounded-full bg-[#33c94a]" />
        <span className="ml-3 h-2.5 w-24 rounded-full bg-line/80" />
      </div>
      <ViewTransition name={`work-${slug}`} share="morph" default="none">
        <div className="relative min-h-0 flex-1 bg-frame-bar">
          {src && <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover object-top" />}
        </div>
      </ViewTransition>
    </div>
  );
}

/**
 * Pastel project card. The title sits on top; the cover peeks up from the bottom edge in a browser frame
 * that slides up on hover.
 */
export function WorkCard({
  item,
  lang,
  layout = "bleed",
  className = "",
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: {
  item: WorkCardData;
  lang: Locale;
  layout?: "bleed" | "center";
  className?: string;
  sizes?: string;
}) {
  const title = pick(item.title, lang);
  return (
    <Link
      href={`/${lang}/work/${item.slug}`}
      transitionTypes={["nav-forward"]}
      className={`lift group relative flex flex-col overflow-hidden rounded-[2.5rem] text-on-pastel md:rounded-[3.5rem] ${className}`}
      style={{ background: toneFor(item.category?.slug) }}
    >
      <div className="flex items-start justify-between gap-4 px-7 pt-7 md:px-11 md:pt-10">
        <div>
          {item.category && <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-70">{pick(item.category.name, lang)}</p>}
          <h3 className="display mt-1.5 text-[clamp(1.9rem,3.2vw,2.8rem)]">{title}</h3>
        </div>
        <span
          aria-hidden
          className={`grid size-11 shrink-0 place-items-center rounded-full bg-white/45 transition-[transform,background-color] ${spring} group-hover:-rotate-45 group-hover:bg-white/80`}
        >
          <ArrowIcon className="size-4" />
        </span>
      </div>
      <div className="relative mt-8 min-h-[15rem] flex-1 md:mt-10">
        <div
          className={`absolute bottom-0 top-0 translate-y-5 transition-transform ${spring} group-hover:translate-y-0 ${
            layout === "bleed" ? "left-7 right-0 md:left-11 [&>div]:rounded-tr-none" : "inset-x-7 md:inset-x-11"
          }`}
        >
          <CoverFrame slug={item.slug} src={item.cover?.url} alt={pick(item.cover?.alt, lang) || title} sizes={sizes} />
        </div>
      </div>
    </Link>
  );
}
