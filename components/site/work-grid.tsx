"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { Category } from "@/lib/db/schema";
import type { WorkCard } from "@/lib/cards";
import { pick, type Locale } from "@/lib/i18n";


const CATEGORY_EVENT = "work-category-change";

function subscribeCategory(onChange: () => void) {
  window.addEventListener(CATEGORY_EVENT, onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener(CATEGORY_EVENT, onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function readCategory() {
  return new URLSearchParams(window.location.search).get("category");
}

/** Work index with a category filter that mirrors itself into `?category=` without a server round trip. */
export function WorkGrid({
  items,
  categories,
  lang,
  allLabel,
  emptyLabel,
}: {
  items: WorkCard[];
  categories: Category[];
  lang: Locale;
  allLabel: string;
  emptyLabel: string;
}) {
  const active = useSyncExternalStore(subscribeCategory, readCategory, () => null);

  const select = (slug: string | null) => {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("category", slug);
    else url.searchParams.delete("category");
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new Event(CATEGORY_EVENT));
  };

  const visible = active ? items.filter((p) => p.category?.slug === active) : items;
  const used = categories.filter((c) => items.some((p) => p.categoryId === c.id));

  return (
    <div>
      {used.length > 1 && (
        <div role="group" aria-label="Filter" className="mb-12 flex flex-wrap gap-2">
          {[{ slug: null, label: allLabel }, ...used.map((c) => ({ slug: c.slug, label: pick(c.name, lang) }))].map((f) => (
            <button
              key={f.slug ?? "all"}
              type="button"
              aria-pressed={active === f.slug}
              onClick={() => select(f.slug)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                active === f.slug ? "border-ink bg-ink text-paper" : "border-line text-text hover:border-ink/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="py-16 text-lg text-muted">{emptyLabel}</p>
      ) : (
        <ul className="grid gap-x-8 gap-y-16 md:grid-cols-2">
          {visible.map((p, i) => {
            const title = pick(p.title, lang);
            return (
              <li key={p.id} className={i % 2 ? "md:mt-24" : ""}>
                <Link href={`/${lang}/work/${p.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-ink/10">
                    {p.cover ? (
                      <Image
                        src={p.cover.url}
                        alt={pick(p.cover.alt, lang) || title}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="scale-pattern size-full" aria-hidden />
                    )}
                  </div>
                  <div className="mt-5 flex items-baseline justify-between gap-4">
                    <h2 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
                    <span className="shrink-0 text-sm text-muted">
                      {[p.category ? pick(p.category.name, lang) : null, p.year].filter(Boolean).join(", ")}
                    </span>
                  </div>
                  {pick(p.summary, lang) && <p className="mt-2 max-w-[52ch] text-text/75">{pick(p.summary, lang)}</p>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
