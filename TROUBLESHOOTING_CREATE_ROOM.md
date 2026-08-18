# Troubleshooting: Create Room Issue

## 🔍 Problem: Tidak Bisa Create Room

User report: "belum bisa create room"

### Possible Causes

1. **Update belum ter-push ke device**
2. **Cache issue - menggunakan bundle lama**
3. **Backend API error** (bukan masalah client)
4. **skipRoomId flag tidak bekerja**

---

## ✅ Step-by-Step Troubleshooting

### Step 1: Pastikan Update Sudah Di-Push

#### Option A: Development Build (Recommended untuk debugging)

```bash
# Kill server yang sedang running
# Ctrl+C

# Start fresh
npx expo start --dev-client --clear
```

**Dalam app:**
1. Shake device atau tekan menu
2. Pilih "Reload"
3. Atau tutup app sepenuhnya dan buka lagi

---

#### Option B: EAS Update (Preview/Production Build)

```bash
# Push update ke branch preview
npx eas-cli update --branch preview --message "Fix create room skipRoomId"

# Check update status
npx eas-cli update:list --branch preview
```

**Dalam app:**
1. Tutup app sepenuhnya (swipe close dari recent apps)
2. Buka app lagi
3. Tunggu beberapa detik untuk download update
4. Coba create room lagi

---

### Step 2: Check Console Logs (Development Mode)

Jika menggunakan development build, periksa console output:

**Look for:**
```
[API] POST /rooms → Skip X-Room-Id (global operation)
```

**Good (✅):**
```
[API] POST /rooms → Skip X-Room-Id (global operation)
← Request tidak ada X-Room-Id header
```

**Bad (❌):**
```
[API] POST /rooms → X-Room-Id: 123
← Request masih mengirim X-Room-Id
← skipRoomId flag tidak bekerja
```

---

### Step 3: Test Create Room Flow

1. **Login ke aplikasi**
   ```
   Email: diaz.wirda@humanplus.co.id
   Password: [your password]
   ```

2. **Masuk ke salah satu room** (optional, untuk test edge case)
   - Jika ada room, masuk dulu
   - Lalu kembali ke Room List

3. **Coba buat room baru**
   - Klik tombol "Buat Room"
   - Isi nama: "Test Room"
   - Klik "Buat Room"

4. **Check hasilnya:**
   - ✅ Success: Room baru muncul di list
   - ❌ Error: Catat error message yang muncul

---

### Step 4: Check Backend Response

Jika masih error, periksa response dari backend:

**Check Metro bundler console untuk error details:**

```bash
# Look for error like:
POST /rooms 409 Conflict
POST /rooms 403 Forbidden
POST /rooms 422 Unprocessable Entity
```

**Common errors:**

#### 409 Conflict
```json
{
  "message": "Room aktif belum dipilih"
}
```
**Cause**: Backend masih menerima X-Room-Id header
**Fix**: skipRoomId flag belum bekerja

---

#### 403 Forbidden
```json
{
  "message": "Anda tidak memiliki akses"
}
```
**Cause**: User tidak punya permission untuk create room
**Fix**: Check user role/permissions di backend

---

#### 422 Validation Error
```json
{
  "errors": {
    "name": ["Nama room sudah digunakan"]
  }
}
```
**Cause**: Room name sudah ada atau validation failed
**Fix**: Ganti nama room

---

### Step 5: Manual API Test (Using Postman/cURL)

Test API directly untuk isolate masalah:

```bash
# Get your token first
# Check AsyncStorage or Keychain

# Test create room WITHOUT X-Room-Id
curl -X POST https://spot.slimrich.id/api/rooms \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Room Manual","description":"Test"}'
```

**Expected:**
```json
{
  "id": 999,
  "name": "Test Room Manual",
  "description": "Test",
  "created_at": "2026-08-18T10:00:00.000000Z"
}
```

---

```bash
# Test create room WITH X-Room-Id (should fail)
curl -X POST https://spot.slimrich.id/api/rooms \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "X-Room-Id: 123" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Room Manual 2","description":"Test"}'
```

