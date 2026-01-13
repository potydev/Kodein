# Kodein

Platform pembelajaran coding interaktif dengan sistem kursus, quiz, forum, dan leaderboard.

## 🚀 Fitur Utama

- **Sistem Autentikasi** - Login dan registrasi pengguna
- **Dashboard** - Halaman utama untuk melihat progress pembelajaran
- **Kursus & Pelajaran** - Materi pembelajaran terstruktur dengan editor code
- **Quiz Interaktif** - Latihan coding dengan sistem penilaian
- **Forum Diskusi** - Komunitas untuk berdiskusi dan bertanya
- **Leaderboard** - Peringkat pengguna berdasarkan XP
- **Sistem XP** - Poin pengalaman untuk setiap aktivitas
- **Panel Admin** - Manajemen konten dan pengguna

## 🛠️ Teknologi

- **Frontend Framework**: React 18 dengan TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Routing**: React Router DOM
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Form Handling**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React

## 📦 Instalasi

### Prasyarat

- Node.js (versi 18 atau lebih baru)
- npm atau yarn
- Akun Supabase (untuk backend)

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd Kodein
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   - Copy file `.env.example` menjadi `.env`
   ```bash
   cp .env.example .env
   ```
   - Buka file `.env` dan isi dengan nilai dari Supabase project Anda
   - Dapatkan nilai-nilai ini dari [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api)

