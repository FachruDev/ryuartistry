import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { clayCycle } from "@/lib/clay";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getTeam } from "@/lib/queries";
import { alternates } from "@/lib/site";
import { PageIntro } from "@/components/site/page-intro";
import { PageTransition } from "@/components/site/page-transition";
import { Eyebrow } from "@/components/site/pill";
import { Reveal } from "@/components/site/reveal";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.about.eyebrow, description: dict.about.intro, alternates: alternates(lang, "/about") };
}

// Asymmetric bento for the values: a wide card, a tall one, then two compact ones.
const valueCells = ["md:col-span-7", "md:col-span-5 md:row-span-2", "md:col-span-3", "md:col-span-4"];
const valueShapes = ["rounded-full", "rounded-[35%]", "rounded-[50%_50%_50%_10%]", "rounded-[30%_70%_60%_40%]"];

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const team = await getTeam();

  return (
    <PageTransition>
      <PageIntro eyebrow={dict.about.eyebrow} title={dict.about.title} intro={dict.about.intro} clay="var(--butter)" accent="var(--lilac)" />

      <section className="mx-auto max-w-[1400px] px-4 pb-28 sm:px-8 md:pb-40">
        <Reveal>
          <Eyebrow clay="var(--peach)">{dict.about.valuesTitle}</Eyebrow>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-12">
          {dict.about.values.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.08} className={valueCells[i % valueCells.length]}>
              <div
                className={`clay flex h-full flex-col justify-between gap-10 p-8 sm:p-10 ${i === 1 ? "md:min-h-[28rem]" : "min-h-[14rem]"}`}
                style={{ ["--clay" as string]: clayCycle[i % clayCycle.length] }}
              >
                <span aria-hidden className={`clay block size-10 ${valueShapes[i % valueShapes.length]}`} style={{ ["--clay" as string]: "var(--cloud)" }} />
                <div>
                  <h2 className="display text-[clamp(2rem,3.4vw,3.2rem)] text-plum">{v.title}</h2>
                  <p className="mt-3 max-w-[36ch] text-lg leading-relaxed text-plum/75">{v.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {team.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 pb-28 sm:px-8 md:pb-40">
          <Reveal>
            <h2 className="display text-[clamp(2.4rem,5vw,4.4rem)] text-plum">{dict.about.teamTitle}</h2>
          </Reveal>
          <ul className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m, i) => (
              <li key={m.id} className={i % 2 ? "lg:mt-16" : ""}>
                <Reveal delay={(i % 4) * 0.08}>
                  <div className="bezel">
                    <div className="bezel-core relative aspect-[4/5]" style={{ background: clayCycle[i % clayCycle.length] }}>
                      {m.photo && <Image src={m.photo.url} alt={m.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />}
                    </div>
                  </div>
                  <h3 className="display mt-5 text-2xl text-plum">{m.name}</h3>
                  <p className="font-semibold text-plum-soft">{pick(m.role, lang)}</p>
                  {pick(m.bio, lang) && <p className="mt-3 text-plum/75">{pick(m.bio, lang)}</p>}
                  {m.socials.length > 0 && (
                    <p className="mt-3 flex flex-wrap gap-2">
                      {m.socials.map((s) => (
                        <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-plum/[0.05] px-3 py-1 text-sm font-semibold text-plum hover:bg-plum/10">
                          {s.label}
                        </a>
                      ))}
                    </p>
                  )}
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageTransition>
  );
}
