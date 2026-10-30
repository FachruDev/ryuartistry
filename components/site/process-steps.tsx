"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./ui";

const tones = ["var(--lilac)", "var(--mint)", "var(--sky)", "var(--peach)"];

/** Numbered steps joined by a line that fills in as the visitor scrolls past. */
export function ProcessSteps({ title, intro, steps }: { title: string; intro: string; steps: { title: string; body: string }[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });

  return (
    <section className="px-4 py-24 sm:px-8 md:py-36">
      <Reveal>
        <SectionHeading title={title} intro={intro} />
      </Reveal>
      <div className="relative mx-auto mt-16 max-w-[1240px] md:mt-24">
        <div aria-hidden className="absolute inset-x-0 top-7 hidden h-[2px] rounded-full bg-line lg:block">
          <motion.div style={{ scaleX: progress }} className="h-full origin-left rounded-full bg-ink" />
        </div>
        <ol ref={ref} className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {steps.map((s, i) => (
            <li key={s.title} className="group">
              <Reveal delay={i * 0.08}>
                <span
                  className="display relative grid size-14 place-items-center rounded-full text-xl text-on-pastel ring-[6px] ring-paper transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-12 group-hover:scale-110"
                  style={{ background: tones[i % tones.length] }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="display mt-6 text-[2rem] text-ink">{s.title}</h3>
                <p className="mt-3 max-w-[34ch] leading-relaxed text-muted">{s.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
