import { ViewTransition } from "react";

/** Clay-toned placeholders shown while a route or section streams in. */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton rounded-[1.5rem] ${className}`} />;
}

export function DetailSkeleton() {
  return (
    <ViewTransition exit="skeleton-out" default="none">
      <div role="status" aria-label="Memuat" className="mx-auto grid max-w-[1400px] gap-12 px-4 pb-24 pt-36 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:pt-44">
        <div className="space-y-5">
          <SkeletonBlock className="h-7 w-32 rounded-full" />
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-24 w-4/5" />
          <SkeletonBlock className="h-5 w-3/5 rounded-full" />
          <SkeletonBlock className="h-5 w-2/5 rounded-full" />
        </div>
        <SkeletonBlock className="aspect-[4/5] w-full rounded-[2rem]" />
      </div>
    </ViewTransition>
  );
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Memuat" className="mx-auto max-w-[1400px] px-4 pb-24 pt-36 sm:px-8 md:pt-44">
      <SkeletonBlock className="h-7 w-36 rounded-full" />
      <SkeletonBlock className="mt-6 h-28 w-full max-w-3xl" />
      <SkeletonBlock className="mt-4 h-6 w-full max-w-xl rounded-full" />
      <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="space-y-4">
            <SkeletonBlock className={`w-full rounded-[2rem] ${i % 2 ? "aspect-[4/3]" : "aspect-[4/5]"}`} />
            <SkeletonBlock className="h-8 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
