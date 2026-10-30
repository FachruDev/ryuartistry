import type { ReactNode } from "react";

/** Indigo masthead that opens every inner page, so the fixed header always sits on ink. */
export function PageIntro({ title, intro, children }: { title: string; intro?: string; children?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden bg-ink px-4 pb-16 pt-36 text-paper sm:px-8 md:pb-24 md:pt-44">
      <div className="scale-pattern absolute inset-y-0 right-0 -z-10 w-1/2 opacity-30 [mask-image:linear-gradient(to_left,black,transparent)]" aria-hidden />
      <div className="mx-auto max-w-[1440px]">
        <h1 className="display max-w-[16ch] text-[clamp(3rem,9vw,8.5rem)]">{title}</h1>
        {intro && <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-paper/80 sm:text-xl">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
