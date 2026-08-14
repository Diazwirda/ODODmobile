# API Documentation - Spot Slimrich
## Dokumentasi API untuk Mobile App Integration

**Base URL Production:** `https://spot.slimrich.id/api`  
**Base URL Development:** `http://localhost:8000/api`

**Catatan Penting:**
- Aplikasi ini menggunakan database MySQL yang sama dengan aplikasi OdobDaily
- Perbedaan utama: Department di Spot Slimrich menggunakan API Slimrich (fixed), sedangkan OdobDaily bisa dibuat manual oleh admin
- Role admin dan reporter aman digunakan karena terpisah per room (perusahaan)
- Setiap user bisa bergabung ke berbagai room/perusahaan

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Room Management](#room-management)
4. [Dashboard & Statistics](#dashboard--statistics)
5. [Rules Management](#rules-management)
6. [Violations (Spotting)](#violations-spotting)
7. [Departments](#departments)
8. [Profile Management](#profile-management)
9. [Tutorial](#tutorial)
10. [Admin Functions](#admin-functions)
11. [Response Formats](#response-formats)
12. [Error Handling](#error-handling)

---

## 🔐 Authentication

### 1. Register
```http
POST /auth/register
```


**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@humanplus.co.id",
  "password": "password123",
  "password_confirmation": "password123",
  "department": "Teknologi",
  "position": "Developer"
}
```

**Response (201):**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@humanplus.co.id",
    "role": "reporter",
    "department": "Teknologi",
    "position": "Developer",
    "points": 0,
    "photo": null,
    "created_at": "2026-07-23T10:00:00.000000Z",
    "updated_at": "2026-07-23T10:00:00.000000Z"
  }
}
```

**Validation Rules:**
- `name`: required, string, max 120 characters
- `email`: required, email format, unique, max 255 characters
- `password`: required, min 8 characters, must be confirmed
- `department`: optional, string, max 120 characters
- `position`: optional, string, max 120 characters

**Notes:**
- Hanya email dengan domain `@humanplus.co.id` yang bisa register
- User otomatis mendapat role `reporter`

---

### 2. Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@humanplus.co.id",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@humanplus.co.id",
    "role": "reporter",
    "department": "Teknologi",
    "position": "Developer",
    "points": 100,
    "photo": null
  }
}
```

**Notes:**
- Login mendukung integrasi dengan Slimrich API jika dikonfigurasi
- Jika Slimrich API aktif, sistem akan sync data user dari Slimrich
- Token JWT valid selama 7 hari

---

### 3. Get Current User
```http
GET /auth/me
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@humanplus.co.id",
  "role": "reporter",
  "department": "Teknologi",
  "position": "Developer",
  "points": 100,
  "photo": null
}
```

---

### 4. Refresh Token
```http
POST /auth/refresh
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@humanplus.co.id",
    "role": "reporter"
  }
}
```

---

### 5. Logout
```http
POST /auth/logout
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Logout berhasil"
}
```

---

## 👥 User Management

### Get Users for Violation Report
```http
GET /users
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Response (200):**
```json
[
  {
    "id": 2,
    "name": "Jane Smith",
    "department": "Marketing",
    "photo": "https://cdn.example.com/photo.jpg"
  },
  {
    "id": 3,
    "name": "Bob Wilson",
    "department": "HR",
    "photo": null
  }
]
```

**Notes:**
- Endpoint ini juga melakukan sync otomatis dengan Slimrich API
- Hanya menampilkan user dengan role `reporter` (bukan admin)
- Memerlukan header `X-Room-Id` untuk filter user per room

---

## 🏢 Room Management

Room adalah representasi dari perusahaan/organisasi. User bisa bergabung ke berbagai room.

### 1. Get All Rooms (User Joined)
```http
GET /rooms
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "PT Human Plus Indonesia",
    "code": "HPL2026",
    "description": "Room untuk Human Plus",
    "logo": "https://cdn.example.com/logo.png",
    "user_role": "admin",
    "members_count": 45,
    "created_at": "2026-01-01T00:00:00.000000Z"
  },
  {
    "id": 2,
    "name": "Client ABC",
    "code": "ABC2026",
    "description": null,
    "logo": null,
    "user_role": "member",
    "members_count": 20,
    "created_at": "2026-02-01T00:00:00.000000Z"
  }
]
```

---

### 2. Create Room
```http
POST /rooms
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:**
```
name: PT Human Plus Indonesia
description: Room untuk tracking behavior
logo: [file upload]
```

**Response (201):**
```json
{
  "id": 1,
  "name": "PT Human Plus Indonesia",
  "code": "HPL2026",
  "description": "Room untuk tracking behavior",
  "logo": "https://cdn.example.com/logo.png",
  "created_at": "2026-07-23T10:00:00.000000Z"
}
```

**Validation Rules:**
- `name`: required, string, max 255 characters
- `description`: optional, string, max 1000 characters
- `logo`: optional, image (jpg, jpeg, png, webp), max 2MB

**Notes:**
- User yang membuat room otomatis menjadi admin room tersebut
- Code room di-generate otomatis (4 karakter uppercase)

---

### 3. Join Room
```http
POST /rooms/join
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "code": "HPL2026"
}
```

**Response (200):**
```json
{
  "message": "Berhasil bergabung ke room",
  "room": {
    "id": 1,
    "name": "PT Human Plus Indonesia",
    "code": "HPL2026",
    "description": "Room untuk tracking behavior",
    "logo": "https://cdn.example.com/logo.png"
  }
}
```

---

### 4. Update Room
```http
PATCH /rooms/{room_id}
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:**
```
name: PT Human Plus Indonesia (Updated)
description: Updated description
logo: [file upload]
```

**Response (200):**
```json
{
  "id": 1,
  "name": "PT Human Plus Indonesia (Updated)",
  "code": "HPL2026",
  "description": "Updated description",
  "logo": "https://cdn.example.com/new-logo.png"
}
```

**Notes:**
- Hanya admin room yang bisa update
- Logo bersifat optional, bisa tidak diubah

---

### 5. Delete Room
```http
DELETE /rooms/{room_id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Room berhasil dihapus"
}
```

**Notes:**
- Hanya admin room yang bisa delete
- Menghapus room akan menghapus semua data terkait (violations, rules, dll)

---

### 6. Leave Room
```http
DELETE /rooms/{room_id}/leave
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Berhasil keluar dari room"
}
```

---

### 7. Remove Member from Room
```http
DELETE /rooms/{room_id}/members/{user_id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Member berhasil dihapus dari room"
}
```

**Notes:**
- Hanya admin room yang bisa remove member

---

### 8. Add Admin to Room
```http
POST /rooms/{room_id}/admins
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "user_id": 5
}
```

**Response (200):**
```json
{
  "message": "User berhasil dijadikan admin"
}
```

**Notes:**
- Hanya admin room yang bisa menambah admin lain

---

## 📊 Dashboard & Statistics

### 1. Get Leaderboard
```http
GET /dashboard/leaderboard
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Query Parameters:**
- `period`: `all-time` | `daily` | `weekly` | `monthly` | `yearly` (default: `all-time`)
- `department`: Department name or `all` (default: `all`)
- `search`: Search by user name
- `limit`: Limit results (optional, for top N)
- `per_page`: Results per page (default: 10, max: 50)
- `sort`: `asc` | `desc` (default: `desc`)
- `page`: Page number for pagination

**Period-specific parameters:**
- For `daily`: `date` (format: YYYY-MM-DD)
- For `weekly`: `year`, `month`, `week`
- For `monthly`: `month` (format: YYYY-MM or just month number), `year`
- For `yearly`: `year`


**Response (200) - With Pagination:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@humanplus.co.id",
      "age": null,
      "department": "Teknologi",
      "position": "Developer",
      "photo": null,
      "total_points": 150,
      "rank": 1,
      "badge": "gold"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@humanplus.co.id",
      "age": null,
      "department": "Marketing",
      "position": "Manager",
      "photo": "https://cdn.example.com/photo.jpg",
      "total_points": 120,
      "rank": 2,
      "badge": "silver"
    },
    {
      "id": 3,
      "name": "Bob Wilson",
      "email": "bob@humanplus.co.id",
      "age": null,
      "department": "HR",
      "position": "Staff",
      "photo": null,
      "total_points": 100,
      "rank": 3,
      "badge": "bronze"
    }
  ],
  "current_page": 1,
  "last_page": 5,
  "per_page": 10,
  "total": 45
}
```

**Response (200) - With Limit (Top N):**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "total_points": 150,
    "rank": 1,
    "badge": "gold"
  }
]
```

**Notes:**
- Badge diberikan untuk rank 1-3 (gold, silver, bronze)
- Hanya menampilkan user dengan role `member` (bukan admin)

---

### 2. Get Statistics
```http
GET /dashboard/stats
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Response (200):**
```json
{
  "reports_today": 5,
  "reports_this_week": 23,
  "total_violation": 156,
  "total_points_log": 312,
  "departments": [
    "HR",
    "Marketing",
    "Teknologi dan Produk",
    "FAT"
  ]
}
```

