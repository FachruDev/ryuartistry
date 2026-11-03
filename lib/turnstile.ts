import "server-only";
import { siteUrl } from "@/lib/site";

// Cloudflare Turnstile ("saya bukan robot"). The widget in the browser hands the form a one-time
// token; only this server-side check, with the secret key, decides whether it is genuine.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Cloudflare's documented test secrets (1x… always passes, 2x… always fails, 3x… token already spent).
// Their responses carry no real action or hostname, so those two checks are skipped for them only.
const TEST_SECRET = /^[123]x0{31}AA$/;

/** Turnstile is enforced once the secret key is set; until then the form keeps its other bot checks. */
export const turnstileEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY);

/** Hostnames the widget may be solved on: TURNSTILE_HOSTNAMES (comma separated), else this site's own host. */
function allowedHostnames() {
  const listed = (process.env.TURNSTILE_HOSTNAMES ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return new Set(listed.length ? listed : [new URL(siteUrl).hostname]);
}

export async function verifyTurnstile(token: string, ip: string, action: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token || token.length > 2048) return false;
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`siteverify ${res.status}`);
    const result = (await res.json()) as { success: boolean; action?: string; hostname?: string; "error-codes"?: string[] };
    if (!result.success) {
      console.warn("turnstile rejected", result["error-codes"]);
      return false;
    }
    if (TEST_SECRET.test(secret)) return true;
    // A token minted for another form, or on someone else's site, must not unlock this one.
    if (result.action !== action || !allowedHostnames().has((result.hostname ?? "").toLowerCase())) {
      console.warn("turnstile token for wrong action or host", result.action, result.hostname);
      return false;
    }
    return true;
  } catch (error) {
    // Fail closed: if Cloudflare cannot be reached the message is not accepted, and the visitor can retry.
    console.error("turnstile verify failed", error);
    return false;
  }
}
