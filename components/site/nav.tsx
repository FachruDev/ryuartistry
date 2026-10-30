"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { ThemeToggle } from "./theme-toggle";

const ease = [0.32, 0.72, 0, 1] as const;
const glass =
  "bg-[var(--nav)] ring-1 ring-line/70 backdrop-blur-xl backdrop-saturate-150 shadow-[0_12px_32px_-20px_rgb(var(--shade)/0.4)]";
const roundButton = `size-11 rounded-full text-ink transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 active:scale-95 ${glass}`;

export function Nav({ lang, nav, themeLabel }: { lang: Locale; nav: Dictionary["nav"]; themeLabel: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [lastPath, setLastPath] = useState(pathname);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
  const menuLinks = [...links.slice(0, 5), { href: `/${lang}/careers`, label: nav.careers }, links[5]];
  // Home only matches itself; every other link also covers its detail pages.
  const isActive = (href: string) => pathname === href || (href !== home && pathname.startsWith(`${href}/`));
  const current = links.find((l) => isActive(l.href))?.href ?? null;
  const lit = hovered ?? current;

  const otherLang: Locale = lang === "id" ? "en" : "id";
  const switchHref = pathname.replace(/^\/(id|en)(?=\/|$)/, `/${otherLang}`);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3">
          <Link href={`/${lang}`} aria-label="Ryuartistry" className={`group display flex h-11 items-center rounded-full px-4 text-[1.3rem] tracking-[-0.04em] text-ink ${glass}`}>
            ryuartistry
            <span className="inline-block text-accent transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1.5">.</span>
          </Link>

          <nav aria-label={nav.main} onMouseLeave={() => setHovered(null)} className={`hidden rounded-full p-1 md:flex ${glass}`}>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                onMouseEnter={() => setHovered(l.href)}
                onFocus={() => setHovered(l.href)}
                onBlur={() => setHovered(null)}
                className="relative rounded-full px-3 py-2 text-[14px] font-medium text-muted transition-colors duration-300 hover:text-ink aria-[current=page]:text-ink lg:px-4 lg:text-[15px]"
              >
                {lit === l.href && (
                  <motion.span
                    layoutId="nav-highlight"
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-paper-raised shadow-[0_2px_10px_-4px_rgb(var(--shade)/0.25)] ring-1 ring-line"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{l.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={switchHref}
              hrefLang={otherLang}
              aria-label={otherLang === "en" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
              className={`grid place-items-center text-[13px] font-bold ${roundButton}`}
            >
              {otherLang.toUpperCase()}
            </Link>
            <ThemeToggle label={themeLabel} className={roundButton} />
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? nav.close : nav.menu}
              className={`relative grid place-items-center md:hidden ${roundButton}`}
            >
              <span className={`absolute h-[2px] w-4 rounded bg-current transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "rotate-45" : "-translate-y-[3.5px]"}`} />
              <span className={`absolute h-[2px] w-4 rounded bg-current transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "-rotate-45" : "translate-y-[3.5px]"}`} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 bg-paper/40 backdrop-blur-sm md:hidden"
            />
            <motion.nav
              key="panel"
              id="site-menu"
              aria-label={nav.menu}
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.4, ease }}
              className="fixed inset-x-3 top-[4.5rem] z-40 origin-top rounded-[2rem] bg-paper-raised/95 p-2 shadow-[0_30px_60px_-30px_rgb(var(--shade)/0.5)] ring-1 ring-line backdrop-blur-xl md:hidden"
            >
              <ul>
                {menuLinks.map((l, i) => (
                  <motion.li key={l.href} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.04 + i * 0.04, ease }}>
                    <Link
                      href={l.href}
                      aria-current={isActive(l.href) ? "page" : undefined}
                      className="group display flex items-center justify-between rounded-[1.4rem] px-4 py-3 text-[2rem] text-ink transition-colors aria-[current=page]:bg-paper"
                    >
                      {l.label}
                      <ArrowRight weight="bold" className="size-5 text-muted transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-1" />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
