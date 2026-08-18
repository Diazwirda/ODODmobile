# 🔐 Sistem Invite Code Room (Perusahaan)

## 📌 Overview

Sistem **Invite Code** memungkinkan user untuk:
1. **Membuat room baru** dengan invite code yang unik
2. **Bergabung ke room** dengan memasukkan invite code
3. **Mengelola akses** dengan mengaktifkan/menonaktifkan invite code
4. **Memilih tipe kode** (generated otomatis atau manual)

---

## 🏗️ Struktur Database

### Tabel: `rooms`

| Column | Type | Description |
|--------|------|-------------|
| `invite_code` | `string(32)` | Kode unik untuk join room |
| `invite_code_enabled` | `boolean` | Status aktif/nonaktif (default: `true`) |
| `invite_code_type` | `string(24)` | Tipe kode: `generated` atau `manual` |

**Constraints:**
- `invite_code` memiliki **UNIQUE index** — tidak boleh ada duplikat
- `invite_code` bersifat **case-insensitive** (disimpan dalam uppercase)
- `invite_code` hanya boleh berisi: **A-Z, 0-9, dan tanda hubung (-)

---

## 🎯 Cara Kerja

### 1️⃣ **Membuat Room dengan Invite Code**

#### A. Generated (Otomatis)

Sistem akan generate random code 8 karakter uppercase:

**Request:**
```http
POST /api/rooms
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "name": "PT Teknologi Indonesia",
  "description": "Room untuk tim engineering",
  "invite_code_type": "generated",
  "invite_code_enabled": true
}
```

**Response:**
```json
{
  "id": 5,
  "name": "PT Teknologi Indonesia",
  "slug": "pt-teknologi-indonesia",
  "description": "Room untuk tim engineering",
  "photo": null,
  "invite_code": "X7K9M2N4",
  "invite_code_enabled": true,
  "invite_code_type": "generated",
  "membership_role": "admin",
  "can_manage": true,
  "admins": [
    {
      "id": 1,
      "name": "Admin User",
      "email": "admin@humanplus.co.id",
      "department": "Engineering",
      "photo": null,
      "joined_at": "2026-08-18T10:30:00.000000Z"
    }
  ],
  "joined_at": "2026-08-18T10:30:00.000000Z",
  "created_at": "2026-08-18T10:30:00.000000Z"
}
```

**Proses di Backend:**
```php
// Generate random 8 karakter uppercase
$code = strtoupper(Str::random(8)); // Example: "X7K9M2N4"

// Cek unique - jika sudah ada, generate ulang
while (Room::where('invite_code', $code)->exists()) {
    $code = strtoupper(Str::random(8));
}
```

---

#### B. Manual (Custom Code)

Admin dapat menentukan invite code sendiri:

**Request:**
```http
POST /api/rooms
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "name": "PT Inovasi Digital",
  "description": "Room untuk tim produk",
  "invite_code_type": "manual",
  "invite_code": "PRODUK-2026",
  "invite_code_enabled": true
}
```

**Response:**
```json
{
  "id": 6,
  "name": "PT Inovasi Digital",
  "invite_code": "PRODUK-2026",
  "invite_code_enabled": true,
  "invite_code_type": "manual"
  // ... fields lainnya
}
```

**Validasi di Backend:**
```php
// 1. Normalize: uppercase + hapus karakter selain A-Z, 0-9, dan dash
$code = strtoupper(trim($input));
$code = preg_replace('/[^A-Z0-9\-]/', '', $code);
// Input: "produk-2026" → Output: "PRODUK-2026"

// 2. Cek uniqueness
if (Room::where('invite_code', $code)->exists()) {
    throw ValidationException::withMessages([
        'invite_code' => 'Kode undangan sudah dipakai room lain.'
    ]);
}
```

**Error Scenarios:**

❌ **Kode sudah digunakan:**
```json
{
  "message": "The invite code has already been taken.",
  "errors": {
    "invite_code": ["Kode undangan sudah dipakai room lain."]
  }
}
```

❌ **Kode kosong pada tipe manual:**
```json
{
  "message": "Kode undangan manual wajib diisi.",
}
```

---

### 2️⃣ **Join Room dengan Invite Code**

User lain dapat bergabung ke room dengan memasukkan invite code:

**Request:**
```http
POST /api/rooms/join
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "X7K9M2N4"
}
```

**Response (Success):**
```json
{
  "id": 5,
  "name": "PT Teknologi Indonesia",
  "invite_code": "X7K9M2N4",
  "membership_role": "reporter",
  "can_manage": false,
  // ... fields lainnya
}
```

