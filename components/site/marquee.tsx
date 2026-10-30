"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from "motion/react";

const clays = ["var(--lilac)", "var(--mint)", "var(--sky)", "var(--peach)", "var(--butter)"];

function Row({ items, reverse, offset }: { items: string[]; reverse?: boolean; offset: number }) {
  const loop = [...items, ...items];
  return (
    <div className={`marquee flex overflow-hidden ${reverse ? "marquee-reverse" : ""}`}>
      <div className="marquee-track flex shrink-0 gap-4 pr-4" style={{ ["--marquee-duration" as string]: `${items.length * 5}s` }}>
        {loop.map((item, i) => (
          <span
            key={`${item}-${i}`}
            aria-hidden={i >= items.length}
            className="clay inline-flex shrink-0 items-center gap-3 rounded-full px-6 py-3.5 text-lg font-semibold text-plum sm:text-xl"
            style={{ ["--clay" as string]: clays[(i + offset) % clays.length] }}
          >
            <span aria-hidden className="size-2.5 rounded-full bg-plum/70" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Two counter-running rows of clay pills that lean into the scroll direction. */
export function Marquee({ items, label }: { items: string[]; label: string }) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 40, stiffness: 300 });
  const skew = useTransform(velocity, [-2000, 0, 2000], reduced ? [0, 0, 0] : [4, 0, -4]);

  return (
    <section aria-label={label} className="relative -rotate-2 py-16 sm:py-24">
      <motion.div style={{ skewX: skew }} className="space-y-4">
        <Row items={items} offset={0} />
        <Row items={[...items].reverse()} reverse offset={2} />
      </motion.div>
    </section>
  );
}
