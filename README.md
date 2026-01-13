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

Aplikasi ini menggunakan Vite yang memerlukan environment variables saat **build time**. Untuk deployment:

### Build untuk Production

```bash
npm run build
```

Build akan menghasilkan folder `dist` yang berisi static files siap deploy.

### Environment Variables untuk Production

Pastikan environment variables berikut tersedia saat build:
- `VITE_SUPABASE_URL` - URL Supabase project
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Anon/Public key dari Supabase

**Catatan Penting:**
- Vite memerlukan env vars yang dimulai dengan `VITE_` saat build time
- Jika menggunakan Dockerfile, pastikan env vars dikirim sebagai build arguments
- Jika menggunakan platform deployment (seperti Dokploy), pastikan Build-time Arguments diisi manual karena tidak otomatis ter-inject

### Deployment dengan Docker

Aplikasi sudah menyediakan `Dockerfile` untuk deployment dengan Docker. Dockerfile menggunakan multi-stage build dengan Nginx untuk serve static files.

**Catatan:** Pastikan environment variables dikirim sebagai build arguments saat build Docker image.

### Troubleshooting

Jika mengalami masalah deployment, lihat file [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) untuk panduan lengkap.

**Masalah umum:**
- **Layar putih setelah deploy** → Biasanya karena environment variables tidak ter-set saat build time
- **Error: "Missing Supabase environment variables"** → Pastikan Build-time Arguments sudah diisi (jika menggunakan Dockerfile)

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
