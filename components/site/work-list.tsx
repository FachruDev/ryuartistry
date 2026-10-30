import Link from "next/link";
import type { Category, Media, Project } from "@/lib/db/schema";
import { pick, type Locale } from "@/lib/i18n";
import { ParallaxImage } from "./parallax-image";

type Item = Project & { cover: Media | null; category: Category | null };

/** Large alternating rows: the image drifts, the title carries the row. */
export function WorkList({ items, lang }: { items: Item[]; lang: Locale }) {
  return (
    <ul className="space-y-24 md:space-y-36">
      {items.map((p, i) => {
        const title = pick(p.title, lang);
        const meta = [p.category ? pick(p.category.name, lang) : null, p.year].filter(Boolean).join(", ");
        return (
          <li key={p.id}>
            <Link
              href={`/${lang}/work/${p.slug}`}
              className="group grid items-end gap-6 md:grid-cols-12 md:gap-10"
            >
              <div className={`md:col-span-7 ${i % 2 ? "md:col-start-6 md:row-start-1" : ""}`}>
                {p.cover ? (
                  <ParallaxImage
                    src={p.cover.url}
                    alt={pick(p.cover.alt, lang) || title}
                    sizes="(min-width: 768px) 58vw, 100vw"
                    className="aspect-[4/3] rounded-sm"
                  />
                ) : (
                  <div className="scale-pattern aspect-[4/3] rounded-sm" aria-hidden />
                )}
              </div>
              <div className={`md:col-span-5 ${i % 2 ? "md:col-start-1 md:row-start-1" : ""}`}>
                {meta && <p className="text-sm font-semibold text-muted">{meta}</p>}
                <h3 className="display mt-3 text-[clamp(2.4rem,5vw,4.6rem)] text-ink transition-[font-variation-settings] duration-500 [--wdth:88] group-hover:[--wdth:100]">
                  {title}
                </h3>
                {pick(p.summary, lang) && (
                  <p className="mt-4 max-w-[44ch] text-lg leading-relaxed text-text/80">{pick(p.summary, lang)}</p>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
