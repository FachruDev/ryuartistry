import { ViewTransition, type ReactNode } from "react";

/** Every route's content leaves softly and arrives with a blur-rise on navigation. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
