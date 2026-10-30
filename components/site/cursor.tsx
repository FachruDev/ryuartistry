"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/**
 * A soft clay cursor for fine pointers. Elements with `data-cursor="Label"` grow it into
 * a labelled pastel bubble; everything else keeps the native cursor underneath.
 */
export function ClayCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 380, damping: 32, mass: 0.6 });
  const [label, setLabel] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!mq.matches) return;
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor]");
      setLabel(target?.dataset.cursor ?? null);
      setEnabled(true);
    };
    const leave = () => setEnabled(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed left-0 top-0 z-50"
      animate={{ opacity: enabled ? 1 : 0 }}
    >
      <motion.div
        className="-translate-x-1/2 -translate-y-1/2 grid place-items-center rounded-full text-[13px] font-bold text-plum"
        animate={{
          width: label ? 92 : 14,
          height: label ? 92 : 14,
          backgroundColor: label ? "rgba(255, 232, 163, 0.92)" : "rgba(42, 30, 63, 0.85)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <motion.span animate={{ opacity: label ? 1 : 0, scale: label ? 1 : 0.6 }}>{label}</motion.span>
      </motion.div>
    </motion.div>
  );
}
