"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "@phosphor-icons/react";

const ease = [0.32, 0.72, 0, 1] as const;

export type ServiceItem = { id: string; title: string; description: string; discipline?: string; clay: string };

/** Progressive disclosure: each service opens in place to show its description. */
export function ServiceAccordion({ items }: { items: ServiceItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <ul className="space-y-4">
      {items.map((s) => {
        const on = open === s.id;
        return (
          <li key={s.id}>
            <div className="clay overflow-hidden" style={{ ["--clay" as string]: on ? s.clay : "var(--cloud)", transition: "background 0.7s" }}>
              <button
                type="button"
                aria-expanded={on}
                onClick={() => setOpen(on ? null : s.id)}
                className="flex w-full items-center justify-between gap-6 px-6 py-6 text-left sm:px-10 sm:py-8"
              >
                <span>
                  {s.discipline && <span className="block text-sm font-semibold text-plum-soft">{s.discipline}</span>}
                  <span className="display mt-1 block text-[clamp(1.8rem,3.6vw,3.2rem)] text-plum">{s.title}</span>
                </span>
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-plum text-milk">
                  <Plus weight="light" className={`size-5 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${on ? "rotate-45" : ""}`} />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.6, ease }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-[60ch] px-6 pb-8 text-lg leading-relaxed text-plum/80 sm:px-10 sm:pb-10">{s.description}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
