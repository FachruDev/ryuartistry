"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

const ease = [0.32, 0.72, 0, 1] as const;
const clays = ["var(--lilac)", "var(--mint)", "var(--sky)", "var(--peach)", "var(--butter)", "var(--lilac)"];

export function Nav({ lang, nav, email }: { lang: Locale; nav: Dictionary["nav"]; email?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const { scrollY } = useScroll();

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Sticky but polite: tucks away while reading down, returns on the way up.
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > 240 && y > prev + 4);
    if (y < prev - 4) setHidden(false);
  });

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    { href: `/${lang}/work`, label: nav.work },
    { href: `/${lang}/lab`, label: nav.lab },
    { href: `/${lang}/services`, label: nav.services },
    { href: `/${lang}/about`, label: nav.about },
    { href: `/${lang}/careers`, label: nav.careers },
    { href: `/${lang}/contact`, label: nav.contact },
  ];
  const otherLang: Locale = lang === "id" ? "en" : "id";
  const switchHref = pathname.replace(/^\/(id|en)(?=\/|$)/, `/${otherLang}`);

  return (
    <>
      <motion.header
        style={{ viewTransitionName: "site-nav" }}
        animate={{ y: hidden && !open ? -110 : 0 }}
        transition={{ duration: 0.6, ease }}
        className="fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-4"
      >
        <div className="flex w-full max-w-[880px] items-center justify-between gap-2 rounded-full bg-cloud/70 py-2 pl-5 pr-2 shadow-[0_20px_50px_-24px_rgba(42,30,63,0.35)] ring-1 ring-plum/[0.07] backdrop-blur-xl">
          <Link href={`/${lang}`} className="display flex items-baseline text-[1.45rem] text-plum" aria-label="Ryuartistry">
            ryu
            <span aria-hidden className="mx-[1px] inline-block size-2.5 translate-y-[-2px] rounded-full bg-[var(--berry)]" />
            artistry
          </Link>

          <nav aria-label="Utama" className="hidden items-center gap-1 lg:flex">
            {links.slice(0, 5).map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3.5 py-2 text-[14px] font-semibold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    active ? "bg-plum text-milk" : "text-plum-soft hover:bg-plum/[0.06] hover:text-plum"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <Link
              href={switchHref}
              hrefLang={otherLang}
              aria-label={otherLang === "en" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
              className="grid size-10 place-items-center rounded-full text-[13px] font-bold text-plum-soft ring-1 ring-plum/10 transition-colors hover:bg-plum/[0.06] hover:text-plum"
            >
              {otherLang.toUpperCase()}
            </Link>
            <Link
              href={`/${lang}/contact`}
              className="hidden rounded-full bg-plum px-4 py-2.5 text-[14px] font-semibold text-milk transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98] sm:inline-flex"
            >
              {nav.letsTalk}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? nav.close : nav.menu}
              className="relative grid size-10 place-items-center rounded-full bg-[var(--butter)] text-plum transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 lg:hidden"
            >
              <span className={`absolute h-[1.5px] w-4 rounded bg-current transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "rotate-45" : "-translate-y-[3.5px]"}`} />
              <span className={`absolute h-[1.5px] w-4 rounded bg-current transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "-rotate-45" : "translate-y-[3.5px]"}`} />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label={nav.menu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35, ease } }}
            transition={{ duration: 0.5, ease }}
            className="fixed inset-0 z-30 flex flex-col justify-between overflow-y-auto bg-milk/85 px-6 pb-10 pt-28 backdrop-blur-3xl"
          >
            <div aria-hidden className="morph-blob pointer-events-none absolute -right-24 top-24 size-72 bg-[var(--peach)] opacity-60 blur-2xl" />
            <div aria-hidden className="morph-blob pointer-events-none absolute -left-20 bottom-20 size-64 bg-[var(--lilac)] opacity-60 blur-2xl" />
            <nav aria-label={nav.menu} className="relative">
              <ul className="space-y-1">
                {links.map((l, i) => (
                  <li key={l.href} className="overflow-hidden">
                    <motion.div
                      initial={{ y: 56, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.08 + i * 0.05, ease }}
                    >
                      <Link href={l.href} className="group flex items-center gap-4 py-1">
                        <span aria-hidden className="clay size-5 rounded-full transition-transform duration-500 group-hover:scale-125" style={{ ["--clay" as string]: clays[i] }} />
                        <span className="display text-[clamp(2.75rem,12vw,5rem)] text-plum transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-2">
                          {l.label}
                        </span>
                      </Link>
                    </motion.div>
                  </li>
                ))}
              </ul>
            </nav>
            {email && (
              <motion.a
                href={`mailto:${email}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.45, ease }}
                className="relative mt-10 text-lg font-semibold text-plum-soft underline decoration-[var(--berry)] decoration-2 underline-offset-4"
              >
                {email}
              </motion.a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
