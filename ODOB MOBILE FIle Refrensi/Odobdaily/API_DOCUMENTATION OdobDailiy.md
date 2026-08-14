# OdobDaily Mobile API Documentation

**Base URL:** `https://odobdaily.com/api`

**Version:** 1.0

**Last Updated:** January 2026

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Room/Company Management](#roomcompany-management)
4. [Dashboard & Leaderboard](#dashboard--leaderboard)
5. [Rules](#rules)
6. [Violations/Spotting](#violationsspotting)
7. [Profile](#profile)
8. [Admin Endpoints](#admin-endpoints)
9. [Departments](#departments)
10. [Error Handling](#error-handling)
11. [Security Notes](#security-notes)

---

## 🔐 Authentication

All API endpoints (except login/register/Google OAuth) require JWT token in header:

```
Authorization: Bearer {token}
```

### Register

**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "password": "password123",
  "password_confirmation": "password123",
  "department": "Engineering", // optional
  "position": "Developer" // optional
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@company.com",
    "role": "reporter",
    "department": "Engineering",
    "position": "Developer",
    "photo": null,
    "points": 0,
    "created_at": "2026-01-01T00:00:00.000000Z",
    "updated_at": "2026-01-01T00:00:00.000000Z"
  }
}
```

---

### Login

**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@company.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { /* same as register response */ }
}
```

**Error (422):**
```json
{
  "message": "Email atau password salah"
}
```

---

### Google OAuth Login

**Step 1: Get Google Auth URL**

**GET** `/auth/google`

**Response (200):**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Step 2: Handle Callback**

After user authorizes, Google redirects to:
`https://odobdaily.com/api/auth/google/callback?code=xxx`

Backend processes and redirects to:
`https://odobdaily.com/login#/auth/google/callback?token=xxx`

Mobile app should:
1. Open Google OAuth URL in browser/webview
2. Intercept redirect with `token` parameter
3. Extract token and store it

---

### Get Current User

**GET** `/auth/me`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@company.com",
  "role": "reporter",
  "department": "Engineering",
  "position": "Developer",
  "photo": "https://odobdaily.b-cdn.net/profiles/photo.jpg",
  "points": 150,
  "created_at": "2026-01-01T00:00:00.000000Z",
  "updated_at": "2026-01-01T00:00:00.000000Z"
}
```

---

### Refresh Token

**POST** `/auth/refresh`

**Headers:** `Authorization: Bearer {old_token}`

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { /* user object */ }
}
```

---

### Logout

**POST** `/auth/logout`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "message": "Logout berhasil"
}
```

---

## 👥 User Management

### Get Users in Room

**GET** `/admin/users`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Query Params:**
- `paginate=true` - Enable pagination
- `per_page=10` - Items per page (max 100)
- `page=1` - Page number

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@company.com",
    "age": 25,
    "department": "Engineering",
    "position": "Developer",
    "photo": "https://...",
    "role": "admin",
    "points": 150,
    "created_at": "2026-01-01T00:00:00.000000Z"
  }
]
```

With pagination:
```json
{
  "current_page": 1,
  "data": [ /* array of users */ ],
  "first_page_url": "...",
  "from": 1,
  "last_page": 5,
  "last_page_url": "...",
  "next_page_url": "...",
  "path": "...",
  "per_page": 10,
  "prev_page_url": null,
  "to": 10,
  "total": 50
}
```

---

## 🏢 Room/Company Management

### Get All Rooms

**GET** `/rooms`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "HUMPLUS",
    "code": "HMP2026",
    "description": "Technology Company",
    "photo": "https://odobdaily.b-cdn.net/rooms/photo.jpg",
    "member_count": 25,
    "membership_role": "admin",
    "can_manage": true,
    "created_at": "2026-01-01T00:00:00.000000Z"
  }
]
```

---

### Create Room

**POST** `/rooms`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "name": "HUMPLUS",
  "description": "Technology Company", // optional
  "photo": "base64_encoded_image" // optional
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "HUMPLUS",
  "code": "HMP2026",
  "description": "Technology Company",
  "photo": "https://...",
  "member_count": 1,
  "membership_role": "admin",
  "can_manage": true,
  "created_at": "2026-01-01T00:00:00.000000Z"
}
```

---

### Join Room

**POST** `/rooms/join`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "code": "HMP2026"
}
```

**Response (200):**
```json
{
  "message": "Berhasil bergabung dengan perusahaan HUMPLUS",
  "room": { /* room object */ }
}
```

**Error (422):**
```json
{
  "message": "Kode perusahaan tidak valid atau perusahaan tidak ditemukan."
}
```

---

### Update Room

**PATCH** `/rooms/{id}`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: {id}
```

**Request Body:**
```json
{
  "name": "HUMPLUS Updated",
  "description": "New description",
  "photo": "base64_encoded_image" // optional
}
```

**Response (200):**
```json
{
  "message": "Perusahaan berhasil diperbarui",
  "room": { /* updated room object */ }
}
```

---

### Delete Room

**DELETE** `/rooms/{id}`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: {id}
```

**Response (200):**
```json
{
  "message": "Perusahaan berhasil dihapus"
}
```

---

### Add Admin to Room

**POST** `/rooms/{id}/admins`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: {id}
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
  "message": "User berhasil ditambahkan sebagai admin"
}
```

---

## 📊 Dashboard & Leaderboard

### Get Leaderboard

**GET** `/dashboard/leaderboard`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@company.com",
    "department": "Engineering",
    "position": "Developer",
    "photo": "https://...",
    "points": 250,
    "rank": 1
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@company.com",
    "department": "Marketing",
    "position": "Manager",
    "photo": "https://...",
    "points": 200,
    "rank": 2
  }
]
```

---

### Get Dashboard Stats

**GET** `/dashboard/stats`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Response (200):**
```json
{
  "total_members": 25,
  "total_spotting": 150,
  "pending_verifications": 5,
  "your_rank": 3,
  "your_points": 180,
  "top_violators": [
    {
      "user_id": 1,
      "name": "John Doe",
      "photo": "https://...",
      "violation_count": 15
    }
  ],
  "recent_activities": [
    {
      "id": 1,
      "type": "spotting",
      "message": "John Doe melaporkan Jane Smith",
      "created_at": "2026-01-15T10:30:00.000000Z"
    }
  ]
}
```

---

## 📜 Rules

### Get All Rules

**GET** `/rules`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Response (200):**
```json
[
  {
    "id": 1,
    "room_id": 1,
    "name": "Lupa Badge",
    "category": "Ketertiban",
    "description": "Lupa membawa badge ID",
    "admin_only": false,
    "created_at": "2026-01-01T00:00:00.000000Z",
    "updated_at": "2026-01-01T00:00:00.000000Z"
  }
]
```

---

### Create Rule (Admin Only)

**POST** `/admin/rules`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Request Body:**
```json
{
  "name": "Lupa Badge",
  "category": "Ketertiban",
  "description": "Lupa membawa badge ID",
  "admin_only": false
}
```

**Response (201):**
```json
{
  "id": 1,
  "room_id": 1,
  "name": "Lupa Badge",
  "category": "Ketertiban",
  "description": "Lupa membawa badge ID",
  "admin_only": false,
  "created_at": "2026-01-01T00:00:00.000000Z",
  "updated_at": "2026-01-01T00:00:00.000000Z"
}
```

---

### Update Rule (Admin Only)

**PUT** `/admin/rules/{id}`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Request Body:**
```json
{
  "name": "Lupa Badge (Updated)",
  "category": "Ketertiban",
  "description": "Updated description",
  "admin_only": false
}
```

**Response (200):**
```json
{
  "id": 1,
  /* updated rule object */
}
```

---

### Delete Rule (Admin Only)

**DELETE** `/admin/rules/{id}`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Response (200):**
```json
{
  "message": "Rule berhasil dihapus (soft delete)"
}
```

---

### Get Deleted Rules (Admin Only)

**GET** `/admin/rules/deleted`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Old Rule",
    "deleted_at": "2026-01-10T00:00:00.000000Z"
  }
]
```

