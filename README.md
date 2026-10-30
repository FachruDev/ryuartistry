# Ryuartistry

Website studio kreatif Ryuartistry (AI, game, software, kreatif) beserta CMS bawaan di `/admin`.

- **Situs publik** dua bahasa: `/id` dan `/en`. Pengunjung diarahkan otomatis sesuai bahasa browser.
- **CMS** untuk Karya (portofolio), Lab (blog/devlog), Layanan, Tim, Inbox kontak, Media, dan Pengaturan situs, dengan dashboard analitik dan pencarian cepat (Ctrl + K).
- **Asisten AI**: Claude bisa membaca dan mengubah isi CMS lewat MCP, memakai langganan Claude yang sudah ada (tanpa API berbayar per pemakaian).

## Stack

| Bagian | Teknologi |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components, Partial Prefetching) |
| Database | Neon Postgres + Drizzle ORM |
| Auth | Better Auth (email + password, tanpa pendaftaran publik) |
| Media | Neon Object Storage (S3), bucket `assets-public` |
| Editor | Tiptap (disimpan sebagai JSON, dirender di server) |
| Visual | Tailwind v4, Motion, View Transitions |

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
| `bun run db:seed-demo` | Mengisi konten contoh: 6 karya dan 3 catatan Lab |
| `bun run db:seed-demo --clean` | Menghapus semua konten contoh |

## Konten contoh

Situs saat ini diisi konten contoh supaya desainnya bisa dinilai. Gambarnya dari Unsplash (lisensi bebas) dan disimpan di `public/demo`. Jalankan `bun run db:seed-demo --clean` setelah karya asli dimasukkan lewat CMS, lalu hapus folder `public/demo`.

## Arah visual

Sederhana dan ringan, dengan palet "Naga" (dari *ryu*, naga): kertas beras, tinta biru-hitam, merah stempel, dan kartu pastel per disiplin. Tidak ada 3D; animasinya hanya hover, reveal saat scroll, dan transisi halaman. Token warna ada di `app/globals.css`, masing-masing punya nilai terang dan gelap.

| Token | Terang | Gelap | Dipakai untuk |
| --- | --- | --- | --- |
| `paper` | `#f3f1ea` | `#0f1724` | Latar |
| `ink` | `#14213d` | `#f3f1ea` | Teks dan tombol utama |
| `muted` | `#56627a` | `#a3adbf` | Teks pendukung |
| `accent` | `#e0442a` | `#ff6a4d` | Titik di judul dan logo, fokus |
| `wisteria` | `#cbc4f3` | `#b3aae8` | Disiplin AI |
| `jade` | `#a7dcc4` | `#8fcbb0` | Disiplin Game |
| `mizu` | `#b9d7f0` | `#9cc1e3` | Disiplin Software |
| `sakura` | `#f6c6d1` | `#e8adbb` | Disiplin Kreatif |
| `yuzu` | `#f4df86` | `#e8cf6c` | CTA |

Font: Bricolage Grotesque untuk judul, Plus Jakarta Sans untuk teks.

Cahaya pastel yang bergerak di bagian atas setiap halaman berasal dari kanvas 32×32 piksel (`components/site/hero-glow.tsx`) yang digambar ulang 30 kali per detik dan diregangkan oleh CSS, sehingga terlihat blur tanpa biaya besar. Warnanya dibaca dari token tema, berhenti saat tidak terlihat di layar, dan diam jika pengunjung memilih reduced motion.

Tema mengikuti sistem sampai pengunjung memilih lewat tombol di navigasi atau footer; pilihannya disimpan di `localStorage`. Skrip kecil di `<head>` (`lib/theme.ts`) memasang `data-theme` sebelum halaman tampil, jadi tidak ada kedipan. Gunakan varian Tailwind `dark:` untuk gaya khusus mode gelap. CMS selalu memakai tema terang.

## Struktur

```
app/[lang]/        situs publik (beranda, work, lab, services, about, contact)
app/admin/         CMS; semua halaman memeriksa sesi sendiri
app/api/           handler Better Auth dan upload media
lib/db/schema.ts   skema database (teks dua bahasa disimpan sebagai { id, en })
lib/queries.ts     query publik dengan "use cache" + cacheTag
lib/actions/       Server Actions CMS; setiap simpan memanggil updateTag dan mencatat aktivitas
lib/mcp/tools.ts   tool MCP untuk asisten AI (dipakai app/api/mcp)
lib/analytics.ts   query dan wawasan untuk dashboard analitik
components/site/   komponen situs (navigasi, hero, kartu karya, toggle tema, dsb.)
components/admin/  komponen CMS (editor, media picker, form)
```

