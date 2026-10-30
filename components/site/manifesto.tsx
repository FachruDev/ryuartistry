"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

/** A line of copy read word by word as the visitor scrolls through a pinned section. */
export function Manifesto({ text }: { text: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.7", "end end"] });
  const words = text.split(" ");

  const className = "display-italic mx-auto max-w-[1100px] text-[clamp(2rem,4.8vw,4.6rem)] leading-[1.1] text-plum";

  if (reduced) {
    return (
      <section className="px-4 py-28 sm:px-8">
        <p className={className}>{text}</p>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[200vh]">
      <div className="sticky top-0 flex min-h-[100dvh] items-center px-4 sm:px-8">
        <p className={className}>
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
  const opacity = useTransform(progress, range, [0.12, 1]);
  const y = useTransform(progress, range, [12, 0]);
  return (
    <>
      <motion.span style={{ opacity, y }} className="inline-block">
        {children}
      </motion.span>{" "}
    </>
  );
}
