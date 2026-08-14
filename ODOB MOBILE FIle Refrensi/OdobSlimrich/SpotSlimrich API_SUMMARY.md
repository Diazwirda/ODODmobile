# API Summary - Spot Slimrich untuk Mobile App

## 📌 Informasi Penting

**Base URL Production:** `https://spot.slimrich.id/api`  
**Base URL Development:** `http://localhost:8000/api`

**Authentication:** JWT Token via Header `Authorization: Bearer {token}`

**Room Context:** Header `X-Room-Id: {room_id}` (untuk endpoint yang memerlukan context room)

---

## 🔑 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register user baru (email @humanplus.co.id only) |
| POST | `/auth/login` | Login user (support Slimrich integration) |
| GET | `/auth/me` | Get current user info |
| POST | `/auth/refresh` | Refresh JWT token |
| POST | `/auth/logout` | Logout user |

---

## 🏢 Room Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rooms` | Get semua room yang user join |
| POST | `/rooms` | Create room baru |
| POST | `/rooms/join` | Join ke room dengan code |
| PATCH | `/rooms/{id}` | Update room (admin only) |
| DELETE | `/rooms/{id}` | Delete room (admin only) |
| DELETE | `/rooms/{id}/leave` | Leave dari room |
| DELETE | `/rooms/{id}/members/{user_id}` | Remove member (admin only) |
| POST | `/rooms/{id}/admins` | Add admin (admin only) |

---

## 📊 Dashboard & Statistics

| Method | Endpoint | Description | Params |
|--------|----------|-------------|--------|
| GET | `/dashboard/leaderboard` | Get leaderboard | `period`, `department`, `search`, `per_page`, `page`, `sort` |
| GET | `/dashboard/stats` | Get statistics summary | - |

**Period options:** `all-time`, `daily`, `weekly`, `monthly`, `yearly`

---

## 📜 Rules Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/rules` | Get all rules | All members |
| POST | `/admin/rules` | Create rule | Admin only |
| PUT | `/admin/rules/{id}` | Update rule | Admin only |
| DELETE | `/admin/rules/{id}` | Delete rule (soft delete) | Admin only |
| GET | `/admin/rules/deleted` | Get deleted rules | Admin only |
| PATCH | `/admin/rules/{id}/restore` | Restore deleted rule | Admin only |

---

## 🚨 Violations (Spotting)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/users` | Get users untuk violation report | All members |
| GET | `/violations` | Get all violations | All members |
| GET | `/violations/my` | Get my reports | All members |
| POST | `/violations` | Create violation report | All members |
| PATCH | `/admin/violations/{id}/status` | Verify/reject violation | Admin only |

**Create Violation Body:**
- `rule_id` (required)
- `violator_ids[]` (array, optional, multiple violators)
- `description` (optional, max 1200 chars)
- `photos[]` (required, min 1, max 3, each max 5MB)

**Status:** `pending`, `verified`, `rejected`

---

## 🏢 Departments

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/departments` | Get departments | All members |
| POST | `/departments` | Create department | All members |
| DELETE | `/admin/departments/{id}` | Delete department | Admin only |
| GET | `/slimrich/departments` | Get Slimrich departments | Public (no auth) |

**Note:** Department di Spot Slimrich bisa dibuat manual (berbeda dengan OdobDaily)

---

## 👤 Profile Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update profile |
| POST | `/profile/photo` | Update profile photo (max 2MB) |
| DELETE | `/profile/photo` | Delete profile photo |

---

## 📚 Tutorial

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tutorial/complete` | Mark tutorial as completed |

---

## 👨‍💼 Admin Functions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | Get all users in room |
| PUT | `/admin/users/{id}` | Update user |
| POST | `/admin/users/{id}/points` | Add/subtract points manually |
| GET | `/admin/reports/pending` | Get pending reports (paginated) |
| GET | `/admin/reports/history` | Get verification history (paginated) |
| GET | `/admin/report-summary` | Get reports summary statistics |
| GET | `/admin/export/excel` | Export leaderboard to Excel |
| GET | `/admin/export/pdf` | Export leaderboard to PDF |

---

## 🌐 Media/Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/media?path={file_path}` | Get uploaded file (public) |

**Example:** `/media?path=violations/photo123.jpg`

---

## 🔐 Security & Headers

### Required Headers

**All Authenticated Requests:**
```
Authorization: Bearer {jwt_token}
```

**Room Context Requests:**
```
Authorization: Bearer {jwt_token}
X-Room-Id: {room_id}
```

### JWT Token
- Valid for: 7 days
- Contains: `user_id`, `email`, `role`, `iat`, `exp`
- Store securely in Keychain/Keystore

---

## 📱 Mobile App Integration Flow

### 1. First Time User
```
1. Register → POST /auth/register
2. Get user → GET /auth/me
3. Create/Join room → POST /rooms OR POST /rooms/join
4. Complete tutorial → POST /tutorial/complete
5. Start using app
```

### 2. Returning User
```
1. Login → POST /auth/login
2. Get rooms → GET /rooms
3. Select active room
4. Use features
```

### 3. Daily Usage - Reporter
```
1. View dashboard → GET /dashboard/leaderboard
2. Create report:
   - Get rules → GET /rules
   - Get users → GET /users
   - Submit → POST /violations
3. Check reports → GET /violations/my
```

### 4. Daily Usage - Admin
```
1. Check pending → GET /admin/reports/pending
2. Verify/reject → PATCH /admin/violations/{id}/status
3. View stats → GET /admin/report-summary
4. Manage rules → POST/PUT/DELETE /admin/rules
```

---

## 🎯 Key Differences: Spot Slimrich vs OdobDaily

