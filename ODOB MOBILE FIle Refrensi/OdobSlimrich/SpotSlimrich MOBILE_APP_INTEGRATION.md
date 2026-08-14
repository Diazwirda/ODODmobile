# Mobile App Integration Guide
## Spot Slimrich & OdobDaily

---

## 📱 Overview

Dokumen ini adalah panduan lengkap untuk mengintegrasikan aplikasi **Spot Slimrich** dan **OdobDaily** dengan mobile app (iOS/Android).

### Apa yang Tersedia?

✅ **Backend API Laravel** - Sudah siap pakai  
✅ **Database MySQL** - Shared database untuk kedua aplikasi  
✅ **JWT Authentication** - Token-based auth  
✅ **Multi-room/Multi-company Support** - User bisa join berbagai perusahaan  
✅ **File Upload** - Support foto violation, profile, room logo  
✅ **Admin & Reporter Roles** - Role-based access control  
✅ **Slimrich Integration** - Optional integration dengan Slimrich API  

---

## 📚 Dokumentasi yang Tersedia

### 1. **API_DOCUMENTATION.md** ⭐ (Lengkap)
Dokumentasi API lengkap dengan:
- Semua endpoints (50+ endpoints)
- Request/response examples
- Validation rules
- Error handling
- Authentication flow
- File upload guidelines

👉 **Baca ini untuk detail lengkap semua API**

---

### 2. **API_SUMMARY.md** (Quick Reference)
Ringkasan cepat berisi:
- Daftar semua endpoints dalam table
- Quick integration flow
- Best practices
- Implementation checklist

👉 **Baca ini untuk overview cepat**

---

### 3. **DATABASE_SCHEMA.md**
Penjelasan struktur database:
- Schema semua tabel
- Relationships
- Query examples
- Data isolation strategy
- Performance optimization

👉 **Baca ini untuk memahami database**

---

### 4. **POSTMAN_COLLECTION.json**
Postman collection untuk testing API:
- Import ke Postman
- Test semua endpoints
- Auto-save token

👉 **Gunakan ini untuk testing**

---

## 🎯 Perbedaan Utama: Spot Slimrich vs OdobDaily

| Aspek | Spot Slimrich | OdobDaily |
|-------|---------------|-----------|
| **Department** | Fixed dari Slimrich API | Manual (user bisa create) |
| **Use Case** | Khusus client Slimrich | Any organization |
| **Flexibility** | Medium | Tinggi |
| **Slimrich Integration** | Required | Optional |

### Kesamaan ✅
- Database MySQL yang sama
- API endpoints yang sama
- Role system (admin/reporter)
- Points & leaderboard system
- Multi-room support
- Violation workflow

---

## 🚀 Quick Start untuk Mobile Developer

### Step 1: Setup Backend
```bash
# Clone repository
git clone <repository-url>
cd One-Day-One-Behavior-Spot-Slimrich

# Install dependencies
composer install

# Setup environment
cp .env.example .env
php artisan key:generate

# Configure database in .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=spotting_db
DB_USERNAME=root
DB_PASSWORD=your_password

# Run migrations
php artisan migrate

# Start server
php artisan serve
```

### Step 2: Test API
```bash
# Test login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@humanplus.co.id","password":"password123"}'

# Response akan return JWT token
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": { ... }
}
```

### Step 3: Build Mobile App
1. Baca **API_DOCUMENTATION.md**
2. Import **POSTMAN_COLLECTION.json** untuk testing
3. Implementasi authentication flow
4. Implementasi main features
5. Test dengan backend

---

## 🏗️ Architecture Overview

```
┌─────────────────┐
│   Mobile App    │
│  (iOS/Android)  │
└────────┬────────┘
         │ HTTPS/REST API
         │ JWT Token
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Laravel API    │◄────►│  MySQL Database  │
│  (Backend)      │      │  (Shared DB)     │
└────────┬────────┘      └──────────────────┘
         │
         │ Optional
         ▼
┌─────────────────┐
│  Slimrich API   │
│  (External)     │
└─────────────────┘
```

---

## 📋 Key Features untuk Mobile App

### 1. Authentication & User Management
- [x] Register dengan email @humanplus.co.id
- [x] Login (local + Slimrich integration)
- [x] JWT token management (7 days validity)
- [x] Profile management (update info, upload photo)
- [x] Logout

### 2. Room/Company Management
- [x] Create room (perusahaan baru)
- [x] Join room dengan code
- [x] Switch between rooms
- [x] Leave room
- [x] Room admin management

### 3. Spotting/Violation Features
- [x] View rules (jenis pelanggaran)
- [x] Select violator (support multiple)
- [x] Upload photos (1-3 photos)
- [x] Add description
- [x] Submit violation report
- [x] View my reports
- [x] View report status (pending/verified/rejected)

### 4. Dashboard & Leaderboard
- [x] View leaderboard (filterable by period, department)
- [x] View statistics (reports today, this week, total)
- [x] View ranking with badges (gold, silver, bronze)
- [x] Search users in leaderboard
- [x] Pagination support

