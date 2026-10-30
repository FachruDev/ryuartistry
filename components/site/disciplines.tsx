"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowUpRight, Plus } from "@phosphor-icons/react";

const ease = [0.32, 0.72, 0, 1] as const;

export type DisciplinePanel = {
  key: string;
  title: string;
  tagline: string;
  body: string;
  clay: string;
  image: string;
  services: string[];
  href: string;
  linkLabel: string;
};

function subscribeWide(onChange: () => void) {
  const mq = window.matchMedia("(min-width: 1024px)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const readWide = () => window.matchMedia("(min-width: 1024px)").matches;

function Panel({ panel, toggleLabel, className = "" }: { panel: DisciplinePanel; toggleLabel: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <article
      className={`clay relative flex flex-col justify-between gap-8 overflow-hidden p-6 sm:p-10 ${className}`}
      style={{ ["--clay" as string]: panel.clay, borderRadius: "2.5rem" }}
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h3 className="display text-[clamp(3.6rem,8vw,7.5rem)] text-plum">{panel.title}</h3>
          <p className="display-italic mt-2 text-2xl text-plum/80 sm:text-3xl">{panel.tagline}</p>
        </div>
        <div className="bezel hidden w-40 shrink-0 rotate-3 sm:block lg:w-56">
          <div className="bezel-core relative aspect-[4/5]">
            <Image src={panel.image} alt="" fill sizes="224px" className="object-cover" />
          </div>
        </div>
      </div>

      <div>
        <p className="max-w-[42ch] text-lg leading-relaxed text-plum/80">{panel.body}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {panel.services.length > 0 && (
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className="group inline-flex items-center gap-3 rounded-full bg-cloud/70 py-2 pl-5 pr-2 text-[15px] font-semibold text-plum transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            >
              {toggleLabel}
              <span className="grid size-8 place-items-center rounded-full bg-plum text-milk">
                <Plus weight="light" className={`size-4 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${open ? "rotate-45" : ""}`} />
              </span>
            </button>
          )}
          <Link
            href={panel.href}
            className="group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-semibold text-plum underline decoration-plum/30 decoration-2 underline-offset-4 hover:decoration-plum"
          >
            {panel.linkLabel}
            <ArrowUpRight weight="light" className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.6, ease }}
              className="flex flex-wrap gap-2 overflow-hidden pt-5"
            >
              {panel.services.map((s) => (
                <li key={s} className="rounded-full bg-cloud/80 px-4 py-2 text-sm font-semibold text-plum">
                  {s}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}

export function Disciplines({
  eyebrow,
  heading,
  toggleLabel,
  panels,
}: {
  eyebrow: string;
  heading: string;
  toggleLabel: string;
  panels: DisciplinePanel[];
}) {
  const reduced = useReducedMotion();
  const wide = useSyncExternalStore(subscribeWide, readWide, () => false);

  const header = (
    <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-8">
      <span className="inline-flex items-center gap-2 rounded-full bg-cloud/80 px-3 py-1 text-xs font-semibold tracking-[0.04em] text-plum-soft ring-1 ring-plum/[0.07]">
        <span aria-hidden className="size-2 rounded-full bg-[var(--mint)]" />
        {eyebrow}
      </span>
      <h2 className="display mt-4 text-[clamp(2.6rem,6vw,5.5rem)] text-plum">{heading}</h2>
    </div>
  );

  if (!wide || reduced) {
    return (
      <section className="py-24">
        {header}
        <div className="mx-auto mt-12 max-w-[1400px] space-y-6 px-4 sm:px-8">
          {panels.map((p) => (
            <Panel key={p.key} panel={p} toggleLabel={toggleLabel} className="min-h-[70vh]" />
          ))}
        </div>
      </section>
    );
  }

  return <Horizontal header={header} panels={panels} toggleLabel={toggleLabel} />;
}

function Horizontal({ header, panels, toggleLabel }: { header: React.ReactNode; panels: DisciplinePanel[]; toggleLabel: string }) {
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
    return () => ro.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0.08, 0.92], [0, -distance]);
  const bar = useTransform(scrollYProgress, [0.08, 0.92], [0, 1]);

  return (
    <section ref={section} className="relative" style={{ height: `${panels.length * 95 + 30}vh` }}>
      <div className="sticky top-0 flex h-[100dvh] flex-col justify-center overflow-hidden pt-20">
        {header}
        <motion.div ref={track} style={{ x }} className="flex items-stretch gap-8 px-8 pb-10 pt-10">
          {panels.map((p, i) => (
            <Panel
              key={p.key}
              panel={p}
              toggleLabel={toggleLabel}
              className={`h-[62vh] w-[min(78vw,1040px)] shrink-0 ${i % 2 ? "translate-y-6" : ""}`}
            />
          ))}
        </motion.div>
        <div className="mx-auto h-1 w-40 overflow-hidden rounded-full bg-plum/10">
          <motion.div style={{ scaleX: bar }} className="h-full origin-left rounded-full bg-plum" />
        </div>
      </div>
    </section>
  );
}
