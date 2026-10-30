/**
 * Placeholder content so the site can be reviewed before real work is added.
 *   bun run db:seed-demo           insert demo projects, lab notes, a job, and their images
 *   bun run db:seed-demo --clean   remove everything this script created
 * Images live in /public/demo (Unsplash, free licence) and are referenced by local URL.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { inArray, like } from "drizzle-orm";
import type { JSONContent } from "@tiptap/core";
import * as schema from "../lib/db/schema";

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });

type L = { id: string; en: string };

const doc = (heading: L, paragraphs: L[], bullets: L[]): { id: JSONContent; en: JSONContent } => {
  const build = (lang: "id" | "en"): JSONContent => ({
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: heading[lang] }] },
      ...paragraphs.map((p) => ({ type: "paragraph", content: [{ type: "text", text: p[lang] }] })),
      {
        type: "bulletList",
        content: bullets.map((b) => ({ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: b[lang] }] }] })),
      },
    ],
  });
  return { id: build("id"), en: build("en") };
};

const images: Record<string, L> = {
  "iridescent-bloom": { id: "Bentuk 3D berkilau seperti bunga pelangi", en: "Iridescent 3D bloom" },
  "moon-ring": { id: "Bola pastel di atas cincin lembut", en: "Pastel sphere resting on a soft ring" },
  "glass-cubes": { id: "Kubus kaca pastel tersusun", en: "Stacked pastel glass cubes" },
  "peach-stack": { id: "Tumpukan cakram peach melayang", en: "Floating stack of peach discs" },
  "coral-garden": { id: "Bentuk organik bertekstur di latar lilac", en: "Textured organic shapes on lilac" },
  "orbit-discs": { id: "Cakram pastel yang mengorbit", en: "Orbiting pastel discs" },
  "lilac-rings": { id: "Cincin lilac dan bentuk berbulu", en: "Lilac rings and fuzzy forms" },
  "soft-spheres": { id: "Bola-bola lembut bercahaya", en: "Softly glowing spheres" },
  "mint-hills": { id: "Bukit mint yang halus", en: "Smooth mint hills" },
  "balance-act": { id: "Bentuk geometris yang saling menyeimbangkan", en: "Geometric shapes in balance" },
  "lilac-loops": { id: "Lengkungan lilac besar", en: "Large lilac loops" },
  "paper-waves": { id: "Gelombang kertas berlapis", en: "Layered paper waves" },
};

const projectSlugs = ["mimpi-naga", "pulau-mochi", "kanvas", "kopi-senja", "suara-ombak", "lentera"];
const postSlugs = ["tanah-liat-dari-shader", "devlog-pulau-mochi-1", "agen-ai-kecil"];
const jobSlugs = ["creative-developer-webgl"];

async function clean() {
  await db.delete(schema.projects).where(inArray(schema.projects.slug, projectSlugs));
  await db.delete(schema.posts).where(inArray(schema.posts.slug, postSlugs));
  await db.delete(schema.jobs).where(inArray(schema.jobs.slug, jobSlugs));
  await db.delete(schema.media).where(like(schema.media.key, "demo/%"));
  console.log("Demo content removed.");
}

async function seed() {
  await clean();

  const mediaRows = await db
    .insert(schema.media)
    .values(
      Object.entries(images).map(([name, alt]) => ({
        key: `demo/${name}.jpg`,
        url: `/demo/${name}.jpg`,
        alt,
        mime: "image/jpeg",
        size: 0,
        width: 1400,
      })),
    )
    .returning();
  const m = (name: string) => mediaRows.find((r) => r.key === `demo/${name}.jpg`)!.id;

  const cats = await db.select().from(schema.categories);
  const c = (slug: string) => cats.find((x) => x.slug === slug)?.id ?? null;
  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 86_400_000);

  await db.insert(schema.projects).values([
    {
      slug: "mimpi-naga",
      title: { id: "Mimpi Naga", en: "Dragon Dreams" },
      summary: {
        id: "Instalasi generatif yang mengubah cerita pengunjung menjadi naga 3D yang terus berubah bentuk.",
        en: "A generative installation that turns visitors' stories into an ever-shifting 3D dragon.",
      },
      body: doc(
        { id: "Ide awal", en: "The idea" },
        [
          { id: "Pengunjung membisikkan satu kalimat, dan model AI menerjemahkannya menjadi warna, tekstur, dan gerak naga di layar.", en: "Visitors whisper a sentence, and an AI model turns it into the colour, texture, and motion of a dragon on screen." },
          { id: "Setiap naga unik dan tidak pernah muncul dua kali.", en: "Every dragon is unique and never appears twice." },
        ],
        [
          { id: "Pipeline suara ke prompt secara real time", en: "Real-time voice-to-prompt pipeline" },
          { id: "Shader tanah liat yang bereaksi pada suara", en: "Clay shader that reacts to sound" },
        ],
      ),
      coverId: m("iridescent-bloom"),
      gallery: [m("lilac-rings"), m("soft-spheres")],
      categoryId: c("ai"),
      techStack: ["Three.js", "WebGPU", "Whisper", "Stable Diffusion"],
      client: "Konsep internal",
      year: 2026,
      featured: true,
      status: "published",
      publishedAt: daysAgo(3),
      sortOrder: 0,
    },
    {
      slug: "pulau-mochi",
      title: { id: "Pulau Mochi", en: "Mochi Island" },
      summary: { id: "Game puzzle santai tentang menumpuk pulau-pulau mochi tanpa membuatnya runtuh.", en: "A cosy puzzle game about stacking mochi islands without letting them topple." },
      body: doc(
        { id: "Bermain dengan fisika lembut", en: "Playing with soft physics" },
        [{ id: "Setiap pulau bergoyang dan memantul seperti kue mochi sungguhan.", en: "Every island wobbles and bounces like real mochi." }],
        [
          { id: "60 level buatan tangan", en: "60 hand-made levels" },
          { id: "Berjalan lancar di ponsel kelas menengah", en: "Runs smoothly on mid-range phones" },
        ],
      ),
      coverId: m("moon-ring"),
      gallery: [m("mint-hills"), m("balance-act")],
      categoryId: c("game"),
      techStack: ["Unity", "C#", "FMOD"],
      year: 2026,
      featured: true,
      status: "published",
      publishedAt: daysAgo(12),
      sortOrder: 1,
    },
    {
      slug: "kanvas",
      title: { id: "Kanvas", en: "Kanvas" },
      summary: { id: "Aplikasi moodboard kolaboratif untuk tim kreatif, lengkap dengan saran palet dari AI.", en: "A collaborative moodboard app for creative teams, with AI palette suggestions." },
      body: doc(
        { id: "Masalahnya", en: "The problem" },
        [{ id: "Tim kreatif menyebar referensi di belasan aplikasi. Kanvas mengumpulkannya dalam satu papan yang hidup.", en: "Creative teams scatter references across a dozen apps. Kanvas gathers them on one living board." }],
        [
          { id: "Kolaborasi real time", en: "Real-time collaboration" },
          { id: "Ekstraksi palet otomatis", en: "Automatic palette extraction" },
        ],
      ),
      coverId: m("glass-cubes"),
      categoryId: c("software"),
      techStack: ["Next.js", "Postgres", "WebSockets"],
      year: 2025,
      featured: true,
      status: "published",
      publishedAt: daysAgo(30),
      sortOrder: 2,
    },
    {
      slug: "kopi-senja",
      title: { id: "Kopi Senja", en: "Kopi Senja" },
      summary: { id: "Identitas brand dan kemasan untuk roastery kopi kecil yang ingin terasa hangat dan jenaka.", en: "Brand identity and packaging for a small roastery that wanted to feel warm and witty." },
      body: doc(
        { id: "Rasa yang terlihat", en: "Taste you can see" },
        [{ id: "Setiap varian kopi punya bentuk clay dan warna pastelnya sendiri.", en: "Each coffee blend gets its own clay shape and pastel colour." }],
        [
          { id: "Logo dan sistem tipografi", en: "Logo and type system" },
          { id: "Kemasan dan ilustrasi 3D", en: "Packaging and 3D illustration" },
        ],
      ),
      coverId: m("peach-stack"),
      gallery: [m("orbit-discs")],
      categoryId: c("creative"),
      techStack: ["Blender", "Figma"],
      year: 2025,
      featured: true,
      status: "published",
      publishedAt: daysAgo(45),
      sortOrder: 3,
    },
    {
      slug: "suara-ombak",
      title: { id: "Suara Ombak", en: "Suara Ombak" },
      summary: { id: "Asisten suara yang memahami bahasa daerah untuk layanan pelanggan di kota pesisir.", en: "A voice assistant that understands regional languages for coastal-town customer service." },
      body: doc(
        { id: "Mendengar lebih banyak orang", en: "Listening to more people" },
        [{ id: "Kami melatih ulang model pengenal suara dengan rekaman yang dikumpulkan bersama komunitas lokal.", en: "We fine-tuned a speech model with recordings gathered together with local communities." }],
        [{ id: "Mendukung tiga bahasa daerah", en: "Supports three regional languages" }],
      ),
      coverId: m("coral-garden"),
      categoryId: c("ai"),
      techStack: ["Python", "Whisper", "FastAPI"],
      year: 2025,
      status: "published",
      publishedAt: daysAgo(60),
      sortOrder: 4,
    },
    {
      slug: "lentera",
      title: { id: "Lentera", en: "Lentera" },
      summary: { id: "Prototipe game ritme di mana setiap ketukan menyalakan lentera di langit malam.", en: "A rhythm game prototype where every beat lights a lantern in the night sky." },
      body: doc(
        { id: "Prototipe seminggu", en: "A one-week prototype" },
        [{ id: "Dibuat dalam game jam internal untuk menguji input ritme di layar sentuh.", en: "Built during an internal game jam to test rhythm input on touch screens." }],
        [{ id: "Latensi input di bawah 20 ms", en: "Input latency under 20 ms" }],
      ),
      coverId: m("orbit-discs"),
      categoryId: c("game"),
      techStack: ["Godot", "GDScript"],
      year: 2024,
      status: "published",
      publishedAt: daysAgo(90),
      sortOrder: 5,
    },
  ]);

  await db.insert(schema.posts).values([
    {
      slug: "tanah-liat-dari-shader",
      title: { id: "Membuat tanah liat dari shader", en: "Making clay out of a shader" },
      excerpt: { id: "Bagaimana kami membuat gumpalan 3D di beranda terasa lembut dan bisa diremas.", en: "How we made the 3D lump on our homepage feel soft enough to squeeze." },
      body: doc(
        { id: "Noise, normal, dan sedikit sheen", en: "Noise, normals, and a little sheen" },
        [{ id: "Kuncinya bukan bentuknya, tapi cara cahaya jatuh di permukaan.", en: "The trick isn't the shape, it's how light falls on the surface." }],
        [
          { id: "Simplex noise dua oktaf", en: "Two-octave simplex noise" },
          { id: "Normal dihitung ulang dari permukaan yang terdistorsi", en: "Normals recomputed from the displaced surface" },
        ],
      ),
      coverId: m("lilac-loops"),
      categoryId: c("lab-creative"),
      readingTime: 4,
      status: "published",
      publishedAt: daysAgo(2),
    },
    {
      slug: "devlog-pulau-mochi-1",
      title: { id: "Devlog Pulau Mochi #1: fisika yang lembut", en: "Mochi Island devlog #1: soft physics" },
      excerpt: { id: "Catatan minggu pertama membuat pulau yang bergoyang tanpa membuat pemain pusing.", en: "Notes from week one of making islands wobble without making players dizzy." },
      body: doc(
        { id: "Pegas di mana-mana", en: "Springs everywhere" },
        [{ id: "Kami mencoba tiga pendekatan fisika sebelum menemukan yang terasa seperti mochi.", en: "We tried three physics approaches before one felt like mochi." }],
        [{ id: "Soft body murah dengan pegas", en: "Cheap soft bodies with springs" }],
      ),
      coverId: m("mint-hills"),
      categoryId: c("lab-game"),
      readingTime: 6,
      status: "published",
      publishedAt: daysAgo(9),
    },
    {
      slug: "agen-ai-kecil",
      title: { id: "Agen AI kecil yang benar-benar berguna", en: "Small AI agents that are actually useful" },
      excerpt: { id: "Kenapa kami lebih suka agen sempit dengan satu tugas jelas daripada asisten serba bisa.", en: "Why we prefer narrow agents with one clear job over do-everything assistants." },
      body: doc(
        { id: "Satu agen, satu pekerjaan", en: "One agent, one job" },
        [{ id: "Agen yang fokus lebih mudah diuji, diukur, dan dipercaya.", en: "Focused agents are easier to test, measure, and trust." }],
        [{ id: "Mulai dari alur kerja yang sudah ada", en: "Start from workflows that already exist" }],
      ),
      coverId: m("paper-waves"),
      categoryId: c("lab-ai"),
      readingTime: 5,
      status: "published",
      publishedAt: daysAgo(21),
    },
  ]);

  await db.insert(schema.jobs).values({
    slug: "creative-developer-webgl",
    title: { id: "Creative Developer (WebGL)", en: "Creative Developer (WebGL)" },
    summary: { id: "Bantu kami membuat pengalaman web 3D yang terasa seperti mainan.", en: "Help us build 3D web experiences that feel like toys." },
    body: doc(
      { id: "Yang akan kamu kerjakan", en: "What you'll do" },
      [{ id: "Membangun scene interaktif dengan Three.js dan shader untuk proyek klien dan eksperimen Lab.", en: "Build interactive scenes with Three.js and shaders for client projects and Lab experiments." }],
      [
        { id: "Pengalaman dengan Three.js atau WebGL", en: "Experience with Three.js or WebGL" },
        { id: "Peka terhadap gerak dan detail", en: "An eye for motion and detail" },
      ],
    ),
    location: "Remote",
    employmentType: "Full-time",
  });

  console.log(`Demo content added: ${projectSlugs.length} projects, ${postSlugs.length} notes, 1 job, ${mediaRows.length} images.`);
}

if (process.argv.includes("--clean")) await clean();
else await seed();