**Proses di Backend:**
```php
// 1. Normalize input code
$code = strtoupper(trim($input));
$code = preg_replace('/[^A-Z0-9\-]/', '', $code);

// 2. Cari room dengan invite code yang aktif
$room = Room::where('invite_code_enabled', true)
             ->where('invite_code', $code)
             ->first();

if (!$room) {
    return response()->json([
        'message' => 'Kode room tidak valid atau sedang nonaktif.'
    ], 422);
}

// 3. Tambahkan user sebagai member dengan role 'reporter'
RoomMember::firstOrCreate(
    ['room_id' => $room->id, 'user_id' => $user->id],
    ['role' => 'reporter', 'joined_at' => now()]
);
```

**Error Scenarios:**

❌ **Kode tidak ditemukan atau nonaktif:**
```json
{
  "message": "Kode room tidak valid atau sedang nonaktif."
}
```

❌ **User sudah join:**
- Sistem akan return data room yang sudah ada (tidak error)
- Tidak membuat membership duplikat

---

### 3️⃣ **Mengelola Invite Code (Update Room)**

Admin dapat mengubah invite code settings:

#### A. Menonaktifkan Invite Code

```http
PUT /api/rooms/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "invite_code_enabled": false
}
```

**Effect:**
- User tidak bisa join menggunakan invite code
- Kode tetap tersimpan, hanya dinonaktifkan

---

#### B. Regenerate Invite Code (Generated Type)

```http
PUT /api/rooms/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "regenerate_invite_code": true
}
```

**Response:**
```json
{
  "id": 5,
  "invite_code": "N9P2Q7R5",  // ← Kode baru
  "invite_code_type": "generated"
}
```

**Note:**
- Hanya berlaku untuk room dengan `invite_code_type = 'generated'`
- Kode lama akan diganti dan tidak bisa digunakan lagi

---

#### C. Mengubah ke Manual Code

```http
PUT /api/rooms/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "invite_code_type": "manual",
  "invite_code": "CUSTOM-CODE-01"
}
```

---

#### D. Mengubah dari Manual ke Generated

```http
PUT /api/rooms/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "invite_code_type": "generated"
}
```

**Effect:**
- Sistem akan auto-generate kode baru 8 karakter
- Kode manual lama akan diganti

---

## 🔒 Security & Validations

### 1. Uniqueness
- Setiap `invite_code` harus unique di seluruh tabel `rooms`
- Database level: `UNIQUE INDEX` pada kolom `invite_code`
- Application level: Check existence sebelum insert/update

### 2. Normalization
Semua invite code dinormalisasi dengan aturan:
```php
$code = strtoupper(trim($input));           // Uppercase & trim
$code = preg_replace('/[^A-Z0-9\-]/', '', $code); // Hanya A-Z, 0-9, dash
```

**Examples:**
- Input: `"abc-123"` → Output: `"ABC-123"`
- Input: `"test code"` → Output: `"TESTCODE"`
- Input: `"hello@world!"` → Output: `"HELLOWORLD"`

### 3. Access Control
- Hanya **admin room** yang bisa:
  - Mengubah `invite_code_type`
  - Regenerate invite code
  - Enable/disable invite code
- **Reporter** dan non-member: tidak bisa modify

### 4. Join Restrictions
- Invite code harus `invite_code_enabled = true`
- Jika disabled, join akan ditolak dengan error 422
- User yang sudah join tidak bisa join ulang (idempotent)

---

## 📱 Mobile App Integration

### Flow untuk Mobile App:

#### 1️⃣ **User Membuat Room Baru**
```dart
// Flutter Example
Future<Room> createRoom({
  required String name,
  String? description,
  required String inviteCodeType, // 'generated' or 'manual'
  String? inviteCode,            // required if type = 'manual'
}) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/rooms'),
    headers: {'Authorization': 'Bearer $token'},
    body: {
      'name': name,
      'description': description,
      'invite_code_type': inviteCodeType,
      'invite_code': inviteCode,
    },
  );
  return Room.fromJson(jsonDecode(response.body));
}
```

#### 2️⃣ **User Join Room dengan Kode**
```dart
Future<Room> joinRoom(String inviteCode) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/rooms/join'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({'code': inviteCode}),
  );
  
  if (response.statusCode == 200) {
    return Room.fromJson(jsonDecode(response.body));
  } else {
    throw Exception('Kode tidak valid atau nonaktif');
  }
}
```

#### 3️⃣ **Admin Regenerate Code**
```dart
Future<Room> regenerateInviteCode(int roomId) async {
  final response = await http.put(
    Uri.parse('$baseUrl/api/rooms/$roomId'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({'regenerate_invite_code': true}),
  );
  return Room.fromJson(jsonDecode(response.body));
}
```

#### 4️⃣ **Toggle Enable/Disable Invite Code**
```dart
Future<Room> toggleInviteCode(int roomId, bool enabled) async {
  final response = await http.put(
    Uri.parse('$baseUrl/api/rooms/$roomId'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({'invite_code_enabled': enabled}),
  );
  return Room.fromJson(jsonDecode(response.body));
}
```

