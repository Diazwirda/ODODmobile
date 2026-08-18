# Changelog: Fix Room List Refresh Issue

## 🐛 Problem

Room yang baru dibuat tidak muncul di halaman perusahaan setelah kembali dari screen "Buat Room Baru".

### User Report
"kenapa room yang terbuat tidak tampil di halaman perusahaan?"

### Root Cause

`RoomListScreen` menggunakan `useEffect` dengan `loadRooms` dependency untuk fetch data:

```typescript
useEffect(() => {
  loadRooms();
}, [loadRooms]);
```

**Masalahnya:**
- `useEffect` hanya run saat component **mount** (pertama kali)
- Ketika user kembali dari `CreateRoomScreen` dengan `navigation.goBack()`, screen **tidak di-remount**
- Screen sudah ada di memory (navigation stack), jadi `useEffect` tidak trigger lagi
- Room list tidak refresh → room baru tidak muncul

### Flow Diagram (Before Fix)

```
1. RoomListScreen mount
   ↓
2. useEffect runs → loadRooms()
   ↓
3. Display existing rooms
   ↓
4. User clicks "Buat Room"
   ↓
5. Navigate to CreateRoomScreen
   ↓
6. User creates new room successfully
   ↓
7. navigation.goBack() → RoomListScreen
   ↓
8. ❌ Screen already mounted, useEffect NOT triggered
   ↓
9. ❌ loadRooms() NOT called
   ↓
10. ❌ Room list NOT refreshed
    ↓
11. ❌ New room NOT visible
```

---

## ✅ Solution

### Use `useFocusEffect` Instead of `useEffect`

Replace mount-only `useEffect` with focus-based `useFocusEffect`:

**File**: `src/screens/room/RoomListScreen.tsx`

#### Before Fix ❌

```typescript
import React, { useCallback, useEffect, useState } from 'react';

// ... other code ...

useEffect(() => {
  loadRooms();
}, [loadRooms]);
```

**Problem**: Only runs on mount

---

#### After Fix ✅

```typescript
import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

// ... other code ...

// Load rooms when screen comes into focus
useFocusEffect(
  useCallback(() => {
    loadRooms();
  }, [loadRooms])
);
```

**Benefit**: Runs every time screen gains focus

---

## 📊 Flow Comparison

### Before Fix (useEffect) ❌

```
RoomListScreen mount → loadRooms() ✅
Navigate away → Screen stays in memory
Navigate back → ❌ No refresh
                ❌ Stale data
```

---

### After Fix (useFocusEffect) ✅

```
RoomListScreen mount → loadRooms() ✅
Navigate away → Screen stays in memory
Navigate back → Screen gains focus
              → useFocusEffect triggers
              → loadRooms() ✅
              → Fresh data ✅
              → New room visible ✅
```

---

## 🎯 When This Helps

### Scenario 1: Create Room
```
RoomList → CreateRoom → Create Success → Back to RoomList
✅ useFocusEffect triggers
✅ List refreshes
✅ New room appears
```

---

### Scenario 2: Join Room
```
RoomList → JoinRoom → Join Success → Back to RoomList
✅ useFocusEffect triggers
✅ List refreshes
✅ Joined room appears
```

---

### Scenario 3: Delete Room (in future)
```
RoomList → Room Details → Delete Room → Back to RoomList
✅ useFocusEffect triggers
✅ List refreshes
✅ Deleted room removed
```

---

### Scenario 4: Update Room Name (in future)
```
RoomList → Room Settings → Update Name → Back to RoomList
✅ useFocusEffect triggers
✅ List refreshes
✅ Updated name shows
```

---

## 🔍 Why `useFocusEffect` vs Other Solutions?

### Alternative 1: Call fetchRooms in CreateRoomScreen ❌

```typescript
// In CreateRoomScreen.tsx
await createRoom(payload);
await useRoomStore.getState().fetchRooms(); // ❌ Couples screens
navigation.goBack();
```

**Problems:**
- Tight coupling between screens
- Needs to be repeated in JoinRoomScreen, UpdateRoomScreen, etc.
- Harder to maintain
- Fetches data twice (before navigation)

---

### Alternative 2: Navigation Params ❌

```typescript
// In CreateRoomScreen
navigation.navigate('RoomListScreen', { refresh: true });

// In RoomListScreen
useEffect(() => {
  if (route.params?.refresh) {
    loadRooms();
  }
}, [route.params]);
```

