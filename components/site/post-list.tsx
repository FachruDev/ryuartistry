import Image from "next/image";
import Link from "next/link";
import type { PostRow } from "@/lib/cards";
import { formatDate, pick, type Locale } from "@/lib/i18n";
import { toneFor } from "@/lib/tones";
import { ArrowIcon, Tag } from "./ui";

const spring = "duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]";

/** Lab notes as rows: a tilting thumbnail, meta line, title, and an arrow that fills on hover. */
export function PostList({ items, lang, minRead }: { items: PostRow[]; lang: Locale; minRead: string }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((p) => {
        const tone = toneFor(p.category?.slug, "var(--mizu)");
        return (
          <li key={p.id}>
            <Link href={`/${lang}/lab/${p.slug}`} transitionTypes={["nav-forward"]} className="group grid grid-cols-[auto_1fr] items-center gap-5 py-6 sm:grid-cols-[auto_1fr_auto] md:gap-8 md:py-8">
              <span
                className={`relative block size-20 overflow-hidden rounded-[1.25rem] transition-transform md:size-28 md:rounded-[1.75rem] ${spring} group-hover:-rotate-3 group-hover:scale-105`}
                style={{ background: tone }}
              >
                {p.cover && <Image src={p.cover.url} alt="" fill sizes="112px" className="object-cover" />}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted">
                  {p.category && <Tag tone={tone}>{pick(p.category.name, lang)}</Tag>}
                  <time dateTime={p.publishedAt ? new Date(p.publishedAt).toISOString() : undefined}>{formatDate(p.publishedAt, lang)}</time>
                  <span aria-hidden>·</span>
                  <span>
                    {p.readingTime} {minRead}
                  </span>
                </div>
                <h3 className="display mt-2 text-[clamp(1.5rem,2.6vw,2.2rem)] text-ink">{pick(p.title, lang)}</h3>
                {pick(p.excerpt, lang) && <p className="mt-1.5 line-clamp-2 hidden max-w-[62ch] text-muted sm:block">{pick(p.excerpt, lang)}</p>}
              </div>
              <span
                aria-hidden
                className={`hidden size-12 place-items-center rounded-full text-ink ring-1 ring-line transition-[transform,background-color,color] sm:grid ${spring} group-hover:-rotate-45 group-hover:bg-ink group-hover:text-paper group-hover:ring-ink`}
              >
                <ArrowIcon className="size-4" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
