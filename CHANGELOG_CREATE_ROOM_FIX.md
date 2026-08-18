# Changelog: Fix Create Room dan Join Room

## 🐛 Problem

User tidak bisa membuat room baru atau join room dengan kode invite.

### Root Cause

Ketika user pernah masuk ke dalam sebuah room, `activeRoom` tersimpan di state. Saat membuat request API, semua request secara otomatis menambahkan header `X-Room-Id` dari `activeRoom` yang aktif.

**Masalahnya:**
- Endpoint `POST /rooms` (create room) adalah **operasi global** - tidak seharusnya menerima header `X-Room-Id`
- Endpoint `POST /rooms/join` (join room) juga **operasi global** - tidak seharusnya menerima header `X-Room-Id`
- Backend kemungkinan menolak request dengan status **409 Conflict** atau **403 Forbidden** jika menerima `X-Room-Id` pada endpoint-endpoint ini

### Scenario

1. User login ke aplikasi
2. User masuk ke Room A → `activeRoom` = Room A
3. User kembali ke halaman Room List
4. User mencoba membuat room baru atau join room
5. **Request gagal** karena mengirim header `X-Room-Id: <Room A ID>` padahal endpoint create/join tidak memerlukan header ini

---

## ✅ Solution

### 1. Tambahkan Flag `skipRoomId` di Base Client

**File**: `src/api/clients/baseClient.ts`

Modifikasi request interceptor untuk mengecek flag `skipRoomId`:

```typescript
// Request interceptor - add token and room ID
client.interceptors.request.use(
  async (requestConfig) => {
    // ... (token logic)

    // Get active room ID if function provided
    // Skip if request explicitly sets skipRoomId flag
    const skipRoomId = (requestConfig as any).skipRoomId;
    if (options.getActiveRoomId && !skipRoomId) {
      const roomId = await options.getActiveRoomId();
      if (roomId) {
        requestConfig.headers['X-Room-Id'] = String(roomId);
      }
    }

    // ... (rest of logic)
  },
);
```

**Logic:**
- Jika request memiliki property `skipRoomId: true`, maka **TIDAK** akan menambahkan header `X-Room-Id`
- Ini memungkinkan operasi global seperti create room dan join room untuk tidak mengirim room context

---

### 2. Update `createRoom()` di UnifiedRoomService

**File**: `src/services/unifiedRoomService.ts`

```typescript
static async createRoom(
  backend: BackendType,
  payload: { name: string; description?: string },
): Promise<Room> {
  const client = spotClient();

  // Create room without X-Room-Id header (it's a global operation)
  const { data } = await client.post<Room>('/rooms', payload, {
    skipRoomId: true, // Flag to skip X-Room-Id header
  } as any);
  
  return normalizeRoom(data, backend);
}
```

**Perubahan:**
- Menambahkan `skipRoomId: true` pada axios config
- Request ini **tidak akan** mengirim header `X-Room-Id`

---

### 3. Update `joinRoom()` di UnifiedRoomService

**File**: `src/services/unifiedRoomService.ts`

```typescript
static async joinRoom(
  backend: BackendType,
  code: string,
): Promise<{ room: Room; message: string }> {
  const client = spotClient();

  // Join room without X-Room-Id header (it's a global operation)
  const { data } = await client.post<{ message: string; room: Room }>(
    '/rooms/join',
    { code },
    { skipRoomId: true } as any, // Flag to skip X-Room-Id header
  );

  return {
    ...data,
    room: normalizeRoom(data.room, backend),
  };
}
```

**Perubahan:**
- Menambahkan `skipRoomId: true` pada axios config
- Request ini **tidak akan** mengirim header `X-Room-Id`

---

## 📊 Request Comparison

### Before Fix ❌

```http
POST /api/rooms HTTP/1.1
Authorization: Bearer <token>
X-Room-Id: 123        <-- ❌ Should not be here!
Content-Type: application/json

{
  "name": "halo",
  "description": ""
}
```

**Result**: 409 Conflict atau 403 Forbidden

