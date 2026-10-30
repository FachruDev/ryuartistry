"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, List, MagnifyingGlass, SignOut, X } from "@phosphor-icons/react";
import { isActive, navGroups } from "./nav-items";
import { CommandPalette, openPalette } from "./command-palette";

type User = { name: string; email: string; role: string };

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function Sidebar({ user, unread, signOut }: { user: User; unread: number; signOut: () => Promise<void> }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-baseline gap-0.5 px-5 pb-1 pt-6">
        <span className="display text-[1.6rem] text-ink">ryuartistry</span>
        <span className="size-1.5 rounded-full bg-accent" aria-hidden />
      </Link>
      <p className="px-5 text-xs font-medium text-muted">Content studio</p>

      <nav aria-label="Menu CMS" className="mt-6 flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {navGroups.map((group, i) => (
          <div key={group.label ?? i}>
            {group.label && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted/80">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href, pathname);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors ${
                        active ? "bg-ink text-paper shadow-[0_6px_16px_-8px_rgb(var(--shade)/0.6)]" : "text-ink/75 hover:bg-ink/[0.05] hover:text-ink"
                      }`}
                    >
                      <Icon size={18} weight={active ? "fill" : "regular"} className="shrink-0" />
                      <span className="flex-1">{label}</span>
                      {href === "/admin/inbox" && unread > 0 && (
                        <span className="rounded-full bg-accent px-1.5 text-[11px] font-bold leading-5 text-white">{unread}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="m-3 flex items-center gap-3 rounded-xl border border-line bg-paper p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-wisteria text-sm font-bold text-on-pastel">
          {initials(user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.role === "admin" ? "Admin" : "Editor"}</p>
        </div>
        <form action={signOut}>
          <button
            title="Keluar"
            aria-label="Keluar"
            className="grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <SignOut size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

/** CMS chrome: sidebar (drawer on small screens), top bar with search, and the command palette. */
export function AdminShell({
  user,
  unread,
  signOut,
  children,
}: {
  user: User;
  unread: number;
  signOut: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);

  // Close the drawer after navigating.
  if (drawer && openedAt !== pathname) {
    setDrawer(false);
  }

  // Ctrl/⌘ + S saves the editor form on the page instead of saving the HTML file.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "s") return;
      const form = document.querySelector<HTMLFormElement>("form[data-save-form]");
      if (!form) return;
      e.preventDefault();
      form.requestSubmit();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="hidden border-r border-line bg-paper-raised lg:sticky lg:top-0 lg:block lg:h-screen">
        <Sidebar user={user} unread={unread} signOut={signOut} />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button aria-label="Tutup menu" className="absolute inset-0 bg-ink-deep/40 backdrop-blur-[2px]" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-paper-raised shadow-2xl">
            <button
              aria-label="Tutup menu"
              onClick={() => setDrawer(false)}
              className="absolute right-3 top-5 grid size-9 place-items-center rounded-md text-muted hover:bg-ink/5"
            >
              <X size={18} />
            </button>
            <Sidebar user={user} unread={unread} signOut={signOut} />
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur-md sm:px-8 lg:px-10">
          <button
            aria-label="Buka menu"
            onClick={() => {
              setOpenedAt(pathname);
              setDrawer(true);
            }}
            className="grid size-9 place-items-center rounded-md border border-line bg-paper-raised lg:hidden"
          >
            <List size={18} />
          </button>
          <button
            onClick={openPalette}
            className="flex h-10 w-full max-w-md items-center gap-2.5 rounded-lg border border-line bg-paper-raised px-3 text-left text-sm text-muted transition-colors hover:border-ink/25"
          >
            <MagnifyingGlass size={16} />
            <span className="flex-1 truncate">Cari konten atau lompat ke…</span>
            <kbd className="hidden rounded border border-line bg-paper px-1.5 py-0.5 font-sans text-[11px] font-semibold sm:inline">Ctrl K</kbd>
          </button>
          <a
            href="/"
            target="_blank"
            className="ml-auto hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-ink/5 sm:inline-flex"
          >
            Lihat situs <ArrowUpRight size={14} weight="bold" />
          </a>
        </header>
        <main className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>

      <CommandPalette />
    </div>
  );
}
