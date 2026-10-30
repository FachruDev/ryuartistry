/** Pastel tone assigned to each discipline (category slug or service icon). */
export const disciplineTone: Record<string, string> = {
  ai: "var(--wisteria)",
  game: "var(--jade)",
  software: "var(--mizu)",
  creative: "var(--sakura)",
  "lab-ai": "var(--wisteria)",
  "lab-game": "var(--jade)",
  "lab-software": "var(--mizu)",
  "lab-creative": "var(--sakura)",
};

export const toneCycle = ["var(--wisteria)", "var(--jade)", "var(--mizu)", "var(--sakura)", "var(--yuzu)"];

export function toneFor(slug: string | null | undefined, fallback = "var(--yuzu)") {
  return disciplineTone[slug ?? ""] ?? fallback;
}
