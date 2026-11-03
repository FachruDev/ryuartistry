import "server-only";
import { randomInt } from "node:crypto";

export const MIN_PASSWORD = 12;

// Top entries of public breach lists plus words tied to this site. Short on purpose:
// the length rule already rules out most of the long tail.
const COMMON = new Set([
  "123456789012", "1234567890123", "qwertyuiopas", "password1234", "passwordpassword", "iloveyou1234",
  "adminadmin123", "administrator", "welcome12345", "letmein12345", "qwerty123456", "1q2w3e4r5t6y",
  "abc123456789", "000000000000", "111111111111", "123123123123", "passw0rd1234", "changeme1234",
  "indonesia123", "bismillah123", "sayang123456", "katasandi123", "rahasia12345",
]);
const SITE_WORDS = ["ryuartistry", "ryuart", "admin", "password", "katasandi"];

/** Returns why a new password is not acceptable, or null when it is. */
export function passwordProblem(password: string, user: { email: string; name?: string }) {
  if (password.length < MIN_PASSWORD) return `Password minimal ${MIN_PASSWORD} karakter.`;
  if (password.length > 128) return "Password maksimal 128 karakter.";
  const lower = password.toLowerCase();
  if (COMMON.has(lower) || /^(.)\1+$/.test(password)) return "Password ini terlalu umum. Pakai kalimat atau kombinasi yang lebih unik.";
  const personal = [user.email.split("@")[0], ...(user.name?.split(/\s+/) ?? [])].filter((w) => w.length >= 4);
  if ([...SITE_WORDS, ...personal].some((w) => lower.includes(w.toLowerCase()))) {
    return "Jangan pakai nama, email, atau nama situs di dalam password.";
  }
  return null;
}

const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** A random password for a new account or a reset, shown to the admin once. */
export function generatePassword(length = 16) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out.replace(/(.{4})(?=.)/g, "$1-");
}
