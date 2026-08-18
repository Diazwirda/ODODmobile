# Changelog: Fix Keychain Decryption Error

## 🐛 Problem

User tidak bisa login dengan error:

```
Login Gagal
Could not decrypt data with alias: odob-mobile-spot_token
```

### Root Cause

Error ini terjadi karena **Android Keystore data corruption** atau **app signature mismatch**. Ini umum terjadi saat:

1. **Development vs Production Build**
   - Development build punya signature berbeda dengan production build
   - Keystore data yang disimpan dengan satu signature tidak bisa dibaca dengan signature lainnya

2. **App Reinstall**
   - User uninstall app lalu install ulang
   - Keystore data tidak otomatis terhapus, tapi signature berubah
   - Data lama tidak bisa didekripsi

3. **Android System Keystore Corruption**
   - Android system keystore bisa corrupt karena berbagai alasan
   - Data ter-enkripsi tapi decrypt key hilang atau corrupt

### What Happens

1. App startup → `hydrateBackend()` dipanggil
2. `SecureStorage.getItem('spot_token')` mencoba membaca token
3. `react-native-keychain` error: "Could not decrypt data"
4. Error tidak di-catch → **app crash** atau **infinite loading**
5. User tidak bisa login karena state app rusak

---

## ✅ Solution

### Auto-Recovery dari Corrupted Keychain Data

Tambahkan error handling di `secureStorage.ts` untuk **otomatis menghapus corrupted data** dan membiarkan user login ulang.

**File**: `src/services/secureStorage.ts`

#### 1. Update `getItem()` Function

```typescript
export async function getItem(key: string): Promise<string | null> {
  const service = `${SERVICE_PREFIX}-${key}`;
  try {
    const result = await Keychain.getGenericPassword({ service });
    return result ? result.password : null;
  } catch (error) {
    // Handle decryption errors (e.g. when app signature changes or keystore corrupted)
    if (error instanceof Error && error.message.includes('decrypt')) {
      console.warn(`[SecureStorage] Decryption error for ${key}, clearing corrupted data`);
      // Clear corrupted data
      try {
        await Keychain.resetGenericPassword({ service });
      } catch (resetError) {
        console.error('[SecureStorage] Failed to reset corrupted keychain:', resetError);
      }
      return null;
    }
    // Re-throw other errors
    throw error;
  }
}
```

**What it does:**
- Try to read data normally
- If decryption fails → catch error
- Check if error message contains "decrypt"
- If yes → clear corrupted data with `resetGenericPassword()`
- Return `null` (same as "no data")
- App continues normally, user can login fresh

---

#### 2. Update `getToken()` Function (Legacy Support)

```typescript
export async function getToken(): Promise<string | null> {
  // Try new location first, fallback to legacy
  let token = await getItem('odob_token');
  if (!token) {
    try {
      const result = await Keychain.getGenericPassword({ service: LEGACY_SERVICE });
      token = result ? result.password : null;
      // Migrate to new location if found in legacy
      if (token) {
        await setItem('odob_token', token);
      }
    } catch (error) {
      // Handle decryption errors for legacy tokens
      if (error instanceof Error && error.message.includes('decrypt')) {
        console.warn('[SecureStorage] Legacy token decryption error, clearing');
        try {
          await Keychain.resetGenericPassword({ service: LEGACY_SERVICE });
        } catch (resetError) {
          console.error('[SecureStorage] Failed to reset legacy keychain:', resetError);
        }
      } else {
        throw error;
      }
    }
  }
  return token;
}
```

**What it does:**
- Same error handling for legacy token storage
- Ensures backward compatibility with old app versions
- Clears corrupted legacy data gracefully

---

## 📊 Flow Comparison

### Before Fix ❌

```
App Start
  ↓
hydrateBackend()
  ↓
getItem('spot_token')
  ↓
Keychain.getGenericPassword() → ❌ Decryption Error
  ↓
Error thrown → Not caught
  ↓
❌ App Crash / Infinite Loading
  ↓
User can't login (app broken)
```

---

### After Fix ✅

```
App Start
  ↓
hydrateBackend()
  ↓
getItem('spot_token')
  ↓
Keychain.getGenericPassword() → ❌ Decryption Error
  ↓
Error caught → Check if "decrypt" error
  ↓
Clear corrupted data with resetGenericPassword()
  ↓
Return null (no token)
  ↓
hydrateBackend() continues: "No token found"
  ↓
Set isAuthenticated = false
  ↓
✅ Show Login Screen
  ↓
User can login fresh
```

---

## 🎯 User Experience

### Before Fix ❌

