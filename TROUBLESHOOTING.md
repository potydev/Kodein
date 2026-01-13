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
Dokploy mungkin tidak otomatis mengirim environment variables sebagai **build arguments** ke Dockerfile. Dockerfile memerlukan env vars sebagai build arguments (`--build-arg`) saat build.

**Solusi:**

1. **Pastikan Dokploy Mengirim Env Vars sebagai Build Arguments**
   
   Di Dokploy, cek apakah ada opsi untuk mengirim env vars sebagai build arguments. Beberapa platform deployment memerlukan konfigurasi khusus:
   
   - Cari opsi **"Build Arguments"** atau **"Docker Build Args"** di halaman konfigurasi
   - Atau pastikan Dokploy otomatis mengirim semua env vars yang dimulai dengan `VITE_` sebagai build args
   
2. **Cek Build Logs untuk Build Arguments**
   
   Di build logs Dokploy, cari baris yang menunjukkan build command:
   ```
   docker build --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=...
   ```
   
   Jika tidak ada `--build-arg` untuk env vars, berarti Dokploy tidak mengirim sebagai build args.

3. **Alternatif: Konfigurasi Manual Build Arguments (jika Dokploy support)**
   
   Jika Dokploy memiliki opsi untuk set build arguments manual, tambahkan:
   - `VITE_SUPABASE_URL` = (value dari env vars)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = (value dari env vars)
   - `VITE_SUPABASE_PROJECT_ID` = (value dari env vars)

4. **Kontak Support Dokploy**
   
   Jika Dokploy tidak otomatis mengirim env vars sebagai build args, kontak support Dokploy untuk:
   - Memastikan env vars yang dimulai dengan `VITE_` otomatis dikirim sebagai build args
   - Atau minta panduan cara mengirim build args manual

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


