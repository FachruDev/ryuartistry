"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Category } from "@/lib/db/schema";
import type { WorkCard as WorkCardData } from "@/lib/cards";
import { disciplineClay } from "@/lib/clay";
import { pick, type Locale } from "@/lib/i18n";
import { WorkCard } from "./work-card";

const ease = [0.32, 0.72, 0, 1] as const;
const aspects = ["aspect-[4/5]", "aspect-[4/3]", "aspect-square", "aspect-[3/4]", "aspect-[5/4]"];
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

/** Masonry work index with clay filter chips mirrored into `?category=` without a server round trip. */
export function WorkGrid({
  items,
  categories,
  lang,
  allLabel,
  emptyLabel,
  cursorLabel,
}: {
  items: WorkCardData[];
  categories: Category[];
  lang: Locale;
  allLabel: string;
  emptyLabel: string;
  cursorLabel: string;
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
  const filters = [{ slug: null as string | null, label: allLabel }, ...used.map((c) => ({ slug: c.slug, label: pick(c.name, lang) }))];

  return (
    <div>
      {used.length > 1 && (
        <div role="group" aria-label="Filter" className="mb-14 inline-flex flex-wrap gap-1 rounded-full bg-plum/[0.04] p-1.5 ring-1 ring-plum/[0.06]">
          {filters.map((f) => {
            const on = active === f.slug;
            return (
              <button
                key={f.slug ?? "all"}
                type="button"
                aria-pressed={on}
                onClick={() => select(f.slug)}
                className="relative rounded-full px-5 py-2.5 text-[15px] font-semibold text-plum transition-colors"
              >
                {on && (
                  <motion.span
                    layoutId="work-filter"
                    className="clay absolute inset-0 rounded-full"
                    style={{ ["--clay" as string]: f.slug ? disciplineClay[f.slug] : "var(--butter)" }}
                    transition={{ duration: 0.6, ease }}
                  />
                )}
                <span className="relative">{f.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="py-16 text-lg text-plum-soft">{emptyLabel}</p>
      ) : (
        <div className="columns-1 gap-8 md:columns-2 xl:columns-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.7, delay: Math.min(i, 6) * 0.06, ease }}
                className="mb-14 break-inside-avoid"
              >
                <WorkCard item={p} lang={lang} aspect={aspects[i % aspects.length]} cursorLabel={cursorLabel} sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
