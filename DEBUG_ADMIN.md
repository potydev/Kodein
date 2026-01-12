# Debug Admin Access

Jika Anda sudah menjadi admin tapi tidak bisa akses halaman admin, ikuti langkah berikut:

## 1. Cek Role di Database

Jalankan query ini di Supabase SQL Editor:

```sql
-- Cek role user Anda
SELECT id, email, role FROM auth.users 
WHERE email = 'email_anda@example.com';

-- Cek role di profiles
SELECT p.id, p.username, p.role, u.email 
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'email_anda@example.com';
```

## 2. Set Role Manual (Jika Perlu)

Jika role belum 'admin', jalankan:

```sql
-- Set role menjadi admin (ganti USER_ID dengan ID user Anda)
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'USER_ID';

-- Atau berdasarkan email
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'email_anda@example.com'
);
```

## 3. Cek di Browser Console

Buka browser console (F12) dan ketik:

```javascript
// Cek role di localStorage
localStorage.getItem('sb-vebkgklyipnfzksloynq-auth-token')

// Atau cek di console aplikasi
// Lihat log "Admin check - role: ..."
```

## 4. Clear Cache dan Reload

1. Clear localStorage: `localStorage.clear()`
2. Reload halaman
3. Login lagi

## 5. Verifikasi Migration

Pastikan migration sudah dijalankan:

```sql
-- Cek apakah kolom role ada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';
```

Jika kolom tidak ada, jalankan migration:
`supabase/migrations/20250108000000_add_admin_role.sql`

