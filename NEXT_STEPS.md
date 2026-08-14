# Next Steps - Dual Backend Implementation

**Current Progress:** ~82%  
**Estimated Completion:** 1-2 days  
**Last Updated:** January 2026

---

## ✅ Recently Completed

### Hydration Warning Fix (Just Now)
- [x] Fixed "Unauthorized on spot, logging out..." warning during app startup
- [x] Implemented hydration mode flag to suppress UI warnings during token validation
- [x] Only show logout messages during active usage, not during silent hydration
- [x] Better logging with dev-only messages

**Result:** App startup is now silent, no confusing warnings for users ✨

---

## 🎯 Immediate Next Steps

### Priority 1: Update Room Store (3 hours)
**File:** `src/stores/roomStore.ts`

**Current Problem:**
- Room store still uses old single API client
- Only fetches rooms from one backend
- Doesn't use the new UnifiedRoomService

**What to Do:**
```typescript
// Replace old API calls with UnifiedRoomService
import { UnifiedRoomService } from '../services/unifiedRoomService';

// Old:
fetchRooms: async () => {
  const { data } = await apiClient.get('/rooms');
  set({ rooms: data });
}

// New:
fetchRooms: async () => {
  const rooms = await UnifiedRoomService.getAllRooms();
  set({ rooms });
}
```

**Files to update:**
- `src/stores/roomStore.ts` - Main store file
- All methods: `fetchRooms`, `createRoom`, `joinRoom`, `setActiveRoom`, etc.

---

### Priority 2: Update Create/Join Room Screens (2 hours)
**Files:**
- `src/screens/room/CreateRoomScreen.tsx`
- `src/screens/room/JoinRoomScreen.tsx`

**Changes Needed:**

```typescript
// CreateRoomScreen.tsx
import { useMultiAuthStore } from '../../stores/multiAuthStore';
import { UnifiedRoomService } from '../../services/unifiedRoomService';

const { activeBackend } = useMultiAuthStore();

// On create:
const newRoom = await UnifiedRoomService.createRoom(activeBackend!, {
  name,
  description,
  // ...
});
```

```typescript
// JoinRoomScreen.tsx
const joinedRoom = await UnifiedRoomService.joinRoom(activeBackend!, roomCode);
```

**Testing:**
- Create room from OdobDaily → Should be tagged with backend: 'odob'
- Create room from Spot → Should be tagged with backend: 'spot'
- Join room → Should work for both backends

---

### Priority 3: Make API Calls Backend-Aware (4-5 hours)

**Files to Update:**
- `src/api/violations.ts`
- `src/api/rules.ts`
- `src/api/dashboard.ts`
- `src/api/profile.ts`
- `src/api/admin.ts`

**Pattern to Follow:**

```typescript
// Option A: Get backend from active room (RECOMMENDED)
import { useRoomStore } from '../stores/roomStore';
import { getClient } from './clients';

export const violationsApi = {
  getAll: async () => {
    const { activeRoom } = useRoomStore.getState();
    if (!activeRoom) throw new Error('No active room');
    return getClient(activeRoom.backend).get('/violations');
  },
  
  create: async (data: ViolationPayload) => {
    const { activeRoom } = useRoomStore.getState();
    if (!activeRoom) throw new Error('No active room');
    return getClient(activeRoom.backend).post('/violations', data);
  },
};

// Option B: Pass backend explicitly
export const violationsApi = {
  getAll: (backend: BackendType) => 
    getClient(backend).get('/violations'),
  
  create: (backend: BackendType, data: ViolationPayload) => 
    getClient(backend).post('/violations', data),
};
```

**Recommended Approach:** Option A (get from active room)
- Cleaner API
- Less parameters to pass around
- Room context always available when viewing room details

---

## 📋 Testing Checklist

After completing the above changes:

### End-to-End Testing

