# Troubleshooting Deployment

## Masalah: Layar Putih Setelah Deploy

### Gejala
- Aplikasi berhasil di-deploy
- Nginx berjalan dengan baik (status 200)
- File CSS dan JS berhasil di-load
- Tapi layar hanya menampilkan putih

### Penyebab Utama

**Environment Variables tidak ter-set saat build time!**

Vite memerlukan environment variables yang dimulai dengan `VITE_` saat **build time**, bukan runtime. Jika env vars tidak ter-set, aplikasi akan throw error dan tidak bisa render.

### Solusi

#### 1. Pastikan Environment Variables Sudah Di-Set di Dockploy

Di dashboard Dockploy, pastikan Anda sudah menambahkan:

| Variable Name | Value |
|--------------|-------|
| `VITE_SUPABASE_URL` | URL Supabase Anda |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Key Supabase Anda |

**📍 Lokasi:** Tab **"Environment Variables"** di halaman konfigurasi aplikasi

#### 2. Pastikan Build Type Menggunakan Dockerfile

- Pilih **"Dockerfile"** sebagai build type
- Dockerfile sudah dikonfigurasi untuk menerima env vars sebagai build arguments

#### 3. Rebuild Aplikasi

Setelah menambahkan/mengubah environment variables:
1. Klik **"Rebuild"** atau **"Redeploy"** di Dockploy
2. Tunggu build process selesai
3. Pastikan tidak ada error di build logs

#### 4. Verifikasi di Browser Console

Buka browser console (F12) dan cek apakah ada error:
- Jika ada error: `Missing Supabase environment variables` → env vars tidak ter-set
- Jika ada error lain, catat error message tersebut

### Cara Cek Environment Variables

#### Di Dockploy:
1. Buka halaman aplikasi di Dockploy
2. Cari tab **"Environment Variables"**
3. Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` sudah ada dan terisi

#### Di Build Logs:
Saat build, cek apakah ada warning tentang missing env vars. Jika ada, berarti env vars tidak ter-pass ke build process.

### Alternatif: Cek Build Logs

Di Dockploy, buka **"Build Logs"** dan cari:
- `Missing Supabase environment variables` → env vars tidak ter-set
- `VITE_SUPABASE_URL is undefined` → env vars tidak ter-inject

### ⚠️ Masalah: Environment Variables Tidak Ter-Inject Meskipun Sudah Di-Set

**Gejala:**
- Environment variables sudah di-set di Dokploy
- Build berhasil tanpa error
- Tapi aplikasi masih error: `Missing Supabase environment variables`

**Penyebab:**
Dokploy **TIDAK otomatis** mengirim environment variables sebagai **build arguments** ke Dockerfile. Dockerfile memerlukan env vars sebagai build arguments (`--build-arg`) saat build, dan ini harus di-set manual di Dokploy.

**Solusi: ⭐ WAJIB DILAKUKAN!**

#### Langkah 1: Isi Build-time Arguments di Dokploy

1. **Buka halaman aplikasi di Dokploy**
2. **Cari bagian "Build-time Arguments"** (biasanya di tab konfigurasi atau build settings)
3. **Tambahkan build arguments berikut:**

   | Key | Value |
   |-----|-------|
   | `VITE_SUPABASE_URL` | (Copy value dari Environment Variables) |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | (Copy value dari Environment Variables) |
   | `VITE_SUPABASE_PROJECT_ID` | (Copy value dari Environment Variables) |

   **📍 Catatan Penting:**
   - Value harus **sama persis** dengan value di Environment Variables
   - Copy-paste value dari Environment Variables ke Build-time Arguments
   - Pastikan tidak ada spasi atau karakter tambahan

4. **Simpan konfigurasi**

#### Langkah 2: Rebuild Aplikasi

Setelah mengisi Build-time Arguments:
1. Klik **"Rebuild"** atau **"Redeploy"** di Dokploy
2. Tunggu build process selesai
3. Cek build logs untuk memastikan build arguments ter-inject

#### Langkah 3: Verifikasi di Build Logs

Di build logs Dokploy, cari baris yang menunjukkan build command:
```
docker build --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Jika ada `--build-arg` untuk env vars, berarti sudah benar!

#### Langkah 4: Verifikasi di Browser

Setelah rebuild selesai:
1. Buka aplikasi di browser
2. Tekan F12 untuk buka Developer Tools
3. Cek tab **Console**
4. Jika error `Missing Supabase environment variables` hilang, berarti sudah berhasil! ✅

### Jika Masih Tidak Jalan

1. **Cek Browser Console (F12)**
   - Buka `https://kodein.potydev.cloud`
   - Tekan F12 untuk buka Developer Tools
   - Lihat tab **Console** untuk error messages
   - Screenshot error dan kirim ke support

2. **Cek Network Tab**
   - Di Developer Tools, buka tab **Network**
   - Refresh halaman
   - Cek apakah ada request yang gagal (status merah)
   - Cek apakah file JavaScript berhasil di-load

3. **Test Environment Variables**
   - Buka browser console
   - Ketik: `console.log(window)` untuk cek apakah ada env vars di window object
   - Atau cek source code yang di-build untuk melihat apakah env vars sudah ter-inject

4. **Rebuild dari Scratch**
   - Hapus aplikasi di Dockploy
   - Buat aplikasi baru
   - Pastikan env vars di-set **SEBELUM** build pertama kali
   - Deploy ulang

## Masalah Lainnya

### Build Gagal
- Pastikan Node.js version adalah 18+
- Pastikan semua dependencies ter-install dengan benar
- Cek build logs untuk error message spesifik

### Port Conflict
- Pastikan port 3000 tidak digunakan oleh aplikasi lain
- Atau ganti port di `Dockerfile` dan `nginx.conf`

### Nginx Error
- Cek nginx logs di Dockploy
- Pastikan `nginx.conf` sudah benar
- Pastikan file `dist` sudah ter-copy dengan benar


