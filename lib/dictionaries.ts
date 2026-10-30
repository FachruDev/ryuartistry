import type { Locale } from "@/lib/i18n";

const id = {
  nav: {
    work: "Karya",
    lab: "Lab",
    services: "Layanan",
    about: "Tentang",
    careers: "Karier",
    contact: "Kontak",
  },
  home: {
    heroTitle: "Kami merakit ide menjadi pengalaman digital yang hidup.",
    heroSubtitle:
      "Ryuartistry adalah studio kreatif yang terbuka pada segala hal baru: kecerdasan buatan, game, software, dan desain yang berani.",
    ctaPrimary: "Lihat karya",
    ctaSecondary: "Mulai proyek",
    scroll: "Gulir",
    manifesto:
      "Kami tidak memilih antara seni dan teknologi. Kami percaya keduanya adalah bahasa yang sama, dan tugas kami adalah menulis cerita baru dengannya.",
    disciplinesTitle: "Satu studio, banyak dunia.",
    featuredTitle: "Proyek yang kami banggakan.",
    allWork: "Semua karya",
    labTitle: "Catatan eksperimen terbaru.",
    allLab: "Semua catatan",
    ctaTitle: "Punya ide gila? Mari wujudkan.",
    ctaBody: "Ceritakan proyek, kolaborasi, atau eksperimen yang ingin Anda bangun bersama kami.",
  },
  disciplines: [
    { key: "ai", title: "AI", body: "Produk dan alur kerja yang ditenagai model AI, dari prototipe hingga produksi." },
    { key: "game", title: "Game", body: "Game, pengalaman interaktif, dan dunia virtual yang memikat pemain." },
    { key: "software", title: "Software", body: "Aplikasi web dan mobile yang cepat, rapi, dan siap bertumbuh." },
    { key: "creative", title: "Creative", body: "Identitas brand, motion, dan visual yang membuat orang berhenti menggulir." },
  ],
  work: {
    title: "Karya",
    intro: "Kumpulan proyek kami di persimpangan AI, game, software, dan desain.",
    all: "Semua",
    empty: "Belum ada karya yang dipublikasikan.",
    client: "Klien",
    year: "Tahun",
    stack: "Teknologi",
    links: "Tautan",
    back: "Kembali ke karya",
    next: "Karya berikutnya",
  },
  lab: {
    title: "Lab",
    intro: "Catatan riset, devlog, dan eksperimen dari dapur Ryuartistry.",
    empty: "Belum ada catatan.",
    minRead: "menit baca",
    back: "Kembali ke Lab",
  },
  services: {
    title: "Layanan",
    intro: "Apa yang bisa kami bangun bersama Anda.",
    empty: "Daftar layanan segera hadir.",
  },
  about: {
    title: "Tentang kami",
    intro:
      "Ryuartistry lahir dari rasa penasaran. Kami adalah tim kecil desainer, engineer, dan pembuat game yang suka menjelajahi teknologi baru dan mengubahnya menjadi sesuatu yang bermakna.",
    teamTitle: "Tim",
    valuesTitle: "Yang kami pegang",
    values: [
      { title: "Penasaran dulu", body: "Kami mencoba hal baru sebelum orang lain menganggapnya biasa." },
      { title: "Detail itu penting", body: "Pengalaman yang hebat dibangun dari ratusan keputusan kecil." },
      { title: "Terbuka", body: "Kami berbagi proses, eksperimen, dan pelajaran secara terbuka." },
    ],
  },
  careers: {
    title: "Karier",
    intro: "Bergabunglah dengan tim yang senang bereksperimen.",
    empty: "Saat ini belum ada posisi terbuka, tetapi kami selalu senang berkenalan.",
    apply: "Lamar posisi ini",
    back: "Semua posisi",
  },
  contact: {
    title: "Mari bicara",
    intro: "Ceritakan ide Anda. Kami biasanya membalas dalam 1–2 hari kerja.",
    name: "Nama",
    email: "Email",
    company: "Perusahaan (opsional)",
    type: "Jenis kebutuhan",
    types: { project: "Proyek baru", collab: "Kolaborasi", career: "Karier", other: "Lainnya" },
    message: "Pesan",
    submit: "Kirim pesan",
    sending: "Mengirim…",
    success: "Terima kasih! Pesan Anda sudah kami terima.",
    error: "Pesan gagal dikirim. Periksa kembali isian Anda.",
  },
  footer: {
    rights: "Semua hak dilindungi.",
    madeWith: "Dibuat dengan rasa penasaran.",
  },
  notFound: { title: "Halaman tidak ditemukan", back: "Kembali ke beranda" },
};

