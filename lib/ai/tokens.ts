import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Creates a token and returns the plain value. It is shown once and never stored. */
export async function issueToken(name: string, userId: string, oauthClientId?: string) {
  const token = `ryu_${randomBytes(24).toString("base64url")}`;
  await db.insert(schema.apiTokens).values({
    name,
    tokenHash: hash(token),
    prefix: token.slice(0, 10),
    createdBy: userId,
    oauthClientId,
  });
  return token;
}

/** Resolves `Authorization: Bearer ryu_…` to an active token row, or null. */
export async function verifyBearer(header: string | null) {
  const token = header?.match(/^Bearer\s+(ryu_[\w-]+)$/i)?.[1];
  if (!token) return null;
  const [match] = await db
    .select({ token: schema.apiTokens, ownerDisabledAt: schema.user.disabledAt })
    .from(schema.apiTokens)
    // A token only works while the person who created it still has an active account.
    .innerJoin(schema.user, eq(schema.user.id, schema.apiTokens.createdBy))
    .where(and(eq(schema.apiTokens.tokenHash, hash(token)), isNull(schema.apiTokens.revokedAt)));
  if (!match || match.ownerDisabledAt) return null;
  const row = match.token;
  // Coarse "last used" so the token list shows activity without a write on every call.
  if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > 60_000) {
    await db.update(schema.apiTokens).set({ lastUsedAt: new Date() }).where(eq(schema.apiTokens.id, row.id));
  }
  return row;
}