---

## 🧪 Testing

Unit tests tersedia di `tests/Feature/RoomTest.php`:

### Test Cases:
1. ✅ **Create room with generated code**
2. ✅ **Create room with manual code**
3. ✅ **Validation: manual code cannot be empty**
4. ✅ **Validation: manual code must be unique**
5. ✅ **User can join room with valid code**
6. ✅ **Join fails when invite code is disabled**
7. ✅ **User cannot join twice (idempotent)**
8. ✅ **Admin can regenerate invite code**
9. ✅ **Admin can change from generated to manual**
10. ✅ **Admin can toggle invite code enabled/disabled**

Run tests:
```bash
php artisan test --filter RoomTest
```

---

## 📊 Database Schema

```sql
CREATE TABLE rooms (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    photo VARCHAR(255),
    created_by BIGINT UNSIGNED,
    invite_code VARCHAR(32) UNIQUE,        -- ← UNIQUE constraint
    invite_code_enabled BOOLEAN DEFAULT 1,  -- ← Default: enabled
    invite_code_type VARCHAR(24) DEFAULT 'generated', -- ← 'generated' or 'manual'
    database_name VARCHAR(255),
    database_path VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 🎓 Best Practices

### 1. Generated Code (Recommended untuk kebanyakan kasus)
✅ **Pros:**
- Auto-unique guarantee
- Tidak perlu manual input
- 8 karakter = 208 trillion kombinasi (sangat aman)

❌ **Cons:**
- Kode random, sulit diingat

**Use Case:**
- Room untuk project internal
- Room temporary/short-term
- Ketika security > memorability

---

### 2. Manual Code (Untuk kemudahan branding)
✅ **Pros:**
- Mudah diingat (e.g., `PRODUK-2026`)
- Bisa disesuaikan dengan nama team/project

❌ **Cons:**
- Harus cek uniqueness manual
- Bisa dicoba-coba oleh orang lain

**Use Case:**
- Room publik dengan branding jelas
- Event-based rooms (e.g., `HACKATHON-2026`)
- Marketing campaigns

---

## 🔄 Migration Notes

Room default `UMUM` dibuat saat migration dengan invite code:
```php
'invite_code' => 'UMUM' . strtoupper(Str::random(4)),
'invite_code_enabled' => 1,
'invite_code_type' => 'generated',
```

Contoh: `UMUMA1B2`

---

## 🚨 Common Issues & Solutions

### Issue 1: Kode sudah dipakai
**Error:**
```json
{
  "message": "The invite code has already been taken.",
  "errors": {
    "invite_code": ["Kode undangan sudah dipakai room lain."]
  }
}
```

**Solution:**
- Gunakan kode lain
- Atau gunakan `invite_code_type: 'generated'` untuk auto-generate

---

### Issue 2: Join gagal padahal kode benar
**Error:**
```json
{
  "message": "Kode room tidak valid atau sedang nonaktif."
}
```

**Root Cause:**
- `invite_code_enabled = false`

**Solution:**
- Admin harus enable invite code dulu:
```http
PUT /api/rooms/{id}
{"invite_code_enabled": true}
```

---

### Issue 3: Case sensitivity
**Question:** Apakah `"abc123"` sama dengan `"ABC123"`?

**Answer:** **YA!** Sistem auto-convert ke uppercase:
```php
normalizeInviteCode("abc123")  // → "ABC123"
normalizeInviteCode("ABC123")  // → "ABC123"
normalizeInviteCode("AbC123")  // → "ABC123"
```

---

## 📞 API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/rooms` | Create room dengan invite code | ✅ Yes |
| `POST` | `/api/rooms/join` | Join room dengan invite code | ✅ Yes |
| `PUT` | `/api/rooms/{id}` | Update invite code settings | ✅ Yes (Admin) |
| `GET` | `/api/rooms` | List rooms user | ✅ Yes |

---

## 🎯 Summary

**Invite Code System** memungkinkan:
1. ✅ **Flexible code generation** (auto atau manual)
2. ✅ **Secure access control** (enable/disable)
3. ✅ **Easy room sharing** (1 kode untuk join)
4. ✅ **Admin control** (regenerate, change type)
5. ✅ **Case-insensitive & normalized** (user-friendly)

**Mobile App dapat:**
- Membuat room dengan pilihan kode auto/manual
- Join room dengan scan QR atau input kode
- Admin manage invite code dari settings room
- Disable invite code untuk private room

---

**🔗 Related Documentation:**
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) — Full API reference
- [MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md) — Mobile integration guide
- [CODE_EXAMPLES.md](./CODE_EXAMPLES.md) — Code examples (Flutter, React Native)