---

## 📜 Rules Management

Rules adalah jenis pelanggaran yang bisa dilaporkan.

### 1. Get All Rules
```http
GET /rules
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Lupa Presensi",
    "reporter_points": 5,
    "violator_points": -10,
    "icon": "clock",
    "color": "#FF6B6B",
    "room_id": 1,
    "created_at": "2026-01-01T00:00:00.000000Z"
  },
  {
    "id": 2,
    "name": "Tidak Pakai Seragam",
    "reporter_points": 3,
    "violator_points": -5,
    "icon": "shirt",
    "color": "#4ECDC4",
    "room_id": 1,
    "created_at": "2026-01-01T00:00:00.000000Z"
  }
]
```

---

### 2. Create Rule (Admin Only)
```http
POST /admin/rules
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Request Body:**
```json
{
  "name": "Lupa Presensi",
  "reporter_points": 5,
  "violator_points": -10,
  "icon": "clock",
  "color": "#FF6B6B"
}
```


**Response (201):**
```json
{
  "id": 1,
  "name": "Lupa Presensi",
  "reporter_points": 5,
  "violator_points": -10,
  "icon": "clock",
  "color": "#FF6B6B",
  "room_id": 1,
  "created_at": "2026-07-23T10:00:00.000000Z"
}
```

**Validation Rules:**
- `name`: required, string, max 255 characters
- `reporter_points`: required, integer, min 0
- `violator_points`: required, integer
- `icon`: optional, string, max 50 characters
- `color`: optional, string, max 20 characters

---

### 3. Update Rule (Admin Only)
```http
PUT /admin/rules/{rule_id}
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Request Body:**
```json
{
  "name": "Lupa Presensi (Updated)",
  "reporter_points": 10,
  "violator_points": -15,
  "icon": "clock",
  "color": "#FF0000"
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Lupa Presensi (Updated)",
  "reporter_points": 10,
  "violator_points": -15,
  "icon": "clock",
  "color": "#FF0000",
  "room_id": 1
}
```

