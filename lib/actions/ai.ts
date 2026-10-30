"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { issueToken } from "@/lib/ai/tokens";
import { str } from "@/lib/forms";

export type TokenState = { token?: string; name?: string; error?: string };

export async function createApiToken(_prev: TokenState, form: FormData): Promise<TokenState> {
  const user = await requireAdmin();
  const name = str(form, "name").slice(0, 60);
  if (!name) return { error: "Beri nama token, misalnya “Claude di laptop”." };
  const token = await issueToken(name, user.id);
  refresh();
  return { token, name };
}

export async function revokeApiToken(id: string) {
  await requireAdmin();
  await db.update(schema.apiTokens).set({ revokedAt: new Date() }).where(eq(schema.apiTokens.id, id));
  refresh();
}