**Problems:**
- Fragile (depends on navigation structure)
- Needs to handle params in multiple places
- Breaks with `goBack()` (doesn't pass params)

---

### Alternative 3: Global State Listener ❌

```typescript
// Watch for room changes in global store
useEffect(() => {
  return useRoomStore.subscribe(
    (state) => state.rooms,
    (rooms) => setRooms(rooms)
  );
}, []);
```

**Problems:**
- Requires updating global store on every change
- More complex state management
- Potential performance issues

---

### ✅ Solution 4: useFocusEffect (Best)

```typescript
useFocusEffect(
  useCallback(() => {
    loadRooms();
  }, [loadRooms])
);
```

**Benefits:**
- ✅ Simple and declarative
- ✅ Built-in React Navigation feature
- ✅ Works for all navigation scenarios
- ✅ No coupling between screens
- ✅ Consistent with React Navigation best practices
- ✅ Auto-cleanup on unfocus

---

## 🧪 Testing

### Test Case 1: Create Room

1. Login to app
2. Go to Room List (note current rooms)
3. Click "Buat Room"
4. Fill form: Name = "Test Room"
5. Click "Buat Room"
6. **Wait for navigation back**
7. **Expected**: Loading indicator briefly shows
8. **Expected**: "Test Room" appears in list ✅

---

### Test Case 2: Join Room

1. Go to Room List
2. Click "Gabung Perusahaan"
3. Enter valid invite code
4. Click "Gabung"
5. **Wait for navigation back**
6. **Expected**: Joined room appears in list ✅

---

### Test Case 3: Pull to Refresh (Still Works)

1. Go to Room List
2. Pull down to refresh
3. **Expected**: List refreshes
4. **Expected**: No duplicate loading ✅

---

### Test Case 4: Fast Navigation

1. Go to Room List
2. Quick navigation: CreateRoom → Back → CreateRoom → Back
3. **Expected**: No crashes
4. **Expected**: List updates correctly ✅

---

## 📝 Performance Considerations

### Concern: Does this fetch data too often?

**Answer**: Yes, but it's acceptable for this use case.

**Why it's OK:**
1. Room list is typically small (< 50 items)
2. Network request is fast (~100-300ms)
3. API should have caching
4. Users don't navigate back frequently
5. Pull-to-refresh still available for manual refresh

---

### Optimization (Optional, Future)

If performance becomes an issue:

```typescript
// Add debounce or cache invalidation
const lastFetch = useRef<number>(0);
const CACHE_TIME = 30000; // 30 seconds

useFocusEffect(
  useCallback(() => {
    const now = Date.now();
    // Only fetch if cache expired
    if (now - lastFetch.current > CACHE_TIME) {
      loadRooms();
      lastFetch.current = now;
    }
  }, [loadRooms])
);
```

**Not needed yet**, but available if required.

---

## 🔧 Related Changes

This fix complements the create room fix:

1. **CHANGELOG_CREATE_ROOM_FIX.md** - Fixed create room endpoint
2. **CHANGELOG_KEYCHAIN_FIX.md** - Fixed login keychain error
3. **This file** - Fixed room list refresh

Together, these ensure:
- ✅ User can create room (backend accepts request)
- ✅ User can login (keychain auto-recovery)
- ✅ New room appears immediately (screen refresh)

---

## 📚 Related Files

- `src/screens/room/RoomListScreen.tsx` - Room list with refresh logic
- `src/screens/room/CreateRoomScreen.tsx` - Create room screen
- `src/screens/room/JoinRoomScreen.tsx` - Join room screen (also benefits)
- `src/services/unifiedRoomService.ts` - Room API service

---

## 🎯 User Experience

### Before Fix ❌

```
User creates room → Success message
User goes back → ❌ Room not visible
User confused: "Did it work?"
User pulls to refresh → Room appears
User: "Why didn't it show immediately?"
```

**Bad UX** 😞

---

### After Fix ✅

```
User creates room → Success message
User goes back → ✅ Loading briefly shows
               → ✅ Room appears immediately
User: "Perfect, it worked!"
```

**Good UX** 😊

---

## ✅ Verification

To verify fix is working:

1. **Check import statement:**
   ```typescript
   import { useFocusEffect } from '@react-navigation/native';
   ```

2. **Check hook usage:**
   ```typescript
   useFocusEffect(
     useCallback(() => {
       loadRooms();
     }, [loadRooms])
   );
   ```

3. **Test create room:**
   - Create new room
   - Go back
   - Room should appear immediately

---

**Status**: ✅ **FIXED**  
**Date**: 2026-08-18  
**Impact**: Room list now refreshes automatically when screen gains focus

*Screen Lifecycle • Navigation • User Experience*
