# Dual Backend Implementation Guide

## 📋 Overview

Aplikasi mobile ini mendukung 2 backend yang berbeda:
- **OdobDaily**: Platform umum untuk organisasi apapun
- **Spot Slimrich**: Platform khusus Human Plus & Slimrich ecosystem

Kedua backend memiliki database MySQL di host yang berbeda, sehingga diperlukan dual API client architecture.

---

## 🏗️ Arsitektur

```
📱 Mobile App
    ↓
Backend Selection Screen
    ├─→ OdobDaily Flow
    │   ├─ API: https://odobdaily.com/api
    │   ├─ Token: odob_token
    │   └─ Features: Manual departments, any email, Google OAuth
    │
    └─→ Spot Slimrich Flow
        ├─ API: https://spot.slimrich.id/api
        ├─ Token: spot_token
        └─ Features: Slimrich API, @humanplus.co.id only
```

---

## 📂 File Structure

### New Files Created:

```
src/
├─ config/
│  └─ backends.ts                      # Backend configuration & validation
├─ api/
│  └─ clients/
│     ├─ baseClient.ts                 # API client factory
│     └─ index.ts                      # Client registry & shortcuts
├─ services/
│  └─ unifiedRoomService.ts            # Aggregate rooms from both backends
├─ stores/
│  └─ multiAuthStore.ts                # Multi-backend auth state
└─ screens/
   └─ auth/
      ├─ BackendSelectionScreen.tsx    # Choose backend
      └─ LoginScreen.tsx                # Login with backend param
```

### Modified Files:

```
src/
├─ types/
│  └─ room.ts                          # Added 'backend' field
├─ services/
│  └─ secureStorage.ts                 # Generic key-value storage
├─ navigation/
│  └─ types.ts                         # Added backend params
└─ .env                                 # Added both backend URLs
```

---

## 🔑 Key Concepts

### 1. Backend Configuration

```typescript
// src/config/backends.ts
export const BACKENDS = {
  odob: {
    id: 'odob',
    name: 'OdobDaily',
    baseURL: 'https://odobdaily.com/api',
    features: {
      manualDepartments: true,
      emailRestriction: null, // Any email
    },
  },
  spot: {
    id: 'spot',
    name: 'Spot Slimrich',
    baseURL: 'https://spot.slimrich.id/api',
    features: {
      slimrichIntegration: true,
      emailRestriction: '@humanplus.co.id',
    },
  },
};
```

### 2. Separate Token Storage

```typescript
// Tokens stored separately per backend
odob_token: "eyJhbGciOiJIUzI1NiIs..."
spot_token: "eyJhbGciOiJIUzI1NiIs..."
```

### 3. Backend-Tagged Data

```typescript
// Each room knows which backend it's from
interface Room {
  id: number;
  name: string;
  backend: 'odob' | 'spot'; // ← Backend identifier
  // ... other fields
}
```

### 4. Unified Services

```typescript
// Service layer aggregates data from both backends
const rooms = await UnifiedRoomService.getAllRooms();
// Returns: [
//   { id: 1, name: "Company A", backend: "odob" },
//   { id: 2, name: "Company B", backend: "spot" }
// ]
```

---

## 🚀 User Flow

### First Time User

```
1. Open App
   ↓
2. Backend Selection Screen
   ↓
3. Choose "OdobDaily" or "Spot Slimrich"
   ↓
4. Login/Register
   ↓
5. Access Rooms & Features
```

### Returning User

```
1. Open App
   ↓
2. Auto-login to last used backend
   ↓
3. Access Rooms & Features
```

### Switching Backend (Admin/Superuser)

```
1. Go to Settings/Profile
   ↓
2. "Switch Backend" or "Add Another Account"
   ↓
3. Login to other backend
   ↓
4. Access rooms from both backends
```

---

## 🔐 Authentication Flow

### Per-Backend Auth

```typescript
// Login to OdobDaily
await useMultiAuthStore.getState().loginToBackend('odob', {
  email: 'user@company.com',
  password: 'password123',
});

// Login to Spot Slimrich
await useMultiAuthStore.getState().loginToBackend('spot', {
  email: 'admin@humanplus.co.id',
  password: 'password123',
});
```

### Token Management

```typescript
// API clients automatically use correct token
const odobClient = getClient('odob'); // Uses odob_token
const spotClient = getClient('spot'); // Uses spot_token

// Tokens refreshed independently per backend
```

---

## 🎨 UI/UX Guidelines

### Visual Distinction

**OdobDaily Theme:**
- Primary Color: `#3B82F6` (Blue)
- Badge: "ODOB"
- Icon: Could use 📊 or 🏢

**Spot Slimrich Theme:**
- Primary Color: `#10B981` (Green)
- Badge: "SPOT"
- Icon: Could use 🎯 or ✨

### Backend Selection Screen

- Two equal-sized cards
- Clear feature comparison
- Visual distinction with colors
- Helpful hint: "Not sure? Choose OdobDaily"

### Login Screen

- Backend badge at top (colored)
- Email hint based on backend
- Google OAuth only for OdobDaily
- Back button to change backend

### Room List

**Option A: Grouped by Backend**
```
🏢 My Companies

🟦 OdobDaily (3)
  - Company A
  - Company B
  - Company C

🟩 Spot Slimrich (2)
  - Human Plus
  - Client XYZ
```

