# Mobile App Integration Guide

## ⚠️ CRITICAL SECURITY WARNING

### ❌ JANGAN LAKUKAN INI:

1. **Jangan buka MySQL ke internet publik**
   - Mobile app tidak boleh koneksi langsung ke database
   - Alasan:
     - Database credentials akan terekspos di APK/IPA
     - Risiko SQL injection sangat tinggi
     - Tidak bisa kontrolakses per user
     - Tidak bisa audit trail
     - Tidak bisa rate limiting

2. **Jangan simpan database password di mobile app**
   - Reverse engineering APK/IPA sangat mudah
   - Tools: jadx, apktool, Hopper, IDA Pro

3. **Jangan percaya input dari mobile app**
   - Semua validasi harus di server
   - Mobile bisa di-tamper (jailbreak/root)

---

## ✅ Arsitektur yang Benar

### Diagram Arsitektur

```
┌─────────────┐
│ Mobile App  │
└──────┬──────┘
       │ HTTPS/REST API
       │ (JWT Token)
       ↓
┌─────────────────┐
│  OdobDaily API  │  ← Laravel Backend
│  (odobdaily.com)│
└────────┬────────┘
         │ Database Connection
         │ (Private Network)
         ↓
┌─────────────────┐
│  MySQL Database │  ← Railway/Cloud
│  (Private)      │
└─────────────────┘
```

### Layer Security

1. **Mobile App Layer**
   - Store JWT token only (tidak ada DB credentials)
   - Implement certificate pinning
   - Obfuscate code
   - Detect jailbreak/root

2. **API Layer** (sudah ada di OdobDaily)
   - JWT authentication
   - Role-based authorization
   - Input validation
   - Rate limiting
   - CORS policy

3. **Database Layer**
   - Private network only
   - Firewall rules: hanya API server yang bisa akses
   - Encrypted connection (SSL)
   - Regular backups

---

## 🔄 Integrasi OdobDaily + Spot.Slimrich

### Pilihan Arsitektur

#### **Opsi 1: Unified Database (Recommended)**

Gabungkan kedua aplikasi dalam 1 database dengan flag `source`:

```sql
-- Tambah kolom di rooms table
ALTER TABLE rooms ADD COLUMN source ENUM('odobdaily', 'spot_slimrich') DEFAULT 'odobdaily';
```

**Keuntungan:**
- Mobile app hanya perlu 1 endpoint
- Single authentication system
- User bisa akses semua company dalam 1 app
- Maintenance lebih mudah

**Cara Implementasi:**
1. Sync data Spot.Slimrich ke OdobDaily database (scheduled job)
2. Saat user login, fetch semua rooms (dari kedua source)
3. Mobile app group rooms by source di UI


**Kode Example (Sync Job):**
```php
// app/Console/Commands/SyncSlimrichRooms.php
public function handle()
{
    $response = Http::get('https://spot.slimrich.id/api/companies');
    $companies = $response->json();

    foreach ($companies as $company) {
        Room::updateOrCreate(
            ['external_id' => $company['id'], 'source' => 'spot_slimrich'],
            [
                'name' => $company['name'],
                'description' => $company['description'],
                // ... other fields
            ]
        );
    }
}
```

---

#### **Opsi 2: Multi-Endpoint**

Mobile app connect ke 2 API berbeda:

```dart
class ApiService {
  final odobApi = Dio(BaseOptions(baseUrl: 'https://odobdaily.com/api'));
  final slimrichApi = Dio(BaseOptions(baseUrl: 'https://spot.slimrich.id/api'));

  Future<List<Room>> getAllRooms() async {
    final odobRooms = await odobApi.get('/rooms');
    final slimrichRooms = await slimrichApi.get('/companies');
    
    return [...odobRooms.data, ...slimrichRooms.data];
  }
}
```

**Keuntungan:**
- Tidak perlu sync data
- Real-time data dari kedua app

**Kekurangan:**
- Kompleksitas lebih tinggi di mobile
- Perlu handle 2 authentication system
- User experience kurang smooth

---

#### **Opsi 3: API Gateway (Best for Scale)**

Buat middleware API yang handle routing:

