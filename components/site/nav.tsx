"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { ArrowUpRight, Sparkle, Translate } from "@phosphor-icons/react";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { ThemeToggle } from "./theme-toggle";

const ease = [0.32, 0.72, 0, 1] as const;
const raised = "shadow-[0_20px_40px_-16px_rgb(var(--shade)/0.35)]";
// Round icon buttons beside the brand pill (theme, language). On hover, ink floods out from the centre
// and the icon turns light; the icon itself never moves.
const round = `pointer-events-auto relative isolate grid size-14 place-items-center overflow-hidden rounded-full text-ink transition-colors duration-500 before:absolute before:inset-0 before:-z-10 before:scale-0 before:rounded-full before:bg-ink before:transition-transform before:duration-500 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-paper hover:before:scale-100 focus-visible:text-paper focus-visible:before:scale-100 ${raised}`;

/** The brand's four-point sparkle, which makes a quarter turn on hover. */
function BrandSparkle() {
  return <Sparkle weight="fill" className="size-5 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-90" />;
}

/** Each letter rolls up to a copy of itself on hover (or while the pill is filled), one after another. */
function RollingText({ text }: { text: string }) {
  return (
    <span aria-hidden className="inline-flex overflow-hidden">
      {Array.from(text).map((ch, i) => (
        <span
          key={i}
          className="relative inline-block transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-full group-data-[passed]:-translate-y-full"
          style={{ transitionDelay: `${i * 18}ms` }}
        >
          {ch}
          <span className="absolute left-0 top-full">{ch}</span>
        </span>
      ))}
    </span>
  );
}

function Wordmark() {
  return (
    // Roomier line height than other display type, so the rolling letters' descenders aren't clipped.
    <span className="display flex items-baseline text-[1.5rem] leading-[1.25] tracking-[-0.04em]">
      <RollingText text="ryuartistry" />
      <span className="text-accent">.</span>
    </span>
  );
}

type MenuLink = { href: string; label: string };

// A long, soft ease-out so hover changes glide rather than snap.
const glide = "duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]";
// The arrow reacts once the line's fill has nearly reached it, but resets at once on the way out.
const arrive = "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:delay-300";

/**
 * Menu rows: number, label, and an arrow sitting on the end of a long rule. The rule draws itself in when the
 * menu opens. On hover a light fill sweeps left to right through the label and along the rule, and when it reaches
 * the arrow the arrow's circle fills and a fresh arrow shoots in. The current page is fully lit with an accent rule.
 */
