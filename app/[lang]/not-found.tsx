import Link from "next/link";

// Rendered inside the [lang] layout, which has already validated the locale.
export default function NotFound() {
  return (
    <section className="relative isolate flex min-h-[90dvh] items-center overflow-hidden px-4 pb-20 pt-36 sm:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 grid place-items-center">
        <div className="clay morph-blob size-[min(70vw,520px)] opacity-90" style={{ ["--clay" as string]: "var(--lilac)" }} />
      </div>
      <div className="mx-auto w-full max-w-[1400px] text-center">
        <p className="display text-[clamp(7rem,26vw,22rem)] leading-none text-plum">404</p>
        <h1 className="display-italic mt-2 text-3xl text-plum">Halaman ini belum dibentuk.</h1>
        <p lang="en" className="mt-1 text-lg text-plum-soft">This page hasn&apos;t been shaped yet.</p>
        <div className="mt-10 flex justify-center gap-3">
          <Link href="/id" className="rounded-full bg-plum px-6 py-3 font-semibold text-milk transition-transform duration-500 hover:-translate-y-0.5">
            Beranda
          </Link>
          <Link href="/en" className="rounded-full px-6 py-3 font-semibold text-plum ring-1 ring-plum/15 hover:bg-plum/[0.05]">
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}