---

### 4. Delete Rule (Admin Only)
```http
DELETE /admin/rules/{rule_id}
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Response (200):**
```json
{
  "message": "Rule berhasil dihapus"
}
```

**Notes:**
- Delete rule menggunakan soft delete
- Rule yang sudah dihapus masih bisa di-restore

---

### 5. Get Deleted Rules (Admin Only)
```http
GET /admin/rules/deleted
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Response (200):**
```json
[
  {
    "id": 5,
    "name": "Rule yang Dihapus",
    "reporter_points": 5,
    "violator_points": -10,
    "deleted_at": "2026-07-20T10:00:00.000000Z"
  }
]
```

---

### 6. Restore Deleted Rule (Admin Only)
```http
PATCH /admin/rules/{rule_id}/restore
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Response (200):**
```json
{
  "message": "Rule berhasil dipulihkan",
  "rule": {
    "id": 5,
    "name": "Rule yang Dihapus",
    "reporter_points": 5,
    "violator_points": -10,
    "deleted_at": null
  }
}
```

---

## 🚨 Violations (Spotting)

Violations adalah laporan pelanggaran yang dibuat oleh reporter.

### 1. Get All Violations
```http
GET /violations
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "rule": {
      "id": 1,
      "name": "Lupa Presensi",
      "reporter_points": 5,
      "violator_points": -10
    },
    "reporter": {
      "id": 1,
      "name": "John Doe",
      "department": "Teknologi",
      "photo": null
    },
    "violator": {
      "id": 2,
      "name": "Jane Smith",
      "department": "Marketing",
      "photo": null
    },
    "violators": [
      {
        "id": 2,
        "name": "Jane Smith",
        "department": "Marketing",
        "photo": null
      }
    ],
    "description": "Lupa presensi pagi",
    "photos": [
      "https://cdn.example.com/violation1.jpg",
      "https://cdn.example.com/violation2.jpg"
    ],
    "status": "pending",
    "reject_reason": null,
    "incident_at": "2026-07-23T08:00:00.000000Z",
    "created_at": "2026-07-23T09:00:00.000000Z"
  }
]
```


**Status Values:**
- `pending`: Menunggu verifikasi admin
- `verified`: Sudah diverifikasi, poin sudah masuk
- `rejected`: Ditolak admin

---

### 2. Get My Reports
```http
GET /violations/my
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "rule": {
      "id": 1,
      "name": "Lupa Presensi",
      "reporter_points": 5,
      "violator_points": -10
    },
    "violator": {
      "id": 2,
      "name": "Jane Smith",
      "department": "Marketing",
      "photo": null
    },
    "violators": [
      {
        "id": 2,
        "name": "Jane Smith",
        "department": "Marketing"
      }
    ],
    "description": "Lupa presensi pagi",
    "photos": [
      "https://cdn.example.com/violation1.jpg"
    ],
    "status": "verified",
    "created_at": "2026-07-23T09:00:00.000000Z"
  }
]
```

---

### 3. Create Violation (Report)
```http
POST /violations
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
Content-Type: multipart/form-data
```

**Request Body:**
```
rule_id: 1
violator_ids[]: 2
violator_ids[]: 3
description: Lupa presensi pagi hari
photos[]: [file upload 1]
photos[]: [file upload 2]
photos[]: [file upload 3]
```


**Response (201):**
```json
{
  "id": 1,
  "rule": {
    "id": 1,
    "name": "Lupa Presensi",
    "reporter_points": 5,
    "violator_points": -10
  },
  "reporter": {
    "id": 1,
    "name": "John Doe",
    "department": "Teknologi",
    "photo": null
  },
  "violator": {
    "id": 2,
    "name": "Jane Smith",
    "department": "Marketing",
    "photo": null
  },
  "violators": [
    {
      "id": 2,
      "name": "Jane Smith",
      "department": "Marketing"
    },
    {
      "id": 3,
      "name": "Bob Wilson",
      "department": "HR"
    }
  ],
  "description": "Lupa presensi pagi hari",
  "photos": [
    "https://cdn.example.com/violation1.jpg",
    "https://cdn.example.com/violation2.jpg",
    "https://cdn.example.com/violation3.jpg"
  ],
  "status": "pending",
  "incident_at": "2026-07-23T10:00:00.000000Z",
  "created_at": "2026-07-23T10:00:00.000000Z"
}
```

**Validation Rules:**
- `rule_id`: required, must exist in room's rules
- `violator_ids`: optional, array of user IDs
- `violator_ids.*`: integer, distinct, user must exist and not be admin
- `description`: optional, string, max 1200 characters
- `photos`: required, array, min 1 file, max 3 files
- `photos.*`: required, image (jpg, jpeg, png, webp), max 5MB per file

**Notes:**
- Minimal 1 foto, maksimal 3 foto
- Support multiple violators (bisa lebih dari 1 orang)
- Status awal selalu `pending`

---

### 4. Update Violation Status (Admin Only)
```http
PATCH /admin/violations/{violation_id}/status
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Request Body - Verify:**
```json
{
  "status": "verified"
}
```

