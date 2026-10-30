"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Category } from "@/lib/db/schema";
import type { WorkCard as WorkCardData } from "@/lib/cards";
import { pick, type Locale } from "@/lib/i18n";
import { WorkCard, workSlot } from "./work-card";

const ease = [0.32, 0.72, 0, 1] as const;
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

/** Work index with filter chips mirrored into `?category=` without a server round trip. */
export function WorkGrid({
  items,
  categories,
  lang,
  labels,
}: {
  items: WorkCardData[];
  categories: Category[];
  lang: Locale;
  labels: { all: string; empty: string; filter: string };
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
  const filters = [{ slug: null as string | null, label: labels.all }, ...used.map((c) => ({ slug: c.slug, label: pick(c.name, lang) }))];

  return (
    <div>
      {used.length > 1 && (
        <div className="mb-12 flex justify-center md:mb-16">
          <div role="group" aria-label={labels.filter} className="inline-flex flex-wrap justify-center gap-1 rounded-full bg-paper-raised/70 p-1.5 ring-1 ring-line">
            {filters.map((f) => {
              const on = active === f.slug;
              return (
                <button
                  key={f.slug ?? "all"}
                  type="button"
                  aria-pressed={on}
                  onClick={() => select(f.slug)}
                  className="relative rounded-full px-5 py-2.5 text-[15px] font-semibold text-muted transition-colors duration-300 hover:text-ink aria-pressed:text-paper"
                >
                  {on && (
                    <motion.span
                      layoutId="work-filter"
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="py-16 text-center text-lg text-muted">{labels.empty}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-12 md:gap-6">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((p, i) => {
              const slot = workSlot(i, visible.length);
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.6, delay: Math.min(i, 6) * 0.05, ease }}
                  className={slot.className}
                >
                  <WorkCard item={p} lang={lang} layout={slot.layout} sizes={slot.sizes} className="h-[28rem] md:h-[36rem]" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
