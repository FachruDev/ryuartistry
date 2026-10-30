"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ButtonLink, Dotted, Sparkle } from "./ui";

const tones = ["var(--wisteria)", "var(--jade)", "var(--mizu)", "var(--sakura)"];
const slide = "transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]";

/** The last word of the headline cycles inside a pastel highlight that resizes to fit it. */
function RotatingWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [widths, setWidths] = useState<number[]>([]);
  const sizers = useRef<(HTMLSpanElement | null)[]>([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || words.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), 2600);
    return () => window.clearInterval(id);
  }, [reduced, words.length]);

  // Measure every word once fonts settle and whenever the headline resizes.
  useEffect(() => {
    const els = sizers.current.filter((el): el is HTMLSpanElement => el !== null);
    const observer = new ResizeObserver(() => setWidths(els.map((el) => el.offsetWidth)));
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [words]);

  const known = widths.length === words.length && widths.every((w) => w > 0);
  const prev = (index - 1 + words.length) % words.length;

  return (
    <>
      {words.map((w, i) => (
        <span
          key={w}
          ref={(el) => {
            sizers.current[i] = el;
          }}
          aria-hidden
          className="invisible absolute left-0 top-0 whitespace-nowrap px-[0.14em]"
        >
          {w}
        </span>
      ))}
      <span
        aria-hidden
        className="relative inline-block h-[1.08em] overflow-hidden rounded-[0.24em] align-[-0.16em] text-on-pastel transition-[width,background-color] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ width: known ? widths[index] : undefined, backgroundColor: tones[index % tones.length] }}
      >
        {!known && <span className="invisible inline-block whitespace-nowrap px-[0.14em] leading-[1.08em]">{words[0]}</span>}
        {words.map((w, i) => (
          <span
            key={w}
            className={`absolute inset-0 grid place-items-center whitespace-nowrap leading-none ${slide}`}
            style={{
              transform: `translateY(${i === index ? 0 : i === prev ? -105 : 105}%)`,
              opacity: i === index ? 1 : 0,
            }}
          >
            {w}
          </span>
        ))}
      </span>
    </>
  );
}

export function Hero({
  lead,
  words,
  customTitle,
  subtitle,
  primary,
  secondary,
}: {
  lead: string;
  words: string[];
  customTitle?: string;
  subtitle: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
}) {
  const { scrollY } = useScroll();
  const drift = [
    useTransform(scrollY, [0, 700], [0, -140]),
    useTransform(scrollY, [0, 700], [0, -60]),
    useTransform(scrollY, [0, 700], [0, -200]),
    useTransform(scrollY, [0, 700], [0, -90]),
  ];

  return (
    <section className="relative px-4 pb-20 pt-36 text-center sm:px-8 md:pb-28 md:pt-48">
      <motion.div style={{ y: drift[0] }} className="absolute left-[7%] top-[34%] md:left-[14%]">
        <Sparkle className="size-9 drop-shadow-[0_6px_14px_rgb(var(--shade)/0.12)] md:size-14" color="var(--sparkle)" />
      </motion.div>
      <motion.div style={{ y: drift[1] }} className="absolute right-[8%] top-[22%] md:right-[17%]">
        <Sparkle className="size-12 drop-shadow-[0_6px_14px_rgb(var(--shade)/0.12)] md:size-16" color="var(--sparkle)" delay={-1.5} />
      </motion.div>
      <motion.div style={{ y: drift[2] }} className="absolute right-[12%] top-[62%] hidden md:block">
        <Sparkle className="size-7" color="var(--wisteria)" delay={-3} />
      </motion.div>
      <motion.div style={{ y: drift[3] }} className="absolute left-[20%] top-[70%] hidden md:block">
        <Sparkle className="size-6" color="var(--sakura)" delay={-0.8} />
      </motion.div>

      <div className="relative">
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
          className="display relative mx-auto text-[clamp(3.3rem,10.5vw,8.4rem)] text-ink"
        >
          {customTitle ? (
            <span className="mx-auto block max-w-[13ch]">
              <Dotted text={customTitle} />
            </span>
          ) : (
            <>
              <span className="sr-only">
                {lead} {words.join(", ")}.
              </span>
              <span aria-hidden className="block">
                {lead}
              </span>
              <span aria-hidden className="relative inline-block whitespace-nowrap">
                <RotatingWord words={words} />
                <span className="text-accent">.</span>
              </span>
            </>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.18, ease: [0.32, 0.72, 0, 1] }}
          className="mx-auto mt-8 max-w-[50ch] text-lg leading-relaxed text-muted sm:text-xl"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.26, ease: [0.32, 0.72, 0, 1] }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          <ButtonLink href={primary.href}>{primary.label}</ButtonLink>
          <ButtonLink href={secondary.href} variant="ghost">
            {secondary.label}
          </ButtonLink>
        </motion.div>
      </div>
    </section>
  );
}
