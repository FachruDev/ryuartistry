"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";

const ease = [0.32, 0.72, 0, 1] as const;
const clays = ["var(--lilac)", "var(--peach)", "var(--mint)", "var(--sky)"];

/**
 * Scrollytelling: the section pins while four chapters scroll past. The clay blob on the
 * right morphs and recolours for each chapter; the active chapter on the left comes forward.
 */
export function ProcessStory({
  eyebrow,
  title,
  steps,
}: {
  eyebrow: string;
  title: string;
  steps: { title: string; body: string }[];
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(steps.length - 1, Math.max(0, Math.floor(v * steps.length * 0.999))));
  });

  return (
    <section ref={ref} className="relative" style={{ height: reduced ? "auto" : `${steps.length * 85 + 40}vh` }}>
      <div className={`${reduced ? "" : "sticky top-0"} flex min-h-[100dvh] items-center px-4 py-24 sm:px-8`}>
        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-cloud/80 px-3 py-1 text-xs font-semibold tracking-[0.04em] text-plum-soft ring-1 ring-plum/[0.07]">
              <span aria-hidden className="size-2 rounded-full bg-[var(--peach)]" />
              {eyebrow}
            </span>
            <h2 className="display mt-5 max-w-[15ch] text-[clamp(2.4rem,5vw,4.6rem)] text-plum">{title}</h2>

            <ol className="mt-12 space-y-3">
              {steps.map((step, i) => {
                const on = reduced || i === active;
                return (
                  <li key={step.title}>
                    <motion.div
                      animate={{ opacity: on ? 1 : 0.35, x: on ? 0 : -6 }}
                      transition={{ duration: 0.6, ease }}
                      className="flex gap-5"
                    >
                      <span
                        className="clay grid size-12 shrink-0 place-items-center rounded-2xl text-sm font-bold text-plum"
                        style={{ ["--clay" as string]: on ? clays[i] : "var(--milk-deep)" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="pt-2">
                        <h3 className="text-2xl font-bold text-plum">{step.title}</h3>
                        <AnimatePresence initial={false}>
                          {on && (
                            <motion.p
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.6, ease }}
                              className="max-w-[46ch] overflow-hidden pt-2 text-lg leading-relaxed text-plum-soft"
                            >
                              {step.body}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[520px]">
            <div
              className="clay morph-blob absolute inset-[8%]"
              style={{ ["--clay" as string]: clays[active], transition: "box-shadow 0.9s, background 0.9s" }}
            />
            <AnimatePresence mode="wait">
              <motion.p
                key={active}
                initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 1.3, rotate: 8 }}
                transition={{ duration: 0.7, ease }}
                className="display absolute inset-0 grid place-items-center text-[clamp(6rem,16vw,12rem)] text-plum/85"
              >
                {String(active + 1).padStart(2, "0")}
              </motion.p>
            </AnimatePresence>
            <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
              {steps.map((s, i) => (
                <span
                  key={s.title}
                  className="h-2 w-9 origin-center rounded-full bg-plum transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{ transform: `scaleX(${i === active ? 1 : 0.22})`, opacity: i === active ? 0.85 : 0.2 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
