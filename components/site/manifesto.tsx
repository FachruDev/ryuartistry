"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

/** The manifesto is read word by word as the visitor scrolls through a pinned section. */
export function Manifesto({ text }: { text: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.6", "end end"] });
  const words = text.split(" ");

  if (reduced) {
    return (
      <section className="bg-paper px-4 py-28 sm:px-8">
        <p className="mx-auto max-w-[1100px] font-serif text-[clamp(2rem,4.6vw,4.4rem)] leading-[1.12] text-ink">{text}</p>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[220vh] bg-paper">
      <div className="sticky top-0 flex min-h-screen items-center px-4 sm:px-8">
        <p className="mx-auto max-w-[1100px] font-serif text-[clamp(2rem,4.6vw,4.4rem)] leading-[1.12] text-ink">
          {words.map((word, i) => (
            <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {word}
            </Word>
          ))}
        </p>
      </div>
    </section>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <>
      <motion.span style={{ opacity }}>{children}</motion.span>{" "}
    </>
  );
}