```
□ Fresh Install
  □ Open app → Backend selection shown
  □ Select OdobDaily → Login screen shown
  □ Login → Rooms list shown (OdobDaily rooms)
  □ Create room → Room created with backend: 'odob'
  □ Join room with code → Room joined successfully
  □ All features work (violations, rules, dashboard, etc.)

□ Switch Backend
  □ Go to Profile → Backend switcher shown
  □ Click "Switch Backend" → Warning shown
  □ Confirm → Logged out, backend selection shown
  □ Select Spot Slimrich → Login with @humanplus.co.id
  □ Login → Rooms list shown (Spot rooms)
  □ Previous OdobDaily rooms not shown
  □ Create room → Room created with backend: 'spot'

□ Reopen App
  □ Close and reopen → Goes to last used backend
  □ No warnings in console
  □ Rooms loaded correctly
  □ All features work

□ Multi-User (Admin)
  □ Login to OdobDaily → Create rooms
  □ Switch and login to Spot → Create rooms
  □ Reopen app → Goes to Spot (last used)
  □ Rooms list shows Spot rooms only
  □ No data mixing between backends
```

---

## 🚫 Common Pitfalls to Avoid

### 1. Don't Mix Backend Data
```typescript
// ❌ BAD: Fetching data without backend context
const violations = await apiClient.get('/violations');

// ✅ GOOD: Always get backend from room
const { activeRoom } = useRoomStore.getState();
const violations = await getClient(activeRoom.backend).get('/violations');
```

### 2. Don't Forget Room Backend Tag
```typescript
// ❌ BAD: Creating room without backend
const room = { name, description };

// ✅ GOOD: Always tag with backend
const room = { name, description, backend: activeBackend };
```

### 3. Don't Hardcode Backend
```typescript
// ❌ BAD: Hardcoded backend
const data = await getClient('odob').get('/violations');

// ✅ GOOD: Dynamic backend from room
const { activeRoom } = useRoomStore.getState();
const data = await getClient(activeRoom.backend).get('/violations');
```

---

## 📊 Progress Tracker

### Core Architecture: 100% ✅
- [x] Backend configuration
- [x] Dual API clients
- [x] Multi-backend auth store
- [x] Unified room service
- [x] Secure storage
- [x] Hydration warning fix

### UI Screens: 90% ✅
- [x] Backend selection
- [x] Login screen
- [x] Register screen
- [x] Room list (grouped)
- [x] Profile (with switcher)
- [ ] Create room (needs update)
- [ ] Join room (needs update)

### Data Layer: 60% 🚧
- [ ] Room store (needs update)
- [ ] Violations API (needs update)
- [ ] Rules API (needs update)
- [ ] Dashboard API (needs update)
- [ ] Profile API (needs update)
- [ ] Admin API (needs update)

### Testing: 20% 🚧
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing

---

## 🎯 Definition of Done

Project is complete when:

✅ All API calls are backend-aware  
✅ Room operations work for both backends  
✅ No data mixing between backends  
✅ Backend switching works smoothly  
✅ No console errors or warnings  
✅ Full E2E testing passed  
✅ Documentation updated  

---

## 💡 Quick Commands

```bash
# Start development
npx expo start

# Clear cache (if issues)
npx expo start --clear

# Build for production
npx expo build:android
npx expo build:ios

# Run tests (when implemented)
npm test
```

---

## 📞 Need Help?

### Architecture Questions
- Read: `DUAL_BACKEND_IMPLEMENTATION.md`
- Check: `MIGRATION_GUIDE.md`

### Implementation Examples
- Backend config: `src/config/backends.ts`
- API clients: `src/api/clients/`
- Auth store: `src/stores/multiAuthStore.ts`
- Room service: `src/services/unifiedRoomService.ts`

### Completed Screens (Use as Reference)
- `src/screens/auth/BackendSelectionScreen.tsx`
- `src/screens/auth/LoginScreen.tsx`
- `src/screens/room/RoomListScreen.tsx`
- `src/screens/profile/ProfileScreenFixed.tsx`

---

**Next Action:** Update Room Store to use UnifiedRoomService  
**Estimated Time:** 3 hours  
**Current Blocker:** None - ready to proceed!
