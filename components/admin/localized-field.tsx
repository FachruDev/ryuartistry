"use client";

import type { Localized } from "@/lib/db/schema";
import { Input, Textarea } from "./ui";

/** Paired Indonesian / English inputs posted as `<name>.id` and `<name>.en`. */
export function LocalizedField({
  name,
  label,
  defaultValue,
  multiline = false,
  rows = 3,
  error,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: Localized;
  multiline?: boolean;
  rows?: number;
  error?: string;
  hint?: string;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="grid gap-3 md:grid-cols-2">
        {(["id", "en"] as const).map((lang) => {
          const props = {
            name: `${name}.${lang}`,
            defaultValue: defaultValue?.[lang] ?? "",
            "aria-label": `${label} (${lang === "id" ? "Indonesia" : "English"})`,
            placeholder: lang === "id" ? "Bahasa Indonesia" : "English",
          };
          return (
            <div key={lang} className="relative">
              {multiline ? <Textarea rows={rows} {...props} /> : <Input {...props} />}
              <span className="pointer-events-none absolute right-2 top-2 rounded bg-line/70 px-1.5 text-[10px] font-bold text-muted">
                {lang.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </fieldset>
  );
}