**Expected to fail:**
```json
{
  "message": "Room aktif belum dipilih"
}
```

Ini membuktikan backend memang menolak X-Room-Id pada endpoint create room.

---

## 🐛 Debugging Checklist

- [ ] Update sudah di-push (eas update atau reload dev build)
- [ ] App di-reload sepenuhnya (tutup dan buka lagi)
- [ ] Cache di-clear (`--clear` flag)
- [ ] Console log menunjukkan "Skip X-Room-Id"
- [ ] Tidak ada error di Metro bundler
- [ ] Backend API reachable (cek network)
- [ ] Token masih valid (tidak expired)

---

## 📝 Verification Commands

### Check if skipRoomId works in code

```bash
# Search for skipRoomId usage
grep -r "skipRoomId" src/
```

**Expected output:**
```
src/api/clients/baseClient.ts:      const skipRoomId = (requestConfig as any).skipRoomId;
src/services/unifiedRoomService.ts:      skipRoomId: true,
src/services/unifiedRoomService.ts:      skipRoomId: true,
src/services/unifiedRoomService.ts:      skipRoomId: true,
```

---

### Check recent updates

```bash
# List recent EAS updates
npx eas-cli update:list --branch preview --limit 5
```

---

### View full update

```bash
# View specific update details
npx eas-cli update:view [UPDATE_ID]
```

---

## 🔧 Quick Fixes

### Fix 1: Force Clear Cache

```bash
# Stop metro
# Delete cache folders
rm -rf node_modules/.cache
rm -rf .expo
rm -rf android/.gradle (if using local build)

# Reinstall
npm install

# Start fresh
npx expo start --dev-client --clear
```

---

### Fix 2: Rebuild App (Last Resort)

If update doesn't work, rebuild completely:

```bash
# For preview build
npx eas-cli build --platform android --profile preview

# Wait for build to complete
# Download and install APK
```

---

### Fix 3: Check Backend Compatibility

Verify backend API version:

```bash
curl https://spot.slimrich.id/api/health

# Or check version endpoint
curl https://spot.slimrich.id/api/version
```

---

## 📊 Expected vs Actual Behavior

### Expected Flow (After Fix)

```
1. User clicks "Buat Room"
2. User fills form
3. User clicks "Buat Room" button
4. CreateRoomScreen calls createRoom()
5. UnifiedRoomService.createRoom() with skipRoomId: true
6. API client checks skipRoomId flag
7. Skip adding X-Room-Id header
8. Send POST /rooms (no X-Room-Id)
9. Backend accepts request
10. Room created successfully ✅
11. Navigate back to Room List
12. New room appears in list
```

---

### Current Issue (If Still Not Working)

```
1-7. Same as above
8. Send POST /rooms
   → Check: Is X-Room-Id header present?
   → If YES: skipRoomId not working
   → If NO: Backend issue
9. Backend response?
   → 409: Backend still checking for X-Room-Id
   → 403: Permission issue
   → 422: Validation issue
   → 500: Server error
```

---

## 📞 What to Report

If issue persists, provide:

1. **Error message** (full text or screenshot)
2. **Console logs** (if using dev build)
3. **Metro bundler output** (check for API errors)
4. **Steps taken** (which troubleshooting steps done)
5. **Build info**:
   - Development build? Preview build?
   - When was last update?
   - Did you reload/reinstall?

---

## 🎯 Next Steps

### If skipRoomId flag working but still error:

→ **Backend issue**, needs backend team to:
- Check if POST /rooms accepts requests without X-Room-Id
- Verify user has permission to create rooms
- Check database constraints

### If skipRoomId flag NOT working:

→ **Code issue**, need to:
- Verify update was pushed successfully
- Check if `as any` type assertion is correct
- Try alternative implementation

### If no error but room not appearing:

→ **Room list refresh issue**, need to:
- Check if fetchRooms() is called after create
- Verify room is added to state
- Check if navigation goes back properly

---

**Last Updated**: 2026-08-18  
**Status**: Waiting for user feedback

*Troubleshooting • Debugging • Support*
