// Plain class helpers, importable from both Server and Client Components.

export const inputClass =
  "w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-[15px] text-text placeholder:text-muted/70 focus:border-glow focus:outline-none focus:ring-2 focus:ring-glow/30";

export function buttonClass(variant: "primary" | "danger" | "ghost" = "primary") {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
  if (variant === "danger") return `${base} bg-danger text-white hover:bg-danger/90`;
  if (variant === "ghost") return `${base} border border-line bg-paper-raised text-text hover:border-ink/40`;
  return `${base} bg-ink text-paper hover:bg-ink-deep`;
}