---

### Restore Rule (Admin Only)

**PATCH** `/admin/rules/{id}/restore`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Response (200):**
```json
{
  "message": "Rule berhasil dipulihkan"
}
```

---

## 🚨 Violations/Spotting

### Get All Violations

**GET** `/violations`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Query Params:**
- `status=pending|verified|rejected` - Filter by status
- `page=1` - Page number
- `per_page=10` - Items per page

**Response (200):**
```json
[
  {
    "id": 1,
    "room_id": 1,
    "rule_id": 1,
    "reporter_id": 2,
    "violator_id": 1,
    "violator_ids": [1, 3],
    "description": "Lupa badge di meja",
    "photos": [
      "https://odobdaily.b-cdn.net/violations/photo1.jpg"
    ],
    "status": "verified",
    "reject_reason": null,
    "incident_at": "2026-01-15T10:00:00.000000Z",
    "created_at": "2026-01-15T10:30:00.000000Z",
    "updated_at": "2026-01-15T11:00:00.000000Z",
    "rule": {
      "id": 1,
      "name": "Lupa Badge"
    },
    "reporter": {
      "id": 2,
      "name": "Jane Smith",
      "department": "HR",
      "photo": "https://..."
    },
    "violator": {
      "id": 1,
      "name": "John Doe",
      "department": "Engineering",
      "photo": "https://..."
    },
    "violators": [
      {
        "id": 1,
        "name": "John Doe",
        "department": "Engineering",
        "photo": "https://..."
      },
      {
        "id": 3,
        "name": "Bob Wilson",
        "department": "Marketing",
        "photo": "https://..."
      }
    ]
  }
]
```