```
Mobile App
    ↓
API Gateway (Node.js/Laravel)
    ├─→ OdobDaily API
    └─→ Spot.Slimrich API
```

**Keuntungan:**
- Single endpoint untuk mobile
- Bisa aggregate data dari multiple sources
- Bisa implement caching, rate limiting centralized
- Easy to add more sources di future

**Kekurangan:**
- Need extra infrastructure
- Additional latency

---

## 🔐 Security Best Practices

### 1. JWT Token Management

**Generate Token (sudah ada di AuthController):**
```php
private function tokenFor(User $user): string
{
    $now = now()->timestamp;
    return JwtService::make([
        'sub' => $user->id,
        'email' => $user->email,
        'role' => $user->role,
        'iat' => $now,
        'exp' => $now + (60 * 60 * 24 * 7), // 7 days
    ]);
}
```

**Mobile Storage:**
```dart
// Flutter example with flutter_secure_storage
final storage = FlutterSecureStorage();

// Save
await storage.write(key: 'jwt_token', value: token);

// Read
final token = await storage.read(key: 'jwt_token');

// Delete
await storage.delete(key: 'jwt_token');
```

**Token Refresh:**
```dart
// Before token expires (check exp claim)
if (isTokenExpiringSoon(token)) {
  final newToken = await api.post('/auth/refresh');
  await storage.write(key: 'jwt_token', value: newToken);
}
```

---

### 2. Certificate Pinning

Prevent man-in-the-middle attacks:

```dart
// Flutter example
import 'package:dio/dio.dart';
import 'package:dio/adapter.dart';

final dio = Dio();
(dio.httpClientAdapter as DefaultHttpClientAdapter).onHttpClientCreate = 
  (HttpClient client) {
    client.badCertificateCallback = 
      (X509Certificate cert, String host, int port) {
        // Pin certificate
        return cert.sha256.toUpperCase() == 
          'YOUR_CERT_SHA256_FINGERPRINT';
      };
    return client;
  };
```

---

### 3. Input Validation

Always validate on server (sudah ada), tapi tambahkan di mobile untuk UX:

```dart
// Mobile side (for UX only)
String? validateEmail(String? value) {
  if (value == null || value.isEmpty) {
    return 'Email required';
  }
  if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
    return 'Invalid email format';
  }
  return null;
}

// Server side MUST validate again (already in Laravel)
```

---

### 4. Handle Sensitive Data

**Photos/Files:**
```dart
// Compress before upload
final compressedFile = await FlutterImageCompress.compressAndGetFile(
  file.absolute.path,
  targetPath,
  quality: 70,
  maxWidth: 1920,
  maxHeight: 1920,
);

// Upload
final formData = FormData.fromMap({
  'photos[]': await MultipartFile.fromFile(compressedFile.path),
});
await dio.post('/violations', data: formData);
```

**Don't log sensitive data:**
```dart
// ❌ BAD
print('Token: $token');
print('Password: $password');

// ✅ GOOD
print('Login successful');
logger.info('User authenticated', extra: {'user_id': userId});
```

---

## 📊 Database Access Pattern

### ❌ WRONG (Direct Database Access)

```dart
// JANGAN LAKUKAN INI!
final connection = await MySqlConnection.connect(ConnectionSettings(
  host: 'railway.proxy.rlwy.net',
  port: 37950,
  user: 'root',
  password: 'MpbIzRKLxntGiexTAKddnfySBdQYeBzx', // ← EXPOSED!
  db: 'railway',
));

final results = await connection.query('SELECT * FROM users'); // ← SQL INJECTION!
```

**Masalah:**
1. Credentials hardcoded di app (bisa di-extract)
2. Tidak ada authorization (semua user bisa akses semua data)
3. SQL injection vulnerability
4. Tidak ada audit trail
5. Tidak bisa rate limiting
6. Database overload (setiap user = 1 connection)

---

### ✅ CORRECT (REST API Access)

```dart
// Mobile app
class ApiService {
  final Dio dio;
  
  Future<List<User>> getUsers(int roomId) async {
    final response = await dio.get(
      '/admin/users',
      options: Options(headers: {'X-Room-Id': roomId.toString()}),
    );
    return (response.data as List).map((json) => User.fromJson(json)).toList();
  }
}

// Backend validates permission, filters data, logs access
```

