"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

export function Header({ lang, nav }: { lang: Locale; nav: Dictionary["nav"] }) {
  const pathname = usePathname();
  const scrolled = useSyncExternalStore(subscribeScroll, () => window.scrollY > 40, () => false);
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Close the mobile menu after navigating.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const links = [
    { href: `/${lang}/work`, label: nav.work },
    { href: `/${lang}/lab`, label: nav.lab },
    { href: `/${lang}/services`, label: nav.services },
    { href: `/${lang}/about`, label: nav.about },
    { href: `/${lang}/careers`, label: nav.careers },
  ];
  const otherLang: Locale = lang === "id" ? "en" : "id";
  const switchHref = pathname.replace(/^\/(id|en)(?=\/|$)/, `/${otherLang}`);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 text-paper transition-colors duration-300 ${
        scrolled || open ? "bg-ink/90 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-8">
        <Link href={`/${lang}`} className="display text-[1.6rem] tracking-tight" aria-label="Ryuartistry">
          ryuartistry
        </Link>

        <nav aria-label="Utama" className="hidden items-center gap-7 text-[15px] md:flex">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-1 transition-colors hover:text-scale ${active ? "text-scale" : "text-paper/85"}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={switchHref}
            hrefLang={otherLang}
            className="rounded-full border border-paper/30 px-3 py-1 text-sm font-semibold hover:border-scale hover:text-scale"
            aria-label={otherLang === "en" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
          >
            {otherLang.toUpperCase()}
          </Link>
          <Link
            href={`/${lang}/contact`}
            className="hidden rounded-full bg-scale px-4 py-1.5 text-sm font-bold text-ink-deep transition-transform hover:-translate-y-0.5 sm:inline-flex"
          >
            {nav.contact}
          </Link>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full border border-paper/30 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="relative block h-3 w-4">
              <span className={`absolute left-0 h-0.5 w-4 bg-current transition-transform ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 h-0.5 w-4 bg-current transition-transform ${open ? "top-1.5 -rotate-45" : "top-2.5"}`} />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Menu" className="border-t border-paper/10 px-4 pb-6 pt-2 md:hidden">
          <ul className="space-y-1">
            {[...links, { href: `/${lang}/contact`, label: nav.contact }].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="display block py-2 text-4xl text-paper">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
