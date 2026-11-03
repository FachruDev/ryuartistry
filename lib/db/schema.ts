import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
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
  /** Set when an admin turns the account off; such users cannot sign in or use their tokens. */
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
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

// ---------------------------------------------------------------------------
// Downloadable builds (APK, EXE, …) attached to a project
// ---------------------------------------------------------------------------

export const releasePlatform = pgEnum("release_platform", ["android", "windows", "macos", "linux"]);

/** One version of a project, e.g. 2.0.1, with its changelog. Files live in `release_files`. */
export const releases = pgTable(
  "releases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    version: text("version").notNull(),
    /** One change per line. */
    changelog: jsonb("changelog").$type<Localized>().default(emptyLocalized).notNull(),
    status: contentStatus("status").default("draft").notNull(),
    releasedAt: timestamp("released_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (t) => [unique("releases_project_version_unique").on(t.projectId, t.version), index("releases_project_idx").on(t.projectId)],
);

/**
 * A build for one platform. Only the newest builds per project and platform keep their object;
 * older ones are archived: `key` becomes null but the row (and the changelog) stays.
 */
export const releaseFiles = pgTable(
  "release_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => releases.id, { onDelete: "cascade" }),
    platform: releasePlatform("platform").notNull(),
    filename: text("filename").notNull(),
    key: text("key"),
    size: bigint("size", { mode: "number" }).notNull(),
    sha256: text("sha256"),
    downloads: integer("downloads").default(0).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [unique("release_files_release_platform_unique").on(t.releaseId, t.platform)],
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

// ---------------------------------------------------------------------------
// Analytics, AI access, and audit trail
// ---------------------------------------------------------------------------

/**
 * One row per public page view. No cookies: `visitorId` is a hash of IP + user agent
 * with a salt that rotates daily, so a visitor cannot be followed across days.
 */
export const pageViews = pgTable(
  "page_views",
  {
    id: uuid("id").primaryKey(),
    path: text("path").notNull(),
    locale: text("locale"),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    visitorId: text("visitor_id").notNull(),
    sessionId: text("session_id").notNull(),
    country: text("country"),
    device: text("device").notNull(),
    browser: text("browser"),
    os: text("os"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("page_views_created_at_idx").on(t.createdAt), index("page_views_path_idx").on(t.path)],
);

/** Apps that registered themselves for OAuth (RFC 7591), e.g. a Claude custom connector. */
export const oauthClients = pgTable("oauth_clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  redirectUris: jsonb("redirect_uris").$type<string[]>().notNull(),
  /** Null for public clients that authenticate with PKCE only. */
  secretHash: text("secret_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Single-use authorization codes, valid for a few minutes. Only the SHA-256 hash is stored. */
export const oauthCodes = pgTable("oauth_codes", {
  codeHash: text("code_hash").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => oauthClients.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  redirectUri: text("redirect_uri").notNull(),
  codeChallenge: text("code_challenge").notNull(),
  scope: text("scope"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/** Personal access tokens for the MCP endpoint. Only the SHA-256 hash is stored. */
export const apiTokens = pgTable("api_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  prefix: text("prefix").notNull(),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  /** Set when the token was issued through OAuth instead of created by hand. */
  oauthClientId: text("oauth_client_id").references(() => oauthClients.id, { onDelete: "set null" }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Fixed-window counters for login, contact, and other public endpoints, shared by every serverless instance. */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorType: text("actor_type").$type<"user" | "ai">().notNull(),
    actorName: text("actor_name").notNull(),
    action: text("action").$type<"create" | "update" | "delete">().notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("activity_log_created_at_idx").on(t.createdAt)],
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  cover: one(media, { fields: [projects.coverId], references: [media.id] }),
  category: one(categories, { fields: [projects.categoryId], references: [categories.id] }),
  releases: many(releases),
}));

export const releasesRelations = relations(releases, ({ one, many }) => ({
  project: one(projects, { fields: [releases.projectId], references: [projects.id] }),
  files: many(releaseFiles),
}));

export const releaseFilesRelations = relations(releaseFiles, ({ one }) => ({
  release: one(releases, { fields: [releaseFiles.releaseId], references: [releases.id] }),
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
export type PageView = typeof pageViews.$inferSelect;
export type ApiToken = typeof apiTokens.$inferSelect;
export type OAuthClient = typeof oauthClients.$inferSelect;
export type Activity = typeof activityLog.$inferSelect;
export type Release = typeof releases.$inferSelect;
export type ReleaseFile = typeof releaseFiles.$inferSelect;
export type ReleasePlatform = (typeof releasePlatform.enumValues)[number];
