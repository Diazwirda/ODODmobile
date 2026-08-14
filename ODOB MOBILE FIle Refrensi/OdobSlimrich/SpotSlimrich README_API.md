# 📚 Dokumentasi Lengkap API - Spot Slimrich

**Base URL Production:** `https://spot.slimrich.id/api`  
**Base URL Development:** `http://localhost:8000/api`

Selamat datang! Ini adalah ringkasan lengkap dokumentasi API untuk integrasi mobile app.

---

## 📖 File Dokumentasi yang Tersedia

### 1. **API_DOCUMENTATION.md** ⭐⭐⭐ (BACA INI DULU!)
**Isi:** Dokumentasi API lengkap 50+ endpoints
- ✅ Request & Response examples
- ✅ Validation rules
- ✅ Error handling
- ✅ Authentication flow
- ✅ File upload guidelines

**Kapan baca:** Pertama kali, untuk memahami semua endpoint

---

### 2. **API_SUMMARY.md** (Quick Reference)
**Isi:** Ringkasan cepat dalam bentuk tabel
- ✅ List semua endpoints
- ✅ Integration flow
- ✅ Best practices
- ✅ Checklist implementasi

**Kapan baca:** Saat development, sebagai cheat sheet

---

### 3. **DATABASE_SCHEMA.md**
**Isi:** Struktur database lengkap
- ✅ Schema semua tabel
- ✅ Relationships
- ✅ Query examples
- ✅ Performance tips

**Kapan baca:** Jika perlu memahami database structure

---

### 4. **CODE_EXAMPLES.md** ⭐⭐
**Isi:** Code examples siap pakai
- ✅ Flutter examples (Dart)
- ✅ React Native examples (JavaScript)
- ✅ API service setup
- ✅ Screen examples

**Kapan baca:** Saat mulai coding, copy-paste examples

---

### 5. **MOBILE_APP_INTEGRATION.md**
**Isi:** Panduan lengkap integrasi mobile
- ✅ Architecture overview
- ✅ Features checklist
- ✅ Development roadmap
- ✅ Best practices
- ✅ FAQ

**Kapan baca:** Sebelum memulai project

---

### 6. **POSTMAN_COLLECTION.json**
**Isi:** Collection untuk testing di Postman
- ✅ Semua endpoints
- ✅ Auto-save token
- ✅ Environment variables

**Kapan pakai:** Testing API sebelum implementasi

---

### 7. **API_CONFIG.md** ⭐
**Isi:** Konfigurasi environment & domain
- ✅ Production URL: https://spot.slimrich.id/api
- ✅ Development URL: http://localhost:8000/api
- ✅ Mobile app configuration examples
- ✅ Environment variables setup

**Kapan baca:** Setup awal project

---

## 🚀 Quick Start (3 Langkah)

### Langkah 1: Setup Backend
```bash
# Install dependencies
composer install

# Setup environment
cp .env.example .env
php artisan key:generate

# Configure database di .env
DB_DATABASE=spotting_db
DB_USERNAME=root
DB_PASSWORD=your_password

# Run migrations
php artisan migrate

# Start server
php artisan serve
```

### Langkah 2: Test API
```bash
# Import POSTMAN_COLLECTION.json ke Postman
# Atau test dengan curl:

curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@humanplus.co.id","password":"password123"}'
```

### Langkah 3: Build Mobile App
1. Baca **API_DOCUMENTATION.md**
2. Copy code dari **CODE_EXAMPLES.md**
3. Implementasi fitur sesuai **MOBILE_APP_INTEGRATION.md**

---

## 🎯 Konsep Penting

### 1. Multi-Company/Multi-Room
```
User bisa join ke BANYAK perusahaan (rooms)
→ Setiap request perlu header: X-Room-Id: {room_id}
→ Data ter-isolasi per room
→ User bisa jadi admin di room A, member di room B
```

### 2. Role System
```
Global Role (users.role):
- admin
- reporter

Room Role (room_members.role):
- admin (bisa approve/reject violations)
- member (hanya bisa create violations)
```

### 3. Spot Slimrich vs OdobDaily
```
                  Spot Slimrich    |    OdobDaily
Department:       From Slimrich API |   Manual creation
Flexibility:      Medium           |    High
Use Case:         Slimrich clients |    Any company
API Integration:  Required         |    Optional
Database:         ✅ SAME          |    ✅ SAME
```

**Kesimpulan:** Database dan API sama, hanya logic department yang beda!

---

## 📋 Endpoint Categories

### Authentication (5 endpoints)
- Register, Login, Get User, Refresh, Logout

### Room Management (8 endpoints)
- List, Create, Join, Update, Delete, Leave, Remove Member, Add Admin

### Dashboard (2 endpoints)
- Leaderboard (with filters), Statistics

### Rules (6 endpoints)
- List, Create, Update, Delete, List Deleted, Restore

### Violations (5 endpoints)
- Get Users, List All, My Reports, Create, Update Status

### Departments (4 endpoints)
- List, Create, Delete, Slimrich Departments (public)

### Profile (4 endpoints)
- Get, Update, Update Photo, Delete Photo

### Admin (8 endpoints)
- Users List, Update User, Add Points, Pending Reports, History, Summary, Export Excel, Export PDF

### Tutorial (1 endpoint)
- Complete Tutorial

**Total: 43 endpoints**

---

## 🔐 Authentication Flow