---

### Get My Reports

**GET** `/violations/my`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Response (200):** Same format as Get All Violations

---

### Create Violation (Spotting)

**POST** `/violations`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
```
rule_id: 1
violator_ids[]: 1
violator_ids[]: 3
description: "Lupa badge di meja"
incident_at: "2026-01-15 10:00:00"
photos[]: <file>
photos[]: <file>
```

**Validation:**
- `rule_id`: required, exists in rules
- `violator_ids[]`: required, array, min 1 user
- `description`: required, max 500 chars
- `incident_at`: optional, datetime
- `photos[]`: optional, array of images, max 3 files, each max 3MB

**Response (201):**
```json
{
  "id": 1,
  "room_id": 1,
  "rule_id": 1,
  "reporter_id": 2,
  "violator_id": 1,
  "violator_ids": [1, 3],
  "description": "Lupa badge di meja",
  "photos": [
    "https://odobdaily.b-cdn.net/violations/photo1.jpg"
  ],
  "status": "pending",
  "incident_at": "2026-01-15T10:00:00.000000Z",
  "created_at": "2026-01-15T10:30:00.000000Z",
  "updated_at": "2026-01-15T10:30:00.000000Z"
}
```

---

### Update Violation Status (Admin Only)

**PATCH** `/admin/violations/{id}/status`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Request Body:**
```json
{
  "status": "verified",
  "reject_reason": null // required if status is "rejected"
}
```

**Response (200):**
```json
{
  "message": "Status violation berhasil diperbarui",
  "violation": { /* updated violation object */ }
}
```

---

## 👤 Profile

### Get Profile

**GET** `/profile`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@company.com",
  "age": 25,
  "department": "Engineering",
  "position": "Developer",
  "photo": "https://odobdaily.b-cdn.net/profiles/photo.jpg",
  "points": 150,
  "rank": 3,
  "total_violations": 5,
  "violation_breakdown": [
    {
      "rule_name": "Lupa Badge",
      "count": 3
    },
    {
      "rule_name": "Terlambat",
      "count": 2
    }
  ],
  "created_at": "2026-01-01T00:00:00.000000Z"
}
```

---

### Update Profile

**PUT** `/profile`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "age": 26,
  "department": "Engineering",
  "position": "Senior Developer"
}
```

**Response (200):**
```json
{
  "message": "Profil berhasil diperbarui",
  "user": { /* updated user object */ }
}
```

---

### Update Profile Photo

**POST** `/profile/photo`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
Content-Type: multipart/form-data
```

**Request Body:**
```
photo: <file> (image, max 3MB)
```

**Response (200):**
```json
{
  "message": "Foto profil berhasil diperbarui",
  "photo_url": "https://odobdaily.b-cdn.net/profiles/photo.jpg"
}
```

---

### Delete Profile Photo

**DELETE** `/profile/photo`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Response (200):**
```json
{
  "message": "Foto profil berhasil dihapus"
}
```

---

## 🔧 Admin Endpoints

### Get Pending Reports

**GET** `/admin/reports/pending`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Response (200):**
```json
[
  {
    "id": 1,
    "rule": { "id": 1, "name": "Lupa Badge" },
    "reporter": {
      "id": 2,
      "name": "Jane Smith",
      "department": "HR",
      "photo": "https://..."
    },
    "violator": {
      "id": 1,
      "name": "John Doe",
      "department": "Engineering",
      "photo": "https://..."
    },
    "violators": [ /* array of violators */ ],
    "description": "Lupa badge di meja",
    "photos": ["https://..."],
    "status": "pending",
    "incident_at": "2026-01-15T10:00:00.000000Z",
    "created_at": "2026-01-15T10:30:00.000000Z"
  }
]
```

---

### Get Verification History

**GET** `/admin/reports/history`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Query Params:**
- `status=verified|rejected|all` (default: all)
- `date_mode=daily|monthly|yearly|all` (default: all)
- `date=2026-01-15` (for daily)
- `month=2026-01` (for monthly)
- `year=2026` (for yearly)
- `per_page=10` (max 100)
- `page=1`

**Response (200):**
```json
{
  "current_page": 1,
  "data": [ /* array of violations */ ],
  "first_page_url": "...",
  "from": 1,
  "last_page": 5,
  "per_page": 10,
  "to": 10,
  "total": 50
}
```

---

### Update User (Admin Only)

**PUT** `/admin/users/{id}`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Request Body:**
```json
{
  "name": "John Doe",
  "age": 25,
  "department": "Engineering",
  "position": "Developer",
  "role": "reporter"
}
```

**Response (200):**
```json
{
  "id": 1,
  /* updated user object */
}
```

---

### Add Manual Points (Admin Only)

**POST** `/admin/users/{id}/points`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
Content-Type: multipart/form-data
```

