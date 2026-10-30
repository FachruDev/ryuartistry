import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { BracketsCurly, GameController, PaintBrush, Robot } from "@phosphor-icons/react/ssr";
import { Reveal } from "./reveal";
import { ArrowIcon, SectionHeading } from "./ui";

const icons: Record<string, Icon> = { ai: Robot, game: GameController, software: BracketsCurly, creative: PaintBrush };
// Same rhythm as the work grid: wide/narrow, then narrow/wide.
const spans = ["md:col-span-7", "md:col-span-5", "md:col-span-5", "md:col-span-7"];

export type DisciplinePanel = {
  key: string;
  title: string;
  tagline: string;
  body: string;
  tone: string;
  services: string[];
  href: string;
};

const spring = "duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]";

export function Disciplines({ title, intro, linkLabel, panels }: { title: string; intro: string; linkLabel: string; panels: DisciplinePanel[] }) {
  return (
    <section className="px-4 py-24 sm:px-8 md:py-36">
      <Reveal>
        <SectionHeading title={title} intro={intro} />
      </Reveal>
      <div className="mx-auto mt-14 grid max-w-[1240px] gap-5 md:mt-20 md:grid-cols-12 md:gap-6">
        {panels.map((p, i) => {
          const Icon = icons[p.key] ?? Robot;
          return (
            <Reveal key={p.key} delay={(i % 2) * 0.08} className={spans[i % spans.length]}>
              <Link
                href={p.href}
                className="lift group flex h-full flex-col rounded-[2.5rem] p-7 text-on-pastel md:rounded-[3.5rem] md:p-11"
                style={{ background: p.tone }}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className={`grid size-[4.5rem] place-items-center rounded-[1.5rem] bg-white/50 transition-transform ${spring} group-hover:-rotate-12 group-hover:scale-110`}>
                    <Icon weight="light" className="size-10" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-60">0{i + 1}</span>
                </div>
                <h3 className="display mt-10 text-[clamp(2.4rem,4.4vw,3.6rem)]">{p.title}</h3>
                <p className="mt-2 text-lg font-semibold">{p.tagline}</p>
                <p className="mt-3 max-w-[46ch] leading-relaxed opacity-75">{p.body}</p>
                {p.services.length > 0 && (
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {p.services.map((s) => (
                      <li key={s} className="rounded-full bg-white/45 px-3 py-1 text-sm font-medium">
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
                <span className="mt-auto inline-flex items-center gap-2 pt-10 font-semibold">
                  {linkLabel}
                  <ArrowIcon className={`size-4 transition-transform ${spring} group-hover:translate-x-1.5`} />
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