**Request Body - Reject:**
```json
{
  "status": "rejected",
  "reject_reason": "Foto tidak jelas, mohon upload ulang dengan foto yang lebih jelas"
}
```

**Response (200):**
```json
{
  "id": 1,
  "rule": {
    "id": 1,
    "name": "Lupa Presensi",
    "reporter_points": 5,
    "violator_points": -10
  },
  "reporter": {
    "id": 1,
    "name": "John Doe"
  },
  "violator": {
    "id": 2,
    "name": "Jane Smith"
  },
  "violators": [
    {
      "id": 2,
      "name": "Jane Smith"
    }
  ],
  "status": "verified",
  "reject_reason": null
}
```

**Validation Rules:**
- `status`: required, must be `verified` or `rejected`
- `reject_reason`: required when status is `rejected`, optional for `verified`, max 1000 characters

**Notes:**
- Ketika status diubah ke `verified`, poin otomatis ditambahkan ke reporter dan dikurangi dari violator
- Ketika status diubah ke `rejected`, poin tidak diberikan
- Jika status diubah kembali, poin akan di-reset dan dihitung ulang

---

## 🏢 Departments

### 1. Get Departments
```http
GET /departments
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Teknologi dan Produk",
    "room_id": 1,
    "created_at": "2026-01-01T00:00:00.000000Z"
  },
  {
    "id": 2,
    "name": "Marketing",
    "room_id": 1,
    "created_at": "2026-01-01T00:00:00.000000Z"
  }
]
```


