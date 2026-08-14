# Migration Guide: Single Backend → Dual Backend

## 📋 Overview

This guide helps you migrate from the old single-backend architecture to the new dual-backend architecture.

---

## 🔄 What Changed?

### Old Architecture (Single Backend)
```typescript
// Single API client
import apiClient from './api/client';

// Single auth store
import { useAuthStore } from './stores/authStore';

// Direct API calls
const response = await apiClient.get('/rooms');
```

### New Architecture (Dual Backend)
```typescript
// Multiple API clients
import { odobClient, spotClient } from './api/clients';

// Multi-backend auth store
import { useMultiAuthStore } from './stores/multiAuthStore';

// Unified services
import { UnifiedRoomService } from './services/unifiedRoomService';
const rooms = await UnifiedRoomService.getAllRooms();
```

---

## 🛠️ Migration Steps

### Step 1: Update Imports

**Old:**
```typescript
import { useAuthStore } from '../stores/authStore';
import apiClient from '../api/client';
```

**New:**
```typescript
import { useMultiAuthStore } from '../stores/multiAuthStore';
import { odobClient, spotClient, getClient } from '../api/clients';
// OR use unified services
import { UnifiedRoomService } from '../services/unifiedRoomService';
```

### Step 2: Update Auth Store Usage

**Old:**
```typescript
const { user, isAuthenticated, login, logout } = useAuthStore();

await login({ email, password });
```

**New:**
```typescript
const {
  odob,
  spot,
  activeBackend,
  isAuthenticatedOnAny,
  loginToBackend,
  logoutFromBackend,
} = useMultiAuthStore();

// Login to specific backend
await loginToBackend('odob', { email, password });

// Get current user
const currentUser = activeBackend === 'odob' ? odob.user : spot.user;

// Check if authenticated
const isAuthenticated = isAuthenticatedOnAny();
```

### Step 3: Update API Calls

**Option A: Use Backend-Specific Clients**
```typescript
// Old
const response = await apiClient.get('/rooms');

// New - OdobDaily
const response = await odobClient().get('/rooms');

// New - Spot Slimrich
const response = await spotClient().get('/rooms');

// New - Dynamic based on room
const client = getClient(room.backend);
const response = await client.get('/violations');
```

**Option B: Use Unified Services (Recommended)**
```typescript
// Old
const { rooms } = await apiClient.get('/rooms');

// New
const rooms = await UnifiedRoomService.getAllRooms();
const { odob, spot } = await UnifiedRoomService.getRoomsGrouped();
```

### Step 4: Update Room Type Usage

**Old:**
```typescript
interface Room {
  id: number;
  name: string;
  // ...
}
```

**New:**
```typescript
interface Room {
  id: number;
  name: string;
  backend: 'odob' | 'spot'; // NEW: backend identifier
  // ...
}

// Usage
const client = getClient(room.backend);
```

### Step 5: Update Navigation

**Old:**
```typescript
// AuthStack directly shows LoginScreen
<Stack.Screen name="LoginScreen" component={LoginScreen} />
```

**New:**
```typescript
// AuthStack starts with BackendSelection
<Stack.Screen name="BackendSelection" component={BackendSelectionScreen} />
<Stack.Screen name="Login" component={LoginScreen} />
```

---

## 📝 Component Migration Examples

### Example 1: Login Component

**Old (LoginScreen):**
```typescript
const { login } = useAuthStore();

const handleLogin = async () => {
  await login({ email, password });
};
```

**New (LoginScreen with backend param):**
```typescript
const { loginToBackend } = useMultiAuthStore();
const { backend } = route.params; // Get from navigation

const handleLogin = async () => {
  await loginToBackend(backend, { email, password });
};
```

### Example 2: Room List

**Old:**
```typescript
const { rooms, fetchRooms } = useRoomStore();

useEffect(() => {
  fetchRooms();
}, []);
```

**New:**
```typescript
const [rooms, setRooms] = useState({ odob: [], spot: [] });

useEffect(() => {
  UnifiedRoomService.getRoomsGrouped().then(setRooms);
}, []);

// Render grouped
{rooms.odob.map(room => <RoomCard room={room} />)}
{rooms.spot.map(room => <RoomCard room={room} />)}
```

### Example 3: API Calls in Screens

**Old:**
```typescript
const response = await apiClient.get('/violations', {
  headers: { 'X-Room-Id': roomId }
});
```

**New:**
```typescript
// Get backend from room
const { activeRoom } = useRoomStore();
const client = getClient(activeRoom.backend);

const response = await client.get('/violations');
// X-Room-Id automatically injected by client
```

---

## 🔧 Backward Compatibility

### Legacy Code Support

The new architecture maintains backward compatibility:

**SecureStorage:**
```typescript
// Old methods still work (maps to 'odob' backend)
await SecureStorage.saveToken(token);
await SecureStorage.getToken();

// New methods
await SecureStorage.setItem('odob_token', token);
await SecureStorage.getItem('odob_token');
```

**Navigation:**
```typescript
// Old routes redirect to new flow
<Stack.Screen name="LoginScreen" component={BackendSelectionScreen} />
```

