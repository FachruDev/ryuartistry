"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "@phosphor-icons/react";

const ease = [0.32, 0.72, 0, 1] as const;

export type ServiceItem = { id: string; title: string; description: string; discipline?: string; tone: string };

/** Each service opens in place; the open row takes on its discipline's pastel. */
export function ServiceAccordion({ items }: { items: ServiceItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <ul className="space-y-3">
      {items.map((s) => {
        const on = open === s.id;
        return (
          <li
            key={s.id}
            className={`overflow-hidden rounded-[2rem] ring-1 transition-[background-color,box-shadow] duration-500 md:rounded-[2.5rem] ${
              on ? "text-on-pastel ring-transparent" : "bg-paper-raised/60 text-ink ring-line hover:bg-paper-raised"
            }`}
            style={on ? { backgroundColor: s.tone } : undefined}
          >
            <button
              type="button"
              aria-expanded={on}
              onClick={() => setOpen(on ? null : s.id)}
              className="group flex w-full items-center justify-between gap-6 px-6 py-6 text-left sm:px-10 sm:py-8"
            >
              <span>
                {s.discipline && (
                  <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] opacity-70">
                    <span aria-hidden className="size-2 rounded-full" style={{ background: s.tone }} />
                    {s.discipline}
                  </span>
                )}
                <span className="display mt-2 block text-[clamp(1.8rem,3.6vw,3rem)]">{s.title}</span>
              </span>
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-full transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 ${
                  on ? "rotate-45 bg-white/60" : "bg-ink text-paper"
                }`}
              >
                <Plus weight="bold" className="size-5" />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {on && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease }}
                  className="overflow-hidden"
                >
                  <p className="max-w-[62ch] px-6 pb-8 text-lg leading-relaxed opacity-80 sm:px-10 sm:pb-10">{s.description}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