**Option B: Unified with Badges**
```
🏢 My Companies (5)

  🟦 Company A (Odob)
  🟦 Company B (Odob)
  🟦 Company C (Odob)
  🟩 Human Plus (Spot)
  🟩 Client XYZ (Spot)
```

---

## 🔧 API Client Usage

### Basic Usage

```typescript
import { odobClient, spotClient } from '../api/clients';

// OdobDaily request
const response = await odobClient().get('/rooms');

// Spot Slimrich request
const response = await spotClient().get('/rooms');
```

### Unified Service

```typescript
import { UnifiedRoomService } from '../services/unifiedRoomService';

// Get all rooms from both backends
const rooms = await UnifiedRoomService.getAllRooms();

// Get rooms grouped
const { odob, spot } = await UnifiedRoomService.getRoomsGrouped();

// Create room in specific backend
const room = await UnifiedRoomService.createRoom('odob', {
  name: 'New Company',
});
```

---

## ⚙️ Configuration

### Environment Variables

```env
# .env
ODOB_API_BASE_URL=https://odobdaily.com/api
SPOT_API_BASE_URL=https://spot.slimrich.id/api

# Legacy support
API_BASE_URL=https://odobdaily.com/api
```

### Backend Config

```typescript
// src/config/backends.ts
export const BACKENDS = {
  odob: { ... },
  spot: { ... },
};
```

---

## 🧪 Testing

### Test Scenarios

**1. Single Backend User (Most Common)**
```
✓ Login to OdobDaily only
✓ Never see Spot Slimrich
✓ All features work normally
```

**2. Admin/Superuser (Rare)**
```
✓ Login to both backends
✓ Switch between backends
✓ Access rooms from both
```

**3. Backend Switching**
```
✓ Logout from one backend
✓ Login to another backend
✓ Data isolated correctly
```

**4. Token Refresh**
```
✓ Each backend refreshes independently
✓ One backend failure doesn't affect other
```

**5. Error Handling**
```
✓ One backend down, other still works
✓ Email validation per backend
✓ Clear error messages
```

---

## 🚨 Common Issues & Solutions

### Issue: Wrong backend selected

**Symptom:** User tries to login with @humanplus.co.id on OdobDaily

**Solution:** 
- Email validation before login
- Clear error message
- "Go back" button to reselect backend

### Issue: Token expired on one backend

**Symptom:** 401 error on one backend

**Solution:**
- Auto token refresh per backend
- If refresh fails, only that backend requires re-login
- Other backend continues working

### Issue: Confusion about which backend to choose

**Symptom:** User unsure between OdobDaily vs Spot

**Solution:**
- Clear descriptions on selection screen
- Default recommendation: OdobDaily
- Email-based smart suggestion (future enhancement)

---

## 📊 Performance Considerations

### Network Requests

- Rooms fetched in parallel from both backends
- Fast fail if one backend unavailable
- Cached per backend separately

### Token Management

- Tokens cached in secure storage
- No unnecessary re-fetch
- Independent refresh cycles

### Data Consistency

- Each backend is source of truth for its data
- No cross-backend data sync needed
- Room list merged client-side

---

## 🔮 Future Enhancements

### Phase 1 (Current - MVP)
- ✅ Backend selection
- ✅ Separate auth per backend
- ✅ Unified room list
- ✅ Visual distinction

### Phase 2 (Optional)
- [ ] Smart backend detection from email
- [ ] Simultaneous login to both backends
- [ ] Backend health monitoring
- [ ] Offline support per backend

### Phase 3 (If Needed)
- [ ] API Gateway migration path
- [ ] Cross-backend search
- [ ] Unified notifications
- [ ] Advanced admin features

---

## 📞 Support & Maintenance

### Backend API Changes

- Both backends under your control ✅
- API consistency can be ensured
- Coordinate changes between backends
- Version tracking optional but recommended

### Adding Backend #3

If you need to add a third backend:

1. Add to `BACKENDS` config
2. Add type to `BackendType`
3. Create client getter
4. Update UI selection screen
5. Test independently

**Recommendation:** If adding 3rd backend, consider API Gateway migration.

---

## ✅ Implementation Checklist

### Core Architecture
- [x] Backend configuration
- [x] Dual API clients
- [x] Multi-auth store
- [x] Secure storage (per backend)
- [x] Unified room service

### UI Screens
- [x] Backend selection screen
- [x] Login screen (with backend param)
- [ ] Register screen (with backend param)
- [ ] Room list (with backend grouping)
- [ ] Settings (backend switcher)

### Features
- [ ] Token refresh per backend
- [ ] Error handling per backend
- [ ] Logout flow
- [ ] Backend health check
- [ ] Navigation integration

### Testing
- [ ] Login to OdobDaily
- [ ] Login to Spot Slimrich
- [ ] Switch between backends
- [ ] Token refresh
- [ ] Error scenarios

---

## 🎯 Next Steps

1. **Complete Register Screen** with backend param
2. **Update RootNavigator** to handle backend selection
3. **Implement Room List** with backend grouping
4. **Add Backend Switcher** in settings
5. **Testing** all scenarios
6. **Polish UI/UX**

---

**Last Updated:** January 2026
**Implementation Status:** 60% Complete
**Target Completion:** <2 weeks