---

## ⚠️ Breaking Changes

### 1. Auth Store API Changed

**Before:**
```typescript
const { user, isAuthenticated } = useAuthStore();
```

**After:**
```typescript
const { odob, spot, activeBackend, isAuthenticatedOnAny } = useMultiAuthStore();
const currentUser = activeBackend === 'odob' ? odob.user : spot.user;
const isAuthenticated = isAuthenticatedOnAny();
```

### 2. Room Interface Extended

```typescript
// NEW REQUIRED FIELD
interface Room {
  // ... existing fields
  backend: 'odob' | 'spot'; // ← Must be set for all rooms
}
```

### 3. API Client Import Path Changed

**Before:**
```typescript
import apiClient from '../api/client';
```

**After:**
```typescript
import { odobClient, spotClient, getClient } from '../api/clients';
```

---

## 🧪 Testing Migration

### Checklist

- [ ] All imports updated to new paths
- [ ] Auth store usage updated to multi-backend
- [ ] Room backend field handled correctly
- [ ] API calls use correct client
- [ ] Navigation flows work end-to-end
- [ ] Backend selection screen appears
- [ ] Login/register with backend param works
- [ ] Room list shows grouped by backend
- [ ] Can switch between backends
- [ ] Token persistence works per backend
- [ ] Logout works correctly per backend

### Test Scenarios

1. **Fresh Install**
   - Open app → Backend selection appears
   - Choose OdobDaily → Login → See rooms
   - Logout → Backend selection appears again

2. **Returning User**
   - Open app → Auto-login to last backend
   - See rooms from that backend only
   - Can switch backend via settings

3. **Multi-Backend User (Admin)**
   - Login to OdobDaily → See Odob rooms
   - Switch to Spot Slimrich → Login → See Spot rooms
   - Both auth states maintained separately

---

## 📊 Performance Considerations

### Network Requests

**Before (Sequential):**
```typescript
const rooms = await fetchRooms();
// Single request
```

**After (Parallel):**
```typescript
const rooms = await UnifiedRoomService.getAllRooms();
// Parallel requests to both backends
// Faster aggregate results
```

### Token Management

**Before:**
- Single token in secure storage
- Single refresh cycle

**After:**
- Two tokens in secure storage
- Independent refresh cycles per backend
- One backend failure doesn't affect the other

---

## 🐛 Common Migration Issues

### Issue 1: `useAuthStore is not a function`

**Cause:** Still importing old auth store

**Solution:**
```typescript
// Change this:
import { useAuthStore } from '../stores/authStore';

// To this:
import { useMultiAuthStore } from '../stores/multiAuthStore';
```

### Issue 2: `room.backend is undefined`

**Cause:** Rooms fetched from old API without backend field

**Solution:**
```typescript
// When fetching rooms, ensure backend is tagged:
const rooms = await UnifiedRoomService.getAllRooms();
// Service automatically adds backend field
```

### Issue 3: Navigation stuck on Backend Selection

**Cause:** Auth state not properly hydrated

**Solution:**
```typescript
// Ensure hydrateAll() is called in RootNavigator
useEffect(() => {
  hydrateAll().finally(() => setIsHydrating(false));
}, []);
```

### Issue 4: API calls return 401

**Cause:** Wrong client used for room's backend

**Solution:**
```typescript
// Don't hardcode client:
❌ const response = await odobClient().get('/violations');

// Use room's backend:
✅ const client = getClient(room.backend);
   const response = await client.get('/violations');
```

---

## 📚 Additional Resources

### Documentation
- `DUAL_BACKEND_IMPLEMENTATION.md` - Complete architecture guide
- `src/config/backends.ts` - Backend configuration
- `src/stores/multiAuthStore.ts` - Multi-auth store API

### Example Screens
- `src/screens/auth/BackendSelectionScreen.tsx` - Backend selection
- `src/screens/auth/LoginScreen.tsx` - Login with backend param
- `src/screens/room/RoomListScreenNew.tsx` - Grouped room list

---

## ✅ Migration Complete Checklist

### Code Changes
- [ ] Updated all auth store imports
- [ ] Updated all API client imports
- [ ] Updated Room type usage
- [ ] Updated navigation setup
- [ ] Added backend field to room fetching

### Testing
- [ ] Auth flow works (selection → login → rooms)
- [ ] Rooms display correctly grouped
- [ ] Backend switching works
- [ ] Token persistence works
- [ ] All features work on both backends

### Deployment
- [ ] Environment variables updated (.env)
- [ ] Native rebuild done (for react-native-config)
- [ ] Testing on both iOS and Android
- [ ] Backend health check implemented

---

## 🚀 Next Steps After Migration

1. **Test thoroughly** with both backends
2. **Monitor errors** in production
3. **Gather user feedback** on UX
4. **Optimize** network requests if needed
5. **Consider API Gateway** if adding 3rd backend

---

**Migration Support:** If you encounter issues, refer to the implementation files or open an issue.

**Last Updated:** January 2026
