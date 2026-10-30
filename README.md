# Ryuartistry

Website studio kreatif Ryuartistry (AI, game, software, kreatif) beserta CMS bawaan di `/admin`.

- **Situs publik** dua bahasa: `/id` dan `/en`. Pengunjung diarahkan otomatis sesuai bahasa browser.
- **CMS** untuk Karya (portofolio), Lab (blog/devlog), Layanan, Tim, Karier, Inbox kontak, Media, dan Pengaturan situs.

## Stack

| Bagian | Teknologi |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components, Partial Prefetching) |
| Database | Neon Postgres + Drizzle ORM |
| Auth | Better Auth (email + password, tanpa pendaftaran publik) |
| Media | Neon Object Storage (S3), bucket `assets-public` |
| Editor | Tiptap (disimpan sebagai JSON, dirender di server) |
| Visual | Tailwind v4, Motion, Lenis, React Three Fiber |

## Menjalankan secara lokal

```bash
bun install
cp .env.example .env    # isi DATABASE_URL, AWS_*, BETTER_AUTH_SECRET, ADMIN_*
bun run db:migrate      # membuat tabel
bun run db:seed         # kategori, layanan awal, pengaturan, akun admin pertama
bun dev
```

Buka http://localhost:3000 untuk situs dan http://localhost:3000/admin untuk CMS. Masuk dengan `ADMIN_EMAIL` dan `ADMIN_PASSWORD` dari `.env`.

## Script

| Perintah | Fungsi |
| --- | --- |
| `bun run db:generate` | Membuat file migrasi setelah `lib/db/schema.ts` diubah |
| `bun run db:migrate` | Menjalankan migrasi ke database |
| `bun run db:studio` | Membuka Drizzle Studio |
| `bun run db:seed` | Mengisi data awal (aman dijalankan berulang) |
| `bun run db:seed-demo` | Mengisi konten contoh: 6 karya, 3 catatan Lab, 1 lowongan |
| `bun run db:seed-demo --clean` | Menghapus semua konten contoh |

## Konten contoh

Situs saat ini diisi konten contoh supaya desainnya bisa dinilai. Gambarnya dari Unsplash (lisensi bebas) dan disimpan di `public/demo`. Jalankan `bun run db:seed-demo --clean` setelah karya asli dimasukkan lewat CMS, lalu hapus folder `public/demo`. Gambar di `public/visuals` dipakai panel disiplin di beranda dan bukan konten contoh.

## Arah visual

"Ryu's clay studio": dunia tanah liat pastel. Token warna ada di `app/globals.css`.

| Token | Warna | Dipakai untuk |
| --- | --- | --- |
| `milk` | `#f4f1fb` | Latar |
| `plum` | `#2a1e3f` | Teks, tombol utama, footer |
| `lilac` | `#cdbcff` | Disiplin AI |
| `mint` | `#b8ecd8` | Disiplin Game |
| `sky` | `#bcdcff` | Disiplin Software |
| `peach` | `#ffcdb8` | Disiplin Kreatif |
| `butter` | `#ffe8a3` | Aksen dan CTA |

Font: Fraunces (sumbu SOFT dan WONK) untuk judul, Plus Jakarta Sans untuk teks. Utilitas CSS: `.clay` (claymorphism), `.bezel` dan `.bezel-core` (bingkai ganda), `.morph-blob`, `.marquee-track`, dan `.skeleton`.

## Struktur

```
app/[lang]/        situs publik (beranda, work, lab, services, about, careers, contact)
app/admin/         CMS; semua halaman memeriksa sesi sendiri
app/api/           handler Better Auth dan upload media
lib/db/schema.ts   skema database (teks dua bahasa disimpan sebagai { id, en })
lib/queries.ts     query publik dengan "use cache" + cacheTag
lib/actions/       Server Actions CMS; setiap simpan memanggil updateTag
components/site/   komponen situs (hero clay 3D, marquee, scrollytelling, panel horizontal, dsb.)
components/admin/  komponen CMS (editor, media picker, form)
```

## Cara konten diperbarui

Halaman publik di-prerender dan di-cache. Saat editor menyimpan di CMS, Server Action memanggil `updateTag(...)` untuk jenis konten tersebut, jadi perubahan langsung tampil tanpa perlu deploy ulang. Konten berstatus **Draf** tidak pernah tampil di situs.

## Deploy

Set environment variable yang sama dengan `.env`, ditambah:

- `BETTER_AUTH_URL` dan `SITE_URL`: domain produksi, misalnya `https://ryuartistry.com`
- `BETTER_AUTH_SECRET`: secret baru khusus produksi
