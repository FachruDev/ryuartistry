import { Reveal } from "./reveal";
import { ButtonLink, Dotted, Sparkle } from "./ui";

/** Yuzu-yellow closing card that invites a conversation. */
export function CtaCard({
  title,
  body,
  primary,
  secondary,
}: {
  title: string;
  body: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="px-4 pt-12 sm:px-8">
      <Reveal className="mx-auto max-w-[1240px]">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-yuzu px-6 py-20 text-center text-on-pastel md:rounded-[3.5rem] md:py-28">
          <Sparkle className="absolute left-[9%] top-12 size-10 md:size-14" color="#ffffff" />
          <Sparkle className="absolute bottom-14 right-[10%] size-12 md:size-16" color="#ffffff" delay={-2} />
          <Sparkle className="absolute right-[24%] top-16 hidden size-6 md:block" color="var(--sakura)" delay={-3.5} />
          <h2 className="display relative mx-auto max-w-[14ch] text-[clamp(2.6rem,7vw,5.6rem)]">
            <Dotted text={title} />
          </h2>
          <p className="relative mx-auto mt-6 max-w-[46ch] text-lg leading-relaxed opacity-75">{body}</p>
          <div className="relative mt-10 flex flex-wrap justify-center gap-3">
            <ButtonLink href={primary.href} variant="pastel">
              {primary.label}
            </ButtonLink>
            {secondary && (
              <ButtonLink href={secondary.href} variant="soft">
                {secondary.label}
              </ButtonLink>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
