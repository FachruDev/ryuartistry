import { ViewTransition } from "react";

/** Placeholders shown while a route or section streams in. */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton rounded-[1.5rem] ${className}`} />;
}

export function DetailSkeleton() {
  return (
    <ViewTransition exit="skeleton-out" default="none">
      <div role="status" aria-label="Loading" className="mx-auto flex max-w-[1240px] flex-col items-center px-4 pb-24 pt-32 sm:px-8 md:pt-44">
        <SkeletonBlock className="h-9 w-36 rounded-full" />
        <SkeletonBlock className="mt-8 h-6 w-20 rounded-full" />
        <SkeletonBlock className="mt-6 h-20 w-full max-w-2xl" />
        <SkeletonBlock className="mt-4 h-5 w-full max-w-lg rounded-full" />
        <SkeletonBlock className="mt-14 h-[24rem] w-full rounded-[2.5rem] sm:h-[34rem] md:rounded-[3.5rem]" />
      </div>
    </ViewTransition>
  );
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="mx-auto flex max-w-[1240px] flex-col items-center px-4 pb-24 pt-36 sm:px-8 md:pt-48">
      <SkeletonBlock className="h-8 w-32 rounded-full" />
      <SkeletonBlock className="mt-6 h-24 w-full max-w-3xl" />
      <SkeletonBlock className="mt-6 h-5 w-full max-w-xl rounded-full" />
      <div className="mt-20 grid w-full gap-6 md:grid-cols-12">
        {["md:col-span-5", "md:col-span-7", "md:col-span-7", "md:col-span-5"].map((span, i) => (
          <SkeletonBlock key={i} className={`h-[28rem] rounded-[2.5rem] md:h-[36rem] md:rounded-[3.5rem] ${span}`} />
        ))}
      </div>
    </div>
  );
}
