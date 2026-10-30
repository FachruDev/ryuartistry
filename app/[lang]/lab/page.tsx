import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toPostRow } from "@/lib/cards";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { getPosts } from "@/lib/queries";
import { alternates } from "@/lib/site";
import { PageIntro } from "@/components/site/page-intro";
import { PageTransition } from "@/components/site/page-transition";
import { PostList } from "@/components/site/post-list";
import { Reveal } from "@/components/site/reveal";

export async function generateMetadata({ params }: PageProps<"/[lang]/lab">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.lab.eyebrow, description: dict.lab.intro, alternates: alternates(lang, "/lab") };
}

export default async function LabPage({ params }: PageProps<"/[lang]/lab">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const posts = await getPosts();

  return (
    <PageTransition>
      <PageIntro eyebrow={dict.lab.eyebrow} title={dict.lab.title} intro={dict.lab.intro} clay="var(--sky)" accent="var(--mint)" />
      <section className="mx-auto max-w-[1400px] px-4 pb-28 sm:px-8 md:pb-40">
        {posts.length === 0 ? (
          <p className="text-lg text-plum-soft">{dict.lab.empty}</p>
        ) : (
          <Reveal>
            <PostList items={posts.map(toPostRow)} lang={lang} minRead={dict.lab.minRead} cursorLabel={dict.cursor.read} />
          </Reveal>
        )}
      </section>
    </PageTransition>
  );
}
