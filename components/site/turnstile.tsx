"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Cloudflare Turnstile ("saya bukan robot"). It adds a hidden `cf-turnstile-response` field to the
 * surrounding form. `resetKey` changes after each failed submit, because a token works only once.
 */
export function Turnstile({ action, lang, resetKey }: { action: string; lang: string; resetKey?: unknown }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  const mount = () => {
    if (!SITE_KEY || !box.current || !window.turnstile || widget.current) return;
    widget.current = window.turnstile.render(box.current, {
      sitekey: SITE_KEY,
      action,
      language: lang,
      // Follow the site's own light/dark switch rather than the OS setting.
      theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
      size: "flexible",
    });
  };

  useEffect(() => {
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey !== undefined && widget.current) window.turnstile?.reset(widget.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={mount} />
      <div ref={box} className="min-h-[65px]" />
    </>
  );
}
