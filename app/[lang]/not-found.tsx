import { ButtonLink, Sparkle } from "@/components/site/ui";

// Rendered inside the [lang] layout, which has already validated the locale.
export default function NotFound() {
  return (
    <section className="relative flex min-h-[86dvh] items-center px-4 pb-16 pt-36 text-center sm:px-8">
      <Sparkle className="absolute left-[12%] top-[30%] size-12 md:size-16" color="var(--sparkle)" />
      <Sparkle className="absolute bottom-[22%] right-[14%] size-10 md:size-14" color="var(--wisteria)" delay={-2} />
      <div className="mx-auto w-full max-w-3xl">
        <p className="display text-[clamp(7rem,28vw,18rem)] leading-none text-ink">
          404<span className="text-accent">.</span>
        </p>
        <h1 className="display mt-4 text-[clamp(1.8rem,4vw,2.8rem)] text-ink">Halaman ini tidak ditemukan.</h1>
        <p lang="en" className="mt-2 text-lg text-muted">
          This page couldn&apos;t be found.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <ButtonLink href="/id">Beranda</ButtonLink>
          <ButtonLink href="/en" variant="ghost">
            Home
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
