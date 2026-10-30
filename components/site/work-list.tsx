import type { WorkCard as WorkCardData } from "@/lib/cards";
import type { Locale } from "@/lib/i18n";
import { Reveal } from "./reveal";
import { WorkCard } from "./work-card";

// Asymmetric bento: one tall feature, two companions, then a wide closer; the pattern repeats.
const slots = [
  { cell: "lg:col-span-7 lg:row-span-2", aspect: "aspect-[4/5]" },
  { cell: "lg:col-span-5", aspect: "aspect-[4/3]" },
  { cell: "lg:col-span-5", aspect: "aspect-[4/3]" },
  { cell: "lg:col-span-10 lg:col-start-2", aspect: "aspect-[16/8]" },
];

export function WorkList({ items, lang, cursorLabel }: { items: WorkCardData[]; lang: Locale; cursorLabel: string }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-12 lg:gap-y-20">
      {items.map((item, i) => {
        const slot = slots[i % slots.length];
        return (
          <Reveal key={item.id} delay={(i % 3) * 0.08} className={slot.cell}>
            <WorkCard item={item} lang={lang} aspect={slot.aspect} cursorLabel={cursorLabel} />
          </Reveal>
        );
      })}
    </div>
  );
}
