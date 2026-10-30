import type { WorkCard as WorkCardData } from "@/lib/cards";
import type { Locale } from "@/lib/i18n";
import { Reveal } from "./reveal";
import { WorkCard, workSlot } from "./work-card";

/** Featured projects in the alternating narrow/wide grid. */
export function WorkList({ items, lang }: { items: WorkCardData[]; lang: Locale }) {
  return (
    <div className="grid gap-5 md:grid-cols-12 md:gap-6">
      {items.map((p, i) => {
        const slot = workSlot(i, items.length);
        return (
          <Reveal key={p.id} delay={(i % 2) * 0.08} className={slot.className}>
            <WorkCard item={p} lang={lang} layout={slot.layout} sizes={slot.sizes} className="h-[28rem] md:h-[36rem]" />
          </Reveal>
        );
      })}
    </div>
  );
}
