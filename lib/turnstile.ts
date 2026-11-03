import "server-only";

// Cloudflare Turnstile ("saya bukan robot"). The widget in the browser hands the form a one-time
// token; only this server-side check, with the secret key, decides whether it is genuine.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Turnstile is on once both keys are set; until then the form keeps its other bot checks. */
export const turnstileEnabled = () => Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);

export async function verifyTurnstile(token: string, ip: string, action: string) {
  if (!turnstileEnabled()) return true;
  if (!token || token.length > 2048) return false;
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(10_000),
    });
    const result = (await res.json()) as { success: boolean; action?: string; "error-codes"?: string[] };
    // A token minted for another form on this site must not unlock this one.
    if (result.success && result.action && result.action !== action) return false;
    if (!result.success) console.warn("turnstile rejected", result["error-codes"]);
    return result.success;
  } catch (error) {
    // Fail closed: if Cloudflare cannot be reached the message is not accepted, and the visitor can retry.
    console.error("turnstile verify failed", error);
    return false;
  }
}