| Feature | Spot Slimrich | OdobDaily |
|---------|---------------|-----------|
| **Departments** | Fixed from Slimrich API | Manual creation by users |
| **Integration** | Slimrich API (required) | Slimrich API (optional) |
| **Use Case** | Slimrich clients only | Any company/organization |
| **Flexibility** | Medium (fixed departments) | High (custom departments) |

**Kesamaan:**
- Menggunakan database MySQL yang sama
- Role system yang sama (admin/reporter)
- Points system yang sama
- Violation workflow yang sama
- Multi-room/company support

---

## ⚠️ Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request berhasil |
| 201 | Created | Resource berhasil dibuat |
| 401 | Unauthorized | Token invalid/expired |
| 403 | Forbidden | Tidak punya akses ke room/action |
| 404 | Not Found | Resource tidak ditemukan |
| 422 | Validation Error | Input tidak valid |
| 500 | Server Error | Internal server error |
| 502 | Bad Gateway | Slimrich API error |

---

## 📋 Validation Rules Summary

### Register/Login
- Email: harus `@humanplus.co.id`
- Password: min 8 characters
- Name: max 120 characters

### Violation Report
- Photos: 1-3 files, max 5MB each
- Description: max 1200 characters
- Rule: must exist in room
- Violators: must be reporters (not admin)

### File Uploads
- Profile photo: max 2MB
- Room logo: max 2MB
- Violation photos: max 5MB per file
- Formats: jpg, jpeg, png, webp

---

## 🔄 Data Sync with Slimrich

### Automatic Sync Points:
1. **Login** - User data di-sync dari Slimrich API
2. **Get Users** - Users di-sync sebelum return data
3. **Failed Auth** - Fallback ke local authentication

### Sync Behavior:
- Department untuk `@humanplus.co.id` → tidak di-override dari Slimrich
- Department untuk email lain → sync dari Slimrich jika tersedia
- Role sync: admin di Slimrich → admin di app
- Photo sync: foto profil di-sync dari Slimrich

### Caching:
- Slimrich departments: cached 5 minutes
- Slimrich users sync: cached 5 minutes
- Cache otomatis clear setelah TTL

---

## 🚀 Quick Start Testing

### 1. Setup Environment
```bash
# Copy .env.example to .env
cp .env.example .env

# Update database config
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Optional: Slimrich integration
SLIMRICH_AUTH_ENABLED=true
SLIMRICH_BASE_URL=https://slimrich.id
SLIMRICH_APP_KEY=your_key
SLIMRICH_APP_SECRET=your_secret
```

### 2. Run Migrations
```bash
php artisan migrate
```

### 3. Test Basic Flow
```bash
# 1. Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@humanplus.co.id","password":"password123","password_confirmation":"password123"}'

# 2. Login (save token)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@humanplus.co.id","password":"password123"}'

# 3. Get user info
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 💡 Best Practices untuk Mobile App

### 1. Token Management
- ✅ Store token securely (Keychain/Keystore)
- ✅ Refresh token before expiry (7 days)
- ✅ Clear token on logout
- ✅ Handle 401 error → force re-login

### 2. Room Context
- ✅ Always send `X-Room-Id` header for room-specific requests
- ✅ Let user select active room before any action
- ✅ Cache selected room ID locally
- ✅ Show room switcher in UI

### 3. File Upload
- ✅ Compress images before upload
- ✅ Show upload progress
- ✅ Validate file size client-side
- ✅ Handle upload failures gracefully

### 4. Error Handling
- ✅ Show user-friendly error messages
- ✅ Handle network errors
- ✅ Retry logic for failed requests
- ✅ Validate input before submit

### 5. Performance
- ✅ Implement pagination for lists
- ✅ Cache frequently accessed data
- ✅ Use lazy loading for images
- ✅ Implement pull-to-refresh

### 6. Offline Support (Optional)
- ✅ Queue violations when offline
- ✅ Sync when connection restored
- ✅ Show offline indicator
- ✅ Cache leaderboard data

---

## 🎨 UI/UX Recommendations

### Home Screen
- Show selected room name/logo
- Display quick stats (points, rank, reports today)
- Easy access to main features

### Spotting Flow
1. Select rule (with icons/colors)
2. Select violator(s) - search enabled
3. Add photos (camera + gallery)
4. Add description (optional)
5. Preview before submit
6. Success feedback

### Admin Dashboard
- Pending reports counter (badge)
- Quick approve/reject actions
- Filter by status
- Export options

### Profile Screen
- Show total points & rank
- Edit profile info
- Upload photo
- View my reports history

---

## 📞 Support Information

**API Version:** 1.0  
**Last Updated:** July 23, 2026  
**Contact:** support@humanplus.co.id

---

## ✅ Implementation Checklist

### Phase 1 - Core Features
- [ ] Authentication (login, register, logout)
- [ ] JWT token management
- [ ] Room selection & switching
- [ ] View leaderboard
- [ ] Create violation report
- [ ] View my reports

### Phase 2 - Advanced Features
- [ ] Profile management
- [ ] Admin approval/rejection
- [ ] Filtering & search
- [ ] Pagination
- [ ] Photo compression
- [ ] Error handling

### Phase 3 - Polish
- [ ] Offline support
- [ ] Push notifications
- [ ] Export data
- [ ] Multi-language
- [ ] Dark mode
- [ ] Analytics

---

## 🔗 Related Files

1. **API_DOCUMENTATION.md** - Dokumentasi lengkap semua endpoint
2. **POSTMAN_COLLECTION.json** - Postman collection untuk testing
3. **API_SUMMARY.md** - File ini (quick reference)

---

**Happy Coding! 🚀**