**Keuntungan:**
1. Credentials tidak pernah terekspos
2. Authorization per request
3. Input validation di server
4. Audit trail complete
5. Rate limiting
6. Connection pooling di server
7. Caching bisa di-implement

---

## 🧪 Testing API from Mobile

### Setup Postman/Insomnia

1. **Create Environment**
```json
{
  "base_url": "https://odobdaily.com/api",
  "token": "",
  "room_id": ""
}
```

2. **Pre-request Script (Postman)**
```javascript
// Auto set token from login response
if (pm.response.code === 200 && pm.response.json().token) {
  pm.environment.set("token", pm.response.json().token);
}
```

3. **Set Headers**
```
Authorization: Bearer {{token}}
X-Room-Id: {{room_id}}
Content-Type: application/json
```

---

## 🚀 Deployment Checklist

### Backend (OdobDaily API)

- [ ] Environment variables configured
  - [ ] `APP_URL=https://odobdaily.com`
  - [ ] `DB_HOST` tidak publik
  - [ ] `JWT_SECRET` random & strong
- [ ] SSL certificate valid
- [ ] CORS configured for mobile
- [ ] Rate limiting enabled
- [ ] Error logging configured (Sentry/Bugsnag)
- [ ] Database backup automated
- [ ] API monitoring (UptimeRobot/Pingdom)

### Mobile App

- [ ] Certificate pinning implemented
- [ ] Code obfuscation enabled
- [ ] Secure storage for tokens
- [ ] Jailbreak/root detection
- [ ] API timeout handling
- [ ] Offline mode (optional)
- [ ] Crash reporting (Firebase Crashlytics)
- [ ] Analytics (Firebase/Mixpanel)

### Database

- [ ] Access restricted to API server IP only
- [ ] SSL/TLS enabled
- [ ] Regular backups (automated)
- [ ] Monitoring alerts configured
- [ ] Slow query log enabled

---

## 📱 Mobile App Features

### Must-Have Features

1. **Authentication**
   - Email/Password login
   - Google OAuth
   - Biometric login (after first login)
   - Remember me
   - Logout

2. **Company Management**
   - List all companies user joined
   - Switch between companies
   - Join company by code
   - Create new company (if allowed)
   - View company details

3. **Spotting**
   - Quick spot button
   - Select rule from list
   - Select violator(s) from member list
   - Add description
   - Upload photos (max 3)
   - Preview before submit

4. **Dashboard**
   - Leaderboard
   - My rank & points
   - Recent activities
   - Stats summary

5. **Profile**
   - View my profile
   - Edit profile
   - Update photo
   - View my violations

6. **Admin Features** (if user is admin)
   - Approve/reject pending spots
   - Manage members
   - Manage rules
   - Manage departments
   - View reports
   - Export data

### Nice-to-Have Features

- Push notifications for new spots
- Dark mode
- Multi-language support
- Offline mode with sync
- QR code for join company
- Gamification (badges, achievements)
- Charts/graphs for stats

---

## 🆘 Troubleshooting

### Common Issues

**1. Token Expired**
```
Error: 401 Unauthorized
Solution: Call /auth/refresh or re-login
```

**2. Room Not Found**
```
Error: 403 Forbidden
Solution: Verify X-Room-Id header is correct
```

**3. Image Upload Failed**
```
Error: 422 Validation Error
Solution: Check file size (<3MB) and format (jpg/png/webp)
```

**4. CORS Error**
```
Error: Access-Control-Allow-Origin
Solution: Backend CORS config needs mobile domain
```

---

## 📞 Support & Resources

**Documentation:**
- API Docs: `API_DOCUMENTATION.md`
- GitHub: https://github.com/HUMPLUS-IT/one-day-one-behavior

**Contact:**
- Email: dev@odobdaily.com
- WhatsApp: [Your Number]

**Tools:**
- Postman Collection: [Link to collection]
- API Status: https://status.odobdaily.com
- Changelog: https://odobdaily.com/changelog
