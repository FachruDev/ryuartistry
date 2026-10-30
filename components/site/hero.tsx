"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { ArrowDown, ArrowUpRight } from "@phosphor-icons/react";

const ClayScene = dynamic(() => import("./clay-scene"), { ssr: false });

const ease = [0.32, 0.72, 0, 1] as const;
const wordClays = ["var(--lilac)", "var(--mint)", "var(--sky)", "var(--peach)"];

let webgl: boolean | undefined;
function canUseWebGL() {
  if (webgl === undefined) {
    try {
      const canvas = document.createElement("canvas");
      webgl = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}
const noopSubscribe = () => () => {};

/** Pastel clay lumps drawn in CSS: shown while WebGL loads and instead of it for reduced motion. */
function StaticClay() {
  return (
    <div aria-hidden className="absolute inset-0 grid place-items-center">
      <div className="clay morph-blob size-[58%] max-w-[420px]" style={{ ["--clay" as string]: "var(--lilac)", borderRadius: "48% 52% 60% 40% / 45% 45% 55% 55%" }} />
      <div className="clay absolute right-[14%] top-[16%] size-16 rounded-full" style={{ ["--clay" as string]: "var(--peach)" }} />
      <div className="clay absolute bottom-[18%] left-[12%] h-10 w-24 rounded-full" style={{ ["--clay" as string]: "var(--mint)" }} />
      <div className="clay absolute left-[18%] top-[20%] size-12 rounded-2xl" style={{ ["--clay" as string]: "var(--sky)" }} />
    </div>
  );
}

export function Hero({
  eyebrow,
  lead,
  words,
  tail,
  subtitle,
  primary,
  secondary,
  scrollLabel,
  nowShaping,
}: {
  eyebrow: string;
  lead: string;
  words: string[];
  tail: string;
  subtitle: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
  scrollLabel: string;
  nowShaping: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const reduced = useReducedMotion();
  const hasWebGL = useSyncExternalStore(noopSubscribe, canUseWebGL, () => false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced || words.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), 2600);
    return () => window.clearInterval(id);
  }, [reduced, words.length]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => (progress.current = v));
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -160]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.65], [1, reduced ? 1 : 0]);
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.18]);
  const stageY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 120]);

  return (
    <section ref={ref} className="relative isolate min-h-[100dvh] overflow-hidden">
      {/* Soft pastel weather behind everything. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="morph-blob absolute -left-32 top-20 size-[38rem] bg-[var(--lilac)] opacity-50 blur-3xl" />
        <div className="morph-blob absolute -right-40 top-[30%] size-[34rem] bg-[var(--peach)] opacity-45 blur-3xl [animation-delay:-3s]" />
        <div className="morph-blob absolute bottom-[-12rem] left-[35%] size-[30rem] bg-[var(--mint)] opacity-45 blur-3xl [animation-delay:-6s]" />
      </div>

      <div className="mx-auto grid min-h-[100dvh] max-w-[1400px] grid-rows-[minmax(42vh,1fr)_auto] gap-6 px-4 pb-10 pt-24 sm:px-8 lg:grid-cols-[1.08fr_1fr] lg:grid-rows-1 lg:items-center lg:gap-4 lg:pb-16 lg:pt-28">
        {/* 3D stage: first on mobile, right column on desktop. */}
        <motion.div style={{ scale: stageScale, y: stageY }} className="relative order-first h-full min-h-[42vh] lg:order-last lg:h-[78vh]">
          {hasWebGL && !reduced ? <ClayScene progress={progress} colorIndex={index} /> : <StaticClay />}
          {words.length > 0 && <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9, ease }}
            className="bezel absolute bottom-4 right-2 hidden w-60 sm:block lg:bottom-16 lg:right-6"
          >
            <div className="bezel-core bg-cloud/90 p-4">
              <p className="text-xs font-semibold text-plum-soft">{nowShaping}</p>
              <div className="mt-2 flex items-center gap-3">
                <motion.span
                  className="clay block size-8 rounded-full"
                  animate={{ ["--clay" as string]: wordClays[index % wordClays.length] }}
                  transition={{ duration: 0.8, ease }}
                />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                    transition={{ duration: 0.5, ease }}
                    className="display text-2xl text-plum"
                  >
                    {words[index]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>}
        </motion.div>

        <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease }}
            className="inline-flex items-center gap-2 rounded-full bg-cloud/80 px-3 py-1 text-xs font-semibold tracking-[0.04em] text-plum-soft ring-1 ring-plum/[0.07]"
          >
            <span aria-hidden className="size-2 rounded-full bg-[var(--berry)]" />
            {eyebrow}
          </motion.span>

          <h1 className="display mt-6 text-[clamp(3.1rem,7.6vw,7.4rem)] text-plum">
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.1, ease }}
            >
              {lead}
            </motion.span>
            {words.length > 0 && <motion.span
              className="my-2 inline-flex"
              initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.1, delay: 0.12, ease }}
            >
              <motion.span
                layout
                transition={{ layout: { duration: 0.7, ease } }}
                className="clay relative inline-flex overflow-hidden rounded-[0.9em] px-[0.32em] pb-[0.12em] pt-[0.02em]"
                animate={{ ["--clay" as string]: wordClays[index % wordClays.length] }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={index}
                    initial={{ y: "70%", opacity: 0, filter: "blur(12px)", scale: 0.9 }}
                    animate={{ y: "0%", opacity: 1, filter: "blur(0px)", scale: 1 }}
                    exit={{ y: "-70%", opacity: 0, filter: "blur(12px)", scale: 1.05 }}
                    transition={{ duration: 0.7, ease }}
                    className="display-italic inline-block"
                  >
                    {words[index]}
                  </motion.span>
                </AnimatePresence>
              </motion.span>
            </motion.span>}
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.1, delay: 0.24, ease }}
            >
              {tail}
            </motion.span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.45, ease }}
          >
            <p className="mt-8 max-w-[44ch] text-lg leading-relaxed text-plum-soft sm:text-xl">{subtitle}</p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href={primary.href}
                className="group inline-flex items-center gap-4 rounded-full bg-plum py-2 pl-6 pr-2 text-[15px] font-semibold text-milk transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {primary.label}
                <span className="grid size-10 place-items-center rounded-full bg-[var(--butter)] text-plum transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105">
                  <ArrowUpRight weight="light" className="size-5" />
                </span>
              </Link>
              <Link
                href={secondary.href}
                className="rounded-full px-5 py-3.5 text-[15px] font-semibold text-plum ring-1 ring-plum/15 transition-colors duration-500 hover:bg-plum/[0.05]"
              >
                {secondary.label}
              </Link>
            </div>
          </motion.div>

          <p className="mt-14 hidden items-center gap-3 text-sm font-medium text-plum-soft lg:flex" aria-hidden>
            <span className="grid size-9 place-items-center rounded-full ring-1 ring-plum/15">
              <ArrowDown weight="light" className="size-4 animate-bounce" />
            </span>
            {scrollLabel}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
