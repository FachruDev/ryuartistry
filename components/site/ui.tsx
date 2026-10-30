import Link from "next/link";
import type { ReactNode } from "react";

const spring = "duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]";

const arrows = {
  right: "M5 12h14m-6-6 6 6-6 6",
  left: "M19 12H5m6-6-6 6 6 6",
  "up-right": "M7 17 17 7M8 7h9v9",
};

export function ArrowIcon({ direction = "right", className = "size-4" }: { direction?: keyof typeof arrows; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={arrows[direction]} />
    </svg>
  );
}

/** Renders a heading with its closing full stop in the accent colour. */
export function Dotted({ text }: { text: string }) {
  const base = text.trim().replace(/\.$/, "");
  if (/[?!…]$/.test(base)) return <>{base}</>;
  return (
    <>
      {base}
      <span className="text-accent">.</span>
    </>
  );
}

// A ::before layer that sweeps in from the left on hover; the pill's rounded overflow clips its edges.
const sweep =
  "relative isolate overflow-hidden transition-[color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] before:absolute before:inset-0 before:-z-10 before:origin-left before:scale-x-0 before:transition-transform before:duration-500 before:ease-[cubic-bezier(0.32,0.72,0,1)] hover:before:scale-x-100 focus-visible:before:scale-x-100";

// Resting colours, then the sweep colour and the text colour that sits on it.
const buttonVariants = {
  solid: "bg-ink text-paper before:bg-yuzu hover:text-on-pastel focus-visible:text-on-pastel",
  ghost: "bg-paper-raised/60 text-ink ring-1 ring-line before:bg-ink hover:text-paper hover:ring-ink focus-visible:text-paper",
  pastel: "bg-on-pastel text-white before:bg-white hover:text-on-pastel focus-visible:text-on-pastel",
  soft: "bg-white/45 text-on-pastel before:bg-on-pastel hover:text-white focus-visible:text-white",
};

/** Pill button classes, shared by links and form buttons. */
export function buttonClass(variant: keyof typeof buttonVariants = "solid") {
  return `group inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-[15px] font-semibold active:scale-[0.97] ${sweep} ${buttonVariants[variant]}`;
}

export function ButtonLink({
  href,
  children,
  variant = "solid",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof buttonVariants;
  className?: string;
}) {
  return (
    <Link href={href} className={`${buttonClass(variant)} ${className}`}>
      {children}
      <ArrowIcon className={`size-4 transition-transform ${spring} group-hover:translate-x-1`} />
    </Link>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      transitionTypes={["nav-back"]}
      className={`group inline-flex items-center gap-2 rounded-full bg-paper-raised/70 py-2 pl-3 pr-4 text-sm font-semibold text-ink ring-1 ring-line before:bg-ink hover:text-paper hover:ring-ink focus-visible:text-paper ${sweep}`}
    >
      <ArrowIcon direction="left" className={`size-4 transition-transform ${spring} group-hover:-translate-x-1`} />
      {children}
    </Link>
  );
}

/** Category pill tinted with its discipline's pastel. */
export function Tag({ children, tone }: { children: ReactNode; tone: string }) {
  return (
    <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-on-pastel" style={{ background: tone }}>
      {children}
    </span>
  );
}

/** Four-point sparkle; twinkles via CSS. */
export function Sparkle({ className = "", color = "var(--yuzu)", delay = 0 }: { className?: string; color?: string; delay?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`twinkle ${className}`} style={{ color, animationDelay: `${delay}s` }}>
      <path fill="currentColor" d="M12 0c.5 6.6 5.4 11.5 12 12-6.6.5-11.5 5.4-12 12-.5-6.6-5.4-11.5-12-12C6.6 11.5 11.5 6.6 12 0Z" />
    </svg>
  );
}

/** Centred section title with an optional intro line. */
export function SectionHeading({ title, intro, as: Tag = "h2", className = "" }: { title: string; intro?: string; as?: "h1" | "h2"; className?: string }) {
  return (
    <div className={`mx-auto max-w-3xl text-center ${className}`}>
      <Tag className="display text-[clamp(2.6rem,6.4vw,5rem)] text-ink">
        <Dotted text={title} />
      </Tag>
      {intro && <p className="mx-auto mt-5 max-w-[52ch] text-lg leading-relaxed text-muted sm:text-xl">{intro}</p>}
    </div>
  );
}
