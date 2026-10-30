/** Pastel tone assigned to each discipline (category slug or service icon). */
export const disciplineTone: Record<string, string> = {
  ai: "var(--lilac)",
  game: "var(--mint)",
  software: "var(--sky)",
  creative: "var(--peach)",
  "lab-ai": "var(--lilac)",
  "lab-game": "var(--mint)",
  "lab-software": "var(--sky)",
  "lab-creative": "var(--peach)",
};

export const toneCycle = ["var(--lilac)", "var(--mint)", "var(--sky)", "var(--peach)", "var(--butter)"];

export function toneFor(slug: string | null | undefined, fallback = "var(--butter)") {
  return disciplineTone[slug ?? ""] ?? fallback;
}