1. User opens app
2. See loading spinner forever or crash
3. Error dialog: "Could not decrypt data with alias: odob-mobile-spot_token"
4. **Can't proceed to login**
5. User must:
   - Clear app data manually
   - Or uninstall and reinstall app
   - Or wait for developer fix

**Very Bad UX** 😞

---

### After Fix ✅

1. User opens app
2. Corrupted token auto-detected and cleared
3. Login screen appears normally
4. User can login fresh
5. **No manual intervention needed**

**Good UX** 😊

---

## 🧪 Testing Scenarios

### Scenario 1: Development Build After Using Preview Build

**Steps:**
1. User downloads preview build (signature: `XXX`)
2. User login → token saved in keychain
3. Developer pushes dev build to user (signature: `YYY`)
4. User opens dev build

**Before Fix:**
- ❌ App crashes or infinite loading

**After Fix:**
- ✅ Corrupted token auto-cleared
- ✅ Login screen appears
- ✅ User can login

---

### Scenario 2: Android System Keystore Corruption

**Steps:**
1. User has been using app normally
2. Android system keystore corrupts (rare but happens)
3. User opens app

**Before Fix:**
- ❌ App can't read token
- ❌ Stuck at loading

**After Fix:**
- ✅ Auto-detect corruption
- ✅ Clear bad data
- ✅ Show login screen

---

### Scenario 3: Normal Login (No Corruption)

**Steps:**
1. User opens app
2. Token is valid and readable

**Before Fix:**
- ✅ Works fine

**After Fix:**
- ✅ Still works fine (no regression)
- Error handling only triggers when actual error occurs

---

## 🔍 Why This Happens

### App Signature Mismatch

Android uses **app signing certificate** to encrypt keychain data:

```
[App Signature + Key Alias] → Encryption Key → Encrypt/Decrypt Data
```

When signature changes:
```
Old Signature → Old Key → Data encrypted
New Signature → New Key → ❌ Can't decrypt old data
```

### Common Causes:

1. **Debug vs Release Build**
   - Debug build signed with debug.keystore
   - Release build signed with production keystore
   - Different keys = can't decrypt

2. **Development Build (Expo)**
   - Each build might have different signature
   - EAS Build uses project-specific keystore
   - Local builds use debug keystore

3. **Reinstall App**
   - Keychain data persists after uninstall (sometimes)
   - New install = new signature
   - Old data = can't decrypt

---

## 📝 Prevention Tips

### For Development

When switching between builds:

```bash
# Option 1: Clear app data
adb shell pm clear com.odob.mobile

# Option 2: Uninstall completely
adb uninstall com.odob.mobile

# Then install new build
```

### For Production

- ✅ Always use same signing keystore
- ✅ Use EAS Build for consistent signatures
- ✅ Never change production keystore
- ✅ Backup keystore securely

---

## 🛠️ Additional Safety Measures

### 1. Hydration Mode

Already implemented in `baseClient.ts`:

```typescript
// During hydration, suppress UI warnings
setHydrating(true);
await hydrateBackend('spot');
setHydrating(false);
```

**Purpose:**
- Prevent "Session Expired" alerts during app startup
- Silently validate tokens
- Clear invalid tokens without user notification

---

### 2. Error Logging

Added console warnings for debugging:

```typescript
console.warn(`[SecureStorage] Decryption error for ${key}, clearing corrupted data`);
```

**Purpose:**
- Track when corruption happens
- Debug in development mode
- Production users won't see console logs

---

## 📚 Related Files

- `src/services/secureStorage.ts` - Secure storage with error handling
- `src/stores/multiAuthStore.ts` - Auth store with hydration
- `src/api/clients/baseClient.ts` - API client with hydration mode
- `src/navigation/RootNavigator.tsx` - App startup hydration

---

## ✅ Verification

To verify the fix works:

### Test 1: Simulate Corruption

```bash
# Force a bad keychain state (requires root or ADB)
adb shell
run-as com.odob.mobile
# Manually corrupt the SharedPreferences or keychain data
```

**Expected**: App should clear bad data and show login

### Test 2: Switch Builds

```bash
# Install preview build
npx eas-cli build:run --platform android --profile preview

# Then install development build
npx expo run:android
```

**Expected**: Login screen appears (not infinite loading)

---

## 🎯 Success Criteria

- ✅ No app crashes on keychain decryption errors
- ✅ No infinite loading screens
- ✅ Login screen always accessible
- ✅ Users can login after corruption
- ✅ No manual intervention needed
- ✅ Error logged for debugging

---

**Status**: ✅ **FIXED**  
**Date**: 2026-08-18  
**Impact**: Users can now login even after keychain corruption

*Auto-Recovery • Error Handling • User Experience*