**Notes:**
- Di aplikasi Spot Slimrich, department menggunakan Slimrich API (fixed)
- Berbeda dengan OdobDaily yang bisa create department manual

---

### 2. Create Department
```http
POST /departments
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Request Body:**
```json
{
  "name": "Finance"
}
```

**Response (201):**
```json
{
  "id": 3,
  "name": "Finance",
  "room_id": 1,
  "created_at": "2026-07-23T10:00:00.000000Z"
}
```

**Validation Rules:**
- `name`: required, string, max 255 characters, unique per room

---

### 3. Delete Department (Admin Only)
```http
DELETE /admin/departments/{department_id}
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Response (200):**
```json
{
  "message": "Department berhasil dihapus"
}
```

---

### 4. Get Slimrich Departments (Public)
```http
GET /slimrich/departments
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "PT ABC Indonesia",
    "code": "ABC"
  },
  {
    "id": 2,
    "name": "PT XYZ Corporation",
    "code": "XYZ"
  }
]
```

**Notes:**
- Endpoint ini public, tidak perlu autentikasi
- Data di-cache di server untuk performa
- Digunakan untuk referensi department dari Slimrich API

---

## 👤 Profile Management

### 1. Get Profile
```http
GET /profile
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```


**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@humanplus.co.id",
  "role": "reporter",
  "department": "Teknologi",
  "position": "Developer",
  "points": 150,
  "photo": "https://cdn.example.com/photo.jpg",
  "age": 25,
  "created_at": "2026-01-01T00:00:00.000000Z"
}
```

---

### 2. Update Profile
```http
PUT /profile
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "department": "Teknologi dan Produk",
  "position": "Senior Developer",
  "age": 26
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe Updated",
  "email": "john@humanplus.co.id",
  "role": "reporter",
  "department": "Teknologi dan Produk",
  "position": "Senior Developer",
  "points": 150,
  "photo": "https://cdn.example.com/photo.jpg",
  "age": 26
}
```

**Validation Rules:**
- `name`: optional, string, max 255 characters
- `department`: optional, string, max 255 characters
- `position`: optional, string, max 255 characters
- `age`: optional, integer, min 17, max 100

---

### 3. Update Profile Photo
```http
POST /profile/photo
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
Content-Type: multipart/form-data
```

**Request Body:**
```
photo: [file upload]
```


**Response (200):**
```json
{
  "message": "Foto profil berhasil diperbarui",
  "photo_url": "https://cdn.example.com/new-photo.jpg"
}
```

**Validation Rules:**
- `photo`: required, image (jpg, jpeg, png, webp), max 2MB

---

### 4. Delete Profile Photo
```http
DELETE /profile/photo
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Response (200):**
```json
{
  "message": "Foto profil berhasil dihapus"
}
```

---

## 📚 Tutorial

### Complete Tutorial
```http
POST /tutorial/complete
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Tutorial selesai"
}
```

**Notes:**
- Digunakan untuk menandai bahwa user sudah menyelesaikan onboarding tutorial
- User model memiliki field `tutorial_completed` yang akan di-set ke `true`

---

## 👨‍💼 Admin Functions

### 1. Get All Users in Room (Admin Only)
```http
GET /admin/users
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@humanplus.co.id",
    "role": "reporter",
    "department": "Teknologi",
    "position": "Developer",
    "points": 150,
    "photo": null
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@humanplus.co.id",
    "role": "admin",
    "department": "Marketing",
    "position": "Manager",
    "points": 0,
    "photo": null
  }
]
```

---

### 2. Update User (Admin Only)
```http
PUT /admin/users/{user_id}
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "department": "Teknologi",
  "position": "Senior Developer",
  "role": "admin"
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe Updated",
  "email": "john@humanplus.co.id",
  "role": "admin",
  "department": "Teknologi",
  "position": "Senior Developer",
  "points": 150
}
```

**Validation Rules:**
- `name`: optional, string, max 255 characters
- `department`: optional, string, max 255 characters
- `position`: optional, string, max 255 characters
- `role`: optional, must be `admin` or `reporter`

---

