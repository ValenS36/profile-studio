# Profile Studio

Fondasi website profil pribadi: Laravel 12, Inertia 2, React 19, TypeScript, Tailwind CSS 4, Motion, MySQL. Nama dan konten awal merupakan placeholder. Skeleton Laravel resmi cabang 12.x; aplikasi khusus ditambahkan di atasnya.

## Persyaratan

- PHP 8.2+ dengan extension Laravel, pdo_mysql, fileinfo, mbstring, XML, cURL, ZIP. Untuk test: pdo_sqlite dan GD.
- Composer 2, Node.js 22+, npm, MySQL 8+.
- Windows: gunakan lingkungan PHP seperti Laravel Herd atau Laragon, dan sediakan MySQL.

## Instalasi lokal

Ekstrak ZIP, buka terminal di folder `profile-studio`, lalu:

```sh
composer install
```

Salin `.env.example` menjadi `.env` (Windows PowerShell: `Copy-Item .env.example .env`; macOS/Linux: `cp .env.example .env`). Buat database MySQL bernama `profile_studio`, sesuaikan DB_USERNAME/DB_PASSWORD di `.env`.

```sh
php artisan key:generate
php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
```

Salin token acak hasil perintah kedua ke `OWNER_SETUP_TOKEN` di `.env`. Jangan membagikannya. Lanjutkan:

```sh
php artisan migrate
php artisan storage:link
npm ci
npm run build
php artisan serve
```

Buka `http://localhost:8000/register`, buat akun dengan token setup dan password minimal 12 karakter. Registrasi otomatis ditutup setelah akun dibuat. Hapus nilai OWNER_SETUP_TOKEN setelah selesai. Tidak ada akun atau password default. Jika konfigurasi di-cache, jalankan `php artisan config:clear` setelah mengubah .env.

Untuk pengembangan dengan hot reload, jalankan `composer run dev` (setelah menghentikan server sebelumnya). Untuk memakai build statis lokal, cukup `php artisan serve` sesudah `npm run build`.

## Alur pemakaian

1. Login dan buka `/dashboard`.
2. Edit profil, upload aset, atur tautan, dan lihat live preview.
3. Klik **Simpan draf**. Tunggu upload selesai.
4. Klik **Publikasikan draf**. Profil publik berada di `/`.
5. Pengunjung melihat halaman coming-soon sampai publikasi pertama.

## Isi proyek

- `routes/web.php`: route publik, autentikasi, editor, publikasi.
- `app/Http/Controllers/AuthController.php`: login/logout dan pendaftaran pemilik melalui token.
- `app/Http/Controllers/ProfileController.php`: validasi, upload, draf dan publikasi.
- `app/Models/Profile.php`: konfigurasi default dan JSON casts.
- `database/migrations/2026_10_26_000001_create_profiles_table.php`: record tunggal profil dan snapshot publik.
- `resources/js/pages/`: Auth, Dashboard, PublicProfile.
- `resources/js/components/ProfileCard.tsx`: komponen bersama preview dan profil publik.
- `resources/js/components/ui/button.tsx`: komponen tombol bergaya shadcn, Radix Slot dan CVA.
- `resources/css/app.css`: tema responsif gelap dengan aksen ungu.
- `tests/Feature/ProfileStudioTest.php`: pengujian akses, registrasi, login, upload dan publikasi.

## Sudah diimplementasikan di source

- Registrasi satu pemilik, token setup, pembatasan percobaan login, session regeneration dan logout.
- Avatar, nama, bio, quote, background warna/gambar/video.
- Satu audio, judul lagu, player native dengan volume dan loop.
- Tambah/hapus/urutkan tautan melalui tombol naik-turun; hanya HTTP(S).
- Warna aksen, opacity, blur, radius, glow kartu dan animasi masuk.
- Preview desktop/mobile, draf, publikasi dan coming-soon.
- Pemeriksaan kepemilikan di server; draf tidak dikirim ke halaman publik.

## Batas tahap pertama

- Belum ada crop avatar, hapus aset, cover musik, drag-and-drop, ikon merek, cursor/partikel, quote typewriter, background mobile khusus, ganti/lupa password, dan analytics.
- Tidak ada layar pembuka atau autoplay audio; pengunjung menggunakan tombol play.
- Peringatan perubahan belum disimpan melindungi refresh/tutup tab; logout memakai konfirmasi.
- Preview mobile mensimulasikan lebar, bukan emulator perangkat.
- Media menggunakan public disk: siapa pun yang mengetahui URL aset dapat membukanya, termasuk aset draf. JSON draf hanya untuk pemilik; ini bukan penyimpanan media rahasia.
- Aset lama tetap disimpan agar snapshot publik tidak rusak ketika draf mengganti media. Pembersihan aset tak terpakai belum dibuat.
- Tidak ada SSR React/metadata sosial khusus dalam tahap ini.
- Tidak ada backend terpisah atau Supabase; hanya Laravel dan database/storage sendiri.

## Pemeriksaan

```sh
npm run typecheck
npm run build
php artisan test
```

Status pemeriksaan lingkungan pembuatan tercatat di `VERIFICATION.md`. Jalankan test backend setelah dependency terpasang. `vendor/`, `node_modules/`, `.env`, data pengguna dan media tidak disertakan. `package-lock.json` disertakan; Composer lock belum tersedia karena Composer/PHP tidak tersedia saat pembuatan.

## Sebelum deployment

Gunakan hosting PHP dengan disk persisten dan document root `public/`. Pasang HTTPS; atur `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` domain, dan `SESSION_SECURE_COOKIE=true`. Jalankan build aset, migration, storage link, kemudian `php artisan config:cache`. Jangan mengekspos root proyek atau .env. Siapkan backup database dan storage.

Upload aplikasi: avatar 5 MB, background 25 MB, audio 10 MB. Sesuaikan `upload_max_filesize` minimal 25M, `post_max_size` minimal 48M, dan batas web server agar upload beberapa file dalam satu request tidak terpotong.

## Password recovery

Login now includes **Lupa password?**. Reset links expire after 60 minutes and can only be used once. New passwords require at least 12 characters and matching confirmation. Requests use a generic response and are rate limited.

The existing `password_reset_tokens` migration is used; run `php artisan migrate --force` when deploying if migrations are pending. Configure `APP_URL` with the actual HTTPS domain and configure `MAIL_MAILER=smtp`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_SCHEME`, and `MAIL_FROM_ADDRESS` for your mail provider in the server environment. Then run `php artisan config:clear` (or rebuild the production config cache). Never commit SMTP credentials.

The default `MAIL_MAILER=log` is for local development: reset emails appear in `storage/logs/laravel.log` and are **not delivered to an inbox**. Verify actual delivery with your provider before enabling recovery in production.

## Username effects

Glitch uses sliced pink/cyan layers and accent-colored glow; rainbow uses a flowing multicolor gradient; typewriter loops with grapheme-aware typing and reserved layout space. All three respect reduced motion. Preview them from the dashboard on desktop/mobile and publish to apply the selected effect to the public profile.
