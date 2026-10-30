import Link from "next/link";
import type { Category, Post } from "@/lib/db/schema";
import { formatDate, pick, type Locale } from "@/lib/i18n";

type Item = Post & { category: Category | null };

export function PostList({ items, lang, minRead }: { items: Item[]; lang: Locale; minRead: string }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((p) => (
        <li key={p.id}>
          <Link
            href={`/${lang}/lab/${p.slug}`}
            className="group grid gap-2 py-7 md:grid-cols-[180px_1fr_auto] md:items-baseline md:gap-10"
          >
            <time dateTime={p.publishedAt?.toISOString()} className="text-sm text-muted">
              {formatDate(p.publishedAt, lang)}
            </time>
            <div>
              <h3 className="text-2xl font-semibold leading-snug text-ink decoration-scale decoration-2 underline-offset-4 group-hover:underline sm:text-3xl">
                {pick(p.title, lang)}
              </h3>
              {pick(p.excerpt, lang) && <p className="mt-2 max-w-[62ch] text-text/75">{pick(p.excerpt, lang)}</p>}
            </div>
            <p className="text-sm text-muted">
              {p.category ? `${pick(p.category.name, lang)}, ` : ""}
              {p.readingTime} {minRead}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
