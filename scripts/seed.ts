/**
 * Idempotent seed: categories, services, site settings, and the first admin account.
 * Run with `bun run db:seed` (Bun loads .env automatically).
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import * as schema from "../lib/db/schema";

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });

const disciplines = [
  { slug: "ai", name: { id: "AI", en: "AI" } },
  { slug: "game", name: { id: "Game", en: "Games" } },
  { slug: "software", name: { id: "Software", en: "Software" } },
  { slug: "creative", name: { id: "Kreatif", en: "Creative" } },
];

async function seedCategories() {
  const rows = disciplines.flatMap((d, i) => [
    { ...d, kind: "project" as const, sortOrder: i },
    { ...d, slug: `lab-${d.slug}`, kind: "post" as const, sortOrder: i },
  ]);
  await db.insert(schema.categories).values(rows).onConflictDoNothing();
}

async function seedServices() {
  await db
    .insert(schema.services)
    .values([
      {
        slug: "ai-products",
        icon: "ai",
        sortOrder: 0,
        title: { id: "Produk & Integrasi AI", en: "AI Products & Integration" },
        description: {
          id: "Chatbot, agen, otomasi alur kerja, dan fitur AI yang terintegrasi ke produk Anda.",
          en: "Chatbots, agents, workflow automation, and AI features built into your product.",
        },
      },
      {
        slug: "game-development",
        icon: "game",
        sortOrder: 1,
        title: { id: "Pengembangan Game", en: "Game Development" },
        description: {
          id: "Game web, mobile, dan pengalaman interaktif, dari konsep hingga rilis.",
          en: "Web and mobile games and interactive experiences, from concept to launch.",
        },
      },
      {
        slug: "software-engineering",
        icon: "software",
        sortOrder: 2,
        title: { id: "Rekayasa Software", en: "Software Engineering" },
        description: {
          id: "Aplikasi web, dashboard, dan platform yang cepat, aman, dan mudah dikembangkan.",
          en: "Web apps, dashboards, and platforms that are fast, secure, and easy to evolve.",
        },
      },
      {
        slug: "creative-direction",
        icon: "creative",
        sortOrder: 3,
        title: { id: "Arah Kreatif & Brand", en: "Creative Direction & Brand" },
        description: {
          id: "Identitas visual, motion design, dan konten yang membuat brand Anda diingat.",
          en: "Visual identity, motion design, and content that makes your brand memorable.",
        },
      },
    ])
    .onConflictDoNothing();
}

async function seedSettings() {
  await db
    .insert(schema.siteSettings)
    .values({
      id: 1,
      tagline: {
        id: "Studio kreatif untuk era AI, game, dan software.",
        en: "A creative studio for the age of AI, games, and software.",
      },
      contactEmail: process.env.ADMIN_EMAIL ?? null,
    })
    .onConflictDoNothing();
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set; skipping admin account.");
    return;
  }
  const existing = await db.query.user.findFirst({ where: eq(schema.user.email, email) });
  if (existing) {
    console.log(`Admin ${email} already exists.`);
    return;
  }
  const id = crypto.randomUUID();
  await db.insert(schema.user).values({
    id,
    email,
    name: process.env.ADMIN_NAME || "Admin",
    emailVerified: true,
    role: "admin",
  });
  await db.insert(schema.account).values({
    id: crypto.randomUUID(),
    accountId: id,
    providerId: "credential",
    userId: id,
    password: await hashPassword(password),
  });
  console.log(`Created admin ${email}.`);
}

await seedCategories();
await seedServices();
await seedSettings();
await seedAdmin();
console.log("Seed complete.");
