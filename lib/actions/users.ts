"use server";

import { and, count, eq, isNull, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { requireAdmin, type SessionUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { generatePassword } from "@/lib/passwords";
import { str } from "@/lib/forms";

export type Role = "admin" | "editor";
export type CreateUserState = { error?: string; created?: { name: string; email: string; password: string } };
export type PasswordState = { error?: string; password?: string };

const actorOf = (user: SessionUser) => ({ type: "user" as const, name: user.name });
const roleInput = z.enum(["admin", "editor"]);

async function findUser(id: string) {
  const [row] = await db.select().from(schema.user).where(eq(schema.user.id, id));
  return row ?? null;
}

/** True when someone other than `id` is still an active admin, so the CMS never ends up without one. */
async function anotherActiveAdmin(id: string) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(schema.user)
    .where(and(eq(schema.user.role, "admin"), isNull(schema.user.disabledAt), ne(schema.user.id, id)));
  return value > 0;
}

/** Signs the user out everywhere and stops the AI tokens they created. */
async function cutAccess(userId: string) {
  await db.delete(schema.session).where(eq(schema.session.userId, userId));
  await db
    .update(schema.apiTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.apiTokens.createdBy, userId), isNull(schema.apiTokens.revokedAt)));
}

async function setPassword(userId: string, password: string) {
  const hash = await hashPassword(password);
  const updated = await db
    .update(schema.account)
    .set({ password: hash })
    .where(and(eq(schema.account.userId, userId), eq(schema.account.providerId, "credential")))
    .returning({ id: schema.account.id });
  if (!updated.length) {
    await db.insert(schema.account).values({ id: crypto.randomUUID(), accountId: userId, providerId: "credential", userId, password: hash });
  }
}

export async function createUser(_prev: CreateUserState, form: FormData): Promise<CreateUserState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ name: z.string().trim().min(2).max(80), email: z.email().max(200), role: roleInput })
    .safeParse({ name: str(form, "name"), email: str(form, "email").toLowerCase(), role: str(form, "role") || "editor" });
  if (!parsed.success) return { error: "Isi nama (minimal 2 huruf), email yang valid, dan role." };

  const [existing] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, parsed.data.email));
  if (existing) return { error: "Email ini sudah punya akun." };

  const id = crypto.randomUUID();
  const password = generatePassword();
  await db.insert(schema.user).values({ id, ...parsed.data, emailVerified: true });
  await setPassword(id, password);
  await logActivity(actorOf(admin), "create", "user", id, parsed.data.name);
  refresh();
  return { created: { name: parsed.data.name, email: parsed.data.email, password } };
}

export async function setUserRole(id: string, role: Role) {
  const admin = await requireAdmin();
  if (id === admin.id) throw new Error("Role sendiri tidak bisa diubah.");
  const target = await findUser(id);
  if (!target || !roleInput.safeParse(role).success) return;
  if (target.role === "admin" && role !== "admin" && !(await anotherActiveAdmin(id))) throw new Error("Harus tetap ada satu admin aktif.");
  await db.update(schema.user).set({ role }).where(eq(schema.user.id, id));
  // A demoted admin must not keep admin rights in a session opened before.
  if (role !== "admin") await db.delete(schema.session).where(eq(schema.session.userId, id));
  await logActivity(actorOf(admin), "update", "user", id, `${target.name} → ${role}`);
  refresh();
}

export async function setUserDisabled(id: string, disabled: boolean) {
  const admin = await requireAdmin();
  if (id === admin.id) throw new Error("Akun sendiri tidak bisa dinonaktifkan.");
  const target = await findUser(id);
  if (!target) return;
  if (disabled && target.role === "admin" && !(await anotherActiveAdmin(id))) throw new Error("Harus tetap ada satu admin aktif.");
  await db.update(schema.user).set({ disabledAt: disabled ? new Date() : null }).where(eq(schema.user.id, id));
  if (disabled) await cutAccess(id);
  await logActivity(actorOf(admin), "update", "user", id, `${target.name} ${disabled ? "dinonaktifkan" : "diaktifkan"}`);
  refresh();
}

export async function resetUserPassword(id: string): Promise<PasswordState> {
  const admin = await requireAdmin();
  if (id === admin.id) return { error: "Ganti password sendiri lewat halaman Akun." };
  const target = await findUser(id);
  if (!target) return { error: "Pengguna tidak ditemukan." };
  const password = generatePassword();
  await setPassword(id, password);
  await db.delete(schema.session).where(eq(schema.session.userId, id));
  await logActivity(actorOf(admin), "update", "user", id, `${target.name}: password direset`);
  refresh();
  return { password };
}

export async function revokeUserSessions(id: string) {
  const admin = await requireAdmin();
  if (id === admin.id) throw new Error("Keluar dari perangkat lain lewat halaman Akun.");
  const target = await findUser(id);
  if (!target) return;
  await db.delete(schema.session).where(eq(schema.session.userId, id));
  await logActivity(actorOf(admin), "update", "user", id, `${target.name}: semua sesi diputus`);
  refresh();
}