function MenuLinks({ links, isActive }: { links: MenuLink[]; isActive: (href: string) => boolean }) {
  return (
    <ul className="w-full">
      {links.map((l, i) => {
        const active = isActive(l.href);
        return (
          <motion.li key={l.href} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 + i * 0.06, ease }}>
            <Link
              href={l.href}
              aria-current={active ? "page" : undefined}
              className="group relative flex items-end justify-between gap-6 py-3 md:py-4"
            >
              <span className="flex items-baseline gap-4 md:gap-7">
                <span
                  aria-hidden
                  className={`w-6 text-sm font-semibold tabular-nums transition-colors ${glide} ${active ? "text-accent" : "text-paper/35 group-hover:text-accent"}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={`display relative text-[clamp(2rem,5.2vw,3.8rem)] leading-[1.1] transition-transform ${glide} group-hover:translate-x-2`}>
                  <span className={active ? "text-paper" : "text-paper/40"}>{l.label}</span>
                  {active ? (
                    <span className="text-accent">.</span>
                  ) : (
                    // A lit copy revealed from the left; the negative insets keep descenders inside the clip.
                    <span
                      aria-hidden
                      className={`absolute inset-0 text-paper transition-[clip-path] [clip-path:inset(-30%_100%_-30%_0)] group-hover:[clip-path:inset(-30%_0_-30%_0)] ${glide}`}
                    >
                      {l.label}
                    </span>
                  )}
                </span>
              </span>

              <span
                aria-hidden
                className={`relative mb-1 grid size-11 shrink-0 place-items-center overflow-hidden rounded-full ring-1 transition-[color,box-shadow] md:size-14 ${arrive} ${
                  active ? "text-ink ring-paper" : "text-paper ring-paper/25 group-hover:text-ink group-hover:ring-paper"
                }`}
              >
                <span className={`absolute inset-0 rounded-full bg-paper transition-transform ${arrive} ${active ? "scale-100" : "scale-0 group-hover:scale-100"}`} />
                <ArrowUpRight weight="bold" className={`relative size-5 transition-transform ${arrive} group-hover:translate-x-[160%] group-hover:-translate-y-[160%]`} />
                <ArrowUpRight
                  weight="bold"
                  className={`absolute size-5 -translate-x-[160%] translate-y-[160%] transition-transform ${arrive} group-hover:translate-x-0 group-hover:translate-y-0`}
                />
              </span>

              <motion.span
                aria-hidden
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.3 + i * 0.06, ease }}
                className="absolute inset-x-0 bottom-0 h-px origin-left bg-paper/15"
              />
              <span
                aria-hidden
                className={`absolute inset-x-0 -bottom-px h-0.5 origin-left transition-transform ${glide} ${
                  active ? "scale-x-100 bg-accent" : "scale-x-0 bg-paper group-hover:scale-x-100"
                }`}
              />
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}

export function Nav({ lang, nav, theme }: { lang: Locale; nav: Dictionary["nav"]; theme: Dictionary["theme"] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Where the menu circle grows from (the menu button's centre) and how far it must reach.
  const [origin, setOrigin] = useState({ x: 0, y: 0, r: 0 });
  const reduced = useReducedMotion();
  const [lastPath, setLastPath] = useState(pathname);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const toggleMenu = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    setOrigin({ x, y, r: Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) });
    setOpen((o) => !o);
  };

  // Once the page's opening section (hero, intro, or article header) has scrolled away, the brand pill stays filled.
  const [passed, setPassed] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", () => {
    const hero = document.querySelector("main :is(section, header)");
    setPassed(hero ? hero.getBoundingClientRect().bottom < 0 : false);
  });

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const home = `/${lang}`;
  const links = [
    { href: home, label: nav.home },
    { href: `/${lang}/work`, label: nav.work },
    { href: `/${lang}/lab`, label: nav.lab },
    { href: `/${lang}/services`, label: nav.services },
    { href: `/${lang}/about`, label: nav.about },
    { href: `/${lang}/contact`, label: nav.contact },
  ];
  // Home only matches itself; every other link also covers its detail pages.
  const isActive = (href: string) => pathname === href || (href !== home && pathname.startsWith(`${href}/`));

  // Like the theme switch: the menu grows as a circle out of its button and shrinks back into it.
  const closed = `circle(0px at ${origin.x}px ${origin.y}px)`;
  const reveal = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { clipPath: closed }, animate: { clipPath: `circle(${origin.r}px at ${origin.x}px ${origin.y}px)` }, exit: { clipPath: closed } };

  const otherLang: Locale = lang === "id" ? "en" : "id";
  const switchHref = pathname.replace(/^\/(id|en)(?=\/|$)/, `/${otherLang}`);

  return (
    <>
      {/* Fixed in the top-right corner: brand pill, theme and language buttons, menu button. */}
      <header className="pointer-events-none fixed inset-x-4 top-4 z-40 py-2 sm:px-4 md:py-4">
        <div className="flex items-center justify-end gap-3">
          <motion.div className="pointer-events-auto hidden md:block" animate={{ opacity: open ? 0 : 1 }} transition={{ duration: 0.3 }}>
            <Link
              href={home}
              aria-label="Ryuartistry"
              data-passed={passed ? "" : undefined}
              className={`group relative flex h-14 items-center overflow-hidden whitespace-nowrap rounded-full border pl-5 pr-7 text-ink transition-[transform,background-color,border-color] duration-300 hover:border-ink/30 hover:bg-paper active:scale-95 ${raised} ${
                passed ? "border-ink/30 bg-paper" : "border-line bg-paper-raised"
              }`}
            >
              <span className="relative z-20 flex items-center gap-2">
                <BrandSparkle />
                <Wordmark />
              </span>
              {/* Ink sweeps in from the left on hover, and stays once the hero is behind you. */}
              <span
                aria-hidden
                className={`absolute inset-0 z-10 rounded-full bg-ink transition-transform duration-500 ease-out ${
                  passed ? "translate-x-0" : "-translate-x-full group-hover:translate-x-0"
                }`}
              />
              <span
                aria-hidden
                className={`absolute inset-0 z-20 flex items-center gap-2 pl-5 pr-7 text-paper transition-opacity delay-200 duration-500 ${
                  passed ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <BrandSparkle />
                <Wordmark />
              </span>
            </Link>
          </motion.div>

          <ThemeToggle label={theme.toggle} className={`${round} ${passed ? "bg-paper" : "bg-paper-raised"}`} />
          <Link
            href={switchHref}
            hrefLang={otherLang}
            aria-label={otherLang === "en" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
            title={otherLang === "en" ? "English" : "Bahasa Indonesia"}
            className={`${round} ${passed ? "bg-paper" : "bg-paper-raised"}`}
          >
            <Translate weight="bold" className="size-5" />
          </Link>

          <motion.button
            type="button"
            onClick={toggleMenu}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? nav.close : nav.menu}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ scale: passed ? 1.05 : 1 }}
            className={`pointer-events-auto relative grid size-14 place-items-center rounded-full text-ink transition-colors hover:bg-paper ${raised} ${
              passed ? "bg-paper" : "bg-paper-raised"
            }`}
          >
            <span className={`absolute h-[2px] w-5 rounded bg-current transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "rotate-45" : "-translate-y-[5px]"}`} />
            <span className={`absolute h-[2px] w-5 rounded bg-current transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "-rotate-45" : "translate-y-[5px]"}`} />
          </motion.button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label={nav.menu}
            {...reveal}
            transition={{ duration: 0.65, ease }}
            className="fixed inset-0 z-30 flex flex-col overflow-y-auto bg-ink px-4 pb-8 pt-28 sm:px-8"
          >
            <nav aria-label={nav.main} className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col justify-center">
              <MenuLinks links={links} isActive={isActive} />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
