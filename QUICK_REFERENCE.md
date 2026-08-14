# Quick Reference - Dual Backend Architecture

## 🚀 Quick Start

### 1. Import the Right Stores/Clients

```typescript
// Multi-backend auth
import { useMultiAuthStore } from '../stores/multiAuthStore';

// API clients
import { odobClient, spotClient, getClient } from '../api/clients';

// Unified services
import { UnifiedRoomService } from '../services/unifiedRoomService';

// Config
import { BACKENDS, BackendType } from '../config/backends';
```

### 2. Common Patterns

#### Login to Backend
```typescript
const { loginToBackend } = useMultiAuthStore();
await loginToBackend('odob', { email, password });
```

#### Get Current User
```typescript
const { activeBackend, odob, spot } = useMultiAuthStore();
const currentUser = activeBackend === 'odob' ? odob.user : spot.user;
```

#### Check Authentication
```typescript
const { isAuthenticatedOnAny, isAuthenticatedOn } = useMultiAuthStore();

if (isAuthenticatedOnAny()) {
  // User logged in to at least one backend
}

if (isAuthenticatedOn('odob')) {
  // User logged in to OdobDaily
}
```

#### Fetch Rooms from Both Backends
```typescript
// Option 1: Get all rooms
const rooms = await UnifiedRoomService.getAllRooms();

// Option 2: Get grouped by backend
const { odob, spot } = await UnifiedRoomService.getRoomsGrouped();
```

#### API Call for Specific Room
```typescript
const { activeRoom } = useRoomStore();
const client = getClient(activeRoom.backend);
const response = await client.get('/violations');
```

#### Switch Backend
```typescript
const { activeBackend, logoutFromBackend } = useMultiAuthStore();

const handleSwitch = async () => {
  await logoutFromBackend(activeBackend!);
  // Navigation handled automatically
};
```

---

## 📋 Backend Configuration

```typescript
// OdobDaily
{
  id: 'odob',
  baseURL: 'https://odobdaily.com/api',
  features: {
    manualDepartments: true,
    emailRestriction: null, // Any email
    googleOAuth: true,
  }
}

// Spot Slimrich
{
  id: 'spot',
  baseURL: 'https://spot.slimrich.id/api',
  features: {
    slimrichIntegration: true,
    emailRestriction: '@humanplus.co.id',
    googleOAuth: false,
  }
}
```

---

## 🎨 UI Color Coding

```typescript
// OdobDaily
Primary: #3B82F6 (Blue)
Badge: "ODOB"

// Spot Slimrich
Primary: #10B981 (Green)
Badge: "SPOT"
```

---

## 🔑 Secure Storage Keys

```typescript
// Tokens
'odob_token'    // OdobDaily JWT token
'spot_token'    // Spot Slimrich JWT token
'last_backend'  // Last used backend ('odob' | 'spot')

// Usage
import * as SecureStorage from '../services/secureStorage';

await SecureStorage.setItem('odob_token', token);
const token = await SecureStorage.getItem('odob_token');
await SecureStorage.removeItem('odob_token');
```

---

## 🚦 Navigation Routes

```typescript
// Auth Stack
'BackendSelection'  // Choose backend
'Login'            // { backend: BackendType }
'Register'         // { backend: BackendType }

// App Stack
'RoomListScreen'   // Shows grouped rooms
'RoomTabs'         // Main app features
```

---

## 📊 Room Type

```typescript
interface Room {
  id: number;
  name: string;
  backend: 'odob' | 'spot'; // ← Always set this!
  // ... other fields
}
```

---

## ⚡ Common Mistakes to Avoid

### ❌ DON'T: Hardcode API client
```typescript
const response = await odobClient().get('/violations');
```

### ✅ DO: Use room's backend
```typescript
const client = getClient(room.backend);
const response = await client.get('/violations');
```

### ❌ DON'T: Forget to tag room with backend
```typescript
const room = { id: 1, name: "Company" }; // Missing backend!
```

### ✅ DO: Always include backend
```typescript
const room = { id: 1, name: "Company", backend: 'odob' };
```

### ❌ DON'T: Use old auth store
```typescript
import { useAuthStore } from '../stores/authStore'; // Old!
```

### ✅ DO: Use multi-auth store
```typescript
import { useMultiAuthStore } from '../stores/multiAuthStore';
```

---

## 🧪 Testing Checklist

```bash
# Test Backend Selection
✓ Open app → Backend selection appears
✓ Choose Odob → Login screen with blue theme
✓ Choose Spot → Login screen with green theme

# Test Auth Flow
✓ Register new account
✓ Login existing account
✓ Token persisted on app restart
✓ Remember last backend

# Test Room Operations
✓ Fetch rooms from both backends
✓ Rooms grouped correctly
✓ Select room → Navigate to features
✓ Create room on active backend
✓ Join room with code

# Test Backend Switching
✓ Logout from current backend
✓ Redirected to backend selection
✓ Can login to other backend
✓ Rooms from new backend shown

# Test Edge Cases
✓ One backend down → Other still works
✓ Token expired → Auto refresh
✓ Invalid credentials → Clear error
✓ Network error → Retry option
```

---

## 🐛 Debugging Tips

### Check Current Auth State
```typescript
// In any component
const state = useMultiAuthStore.getState();
console.log('Auth State:', {
  activeBackend: state.activeBackend,
  odobAuth: state.odob.isAuthenticated,
  spotAuth: state.spot.isAuthenticated,
});
```

### Check API Client Headers
```typescript
// Enable logging in API client
if (__DEV__) {
  apiClient.interceptors.request.use((config) => {
    console.log('API Request:', {
      url: config.url,
      headers: config.headers,
      backend: /* detect from baseURL */
    });
    return config;
  });
}
```

### Check Token Storage
```typescript
// In development
const odobToken = await SecureStorage.getItem('odob_token');
const spotToken = await SecureStorage.getItem('spot_token');
console.log('Tokens:', { odobToken, spotToken });
```

---

## 📞 Quick Help

**Problem:** Backend selection not showing
**Solution:** Check RootNavigator hydration completed

**Problem:** API calls return 401
**Solution:** Check correct client used for room's backend

**Problem:** Rooms not showing
**Solution:** Check UnifiedRoomService returns backend field

**Problem:** Can't switch backend
**Solution:** Check logout properly clears auth state

---

## 🔗 Useful Links

- **Implementation Guide:** `DUAL_BACKEND_IMPLEMENTATION.md`
- **Migration Guide:** `MIGRATION_GUIDE.md`
- **Implementation Status:** `IMPLEMENTATION_STATUS.md`
- **Config:** `src/config/backends.ts`
- **Clients:** `src/api/clients/`
- **Auth Store:** `src/stores/multiAuthStore.ts`
- **Services:** `src/services/unifiedRoomService.ts`

---

**Print this page for quick reference during development! 📄**

