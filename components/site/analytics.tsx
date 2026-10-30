"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function send(payload: object) {
  const body = JSON.stringify(payload);
  if (!navigator.sendBeacon?.("/api/track", body)) {
    fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
  }
}

// Per tab, so a "session" ends when the tab closes. Nothing is stored across visits.
function sessionId() {
  try {
    let id = sessionStorage.getItem("ryu-sid");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("ryu-sid", id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** Cookie-free page view beacon. Reports the view on arrival and the visible time on leave. */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (navigator.webdriver) return;
    const id = crypto.randomUUID();
    let viewed = false;
    // Deferred a tick so React's development double-mount does not count the page twice.
    const timer = setTimeout(() => {
      viewed = true;
      send({ type: "view", id, sessionId: sessionId(), path: location.pathname + location.search, referrer: document.referrer || undefined });
    }, 0);

    let visibleMs = 0;
    let since = document.visibilityState === "visible" ? performance.now() : null;
    let sent = false;

    const flush = () => {
      if (since !== null) visibleMs += performance.now() - since;
      since = null;
      if (viewed && !sent && visibleMs > 0) {
        sent = true;
        send({ type: "leave", id, durationMs: Math.round(visibleMs) });
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
      else if (!sent) since = performance.now();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      clearTimeout(timer);
      flush();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [pathname]);

  return null;
}