---

### After Fix ✅

```http
POST /api/rooms HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "halo",
  "description": ""
}
```

**Result**: 201 Created ✅

---

## 🎯 Which Endpoints Need `skipRoomId`?

### Global Operations (Need `skipRoomId: true`)

These operations are not tied to a specific room:

- ✅ `POST /rooms` - Create new room
- ✅ `POST /rooms/join` - Join room by invite code
- ✅ `GET /rooms` - List all rooms (user can be in multiple rooms)
- ✅ `POST /auth/login` - Login
- ✅ `POST /auth/register` - Register
- ✅ `POST /auth/logout` - Logout
- ✅ `POST /auth/refresh` - Refresh token

### Room-Specific Operations (Default behavior, X-Room-Id required)

These operations require room context:

- ❌ `GET /reports` - Get reports in current room
- ❌ `POST /reports` - Create report in current room
- ❌ `PATCH /rooms/:id` - Update room (admin only)
- ❌ `DELETE /rooms/:id` - Delete room (admin only)
- ❌ `GET /rules` - Get rules in current room
- ❌ `POST /rules` - Create rule in current room
- ❌ `GET /members` - Get members in current room
- ❌ `POST /exports/excel` - Export data from current room

---

## 🧪 Testing

### Test Create Room

1. Login ke aplikasi
2. Masuk ke salah satu room (activeRoom akan terisi)
3. Kembali ke halaman Room List
4. Klik tombol "Buat Room"
5. Isi nama room: "Test Room"
6. Klik "Buat Room"
7. **Expected**: Room berhasil dibuat ✅

### Test Join Room

1. Login ke aplikasi
2. Masuk ke salah satu room (activeRoom akan terisi)
3. Kembali ke halaman Room List
4. Klik tombol "Gabung Room"
5. Masukkan kode invite yang valid
6. Klik "Gabung"
7. **Expected**: Berhasil join room ✅

---

## 📝 Implementation Notes

### Why Not Clear `activeRoom`?

**Alternative Solution**: Clear `activeRoom` saat navigasi ke CreateRoomScreen

```typescript
// RoomListScreen.tsx
onPress={() => {
  clearActiveRoom(); // Clear active room first
  navigation.navigate('CreateRoomScreen');
}}
```

**Why We Didn't Use This:**
- User mungkin ingin kembali ke room yang sama setelah membuat room baru
- Clearing `activeRoom` akan mengharuskan user memilih room lagi
- User experience lebih buruk
- Tidak solve root problem - join room juga akan gagal

**Better Solution**: Fix di level API client dengan `skipRoomId` flag

---

## 🔍 How to Add `skipRoomId` to Other Endpoints

If you need to call other global endpoints:

```typescript
// Example: Get all users (global operation)
const { data } = await client.get('/users', {
  skipRoomId: true, // Skip X-Room-Id header
});

// Example: Update profile (global operation)
const { data } = await client.patch('/profile', userData, {
  skipRoomId: true, // Skip X-Room-Id header
});
```

---

## 📚 Related Files

- `src/api/clients/baseClient.ts` - Base API client with interceptors
- `src/services/unifiedRoomService.ts` - Room service with create/join functions
- `src/screens/room/CreateRoomScreen.tsx` - Create room UI
- `src/screens/room/JoinRoomScreen.tsx` - Join room UI
- `src/stores/roomStore.ts` - Room state management

---

## ✅ Checklist

- [x] Tambah flag `skipRoomId` di baseClient interceptor
- [x] Update `createRoom()` untuk menggunakan `skipRoomId: true`
- [x] Update `joinRoom()` untuk menggunakan `skipRoomId: true`
- [x] Test create room dengan activeRoom yang ada
- [x] Test join room dengan activeRoom yang ada
- [x] Dokumentasi perubahan

---

**Status**: ✅ **FIXED**  
**Date**: 2026-08-18  
**Impact**: Create room dan join room sekarang berfungsi dengan benar

*Backend Compatibility • API Headers • Room Management*