**Request Body:**
```
points: -10 (integer, between -100 to 100, cannot be 0)
note: "Penalty for late submission" (optional, max 500 chars)
evidence: <file> (optional, image, max 3MB)
```

**Response (201):**
```json
{
  "message": "Poin manual berhasil ditambahkan",
  "data": {
    "user_id": 1,
    "points_added": -10,
    "current_points": 140,
    "log_id": 5,
    "violation_id": 10
  }
}
```

---

### Get Report Summary

**GET** `/admin/report-summary`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Query Params:**
- `period=monthly|yearly` (default: monthly)
- `month=2026-01` (for monthly)
- `year=2026` (for yearly)

**Response (200):**
```json
{
  "period": "monthly",
  "label": "Januari 2026",
  "start_date": "2026-01-01",
  "end_date": "2026-01-31",
  "summary": {
    "total_spotting": 150,
    "total_new_users": 10
  },
  "breakdown": [
    {
      "label": "01 Jan 2026",
      "spotting_count": 5,
      "new_user_count": 1
    }
  ]
}
```

---

### Export Excel Report

**GET** `/admin/export/excel`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Query Params:**
- `period=monthly|yearly`
- `month=2026-01` (for monthly)
- `year=2026` (for yearly)

**Response:** Excel file download (.xlsx)

---

### Export PDF Report

**GET** `/admin/export/pdf`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Query Params:** Same as Excel export

**Response:** PDF file download (.pdf)

---

## 🏢 Departments

### Get Departments

**GET** `/departments`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Response (200):**
```json
[
  {
    "id": 1,
    "room_id": 1,
    "name": "Engineering",
    "created_at": "2026-01-01T00:00:00.000000Z",
    "updated_at": "2026-01-01T00:00:00.000000Z"
  },
  {
    "id": 2,
    "room_id": 1,
    "name": "Marketing",
    "created_at": "2026-01-01T00:00:00.000000Z",
    "updated_at": "2026-01-01T00:00:00.000000Z"
  }
]
```

---

### Create Department (Admin Only)

**POST** `/admin/departments`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Request Body:**
```json
{
  "name": "Engineering"
}
```

**Response (201):**
```json
{
  "id": 1,
  "room_id": 1,
  "name": "Engineering",
  "created_at": "2026-01-01T00:00:00.000000Z",
  "updated_at": "2026-01-01T00:00:00.000000Z"
}
```

**Error (422):**
```json
{
  "message": "Departemen dengan nama tersebut sudah ada.",
  "errors": {
    "name": ["Departemen dengan nama tersebut sudah ada."]
  }
}
```

---

### Delete Department (Admin Only)

**DELETE** `/admin/departments/{id}`

**Headers:**
```
Authorization: Bearer {token}
X-Room-Id: 1
```

**Response (200):**
```json
{
  "message": "Departemen berhasil dihapus."
}
```

---

## 🔴 Error Handling

### Standard Error Response

All errors return JSON with `message` field:

```json
{
  "message": "Error description"
}
```

For validation errors (422):
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

---

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `422` - Unprocessable Entity (validation error)
- `500` - Internal Server Error

---

### Common Error Scenarios

**1. Missing Token**
```json
Status: 401
{
  "message": "Unauthenticated."
}
```

**2. Invalid Token**
```json
Status: 401
{
  "message": "Token tidak valid atau sudah kedaluwarsa"
}
```

**3. Missing Room ID**
```json
Status: 400
{
  "message": "X-Room-Id header diperlukan"
}
```

**4. Not Room Member**
```json
Status: 403
{
  "message": "Anda bukan anggota perusahaan ini"
}
```

**5. Admin Only Endpoint**
```json
Status: 403
{
  "message": "Hanya admin yang dapat mengakses endpoint ini"
}
```

---

## 🔒 Security Notes

### 1. Authentication

