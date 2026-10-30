"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

export type DisciplinePanel = {
  key: string;
  title: string;
  body: string;
  services: string[];
  href: string;
  linkLabel: string;
};

const widths: Record<string, number> = { ai: 100, game: 92, software: 78, creative: 80 };

function Panel({ panel, className = "" }: { panel: DisciplinePanel; className?: string }) {
  return (
    <article className={`flex flex-col justify-center gap-10 border-l border-paper/15 pl-6 sm:pl-10 ${className}`}>
      <h3
        className="display text-[clamp(4.5rem,13vw,13rem)] text-paper"
        style={{ ["--wdth" as string]: widths[panel.key] ?? 100 }}
      >
        {panel.title}
      </h3>
      <div className="grid gap-6 md:grid-cols-[minmax(0,34ch)_1fr] md:gap-12">
        <p className="text-lg leading-relaxed text-paper/80">{panel.body}</p>
        <div>
          {panel.services.length > 0 && (
            <ul className="space-y-1.5 text-paper/90">
              {panel.services.map((s) => (
                <li key={s} className="flex gap-3">
                  <span aria-hidden className="mt-2.5 block size-1.5 shrink-0 rotate-45 bg-scale" />
                  {s}
                </li>
              ))}
            </ul>
          )}
          <Link href={panel.href} className="mt-5 inline-block font-semibold text-scale underline-offset-4 hover:underline">
            {panel.linkLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function Disciplines({ heading, panels }: { heading: string; panels: DisciplinePanel[] }) {
  const reduced = useReducedMotion();
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!wide || reduced) {
    return (
      <section className="bg-ink px-4 py-24 text-paper sm:px-8">
        <h2 className="mx-auto mb-14 max-w-[1440px] text-3xl font-semibold sm:text-4xl">{heading}</h2>
        <div className="mx-auto max-w-[1440px] space-y-20">
          {panels.map((p) => (
            <Panel key={p.key} panel={p} />
          ))}
        </div>
      </section>
    );
  }

  return <HorizontalDisciplines heading={heading} panels={panels} />;
}

function HorizontalDisciplines({ heading, panels }: { heading: string; panels: DisciplinePanel[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (track.current) setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0.05, 0.95], [0, -distance]);

  return (
    <section ref={section} className="relative bg-ink text-paper" style={{ height: `${panels.length * 90 + 40}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden pt-24">
        <h2 className="mx-auto w-full max-w-[1440px] px-8 text-4xl font-semibold">{heading}</h2>
        <motion.div ref={track} style={{ x }} className="flex flex-1 items-stretch gap-16 px-8 pb-16 pt-10">
          {panels.map((p) => (
            <Panel key={p.key} panel={p} className="w-[72vw] max-w-[1100px] shrink-0" />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
