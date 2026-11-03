"use server";

import { and, eq, gt } from "drizzle-orm";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { str } from "@/lib/forms";
import { clientIp, hashed, hit } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  company: z.string().trim().max(160).optional(),
  type: z.enum(["project", "collab", "other"]),
  message: z.string().trim().min(10).max(5000),
});

export type ContactState = { status: "idle" | "success" | "error"; fields?: string[]; limited?: boolean };

const MIN_FILL_MS = 3_000;

/** Public contact form. Anyone can call this, so it validates strictly and stays quiet on spam. */
export async function submitInquiry(_prev: ContactState, form: FormData): Promise<ContactState> {
  // Honeypot: real visitors never see or fill this field.
  if (str(form, "website")) return { status: "success" };
  // Bots post straight away or skip the script that stamps the form; people take a few seconds to type.
  const startedAt = Number(str(form, "startedAt"));
  if (!startedAt || Date.now() - startedAt < MIN_FILL_MS) return { status: "success" };

  const parsed = contactSchema.safeParse({
    name: str(form, "name"),
    email: str(form, "email").toLowerCase(),
    company: str(form, "company") || undefined,
    type: str(form, "type") || "project",
    message: str(form, "message"),
  });
  if (!parsed.success) {
    return { status: "error", fields: parsed.error.issues.map((i) => String(i.path[0])) };
  }

  // A few messages per network per hour; random email addresses no longer get around the limit below.
  if (await hit({ key: `contact:ip:${hashed(clientIp(await headers()))}`, max: 5, windowMs: 60 * 60_000 })) {
    return { status: "error", limited: true };
  }

  // One message per email per minute is plenty for a contact form.
  const recent = await db
    .select({ id: schema.inquiries.id })
    .from(schema.inquiries)
    .where(
      and(
        eq(schema.inquiries.email, parsed.data.email),
        gt(schema.inquiries.createdAt, new Date(Date.now() - 60_000)),
      ),
    )
    .limit(1);
  if (recent.length) return { status: "success" };

  await db.insert(schema.inquiries).values({ ...parsed.data, company: parsed.data.company ?? null });
  return { status: "success" };
}

export async function setInquiryStatus(id: string, status: "new" | "read" | "archived") {
  await requireUser();
  await db.update(schema.inquiries).set({ status }).where(eq(schema.inquiries.id, id));
  refresh();
}

export async function deleteInquiry(id: string) {
  await requireUser();
  await db.delete(schema.inquiries).where(eq(schema.inquiries.id, id));
  refresh();
}
