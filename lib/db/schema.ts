import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { JSONContent } from "@tiptap/core";

/** A string stored once per supported locale. */
export type Localized = { id: string; en: string };
/** A Tiptap document stored once per supported locale. */
export type LocalizedDoc = { id: JSONContent | null; en: JSONContent | null };
export type LinkItem = { label: string; url: string };

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

const emptyLocalized: Localized = { id: "", en: "" };
const emptyDoc: LocalizedDoc = { id: null, en: null };

// ---------------------------------------------------------------------------
// Better Auth tables
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("editor").notNull(),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// CMS content
// ---------------------------------------------------------------------------

export const contentStatus = pgEnum("content_status", ["draft", "published"]);
export const categoryKind = pgEnum("category_kind", ["project", "post"]);
export const inquiryType = pgEnum("inquiry_type", ["project", "collab", "other"]);
export const inquiryStatus = pgEnum("inquiry_status", ["new", "read", "archived"]);

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  url: text("url").notNull(),
  alt: jsonb("alt").$type<Localized>().default(emptyLocalized).notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  ...timestamps,
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: jsonb("name").$type<Localized>().notNull(),
  kind: categoryKind("kind").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  ...timestamps,
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: jsonb("title").$type<Localized>().notNull(),
    summary: jsonb("summary").$type<Localized>().default(emptyLocalized).notNull(),
    body: jsonb("body").$type<LocalizedDoc>().default(emptyDoc).notNull(),
    coverId: uuid("cover_id").references(() => media.id, { onDelete: "set null" }),
    gallery: jsonb("gallery").$type<string[]>().default([]).notNull(),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    tags: text("tags").array().default([]).notNull(),
    techStack: text("tech_stack").array().default([]).notNull(),
    client: text("client"),
    year: integer("year"),
    links: jsonb("links").$type<LinkItem[]>().default([]).notNull(),
    featured: boolean("featured").default(false).notNull(),
    status: contentStatus("status").default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (t) => [index("projects_status_idx").on(t.status)],
);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: jsonb("title").$type<Localized>().notNull(),
    excerpt: jsonb("excerpt").$type<Localized>().default(emptyLocalized).notNull(),
    body: jsonb("body").$type<LocalizedDoc>().default(emptyDoc).notNull(),
    coverId: uuid("cover_id").references(() => media.id, { onDelete: "set null" }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    tags: text("tags").array().default([]).notNull(),
    authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
    readingTime: integer("reading_time").default(1).notNull(),
    status: contentStatus("status").default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("posts_status_idx").on(t.status)],
);

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: jsonb("title").$type<Localized>().notNull(),
  description: jsonb("description").$type<Localized>().default(emptyLocalized).notNull(),
  icon: text("icon"),
  sortOrder: integer("sort_order").default(0).notNull(),
  ...timestamps,
});

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  role: jsonb("role").$type<Localized>().default(emptyLocalized).notNull(),
  bio: jsonb("bio").$type<Localized>().default(emptyLocalized).notNull(),
  photoId: uuid("photo_id").references(() => media.id, { onDelete: "set null" }),
  socials: jsonb("socials").$type<LinkItem[]>().default([]).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  ...timestamps,
});

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    company: text("company"),
    type: inquiryType("type").default("project").notNull(),
    message: text("message").notNull(),
    status: inquiryStatus("status").default("new").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("inquiries_status_idx").on(t.status), index("inquiries_email_idx").on(t.email)],
);

/** Singleton row (id = 1) holding site-wide copy and links. */
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  tagline: jsonb("tagline").$type<Localized>().default(emptyLocalized).notNull(),
  heroTitle: jsonb("hero_title").$type<Localized>().default(emptyLocalized).notNull(),
  heroSubtitle: jsonb("hero_subtitle").$type<Localized>().default(emptyLocalized).notNull(),
  contactEmail: text("contact_email"),
  socials: jsonb("socials").$type<LinkItem[]>().default([]).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const projectsRelations = relations(projects, ({ one }) => ({
  cover: one(media, { fields: [projects.coverId], references: [media.id] }),
  category: one(categories, { fields: [projects.categoryId], references: [categories.id] }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  cover: one(media, { fields: [posts.coverId], references: [media.id] }),
  category: one(categories, { fields: [posts.categoryId], references: [categories.id] }),
  author: one(user, { fields: [posts.authorId], references: [user.id] }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  photo: one(media, { fields: [teamMembers.photoId], references: [media.id] }),
}));

export type Project = typeof projects.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Service = typeof services.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