### 3. Add Points to User (Admin Only)
```http
POST /admin/users/{user_id}/points
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Request Body:**
```json
{
  "points": 50,
  "reason": "Bonus kinerja bulan ini"
}
```

**Response (200):**
```json
{
  "message": "Poin berhasil ditambahkan",
  "user": {
    "id": 1,
    "name": "John Doe",
    "points": 200
  }
}
```

**Validation Rules:**
- `points`: required, integer (bisa negatif untuk mengurangi)
- `reason`: optional, string, max 500 characters

---

### 4. Get Pending Reports (Admin Only)
```http
GET /admin/reports/pending
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Query Parameters:**
- `per_page`: Results per page (default: 15)
- `page`: Page number


**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "rule": {
        "id": 1,
        "name": "Lupa Presensi"
      },
      "reporter": {
        "id": 1,
        "name": "John Doe",
        "department": "Teknologi"
      },
      "violator": {
        "id": 2,
        "name": "Jane Smith",
        "department": "Marketing"
      },
      "violators": [
        {
          "id": 2,
          "name": "Jane Smith"
        }
      ],
      "description": "Lupa presensi pagi",
      "photos": ["https://cdn.example.com/violation1.jpg"],
      "status": "pending",
      "created_at": "2026-07-23T09:00:00.000000Z"
    }
  ],
  "current_page": 1,
  "last_page": 3,
  "per_page": 15,
  "total": 42
}
```

---

### 5. Get Verification History (Admin Only)
```http
GET /admin/reports/history
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Query Parameters:**
- `status`: `verified` | `rejected` | `all` (default: `all`)
- `per_page`: Results per page (default: 15)
- `page`: Page number

**Response (200):**
```json
{
  "data": [
    {
      "id": 5,
      "rule": {
        "id": 1,
        "name": "Lupa Presensi"
      },
      "reporter": {
        "id": 1,
        "name": "John Doe"
      },
      "violator": {
        "id": 2,
        "name": "Jane Smith"
      },
      "status": "verified",
      "reject_reason": null,
      "created_at": "2026-07-22T09:00:00.000000Z",
      "updated_at": "2026-07-22T10:00:00.000000Z"
    }
  ],
  "current_page": 1,
  "last_page": 5,
  "per_page": 15,
  "total": 68
}
```

---

### 6. Get Report Summary (Admin Only)
```http
GET /admin/report-summary
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Response (200):**
```json
{
  "total_reports": 156,
  "pending_reports": 12,
  "verified_reports": 120,
  "rejected_reports": 24,
  "total_reporters": 45,
  "most_active_reporter": {
    "id": 1,
    "name": "John Doe",
    "total_reports": 23
  },
  "most_violated_rule": {
    "id": 1,
    "name": "Lupa Presensi",
    "total_violations": 45
  }
}
```

---

### 7. Export to Excel (Admin Only)
```http
GET /admin/export/excel
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Query Parameters:**
- `period`: `all-time` | `daily` | `weekly` | `monthly` | `yearly`
- `date`: For daily period (format: YYYY-MM-DD)
- `month`: For monthly period (format: YYYY-MM or month number)
- `year`: For yearly/monthly/weekly period
- `week`: For weekly period (week number in month)

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File download dengan nama: `leaderboard-{period}-{date}.xlsx`

---

### 8. Export to PDF (Admin Only)
```http
GET /admin/export/pdf
Authorization: Bearer {token}
Headers: X-Room-Id: {room_id}
```

**Query Parameters:**
- Same as Excel export

**Response:**
- Content-Type: `application/pdf`
- File download dengan nama: `leaderboard-{period}-{date}.pdf`

---

## 📝 Response Formats

### Success Response
```json
{
  "data": {},
  "message": "Success message"
}
```

### Paginated Response
```json
{
  "data": [],
  "current_page": 1,
  "last_page": 5,
  "per_page": 10,
  "total": 50
}
```


### Error Response
```json
{
  "message": "Error message",
  "errors": {
    "field_name": [
      "Validation error message"
    ]
  }
}
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Status Code | Description |
|------------|-------------|
| 200 | OK - Request berhasil |
| 201 | Created - Resource berhasil dibuat |
| 400 | Bad Request - Request tidak valid |
| 401 | Unauthorized - Token tidak valid atau expired |
| 403 | Forbidden - User tidak memiliki akses |
| 404 | Not Found - Resource tidak ditemukan |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error |
| 502 | Bad Gateway - External service error (Slimrich API) |

---

### Common Error Responses

**401 Unauthorized:**
```json
{
  "message": "Unauthenticated."
}
```

**403 Forbidden:**
```json
{
  "message": "User tidak memiliki akses ke room ini"
}
```

**404 Not Found:**
```json
{
  "message": "Resource not found"
}
```

**422 Validation Error:**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": [
      "Email sudah digunakan"
    ],
    "password": [
      "Password minimal 8 karakter"
    ]
  }
}
```

