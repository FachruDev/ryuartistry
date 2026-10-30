import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toWorkCard } from "@/lib/cards";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { getCategories, getProjects } from "@/lib/queries";
import { alternates } from "@/lib/site";
import { PageIntro } from "@/components/site/page-intro";
import { PageTransition } from "@/components/site/page-transition";
import { WorkGrid } from "@/components/site/work-grid";

export async function generateMetadata({ params }: PageProps<"/[lang]/work">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.work.title, description: dict.work.intro, alternates: alternates(lang, "/work") };
}

export default async function WorkPage({ params }: PageProps<"/[lang]/work">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const [projects, categories] = await Promise.all([getProjects(), getCategories("project")]);

  return (
    <PageTransition>
      <PageIntro eyebrow={dict.work.eyebrow} title={dict.work.title} intro={dict.work.intro} clay="var(--peach)" accent="var(--lilac)" />
      <section className="mx-auto max-w-[1400px] px-4 pb-28 sm:px-8 md:pb-40">
        <WorkGrid
          items={projects.map(toWorkCard)}
          categories={categories}
          lang={lang}
          allLabel={dict.work.all}
          emptyLabel={dict.work.empty}
          cursorLabel={dict.cursor.view}
        />
      </section>
    </PageTransition>
  );
}