### 5. Admin Features
- [x] View pending reports
- [x] Approve/reject violations
- [x] Manage rules (create, update, delete)
- [x] Manage users
- [x] Add/subtract points manually
- [x] Export data (Excel, PDF)
- [x] View verification history

---

## 🔐 Security & Best Practices

### Authentication Flow
```
1. User login → POST /api/auth/login
2. Save JWT token securely (Keychain/Keystore)
3. Include token in all requests: Authorization: Bearer {token}
4. Handle 401 → Auto logout & redirect to login
5. Refresh token before expiry (7 days)
```

### Room Context
```
1. User selects active room from list
2. Save room_id locally
3. Include in all room-specific requests: X-Room-Id: {room_id}
4. Handle 403 → User not member of room
```

### File Upload
```
1. Validate file type & size client-side
2. Compress images before upload
3. Use multipart/form-data
4. Show upload progress
5. Handle upload errors
```

### Error Handling
```
- 200/201: Success
- 401: Unauthorized → Logout user
- 403: Forbidden → Show access denied message
- 404: Not Found → Show not found message
- 422: Validation Error → Show field-specific errors
- 500: Server Error → Show retry option
- 502: External API Error → Show try again later
```

---

## 📱 Recommended Mobile App Screens

### Onboarding Flow
1. **Splash Screen** - Show logo, check auth status
2. **Tutorial/Intro** - Explain app features (optional)
3. **Login/Register** - Authentication
4. **Room Selection** - Create or join room
5. **Complete Tutorial** - Mark tutorial as completed

### Main App (Reporter)
1. **Home/Dashboard**
   - Show selected room
   - Quick stats (my points, my rank)
   - Leaderboard preview
   - Quick action buttons

2. **Spotting (Create Report)**
   - Select rule
   - Select violator(s) with search
   - Upload photos (camera + gallery)
   - Add description
   - Preview & submit

3. **My Reports**
   - List of my reports
   - Status indicators (pending/verified/rejected)
   - Filter by status

4. **Leaderboard**
   - Full leaderboard with filters
   - Period selector
   - Department filter
   - Search functionality

5. **Profile**
   - View profile info
   - Edit profile
   - Upload photo
   - Change room
   - Logout

### Admin Features (Additional)
6. **Admin Dashboard**
   - Pending reports counter
   - Quick stats
   - Recent activity

7. **Pending Reports**
   - List of pending violations
   - Quick approve/reject
   - View details

8. **Manage Rules**
   - List of rules
   - Add/edit/delete rules
   - Set points

9. **Manage Users**
   - List of users in room
   - Edit user info
   - Add/subtract points

---

## 💡 Technical Recommendations

### State Management
- Use Redux/MobX (React Native)
- Use Provider/Bloc (Flutter)
- Manage auth state globally
- Cache frequently used data

### Networking
```dart
// Example: Flutter with Dio
final dio = Dio(BaseOptions(
  baseUrl: 'https://your-api.com/api',
  connectTimeout: Duration(seconds: 30),
  receiveTimeout: Duration(seconds: 30),
));

// Add interceptors for token
dio.interceptors.add(InterceptorsWrapper(
  onRequest: (options, handler) {
    final token = getStoredToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    final roomId = getSelectedRoomId();
    if (roomId != null) {
      options.headers['X-Room-Id'] = roomId;
    }
    return handler.next(options);
  },
  onError: (error, handler) {
    if (error.response?.statusCode == 401) {
      logout();
    }
    return handler.next(error);
  },
));
```

### Image Handling
```dart
// Compress before upload
import 'package:image/image.dart' as img;
import 'package:flutter_image_compress/flutter_image_compress.dart';

Future<File> compressImage(File file) async {
  final result = await FlutterImageCompress.compressAndGetFile(
    file.absolute.path,
    file.absolute.path + '_compressed.jpg',
    quality: 85,
    minWidth: 1920,
    minHeight: 1080,
  );
  return result;
}
```

### Token Storage
```dart
// Using flutter_secure_storage
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();

// Save token
await storage.write(key: 'jwt_token', value: token);

// Read token
final token = await storage.read(key: 'jwt_token');

// Delete token
await storage.delete(key: 'jwt_token');
```

---

## ✅ Development Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Setup project structure
- [ ] Implement HTTP client with interceptors
- [ ] Implement secure token storage
- [ ] Create API service layer
- [ ] Implement authentication flow
  - [ ] Login screen
  - [ ] Register screen
  - [ ] Token management
  - [ ] Auto-logout on 401
- [ ] Test authentication endpoints

### Phase 2: Core Features (Week 3-4)
- [ ] Room management
  - [ ] List rooms
  - [ ] Create room
  - [ ] Join room with code
  - [ ] Room switcher
- [ ] Dashboard
  - [ ] Show stats
  - [ ] Show leaderboard
  - [ ] Implement filters
  - [ ] Implement pagination
