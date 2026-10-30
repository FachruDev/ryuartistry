"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { disciplineClay } from "@/lib/clay";
import { formatDate, pick, type Locale } from "@/lib/i18n";
import type { PostRow } from "@/lib/cards";

const ease = [0.32, 0.72, 0, 1] as const;

/** Lab notes as rows; on fine pointers the hovered note's cover floats beside the cursor. */
export function PostList({ items, lang, minRead, cursorLabel }: { items: PostRow[]; lang: Locale; minRead: string; cursorLabel: string }) {
  const [hovered, setHovered] = useState<PostRow | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 26 });
  const sy = useSpring(y, { stiffness: 220, damping: 26 });

  return (
    <div
      className="relative"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
      }}
      onPointerLeave={() => setHovered(null)}
    >
      <ul className="border-t border-plum/10">
        {items.map((p) => {
          const clay = disciplineClay[p.category?.slug ?? ""] ?? "var(--butter)";
          return (
            <li key={p.id} className="border-b border-plum/10">
              <Link
                href={`/${lang}/lab/${p.slug}`}
                data-cursor={cursorLabel}
                onPointerEnter={() => setHovered(p)}
                className="group grid grid-cols-[1fr_auto] items-center gap-6 py-8 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] md:hover:translate-x-3"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-plum-soft">
                    {p.category && (
                      <span className="clay rounded-full px-3 py-1 text-xs font-bold text-plum" style={{ ["--clay" as string]: clay }}>
                        {pick(p.category.name, lang)}
                      </span>
                    )}
                    <time dateTime={p.publishedAt ? new Date(p.publishedAt).toISOString() : undefined}>{formatDate(p.publishedAt, lang)}</time>
                    <span>
                      {p.readingTime} {minRead}
                    </span>
                  </div>
                  <h3 className="display mt-3 text-[clamp(1.6rem,3vw,2.6rem)] text-plum">{pick(p.title, lang)}</h3>
                  {pick(p.excerpt, lang) && <p className="mt-2 max-w-[60ch] text-plum-soft">{pick(p.excerpt, lang)}</p>}
                </div>
                <span className="grid size-12 place-items-center rounded-full bg-plum/[0.05] text-plum transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-[var(--butter)]">
                  <ArrowUpRight weight="light" className="size-5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <motion.div style={{ x: sx, y: sy }} className="pointer-events-none absolute left-0 top-0 hidden md:block" aria-hidden>
        <AnimatePresence>
          {hovered?.cover && (
            <motion.div
              key={hovered.id}
              initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
              animate={{ opacity: 1, scale: 1, rotate: 3 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 0 }}
              transition={{ duration: 0.5, ease }}
              className="bezel -translate-y-1/2 translate-x-10"
            >
              <div className="bezel-core relative h-44 w-60">
                <Image src={hovered.cover.url} alt="" fill sizes="240px" className="object-cover" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