**502 Slimrich API Error:**
```json
{
  "message": "Server autentikasi tidak dapat dihubungi"
}
```

---

## 🔒 Authentication & Authorization

### JWT Token
- Token dikirim melalui header `Authorization: Bearer {token}`
- Token valid selama 7 hari
- Token berisi: `user_id`, `email`, `role`, `iat`, `exp`

### Room Context
- Beberapa endpoint memerlukan header `X-Room-Id: {room_id}`
- User harus menjadi member dari room tersebut
- Middleware `room.member` akan memvalidasi akses user ke room

### Role-Based Access Control

**Reporter Role:**
- Bisa membuat violation report
- Bisa melihat leaderboard dan statistik
- Bisa update profile sendiri
- Tidak bisa approve/reject violation
- Tidak bisa mengelola rules

**Admin Role:**
- Semua akses reporter
- Bisa approve/reject violation
- Bisa mengelola rules (create, update, delete)
- Bisa melihat semua laporan
- Bisa export data (Excel, PDF)
- Bisa mengelola user di room
- Bisa menambah/mengurangi poin user secara manual

---

## 🌐 Media/File URLs

### Get Media File
```http
GET /media?path={file_path}
```

**Example:**
```
GET /media?path=violations/abc123.jpg
GET /media?path=profile-photos/user1.jpg
```

**Response:**
- Returns the actual file with appropriate Content-Type
- 404 if file not found

**Notes:**
- Digunakan untuk mengakses file yang disimpan di storage public
- Path bisa berupa: `violations/*`, `profile-photos/*`, `room-logos/*`

---

## 📱 Integration Notes for Mobile App

### 1. Multi-Company Support
- User bisa join ke multiple rooms (perusahaan)
- Setiap request yang memerlukan context room harus mengirim `X-Room-Id` header
- Mobile app perlu menyimpan list rooms yang user join
- User perlu memilih room aktif sebelum melakukan action (spotting, melihat leaderboard, dll)


### 2. Slimrich Integration
- Aplikasi ini terintegrasi dengan Slimrich API untuk autentikasi dan sync user
- Department fixed dari Slimrich API (berbeda dengan OdobDaily yang bisa create manual)
- Jika Slimrich API error, sistem fallback ke local authentication
- Sync user dari Slimrich dilakukan otomatis saat login dan saat fetch users

### 3. File Upload
- Gunakan `multipart/form-data` untuk upload file
- Maximum file size:
  - Violation photos: 5MB per file
  - Profile photo: 2MB
  - Room logo: 2MB
- Supported formats: jpg, jpeg, png, webp
- Violation photos: minimal 1, maksimal 3 photos

### 4. Points System
- Reporter dapat poin positif ketika laporan diverifikasi
- Violator dapat poin negatif (dikurangi)
- Admin bisa menambah/mengurangi poin secara manual
- Total poin user dihitung otomatis dari semua verified violations

### 5. Pagination
- Default `per_page` = 10 atau 15 (tergantung endpoint)
- Maximum `per_page` = 50
- Gunakan parameter `page` untuk navigasi halaman

### 6. Filtering & Search
- Leaderboard support filter by:
  - Period (daily, weekly, monthly, yearly, all-time)
  - Department
  - Search by name
  - Sort direction (asc/desc)
- Violations bisa difilter by status (pending, verified, rejected)

### 7. Role Separation
- Role admin dan reporter aman karena terpisah per room
- Satu user bisa jadi admin di room A dan reporter di room B
- Role di-check pada level room membership, bukan global

### 8. Database Sharing
- Database MySQL bisa diakses oleh aplikasi OdobDaily dan Spot Slimrich
- Kedua aplikasi menggunakan tabel yang sama (`users`, `violations`, `rules`, dll)
- Perbedaan ada di logic aplikasi dan UI, bukan di database schema

---

## 🔄 Recommended Mobile App Flow

### First Time User
1. Show onboarding tutorial
2. Register/Login → `POST /auth/register` or `POST /auth/login`
3. Get user info → `GET /auth/me`
4. Show room selection:
   - Option 1: Join existing room → `POST /rooms/join`
   - Option 2: Create new room → `POST /rooms`
