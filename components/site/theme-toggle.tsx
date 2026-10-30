"use client";

import { useLayoutEffect, useSyncExternalStore, type MouseEvent } from "react";
import { Moon, Sun } from "@phosphor-icons/react";
import { THEME_KEY, type Theme } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const readTheme = (): Theme => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

function savedTheme(): Theme | null {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

const systemTheme = (): Theme => (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function useTheme() {
  return useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);
}

/** Switches theme; where View Transitions exist, the new theme grows as a circle out of the control. */
function switchTheme(next: Theme, e: MouseEvent<HTMLElement>) {
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {}
  const root = document.documentElement;
  const apply = () => root.setAttribute("data-theme", next);
  if (readTheme() === next) return;
  if (typeof document.startViewTransition !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    apply();
    return;
  }

  const rect = e.currentTarget.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

  let applied = false;
  const run = () => {
    if (applied) return;
    applied = true;
    apply();
  };

  root.setAttribute("data-theme-switching", "");
  const transition = document.startViewTransition(run);
  // The update waits for a rendered frame; if none comes soon, switch without the animation.
  const fallback = window.setTimeout(() => {
    if (applied) return;
    transition.skipTransition();
    run();
  }, 300);
  transition.updateCallbackDone.finally(() => window.clearTimeout(fallback)).catch(() => {});
  transition.ready
    .then(() =>
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: "cubic-bezier(0.32, 0.72, 0, 1)", pseudoElement: "::view-transition-new(root)" },
      ),
    )
    .catch(() => {});
  transition.finished.finally(() => root.removeAttribute("data-theme-switching"));
}

/** Re-applies the theme after React's dev remount resets <html>, and follows the system until the user picks. */
export function ThemeSync() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", savedTheme() ?? systemTheme());
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!savedTheme()) root.setAttribute("data-theme", systemTheme());
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return null;
}

const iconSwap = "absolute inset-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]";

/** Icon-only button for the nav: a sun in light mode, a moon in dark. The icon follows CSS, so it never flickers on load. */
export function ThemeToggle({ label, className = "" }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => switchTheme(readTheme() === "dark" ? "light" : "dark", e)}
      className={`group grid place-items-center ${className}`}
    >
      <span className="relative block size-5">
        <Sun weight="bold" className={`${iconSwap} dark:rotate-90 dark:scale-50 dark:opacity-0`} />
        <Moon weight="bold" className={`${iconSwap} -rotate-90 scale-50 opacity-0 dark:rotate-0 dark:scale-100 dark:opacity-100`} />
      </span>
    </button>
  );
}

/** Two-option switch for the footer. */
export function ThemeSwitch({ labels }: { labels: { title: string; light: string; dark: string } }) {
  const theme = useTheme();
  // Colours come from CSS so the switch is right before hydration; state only drives aria-pressed.
  const options = [
    { value: "light" as const, label: labels.light, Icon: Sun, tone: "text-paper dark:text-muted" },
    { value: "dark" as const, label: labels.dark, Icon: Moon, tone: "text-muted dark:text-paper" },
  ];
  return (
    <div role="group" aria-label={labels.title} className="relative inline-grid grid-cols-2 rounded-full bg-paper-raised p-1 ring-1 ring-line">
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-ink transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:translate-x-full"
      />
      {options.map(({ value, label, Icon, tone }) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          onClick={(e) => switchTheme(value, e)}
          className={`relative z-10 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${tone}`}
        >
          <Icon weight="bold" className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
