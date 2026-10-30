"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useSyncExternalStore } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";

const ScaleField = dynamic(() => import("./scale-field"), { ssr: false });

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

export function Hero({
  title,
  subtitle,
  primary,
  secondary,
  scrollLabel,
}: {
  title: string;
  subtitle: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
  scrollLabel: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const reduced = useReducedMotion();
  const hasWebGL = useSyncExternalStore(noopSubscribe, canUseWebGL, () => false);
  const show3d = hasWebGL && !reduced;

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => (progress.current = v));
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -140]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduced ? 1 : 0]);

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-ink text-paper">
      {/* Static scale pattern: shown while WebGL loads, and instead of it for reduced motion. */}
      <div className="scale-pattern absolute inset-0 -z-10 opacity-40" aria-hidden />
      {show3d && <ScaleField progress={progress} />}

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative mx-auto w-full max-w-[1440px] px-4 pb-14 pt-32 sm:px-8 sm:pb-20"
      >
        <h1 className="hero-title display max-w-[13ch] text-[clamp(3.1rem,8.6vw,9rem)] [text-shadow:0_2px_30px_rgba(18,20,58,0.55)]">
          {title}
        </h1>
        <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-[46ch] text-lg leading-relaxed text-paper/85 sm:text-xl">{subtitle}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={primary.href}
              className="rounded-full bg-scale px-6 py-3 font-bold text-ink-deep transition-transform hover:-translate-y-0.5"
            >
              {primary.label}
            </Link>
            <Link
              href={secondary.href}
              className="rounded-full border border-paper/40 bg-ink/60 px-6 py-3 font-semibold text-paper backdrop-blur-sm transition-colors hover:border-scale hover:text-scale"
            >
              {secondary.label}
            </Link>
          </div>
        </div>
        <p className="mt-14 hidden items-center gap-3 text-sm text-paper/60 sm:flex" aria-hidden>
          <span className="block h-px w-10 bg-paper/40" />
          {scrollLabel}
        </p>
      </motion.div>
    </section>
  );
}