5. Complete tutorial → `POST /tutorial/complete`

### Returning User
1. Login → `POST /auth/login`
2. Get user rooms → `GET /rooms`
3. User selects active room
4. Navigate to main features (dashboard, spotting, profile)

### Daily Usage - Reporter
1. View dashboard & leaderboard → `GET /dashboard/leaderboard`, `GET /dashboard/stats`
2. Create spotting report:
   - Get rules → `GET /rules`
   - Get users → `GET /users`
   - Upload photos and submit → `POST /violations`
3. Check my reports → `GET /violations/my`
4. Update profile → `PUT /profile`, `POST /profile/photo`

### Daily Usage - Admin
1. Check pending reports → `GET /admin/reports/pending`
2. Verify or reject reports → `PATCH /admin/violations/{id}/status`
3. View statistics → `GET /admin/report-summary`
4. Manage rules → `GET /rules`, `POST /admin/rules`, `PUT /admin/rules/{id}`
5. Manage users → `GET /admin/users`, `PUT /admin/users/{id}`
6. Export data → `GET /admin/export/excel` or `GET /admin/export/pdf`

---

## 🧪 Testing Endpoints

### Using cURL

**Login:**
```bash
curl -X POST https://spot.slimrich.id/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@humanplus.co.id","password":"password123"}'
```

**Get Leaderboard:**
```bash
curl -X GET "https://spot.slimrich.id/api/dashboard/leaderboard?period=monthly" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Room-Id: 1"
```

**Create Violation:**
```bash
curl -X POST https://spot.slimrich.id/api/violations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Room-Id: 1" \
  -F "rule_id=1" \
  -F "violator_ids[]=2" \
  -F "description=Lupa presensi" \
  -F "photos[]=@/path/to/photo1.jpg" \
  -F "photos[]=@/path/to/photo2.jpg"
```

---

## 🔐 Security Considerations

### 1. HTTPS Required
- Semua API calls harus menggunakan HTTPS di production
- JWT token sangat sensitif, jangan dikirim via HTTP

### 2. Token Storage
- Simpan JWT token dengan aman di device (Keychain/Keystore)
- Jangan simpan di SharedPreferences/UserDefaults tanpa enkripsi
- Refresh token sebelum expired (7 hari)

### 3. Input Validation
- Validasi input di client side sebelum kirim ke server
- Handle validation errors (422) dengan baik di UI

### 4. File Upload Security
- Validasi file type dan size di client sebelum upload
- Compress images jika terlalu besar
- Show upload progress untuk better UX

### 5. Rate Limiting
- Implementasi retry logic dengan exponential backoff
- Handle 429 Too Many Requests jika ada

### 6. Sensitive Data
- Jangan log JWT token atau password
- Mask sensitive info di error messages
- Clear token saat logout

---

## 📞 Support & Contact

Jika ada pertanyaan atau issue terkait API:
- Email: support@humanplus.co.id
- API Version: 1.0
- Last Updated: July 23, 2026

---

## ✅ Checklist untuk Mobile Developer

- [ ] Implementasi authentication flow (login, register, logout)
- [ ] Simpan JWT token dengan aman
- [ ] Implementasi room selection dan switching
- [ ] Handle multi-company context dengan X-Room-Id header
- [ ] Implementasi file upload untuk photos (violation, profile, logo)
- [ ] Implementasi pagination untuk list data
- [ ] Handle error responses dengan baik
- [ ] Implementasi filtering & search
- [ ] Support offline mode (optional)
- [ ] Implementasi push notification (optional, butuh endpoint tambahan)
- [ ] Testing semua endpoint dengan berbagai role (admin, reporter)
- [ ] Handle Slimrich API integration edge cases

---

## 📚 Additional Resources

### Database Schema
Lihat file migrations di `database/migrations/` untuk struktur tabel lengkap.

### Environment Variables
```env
# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Slimrich Integration (Optional)
SLIMRICH_AUTH_ENABLED=true
SLIMRICH_BASE_URL=https://slimrich.id
SLIMRICH_APP_KEY=your_app_key
SLIMRICH_APP_SECRET=your_app_secret
SLIMRICH_API_TOKEN=your_api_token

# Bunny CDN (Optional)
BUNNY_API_URL=https://storage.bunnycdn.com
BUNNY_PULL_URL=https://your-cdn.b-cdn.net
BUNNY_API_KEY=your_api_key
```

---

**End of API Documentation**