4. **Setup Supabase**
   - Buat project baru di [Supabase](https://supabase.com)
   - Jalankan migration files yang ada di folder `supabase/migrations/`

5. **Jalankan development server**
   ```bash
   npm run dev
   ```

6. **Buka browser**
   - Aplikasi akan berjalan di `http://localhost:5173`

## 📜 Scripts

- `npm run dev` - Menjalankan development server
- `npm run build` - Build untuk production
- `npm run build:dev` - Build untuk development
- `npm run preview` - Preview build production
- `npm run lint` - Menjalankan ESLint

## 📁 Struktur Project

```
Kodein/
├── src/
│   ├── components/      # Komponen UI reusable
│   │   ├── ui/          # shadcn/ui components
│   │   └── layout/      # Layout components
│   ├── contexts/        # React contexts (Auth, dll)
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # Integrasi eksternal (Supabase)
│   ├── lib/             # Utility functions
│   ├── pages/           # Halaman aplikasi
│   └── main.tsx         # Entry point
├── supabase/
│   └── migrations/      # Database migrations
└── public/              # Static assets
```

## 🔧 Konfigurasi

### Environment Variables

Copy file `.env.example` menjadi `.env` dan isi dengan nilai yang sesuai:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_public_key
```

**Penting**: File `.env` sudah di-ignore oleh Git dan tidak akan ter-commit ke repository. Jangan pernah commit file `.env` yang berisi credentials asli!

### Supabase Setup

1. Jalankan semua migration files secara berurutan:
   - `20250108000000_add_admin_role.sql`
   - `20250108010000_add_xp_function.sql`
   - Migration lainnya sesuai kebutuhan

2. Setup Row Level Security (RLS) policies sesuai kebutuhan aplikasi

## 🚀 Deployment

### Deploy ke Dockploy

**Ya, aplikasi bisa jalan di Dockploy meskipun `.env` tidak ada di GitHub!** Dockploy memungkinkan Anda menambahkan environment variables melalui dashboard mereka.

#### Langkah-langkah Deployment:

1. **Connect Repository ke Dockploy**
   - Login ke [Dockploy](https://dockploy.com)
   - Buat aplikasi baru (klik **"New Application"** atau **"Create Service"**)
   - Connect ke repository GitHub: `potydev/Kodein`
   - Pilih branch: `main`

2. **Setup Build Configuration**
   
   **📍 Lokasi:** Setelah connect repository, Anda akan melihat form konfigurasi aplikasi. Cari tab **"Environment Variables"** atau **"Build Settings"**.
   
   **Opsi A: Menggunakan Environment Variables (Nixpacks/Railpack - Default)**
   
   📍 **Di mana?** Buka tab **"Environment Variables"** di halaman konfigurasi aplikasi, lalu tambahkan:
   
   | Variable Name | Value | Keterangan |
   |--------------|-------|------------|
   | `NIXPACKS_BUILD_CMD` | `npm run build` | Command untuk build aplikasi |
   | `NIXPACKS_START_CMD` | `npx serve -s dist -l 3000` | Command untuk start aplikasi (serve static files) |
   | `NIXPACKS_INSTALL_CMD` | `npm install` | Command untuk install dependencies (biasanya otomatis) |
   
   **Catatan:** Jika `serve` tidak tersedia, gunakan alternatif:
   - `npx http-server dist -p 3000 -a 0.0.0.0`
   - Atau install dulu: `npm install -g serve` lalu `serve -s dist -l 3000`
   
   **Opsi B: Menggunakan Dockerfile** ⭐ **REKOMENDASI**
   
   📍 **Di mana?** Di halaman konfigurasi aplikasi, cari opsi **"Build Type"** atau **"Build Method"**, pilih **"Dockerfile"**
   
   **Keuntungan:**
   - ✅ Tidak perlu set build command manual
   - ✅ Port sudah diatur (port 3000)
   - ✅ Nginx sudah dikonfigurasi untuk SPA routing (React Router)
   - ✅ Optimized untuk production
   - ✅ Static files di-cache dengan benar
   
   **Catatan:** Environment variables tetap perlu di-set (lihat langkah 3) karena Vite memerlukan env vars saat **build time**.

3. **Setup Environment Variables** ⚠️ **PENTING - WAJIB!**
   
   📍 **Di mana?** Di tab **"Environment Variables"** di dashboard Dockploy, tambahkan environment variables berikut:
   
   | Variable Name | Value | Keterangan |
   |--------------|-------|------------|
   | `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | URL dari Supabase Dashboard |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGc...` | Anon/Public Key dari Supabase |
   
   **⚠️ Penting untuk Dockerfile:**
   - Environment variables ini **WAJIB** di-set karena Vite memerlukan env vars saat **build time**
   - Dockploy akan otomatis meng-inject env vars ke Dockerfile saat build
   - Tanpa env vars ini, build akan berhasil tapi aplikasi tidak bisa connect ke Supabase
   
   **Cara mendapatkan nilai:**
   - Buka [Supabase Dashboard](https://supabase.com/dashboard)
   - Pilih project Anda
   - Pergi ke **Settings** → **API**
   - Copy **Project URL** untuk `VITE_SUPABASE_URL`
   - Copy **anon public** key untuk `VITE_SUPABASE_PUBLISHABLE_KEY`

4. **Setup Port (jika diperlukan)**
   - Vite build menghasilkan static files di folder `dist`
   - Jika menggunakan `NIXPACKS_START_CMD`, set port di command (contoh: `-l 3000`)
   - Jika menggunakan Dockerfile, port sudah di-set di Dockerfile (port 3000)
   - **Catatan:** Pastikan port 3000 tidak digunakan oleh aplikasi lain di server

5. **Deploy**
   - Klik "Deploy" atau "Save & Deploy"
   - Tunggu build process selesai
   - Aplikasi akan otomatis ter-deploy

#### Catatan Penting:

- ✅ **Environment variables di Dockploy aman** - tidak akan ter-expose di repository
- ✅ **File `.env` tidak perlu di-commit** - ini adalah praktik yang benar
- ✅ **Setiap perubahan environment variables** memerlukan re-deploy aplikasi
- ⚠️ **Jangan pernah commit file `.env`** yang berisi credentials asli ke GitHub

#### Troubleshooting:

- **Build gagal?** Pastikan Node.js version di Dockploy adalah 18+
- **Environment variables tidak terbaca?** Pastikan nama variable dimulai dengan `VITE_` (karena ini Vite project)
- **Aplikasi error saat runtime?** Cek console logs di Dockploy untuk melihat error message
- **Layar putih setelah deploy?** ⚠️ **PALING UMUM!** 
  - Ini biasanya karena environment variables tidak ter-set saat build time
  - Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` sudah di-set di Dockploy **SEBELUM** build
  - Setelah menambahkan env vars, **REBUILD** aplikasi
  - Buka browser console (F12) untuk melihat error message
  - Lihat [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) untuk panduan lengkap

## 🎯 Fitur Detail

### Sistem XP
- Mendapat XP dari menyelesaikan quiz
- Mendapat XP dari aktivitas forum
- XP ditampilkan di dashboard dan leaderboard

### Admin Panel
- Manajemen konten kursus
- Manajemen pengguna
- Monitoring aktivitas sistem

### Code Editor
- Editor code terintegrasi untuk latihan coding
- Syntax highlighting
- Real-time feedback

## 📝 Dokumentasi Tambahan

- `ADMIN_SETUP.md` - Panduan setup admin
- `DEBUG_ADMIN.md` - Debugging untuk admin
- `FIX_XP.md` - Dokumentasi perbaikan sistem XP
- `SECURITY_LOGGING.md` - Dokumentasi security dan logging
- `XP_DEBUG.md` - Debugging sistem XP

## 🤝 Kontribusi

1. Fork repository
2. Buat branch untuk fitur baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 Lisensi

Proyek ini adalah proyek pribadi.

## 👨‍💻 Pengembangan

Untuk development lebih lanjut, lihat dokumentasi:
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
