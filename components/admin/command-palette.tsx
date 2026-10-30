"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowRight, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { searchCms, type SearchHit } from "@/lib/actions/search";
import { createItems, navGroups } from "./nav-items";

const OPEN_EVENT = "cms:palette";

export function openPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

type Entry = { href: string; title: string; group: string; hint?: string; icon: "nav" | "new" | "hit" };

const navEntries: (Entry & { keywords: string })[] = navGroups.flatMap((g) =>
  g.items.map((item) => ({
    href: item.href,
    title: item.label,
    group: "Navigasi",
    icon: "nav" as const,
    keywords: `${item.label} ${item.keywords ?? ""}`.toLowerCase(),
  })),
);
const createEntries: (Entry & { keywords: string })[] = createItems.map((item) => ({
  ...item,
  title: item.label,
  group: "Buat baru",
  icon: "new" as const,
  keywords: `${item.label} tambah buat new`.toLowerCase(),
}));

/** Ctrl/⌘ + K: jump to a page, start new content, or search everything in the CMS. */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const [searching, startSearch] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const timer = setTimeout(() => {
      startSearch(async () => setHits(await searchCms(query)));
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  const entries = useMemo<Entry[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (e: { keywords: string }) => !q || q.split(/\s+/).every((word) => e.keywords.includes(word));
    const found = q.length >= 2 ? hits : [];
    return [
      ...found.map((h) => ({
        href: h.href,
        title: h.title,
        group: "Konten",
        hint: h.status ? `${h.kind} · ${h.status === "published" ? "Terbit" : "Draf"}` : h.kind,
        icon: "hit" as const,
      })),
      ...navEntries.filter(match),
      ...createEntries.filter(match),
    ];
  }, [query, hits]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setHits([]);
    setActive(0);
  };

  const go = (entry: Entry | undefined) => {
    if (!entry) return;
    close();
    router.push(entry.href);
  };

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Cari di CMS">
      <button aria-label="Tutup" className="absolute inset-0 bg-ink-deep/35 backdrop-blur-[2px]" onClick={close} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-paper-raised shadow-[0_40px_100px_-30px_rgb(var(--shade)/0.6)]">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <MagnifyingGlass size={18} className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, entries.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(entries[active]);
              } else if (e.key === "Escape") {
                close();
              }
            }}
            placeholder="Cari karya, catatan, pesan, atau ketik nama halaman…"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted/70 focus-visible:outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={`palette-${active}`}
          />
          {searching && <span className="size-4 animate-spin rounded-full border-2 border-line border-t-ink" aria-label="Mencari" />}
        </div>
        <ul id="palette-list" ref={listRef} role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
          {entries.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">Tidak ada hasil untuk “{query}”.</li>}
          {entries.map((entry, i) => {
            const heading = entry.group !== lastGroup ? entry.group : null;
            lastGroup = entry.group;
            return (
              <li key={`${entry.group}-${entry.href}-${entry.title}`} role="presentation">
                {heading && <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted/80">{heading}</p>}
                <button
                  id={`palette-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(entry)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${i === active ? "bg-ink text-paper" : "text-ink"}`}
                >
                  {entry.icon === "new" ? <Plus size={16} weight="bold" /> : <ArrowRight size={16} />}
                  <span className="flex-1 truncate font-medium">{entry.title}</span>
                  {entry.hint && <span className={`shrink-0 text-xs ${i === active ? "text-paper/70" : "text-muted"}`}>{entry.hint}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex gap-4 border-t border-line px-4 py-2.5 text-[11px] text-muted">
          <span>↑↓ pilih</span>
          <span>Enter buka</span>
          <span>Esc tutup</span>
        </div>
      </div>
    </div>
  );
}
