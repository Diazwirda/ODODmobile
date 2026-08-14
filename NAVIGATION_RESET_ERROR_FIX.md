# Navigation Reset Error Fix

**Date:** January 2026  
**Issue:** Console Error - "The action 'RESET' with payload {'index':0,'routes':[{'name':'AuthStack'}]} was not handled by any navigator."  
**Status:** ✅ FIXED

---

## Problem Description

When user session expired (401 error), the app showed a navigation error:

```
Console Error

The action 'RESET' with payload 
{'index':0,'routes':[{'name':'AuthStack'}]} was 
not handled by any navigator.

This is a development-only warning and won't 
be shown in production.

Source
74  await SecureStorage.removeToken();
75  onUnauthorized?.();
76  navigationRef.current?.reset({
77      index: 0,
78      routes: [{ name: 'AuthStack' as ne
79  });

C:\laragon\www\ODOB Mobile\src\api\client.ts (76:37)
```

This error appeared even though the app functioned correctly (user was logged out).

---

## Root Cause

### Legacy Code Conflict

The project has **two API client systems**:

1. **NEW:** `src/api/clients/` - Dual-backend architecture (odob + spot)
   - Uses `multiAuthStore` for auth
   - RootNavigator handles navigation based on auth state
   - No direct navigation manipulation

2. **OLD:** `src/api/client.ts` - Single-backend legacy client
   - Still used by: `roomStore.ts`, `authStore.ts`, `RoomTabs.tsx`
   - Tries to reset navigation directly on 401
   - **This caused the error**

### Why the Error Happened

1. Old client gets 401 error
2. Tries to refresh token, fails
3. Calls `navigationRef.current?.reset()` to go to AuthStack
4. **But** the new navigation structure doesn't have a direct `AuthStack` route at root level
5. Navigation action rejected → Error shown

The new structure:
```
RootNavigator (Stack.Navigator)
├── AppStack (when authenticated)
└── AuthStack (when NOT authenticated)
```

The old client tried to reset to `AuthStack` directly, but it should let RootNavigator decide based on auth state.

---

## Solution

### Changed `src/api/client.ts`

**Before:**
```typescript
} catch {
  await SecureStorage.removeToken();
  _onUnauthorized?.();
  navigationRef.current?.reset({
    index: 0,
    routes: [{ name: 'AuthStack' as never }],
  });
}
```

**After:**
```typescript
} catch {
  await SecureStorage.removeToken();
  _onUnauthorized?.();
  // Don't reset navigation here - let RootNavigator handle it via multiAuthStore
  // The new dual-backend architecture handles navigation automatically
  if (__DEV__) {
    console.log('[OLD API CLIENT] Token refresh failed, auth state will be handled by multiAuthStore');
  }
}
```

### How It Works Now

1. Old client gets 401
2. Tries to refresh, fails
3. Clears token from SecureStorage
4. Calls `_onUnauthorized()` callback (if set)
5. **RootNavigator detects** auth state changed (via multiAuthStore)
6. **Automatically** switches from AppStack to AuthStack
7. ✅ No navigation error

---

## Why This Fix is Safe

### The Flow

```
401 Error (old client)
    ↓
Clear token from SecureStorage
    ↓
Call _onUnauthorized() (optional)
    ↓
RootNavigator's useEffect detects auth change
    ↓
isAuthenticatedOnAny() returns false
    ↓
RootNavigator shows AuthStack
    ↓
User sees backend selection screen
```

### No Breaking Changes

- ✅ Old files still work (roomStore, authStore, etc.)
- ✅ Auth state handled correctly
- ✅ Navigation works smoothly
- ✅ No console errors
- ✅ Token cleared properly
- ✅ User experience unchanged

---

## Added Documentation

Added warning comment to `src/api/client.ts`:

```typescript
/**
 * LEGACY API CLIENT
 * 
 * ⚠️ This is the OLD single-backend API client.
 * It's still used by some old files (roomStore, authStore, RoomTabs).
 * 
 * For NEW code, use:
 * - import { getClient, odobClient, spotClient } from '../api/clients';
 * 
 * TODO: Migrate all old files to use new dual-backend clients
 * - [ ] roomStore.ts → use UnifiedRoomService
 * - [ ] authStore.ts → deprecated, use multiAuthStore
 * - [ ] RoomTabs.tsx → use new client
 * - [ ] RoomTabsFixed.tsx → use new client
 */
```

---

## Testing

### Test Case 1: Session Expires (Old Client)
1. App uses old client (e.g., via roomStore)
2. Token expires, gets 401
3. ✅ Token cleared
4. ✅ RootNavigator shows AuthStack
5. ✅ No navigation error
6. ✅ Dev log: "[OLD API CLIENT] Token refresh failed..."

### Test Case 2: Session Expires (New Client)
1. App uses new dual-backend client
2. Token expires, gets 401
3. ✅ multiAuthStore.logoutFromBackend() called
4. ✅ Dev log: "[Auth] Session expired for odob, logging out"
5. ✅ RootNavigator shows AuthStack
6. ✅ No errors

### Test Case 3: Manual Logout
1. User clicks logout in profile
2. ✅ Token cleared
3. ✅ RootNavigator shows AuthStack
4. ✅ No errors

---

## Migration Path

### Long-term Solution

Eventually, all files should migrate to new clients:

**Priority 1:** Update `roomStore.ts`
```typescript
// Old
import apiClient from '../api/client';

// New
import { UnifiedRoomService } from '../services/unifiedRoomService';
```

**Priority 2:** Deprecate `authStore.ts`
- Already replaced by `multiAuthStore.ts`
- Remove imports from old files

**Priority 3:** Update `RoomTabs.tsx` and `RoomTabsFixed.tsx`
```typescript
// Old
import { setActiveRoomId } from '../api/client';

// New
import { setClientCallbacks } from '../api/clients';
// Use getActiveRoomId callback in client setup
```

---

## Benefits

1. **No errors**: Navigation reset error eliminated
2. **Clean separation**: Old and new clients don't conflict
3. **Backward compatible**: Old code still works during migration
4. **Better architecture**: RootNavigator is single source of truth for navigation
5. **Easier debugging**: Clear logs distinguish old vs new client behavior

---

## Related Issues

### Fixed Together
- ✅ Hydration warning (see `HYDRATION_WARNING_FIX.md`)
- ✅ Logout failed warning (see `HYDRATION_WARNING_FIX.md`)
- ✅ Navigation reset error (this document)

### Still TODO
- [ ] Migrate roomStore to UnifiedRoomService
- [ ] Remove authStore (deprecated)
- [ ] Update RoomTabs to use new clients

---

## Files Modified

- ✅ `src/api/client.ts` - Removed navigation reset, added warning comments
- ✅ `IMPLEMENTATION_STATUS.md` - Marked issue as fixed

---

## Conclusion

The navigation reset error was caused by **legacy code trying to manipulate navigation** in a system where navigation is now **reactively controlled by auth state**.

The fix: **Let RootNavigator handle navigation automatically** based on multiAuthStore state.

**Result:** ✅ No more navigation errors, smooth logout flow, clean architecture!
