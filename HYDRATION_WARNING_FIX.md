# Hydration Warning Fix

**Date:** January 2026  
**Issue:** Warning "Unauthorized on spot, logging out..." appeared after successful login  
**Status:** ✅ FIXED

---

## Problem Description

After logging into OdobDaily backend, users saw these warnings in the console:

```
LOG  [Auth] Session expired for spot, logging out
WARN  Logout from spot failed: [AxiosError: Request failed with status code 401]
```

This happened in two scenarios:
1. **During app startup** - System tried to validate tokens for backends user never logged into
2. **During logout** - System tried to call `/auth/logout` API even though token was already invalid (401)

---

## Root Cause

### Issue 1: Hydration Warning
During app startup, the `hydrateAll()` function would attempt to validate stored tokens for **both** backends, triggering unnecessary 401 errors and logout warnings.

### Issue 2: Redundant Logout API Call
When `onUnauthorized` callback was triggered (due to 401), it called `logoutFromBackend()` which tried to call `/auth/logout` API - but this would fail again with 401 since the token was already invalid.

---

## Solution

Implemented two fixes:

### Fix 1: Hydration Mode Flag
Distinguish between:
- **Hydration mode** (app startup): Silently validate tokens, clear invalid ones without UI warnings
- **Active mode** (normal usage): Show warnings and logout on 401 errors

### Fix 2: Skip Redundant Logout API Call
When logout is triggered by `onUnauthorized` (already got 401), skip the API logout call since token is already invalid.

### Changes Made

#### 1. `src/api/clients/baseClient.ts`

Added hydration mode tracking:

```typescript
// Track if we're in hydration mode (suppress UI warnings)
let isHydrating = false;

/**
 * Set hydration mode
 * When true, 401 errors won't trigger onUnauthorized callbacks
 */
export const setHydrating = (hydrating: boolean) => {
  isHydrating = hydrating;
};
```

Modified response interceptor to check hydration mode:

```typescript
// Only trigger onUnauthorized if not in hydration mode
if (options.onUnauthorized && !isHydrating) {
  options.onUnauthorized();
}
```

#### 2. `src/api/clients/index.ts`

Exported the hydration mode setter:

```typescript
import { setHydrating as setBaseClientHydrating } from './baseClient';

export const setHydrating = setBaseClientHydrating;
```

#### 3. `src/stores/multiAuthStore.ts`

**Import hydration setter:**

```typescript
import { setHydrating } from '../api/clients';
```

**Updated interface** to support skipApiCall parameter:

```typescript
logoutFromBackend: (backend: BackendType, skipApiCall?: boolean) => Promise<void>;
```

**Updated `logoutFromBackend` method** to skip redundant API calls:

```typescript
logoutFromBackend: async (backend, skipApiCall = false) => {
  // Only call API logout if not skipping
  if (!skipApiCall) {
    try {
      const client = backend === 'odob' ? odobClient() : spotClient();
      await client.post('/auth/logout');
    } catch (error: any) {
      // 401 is expected when token already invalid - don't warn
      if (error?.response?.status !== 401) {
        console.warn(`Logout from ${backend} failed:`, error);
      }
    }
  }

  // Remove token and reset state...
}
```

**Updated `hydrateBackend` method** to be more explicit about silent failures:

```typescript
hydrateBackend: async (backend) => {
  const token = await SecureStorage.getItem(`${backend}_token`);

  // No token = user never logged in to this backend
  // This is normal, not an error
  if (!token) {
    set((state) => ({
      [backend]: { ...initialBackendState },
    }));
    return;
  }

  try {
    // Validate token...
  } catch (error) {
    // Token is invalid/expired
    // Silently clear it without triggering onUnauthorized
    await SecureStorage.removeItem(`${backend}_token`);
    set((state) => ({
      [backend]: { ...initialBackendState },
    }));
    
    // Only log in development
    if (__DEV__) {
      console.log(`[Hydration] ${backend} token invalid, cleared silently`);
    }
  }
}
```

**Updated `hydrateAll` method** to enable hydration mode:

