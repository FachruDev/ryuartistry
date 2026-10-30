import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import { Dotted, Eyebrow, Sparkle } from "./ui";

/** Centred masthead for inner pages, sitting on the drifting pastel glow. */
export function PageIntro({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children?: ReactNode }) {
  return (
    <section className="relative px-4 pb-16 pt-36 text-center sm:px-8 md:pb-24 md:pt-48">
      <Sparkle className="absolute left-[8%] top-40 hidden size-10 md:block" color="var(--sparkle)" />
      <Sparkle className="absolute right-[10%] top-56 hidden size-14 md:block" color="var(--sparkle)" delay={-2} />
      <Reveal>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="display mx-auto mt-6 max-w-[14ch] text-[clamp(3rem,8.4vw,6.8rem)] text-ink">
          <Dotted text={title} />
        </h1>
        {intro && <p className="mx-auto mt-6 max-w-[52ch] text-lg leading-relaxed text-muted sm:text-xl">{intro}</p>}
        {children}
      </Reveal>
    </section>
  );
}
