"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * The footer tucks under the page above it; its contents start raised and settle as it scrolls in,
 * so they move slower than the page. Unlike a sticky reveal, this works at any footer or screen height.
 */
export function FooterParallax({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-45%", "0%"]);

  return (
    <footer ref={ref} className={className}>
      <motion.div style={reduced ? undefined : { y }}>{children}</motion.div>
    </footer>
  );
}