export type Dictionary = typeof id;

const en: Dictionary = {
  nav: {
    work: "Work",
    lab: "Lab",
    services: "Services",
    about: "About",
    careers: "Careers",
    contact: "Contact",
  },
  home: {
    heroTitle: "We forge ideas into living digital experiences.",
    heroSubtitle:
      "Ryuartistry is a creative studio open to everything new: artificial intelligence, games, software, and bold design.",
    ctaPrimary: "See our work",
    ctaSecondary: "Start a project",
    scroll: "Scroll",
    manifesto:
      "We don't choose between art and technology. We believe they speak the same language, and our job is to write new stories with it.",
    disciplinesTitle: "One studio, many worlds.",
    featuredTitle: "Projects we're proud of.",
    allWork: "All work",
    labTitle: "Latest experiment notes.",
    allLab: "All notes",
    ctaTitle: "Got a wild idea? Let's build it.",
    ctaBody: "Tell us about the project, collaboration, or experiment you want to build with us.",
  },
  disciplines: [
    { key: "ai", title: "AI", body: "Products and workflows powered by AI models, from prototype to production." },
    { key: "game", title: "Games", body: "Games, interactive experiences, and virtual worlds players love." },
    { key: "software", title: "Software", body: "Web and mobile apps that are fast, clean, and built to grow." },
    { key: "creative", title: "Creative", body: "Brand identity, motion, and visuals that make people stop scrolling." },
  ],
  work: {
    title: "Work",
    intro: "Our projects at the intersection of AI, games, software, and design.",
    all: "All",
    empty: "No published work yet.",
    client: "Client",
    year: "Year",
    stack: "Stack",
    links: "Links",
    back: "Back to work",
    next: "Next project",
  },
  lab: {
    title: "Lab",
    intro: "Research notes, devlogs, and experiments from inside Ryuartistry.",
    empty: "No notes yet.",
    minRead: "min read",
    back: "Back to Lab",
  },
  services: {
    title: "Services",
    intro: "What we can build together.",
    empty: "Services coming soon.",
  },
  about: {
    title: "About us",
    intro:
      "Ryuartistry was born from curiosity. We're a small team of designers, engineers, and game makers who love exploring new technology and turning it into something meaningful.",
    teamTitle: "Team",
    valuesTitle: "What we stand for",
    values: [
      { title: "Curious first", body: "We try new things before everyone else calls them normal." },
      { title: "Details matter", body: "Great experiences are built from hundreds of small decisions." },
      { title: "Open by default", body: "We share our process, experiments, and lessons in the open." },
    ],
  },
  careers: {
    title: "Careers",
    intro: "Join a team that loves to experiment.",
    empty: "No open roles right now, but we're always happy to say hello.",
    apply: "Apply for this role",
    back: "All roles",
  },
  contact: {
    title: "Let's talk",
    intro: "Tell us your idea. We usually reply within 1–2 business days.",
    name: "Name",
    email: "Email",
    company: "Company (optional)",
    type: "What do you need?",
    types: { project: "New project", collab: "Collaboration", career: "Careers", other: "Other" },
    message: "Message",
    submit: "Send message",
    sending: "Sending…",
    success: "Thank you! We've received your message.",
    error: "Couldn't send your message. Please check the form.",
  },
  footer: {
    rights: "All rights reserved.",
    madeWith: "Made with curiosity.",
  },
  notFound: { title: "Page not found", back: "Back home" },
};

const dictionaries: Record<Locale, Dictionary> = { id, en };

export function getDictionary(lang: Locale): Dictionary {
  return dictionaries[lang];
}
