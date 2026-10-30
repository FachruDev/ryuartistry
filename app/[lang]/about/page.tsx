import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getTeam } from "@/lib/queries";
import { alternates } from "@/lib/site";
import { PageIntro } from "@/components/site/page-intro";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.about.title, description: dict.about.intro, alternates: alternates(lang, "/about") };
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const team = await getTeam();

  return (
    <>
      <PageIntro title={dict.about.title} intro={dict.about.intro} />

      <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 md:py-28">
        <h2 className="text-3xl font-semibold text-ink sm:text-4xl">{dict.about.valuesTitle}</h2>
        <ul className="mt-12 grid gap-12 md:grid-cols-3">
          {dict.about.values.map((v) => (
            <li key={v.title} className="border-t-2 border-scale pt-6">
              <h3 className="font-serif text-4xl text-ink">{v.title}</h3>
              <p className="mt-3 max-w-[36ch] text-lg leading-relaxed text-text/80">{v.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {team.length > 0 && (
        <section className="bg-paper-raised px-4 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-[1440px]">
            <h2 className="text-3xl font-semibold text-ink sm:text-4xl">{dict.about.teamTitle}</h2>
            <ul className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((m) => (
                <li key={m.id}>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-ink/10">
                    {m.photo ? (
                      <Image src={m.photo.url} alt={m.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                    ) : (
                      <div className="scale-pattern size-full" aria-hidden />
                    )}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-ink">{m.name}</h3>
                  <p className="text-muted">{pick(m.role, lang)}</p>
                  {pick(m.bio, lang) && <p className="mt-3 text-text/80">{pick(m.bio, lang)}</p>}
                  {m.socials.length > 0 && (
                    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {m.socials.map((s) => (
                        <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline decoration-scale underline-offset-4">
                          {s.label}
                        </a>
                      ))}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