```typescript
hydrateAll: async () => {
  // Enable hydration mode to suppress UI warnings
  setHydrating(true);
  
  try {
    await Promise.allSettled([
      get().hydrateBackend('odob'),
      get().hydrateBackend('spot'),
    ]);
    // ... set active backend
  } finally {
    // Disable hydration mode after startup
    setHydrating(false);
  }
}
```

#### 4. `src/navigation/RootNavigator.tsx`

Improved the unauthorized callback to skip redundant API logout:

```typescript
onUnauthorized: (backend) => {
  // Token expired/invalid during active usage (not hydration)
  // Skip API logout call since we already got 401
  if (__DEV__) {
    console.log(`[Auth] Session expired for ${backend}, logging out`);
  }
  logoutFromBackend(backend, true); // Skip API call
}
```

---

## Behavior After Fix

### During App Startup (Hydration)

✅ **OdobDaily token valid** → User logged in, set as active backend  
✅ **Spot token missing** → Silently set as not authenticated, no warning  
✅ **Spot token invalid** → Silently clear token, no warning, only dev log

**Console output (dev mode only):**
```
[Hydration] spot token invalid, cleared silently
```

### During Active Usage

❌ **User makes API request** → Gets 401 → Shows dev log and logs out **without** trying to call logout API

**Console output (dev mode):**
```
[Auth] Session expired for odob, logging out
```

✅ **No redundant "Logout failed" warning**  
✅ **Token cleared silently**  
✅ **User redirected to backend selection**

---

## Benefits

1. **Better UX**: No confusing warnings during app startup or logout
2. **Clear distinction**: Hydration vs active usage have different behaviors
3. **Silent recovery**: Invalid tokens cleaned up automatically without noise
4. **Better logging**: Dev-only logs for debugging, no production warnings
5. **Proper context**: Users only see logout messages when actively using the app
6. **No redundant API calls**: Don't try to logout when already unauthorized
7. **Cleaner error handling**: 401 errors during logout are expected, not warnings

---

## Testing

### Test Case 1: Fresh Install
1. Install app (no tokens)
2. Open app
3. ✅ No warnings, sees backend selection screen

### Test Case 2: Login to OdobDaily Only
1. Login to OdobDaily
2. Close and reopen app
3. ✅ No warnings, goes straight to OdobDaily rooms

### Test Case 3: Login to Both Backends
1. Login to OdobDaily
2. Switch and login to Spot
3. Close and reopen app
4. ✅ No warnings, goes to last used backend

### Test Case 4: Expired Token During Startup
1. Login to OdobDaily
2. Manually expire token (or wait for natural expiry)
3. Reopen app
4. ✅ Dev log shows token cleared, goes to backend selection
5. ✅ No "Logout failed" warning

### Test Case 5: Expired Token During Active Usage
1. Login to OdobDaily
2. Use app normally
3. Token expires mid-session
4. Make an API request
5. ✅ Dev log: "Session expired for odob, logging out"
6. ✅ No redundant logout API call
7. ✅ No "Logout failed" warning
8. ✅ Redirected to backend selection

---

## Files Modified

- ✅ `src/api/clients/baseClient.ts` - Added hydration mode flag
- ✅ `src/api/clients/index.ts` - Exported hydration setter
- ✅ `src/stores/multiAuthStore.ts` - Updated hydration logic
- ✅ `src/navigation/RootNavigator.tsx` - Improved callback message
- ✅ `IMPLEMENTATION_STATUS.md` - Marked issue as fixed

---

## Future Improvements

### Optional Enhancements

1. **Toast notifications** instead of console logs for session expiry
2. **Reconnection retry** with exponential backoff for network errors
3. **Token refresh queue** to avoid multiple simultaneous refresh attempts
4. **Biometric re-auth** for sensitive operations after token expiry

---

## Related Documentation

- `DUAL_BACKEND_IMPLEMENTATION.md` - Full architecture guide
- `IMPLEMENTATION_STATUS.md` - Current project status
- `MIGRATION_GUIDE.md` - How to update old code
- `QUICK_REFERENCE.md` - Development patterns

---

**Issue Closed:** ✅ Hydration warning eliminated, app startup is now silent