## Cara konten diperbarui

Halaman publik di-prerender dan di-cache. Saat editor menyimpan di CMS, Server Action memanggil `updateTag(...)` untuk jenis konten tersebut, jadi perubahan langsung tampil tanpa perlu deploy ulang. Konten berstatus **Draf** tidak pernah tampil di situs.

## Analitik

Setiap halaman publik mengirim satu beacon kecil ke `/api/track` (`components/site/analytics.tsx`). Tidak ada cookie: pengunjung dikenali dari hash IP + user agent dengan salt yang berganti setiap hari, sesi disimpan di `sessionStorage` per tab. Bot dan admin yang sedang masuk tidak dihitung. Negara terbaca dari header Vercel, jadi kosong saat lokal.

Halaman **Analitik** menampilkan pengunjung, tayangan, halaman per kunjungan, waktu baca, konversi ke pesan masuk, tren harian dibanding periode sebelumnya, halaman teratas, sumber, negara, perangkat, bahasa, jam ramai (WIB), dan wawasan otomatis (`lib/analytics.ts`). Ringkasan **Kesehatan konten** di dashboard (`lib/cms-health.ts`) menandai karya tanpa sampul, terjemahan kosong, draf terbengkalai, dan gambar tanpa alt.

## Asisten AI (MCP)

`/api/mcp` adalah server [MCP](https://modelcontextprotocol.io) tanpa state (Streamable HTTP, JSON). Claude Code atau Claude Desktop terhubung ke sini dan menjalankan tool seperti `cms_overview`, `save_project`, `save_post`, `upload_media_from_url`, dan `get_analytics` (daftar lengkap di `lib/mcp/tools.ts`). AI-nya berjalan di aplikasi Claude milik Anda; server ini hanya menyediakan tool, jadi tidak ada biaya API.

1. Buka CMS → **Asisten AI**, buat token (hanya admin). Token tampil sekali; yang disimpan hanya hash-nya.
2. Tempel perintah yang muncul, misalnya:

   ```bash
   claude mcp add --transport http --scope user ryuartistry https://domain-anda/api/mcp --header "Authorization: Bearer ryu_…"
   ```

3. Minta dalam bahasa biasa: "Buat 3 karya contoh untuk kategori game, dua bahasa, simpan sebagai draft."

Setiap perubahan oleh AI tercatat di **Aktivitas terbaru** dengan nama tokennya, dan cache halaman publik langsung diperbarui. Token bisa dicabut kapan saja dari halaman yang sama.

## Deploy ke Vercel

1. Buka https://vercel.com/new, impor repo `FachruDev/ryuartistry`. Framework (Next.js) dan Bun terdeteksi otomatis dari `bun.lock`; build command dan output tidak perlu diubah.
2. Sebelum klik **Deploy**, isi **Environment Variables**. Cara tercepat: tempel isi `.env` ke kolom pertama (Vercel memecahnya per baris), lalu sesuaikan:

   | Variable | Nilai di Vercel |
   | --- | --- |
   | `DATABASE_URL` | Sama dengan lokal, atau branch Neon khusus produksi |
   | `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` | Sama dengan lokal |
   | `BETTER_AUTH_SECRET` | Secret baru khusus produksi (`openssl rand -base64 32`) |
   | `BETTER_AUTH_URL`, `SITE_URL` | Hapus (jangan pakai `localhost`). Keduanya otomatis memakai domain produksi Vercel; isi hanya jika ingin memaksa domain tertentu |
   | `ADMIN_*` | Tidak perlu; hanya dipakai `bun run db:seed` di komputer lokal |

   `DATABASE_URL` wajib ada saat build, karena halaman publik di-prerender dari database.
3. Push ke `main` menghasilkan deploy produksi; push ke branch lain (misalnya `development`) menghasilkan preview.

Catatan:

- Region fungsi bawaan Vercel (`iad1`, Washington) sudah satu wilayah dengan database dan storage Neon (`us-east-1`).
- Upload media dibatasi 4 MB karena Vercel menolak request di atas 4,5 MB.
- Mengganti `BETTER_AUTH_SECRET` membuat sesi lama tidak berlaku, jadi admin perlu masuk lagi. Password tidak terpengaruh.
- Jika produksi memakai database yang sama dengan lokal, konten contoh dan akun admin ikut tampil. Hapus konten contoh dengan `bun run db:seed-demo --clean` bila sudah tidak diperlukan.
