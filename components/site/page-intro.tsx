import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import { Eyebrow } from "./pill";

/** Split masthead for inner pages: massive title left, a morphing clay lump right. */
export function PageIntro({
  eyebrow,
  title,
  intro,
  clay = "var(--lilac)",
  accent = "var(--peach)",
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  clay?: string;
  accent?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden px-4 pb-20 pt-36 sm:px-8 md:pb-28 md:pt-44">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="morph-blob absolute -right-24 -top-20 size-[30rem] opacity-50 blur-3xl" style={{ background: clay }} />
      </div>
      <div className="mx-auto grid max-w-[1400px] items-end gap-12 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <Eyebrow clay={clay}>{eyebrow}</Eyebrow>
          <h1 className="display mt-6 max-w-[14ch] text-[clamp(3rem,8vw,7.6rem)] text-plum">{title}</h1>
          {intro && <p className="mt-8 max-w-[48ch] text-lg leading-relaxed text-plum-soft sm:text-xl">{intro}</p>}
          {children}
        </Reveal>
        <Reveal delay={0.15} className="relative hidden aspect-square w-full max-w-[380px] justify-self-end lg:block">
          <div aria-hidden className="clay morph-blob absolute inset-[10%]" style={{ ["--clay" as string]: clay }} />
          <div aria-hidden className="clay absolute right-[6%] top-[8%] size-20 rounded-full" style={{ ["--clay" as string]: accent }} />
          <div aria-hidden className="clay absolute bottom-[10%] left-[4%] h-12 w-28 -rotate-12 rounded-full" style={{ ["--clay" as string]: "var(--butter)" }} />
        </Reveal>
      </div>
    </section>
  );
}
