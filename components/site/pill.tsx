import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";

type Variant = "plum" | "clay" | "ghost";

const shell: Record<Variant, string> = {
  plum: "bg-plum text-milk",
  clay: "clay text-plum",
  ghost: "bg-plum/[0.04] text-plum ring-1 ring-plum/10 hover:bg-plum/[0.07]",
};
const core: Record<Variant, string> = {
  plum: "bg-milk/15 text-milk",
  clay: "bg-plum text-milk",
  ghost: "bg-plum text-milk",
};

/** Pill CTA with its arrow nested in its own circle (button-in-button). */
export function PillLink({
  href,
  children,
  variant = "plum",
  clay,
  className = "",
  size = "md",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  clay?: string;
  className?: string;
  size?: "md" | "lg";
}) {
  const pad = size === "lg" ? "py-2.5 pl-7 pr-2.5 text-lg" : "py-2 pl-5 pr-2 text-[15px]";
  const dot = size === "lg" ? "size-11" : "size-9";
  return (
    <Link
      href={href}
      style={clay ? ({ "--clay": clay } as React.CSSProperties) : undefined}
      className={`group inline-flex items-center gap-4 rounded-full font-semibold transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98] ${shell[variant]} ${pad} ${className}`}
    >
      {children}
      <span
        aria-hidden
        className={`grid ${dot} place-items-center rounded-full transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105 ${core[variant]}`}
      >
        <ArrowUpRight weight="light" className="size-[45%]" />
      </span>
    </Link>
  );
}

/** Microscopic pill badge that sits above a heading. */
export function Eyebrow({ children, clay = "var(--lilac)", className = "" }: { children: ReactNode; clay?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-cloud/80 px-3 py-1 text-xs font-semibold tracking-[0.04em] text-plum-soft ring-1 ring-plum/[0.07] ${className}`}
    >
      <span aria-hidden className="size-2 rounded-full" style={{ background: clay }} />
      {children}
    </span>
  );
}