- JWT tokens expire after 7 days
- Store token securely in mobile app (Keychain/Keystore)
- Implement token refresh before expiry
- Never store password locally

### 2. Room Context

Most endpoints require `X-Room-Id` header:
```
X-Room-Id: 1
```

This ensures:
- Data isolation between companies
- Authorization checks per room
- User can be in multiple rooms

### 3. File Upload

**Supported Formats:**
- Images: JPG, JPEG, PNG, WebP
- Max size: 3MB per file
- Max files per request: 3 (for violations)

**Upload Methods:**
- Multipart form-data (recommended for mobile)
- Base64 encoded string (for small files)

**Example (multipart):**
```
Content-Type: multipart/form-data

photo: <binary file data>
```

**Example (base64):**
```json
{
  "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
}
```

### 4. Rate Limiting

API implements rate limiting:
- 60 requests per minute per user
- Exceeded limit returns 429 status

### 5. CORS

API allows cross-origin requests from mobile apps.
Include standard headers:
```
Content-Type: application/json
Accept: application/json
```

### 6. HTTPS Only

**⚠️ IMPORTANT:** Always use HTTPS endpoints:
- ✅ `https://odobdaily.com/api`
- ❌ `http://odobdaily.com/api`

---

## 📱 Mobile App Implementation Guide

### Initial Setup

1. **Base Configuration**
```dart
// Example (Flutter)
class ApiConfig {
  static const String baseUrl = 'https://odobdaily.com/api';
  static const Duration timeout = Duration(seconds: 30);
}
```

2. **Store Token**
```dart
// After login/register
final token = response.data['token'];
await secureStorage.write(key: 'jwt_token', value: token);
```

3. **Add Interceptor**
```dart
dio.interceptors.add(InterceptorsWrapper(
  onRequest: (options, handler) async {
    final token = await secureStorage.read(key: 'jwt_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    
    final roomId = await secureStorage.read(key: 'active_room_id');
    if (roomId != null) {
      options.headers['X-Room-Id'] = roomId;
    }
    
    return handler.next(options);
  },
));
```

---

### User Flow

**1. Authentication Flow**
```
App Launch
  ↓
Check Token Exists?
  ├─ No → Show Login/Register
  └─ Yes → Validate Token (GET /auth/me)
           ├─ Valid → Get Rooms
           └─ Invalid → Show Login
```

**2. Room Selection Flow**
```
Get Rooms (GET /rooms)
  ↓
User Selects Room
  ↓
Store Room ID
  ↓
Set X-Room-Id Header
  ↓
Load Room Data
```

**3. Spotting Flow**
```
User Opens Spotting Form
  ↓
Load Rules (GET /rules)
Load Users (GET /admin/users or /users)
  ↓
User Fills Form + Upload Photos
  ↓
Submit (POST /violations)
  ↓
Show Success Message
```

---

### Handling Multiple Apps (OdobDaily + Spot.Slimrich)

**Recommended Approach: Multi-tenant Flag**

Add `source` field to rooms table:
```sql
ALTER TABLE rooms ADD COLUMN source ENUM('odobdaily', 'spot_slimrich') DEFAULT 'odobdaily';
```

Mobile app logic:
```dart
final rooms = await api.getRooms();
final odobRooms = rooms.where((r) => r.source == 'odobdaily');
final slimrichRooms = rooms.where((r) => r.source == 'spot_slimrich');

// Show all rooms grouped by source
```

**Alternative: Separate Endpoints**

Keep two base URLs:
```dart
const odobBaseUrl = 'https://odobdaily.com/api';
const slimrichBaseUrl = 'https://spot.slimrich.id/api';

// Switch based on room type
```

---

## 🧪 Testing Endpoints

### Using cURL

```bash
# Login
curl -X POST https://odobdaily.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get Rooms
curl -X GET https://odobdaily.com/api/rooms \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create Violation
curl -X POST https://odobdaily.com/api/violations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Room-Id: 1" \
  -F "rule_id=1" \
  -F "violator_ids[]=2" \
  -F "description=Test violation" \
  -F "photos[]=@photo.jpg"
```

### Using Postman

Import this collection structure:
```
OdobDaily API
├── Auth
│   ├── Register
│   ├── Login
│   ├── Get Me
│   └── Logout
├── Rooms
│   ├── Get Rooms
│   ├── Create Room
│   └── Join Room
├── Violations
│   ├── Get Violations
│   └── Create Violation
└── ... (other endpoints)
```

---

## 📞 Support

**Issues & Questions:**
- GitHub: https://github.com/HUMPLUS-IT/one-day-one-behavior
- Email: support@odobdaily.com

**API Version:** 1.0
**Last Updated:** January 2026
