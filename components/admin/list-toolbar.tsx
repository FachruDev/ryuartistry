"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { inputClass } from "./styles";

type Counts = { all: number; published: number; draft: number };

/** Search box + status chips that write `?q=` and `?status=`; the page filters on the server. */
export function ListToolbar({ counts, placeholder = "Cari judul atau slug…" }: { counts: Counts; placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const status = params.get("status") ?? "all";
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [pending, startTransition] = useTransition();

  const update = (next: Record<string, string>) => {
    const search = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value && value !== "all") search.set(key, value);
      else search.delete(key);
    }
    const qs = search.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  useEffect(() => {
    if (query === (params.get("q") ?? "")) return;
    const timer = setTimeout(() => update({ q: query.trim() }), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to typing
  }, [query]);

  const chips = [
    { key: "all", label: "Semua", count: counts.all },
    { key: "published", label: "Terbit", count: counts.published },
    { key: "draft", label: "Draf", count: counts.draft },
  ];

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-72">
        <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Cari"
          className={`${inputClass} pl-9`}
        />
      </div>
      <div className="flex gap-1 rounded-lg border border-line bg-paper-raised p-1" role="group" aria-label="Filter status">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            aria-pressed={status === chip.key}
            onClick={() => update({ status: chip.key })}
            className={`rounded-md px-3 py-1 text-sm font-semibold transition-colors ${
              status === chip.key ? "bg-ink text-paper" : "text-ink/70 hover:text-ink"
            }`}
          >
            {chip.label} <span className={status === chip.key ? "text-paper/70" : "text-muted"}>{chip.count}</span>
          </button>
        ))}
      </div>
      {pending && <span className="size-4 animate-spin rounded-full border-2 border-line border-t-ink" aria-label="Memuat" />}
    </div>
  );
}