- [ ] Profile
  - [ ] View profile
  - [ ] Edit profile
  - [ ] Upload photo
- [ ] Test core features

### Phase 3: Spotting Feature (Week 5-6)
- [ ] Create violation report
  - [ ] Select rule
  - [ ] Select violator(s) with search
  - [ ] Upload photos (camera + gallery)
  - [ ] Image compression
  - [ ] Add description
  - [ ] Preview before submit
- [ ] My reports
  - [ ] List my reports
  - [ ] Filter by status
  - [ ] View details
- [ ] Test spotting flow

### Phase 4: Admin Features (Week 7-8)
- [ ] Admin dashboard
- [ ] Pending reports
  - [ ] List pending
  - [ ] Approve/reject
  - [ ] Add reject reason
- [ ] Manage rules
  - [ ] List rules
  - [ ] Create rule
  - [ ] Edit rule
  - [ ] Delete rule
- [ ] Manage users
  - [ ] List users
  - [ ] Edit user
  - [ ] Add/subtract points
- [ ] Export data
- [ ] Test admin features

### Phase 5: Polish & Testing (Week 9-10)
- [ ] Error handling improvements
- [ ] Loading states & skeletons
- [ ] Empty states
- [ ] Offline support (optional)
- [ ] Push notifications (optional)
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Bug fixes

### Phase 6: Launch (Week 11-12)
- [ ] Beta testing
- [ ] App store submission
- [ ] Documentation
- [ ] User training
- [ ] Production deployment

---

## 🐛 Common Issues & Solutions

### Issue 1: Token Expired (401)
**Solution:** Implement auto-refresh or force re-login
```dart
if (error.statusCode == 401) {
  await storage.delete(key: 'jwt_token');
  Navigator.pushReplacementNamed(context, '/login');
}
```

### Issue 2: Room Context Missing (403)
**Solution:** Always include X-Room-Id header
```dart
headers['X-Room-Id'] = await storage.read(key: 'active_room_id');
```

### Issue 3: Image Too Large (422)
**Solution:** Compress images before upload
```dart
final compressed = await compressImage(originalImage);
```

### Issue 4: Slow Leaderboard Loading
**Solution:** Implement pagination and caching
```dart
// Load first page
loadLeaderboard(page: 1, perPage: 20);

// Cache results
await storage.write(key: 'leaderboard_cache', value: jsonEncode(data));
```

### Issue 5: Multiple Violators Not Working
**Solution:** Send as array
```dart
formData.fields.add(MapEntry('violator_ids[]', '2'));
formData.fields.add(MapEntry('violator_ids[]', '3'));
```

---

## 📞 Support & Resources

### Documentation
- **API_DOCUMENTATION.md** - Full API reference
- **API_SUMMARY.md** - Quick reference
- **DATABASE_SCHEMA.md** - Database structure
- **POSTMAN_COLLECTION.json** - API testing

### Contact
- **Email:** support@humanplus.co.id
- **API Version:** 1.0
- **Last Updated:** July 23, 2026

### Useful Links
- Laravel Documentation: https://laravel.com/docs
- JWT Documentation: https://jwt.io/
- MySQL Documentation: https://dev.mysql.com/doc/

---

## 🎓 FAQ

**Q: Apakah kedua aplikasi (Spot Slimrich & OdobDaily) menggunakan database yang sama?**  
A: Ya, keduanya menggunakan database MySQL yang sama dengan tabel yang identik.

**Q: Apa perbedaan utama antara kedua aplikasi?**  
A: Perbedaan utama ada di department management. Spot Slimrich allow manual department creation, sedangkan OdobDaily menggunakan fixed departments dari Slimrich API.

**Q: Apakah role admin dan reporter aman digunakan di kedua aplikasi?**  
A: Ya, sangat aman. Role dikelola per room, sehingga user bisa jadi admin di satu room dan reporter di room lain.

**Q: Berapa lama JWT token valid?**  
A: Token valid selama 7 hari. Setelah itu user perlu refresh atau login ulang.

**Q: Apakah bisa melaporkan multiple violators sekaligus?**  
A: Ya, gunakan field `violator_ids[]` sebagai array.

**Q: Bagaimana cara handle file upload di mobile?**  
A: Gunakan `multipart/form-data`, compress image sebelum upload, dan validate size/type di client.

**Q: Apakah perlu integrasi dengan Slimrich API?**  
A: Optional untuk Spot Slimrich, tapi required untuk OdobDaily.

**Q: Bagaimana cara testing API?**  
A: Import POSTMAN_COLLECTION.json ke Postman atau gunakan curl commands dari dokumentasi.

---

## 🎉 Ready to Build!

Semua dokumentasi dan resources sudah siap. Mulai dengan membaca **API_DOCUMENTATION.md** untuk detail lengkap, kemudian gunakan **API_SUMMARY.md** sebagai quick reference saat development.

**Good luck! 🚀**