```
1. POST /auth/login
   → Response: { token, user }

2. Save token securely
   → iOS: Keychain
   → Android: Keystore / EncryptedSharedPreferences

3. All requests:
   → Header: Authorization: Bearer {token}
   → Header: X-Room-Id: {room_id} (jika perlu)

4. Token expired (401)
   → Clear token
   → Redirect to login

5. Refresh token before expiry (7 days)
   → POST /auth/refresh
```

---

## 📱 Minimum Features untuk MVP

### Reporter Features
✅ Login / Register  
✅ Join / Create Room  
✅ View Leaderboard  
✅ Create Violation (Spotting)  
✅ View My Reports  
✅ Profile Management  

### Admin Features  
✅ Approve / Reject Violations  
✅ Manage Rules  
✅ View Statistics  

---

## 🔧 Development Tools

### Required Dependencies

**Flutter:**
```yaml
dependencies:
  dio: ^5.0.0
  flutter_secure_storage: ^9.0.0
  image_picker: ^1.0.0
  flutter_image_compress: ^2.0.0
  cached_network_image: ^3.2.0
```

**React Native:**
```json
{
  "axios": "^1.6.0",
  "@react-native-async-storage/async-storage": "^1.19.0",
  "react-native-image-picker": "^7.0.0",
  "react-native-image-resizer": "^3.0.0"
}
```

---

## ⚠️ Hal Penting yang Harus Diperhatikan

### 1. Email Validation
❌ **SALAH:** `user@gmail.com`  
✅ **BENAR:** `user@humanplus.co.id`

### 2. Room Context
❌ **SALAH:** Tidak kirim X-Room-Id  
✅ **BENAR:** Selalu kirim X-Room-Id untuk endpoint yang perlu

### 3. File Upload
❌ **SALAH:** Upload file 10MB  
✅ **BENAR:** Compress dulu, max 5MB per foto

### 4. Multiple Violators
❌ **SALAH:** `violator_ids: [1, 2]`  
✅ **BENAR:** `violator_ids[]: 1, violator_ids[]: 2`

### 5. Token Storage
❌ **SALAH:** SharedPreferences / AsyncStorage plain  
✅ **BENAR:** Secure storage (Keychain/Keystore)

---

## 🐛 Troubleshooting

### Error 401 - Unauthorized
**Penyebab:** Token invalid/expired  
**Solusi:** Clear token, redirect ke login

### Error 403 - Forbidden
**Penyebab:** User bukan member room atau bukan admin  
**Solusi:** Check room membership, show error message

### Error 422 - Validation Error
**Penyebab:** Input tidak valid  
**Solusi:** Show field-specific errors dari response.errors

### Error 502 - Bad Gateway
**Penyebab:** Slimrich API tidak bisa diakses  
**Solusi:** Show "Coba lagi nanti", fallback ke local auth

### Upload Gagal
**Penyebab:** File terlalu besar atau format salah  
**Solusi:** Compress image, validate format (jpg, png, webp)

---

## 📞 Bantuan & Support

**Pertanyaan Teknis:**
- Baca **API_DOCUMENTATION.md** untuk detail endpoint
- Lihat **CODE_EXAMPLES.md** untuk contoh implementasi
- Check **FAQ** di MOBILE_APP_INTEGRATION.md

**Issue dengan Backend:**
- Check server logs: `php artisan log:clear && tail -f storage/logs/laravel.log`
- Test endpoint dengan Postman
- Validate database connection

**Contact:**
- Email: support@humanplus.co.id
- API Version: 1.0

---

## ✅ Final Checklist Sebelum Launch

### Backend
- [ ] Database migrations completed
- [ ] .env configured properly
- [ ] Server running stable
- [ ] API tested dengan Postman
- [ ] Error handling working
- [ ] File uploads working

### Mobile App
- [ ] Authentication flow working
- [ ] Token storage secure
- [ ] Room selection working
- [ ] Create violation working
- [ ] Leaderboard showing correctly
- [ ] Error messages user-friendly
- [ ] Image compression working
- [ ] Offline handling (optional)

### Testing
- [ ] Test sebagai reporter
- [ ] Test sebagai admin
- [ ] Test multi-room switching
- [ ] Test file upload
- [ ] Test network errors
- [ ] Test token expiry
- [ ] Test validation errors

---

## 🎉 Siap untuk Development!

**Urutan Baca Dokumentasi:**
1. **README_API.md** (file ini) ← You are here!
2. **API_DOCUMENTATION.md** ← Read this next
3. **CODE_EXAMPLES.md** ← When coding
4. **API_SUMMARY.md** ← As reference
5. **MOBILE_APP_INTEGRATION.md** ← For architecture

**Start Coding:**
1. Setup backend (10 menit)
2. Test API dengan Postman (30 menit)
3. Copy code examples (1 jam)
4. Customize & implement (development time)

**Good luck! 🚀**

---

## 📄 File Summary

| File | Size | Purpose |
|------|------|---------|
| README_API.md | This file | Overview & quick start |
| API_CONFIG.md | ~300 lines | Environment & domain config ⭐ |
| API_DOCUMENTATION.md | ~1500 lines | Complete API reference |
| API_SUMMARY.md | ~400 lines | Quick reference tables |
| DATABASE_SCHEMA.md | ~500 lines | Database structure |
| CODE_EXAMPLES.md | ~800 lines | Ready-to-use code |
| MOBILE_APP_INTEGRATION.md | ~600 lines | Integration guide |
| POSTMAN_COLLECTION.json | JSON | API testing |

**Total Documentation: ~4100 lines + code examples**

Semua yang Anda butuhkan untuk membangun mobile app sudah tersedia! 🎊

