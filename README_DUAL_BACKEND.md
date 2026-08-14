# ODOB Mobile - Dual Backend Architecture

## 📱 Overview

ODOB Mobile is a cross-platform mobile application built with React Native (Expo) that supports **two independent backends**:

1. **OdobDaily** - Platform for any organization or company
2. **Spot Slimrich** - Platform for Human Plus & Slimrich ecosystem

Both backends share similar features but serve different user bases and have separate databases.

---

## 🏗️ Architecture

```
📱 Mobile App (React Native + Expo)
          ↓
    [Backend Selection]
          ↓
    ┌─────────┴─────────┐
    ↓                   ↓
🟦 OdobDaily       🟩 Spot Slimrich
    ↓                   ↓
MySQL Database     MySQL Database
(Host A)           (Host B)
```

### Key Features

- **Dual Backend Support** - Seamless switching between backends
- **Unified UI** - Consistent experience across both platforms
- **Independent Auth** - Separate authentication per backend
- **Backend Tagging** - All data tagged with source backend
- **Grouped Display** - Rooms grouped by backend in UI
- **Smart Routing** - API calls automatically routed to correct backend

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Clone repository
git clone <repository-url>
cd "ODOB Mobile"

# Install dependencies
npm install

# Start development server
npm start
```

### Environment Variables

Create `.env` file:

```env
ODOB_API_BASE_URL=https://odobdaily.com/api
SPOT_API_BASE_URL=https://spot.slimrich.id/api
```

For local development:
```env
ODOB_API_BASE_URL=http://10.0.2.2:8000/api
SPOT_API_BASE_URL=http://10.0.2.2:8001/api
```

### Run App

```bash
# iOS
npm run ios

# Android
npm run android

# Web (development)
npm run web
```

---

## 📂 Project Structure

```
ODOB Mobile/
├── src/
│   ├── api/
│   │   ├── clients/          # API clients per backend
│   │   │   ├── baseClient.ts
│   │   │   └── index.ts
│   │   ├── auth.ts
│   │   ├── rooms.ts
│   │   └── ...
│   ├── config/
│   │   └── backends.ts       # Backend configuration
│   ├── navigation/
│   │   ├── AuthStack.tsx
│   │   ├── AppStack.tsx
│   │   └── RootNavigator.tsx
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── BackendSelectionScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── room/
│   │   │   └── RoomListScreen.tsx (grouped by backend)
│   │   └── ...
│   ├── services/
│   │   ├── unifiedRoomService.ts  # Aggregates data
│   │   └── secureStorage.ts
│   ├── stores/
│   │   ├── multiAuthStore.ts      # Multi-backend auth
│   │   └── roomStore.ts
│   ├── types/
│   │   ├── auth.ts
│   │   └── room.ts  (includes backend field)
│   └── utils/
├── docs/
│   ├── DUAL_BACKEND_IMPLEMENTATION.md
│   ├── MIGRATION_GUIDE.md
│   ├── IMPLEMENTATION_STATUS.md
│   └── QUICK_REFERENCE.md
├── .env
├── package.json
└── README.md (this file)
```

---

## 🎯 User Flow

### First Time User

```
1. App Launch
   ↓
2. Backend Selection Screen
   ├─→ Choose OdobDaily (Any organization)
   └─→ Choose Spot Slimrich (Human Plus only)
       ↓
3. Login / Register
       ↓
4. Room List (grouped by backend)
       ↓
5. Select Room → Features
```

### Returning User

```
1. App Launch
   ↓
2. Auto-login to Last Used Backend
   ↓
3. Room List
   ↓
4. Features
```

### Backend Switching

```
1. Go to Profile/Settings
   ↓
2. Click "Switch Backend"
   ↓
3. Logout from Current Backend
   ↓
4. Backend Selection Screen
   ↓
5. Login to Other Backend
```

---

## 🔧 Development

### Adding New Features

When adding features that interact with API:

```typescript
// 1. Import correct client
import { getClient } from '../api/clients';

// 2. Get backend from room
const { activeRoom } = useRoomStore();

// 3. Use correct client
const client = getClient(activeRoom.backend);
const response = await client.get('/your-endpoint');
```

### Working with Auth

```typescript
// Multi-backend auth store
import { useMultiAuthStore } from '../stores/multiAuthStore';

const {
  odob,              // OdobDaily auth state
  spot,              // Spot Slimrich auth state
  activeBackend,     // Currently active backend
  loginToBackend,    // Login to specific backend
  logoutFromBackend, // Logout from specific backend
} = useMultiAuthStore();

// Get current user
const currentUser = activeBackend === 'odob' ? odob.user : spot.user;
```

### Working with Rooms

```typescript
// Unified room service
import { UnifiedRoomService } from '../services/unifiedRoomService';

// Get all rooms from both backends
const rooms = await UnifiedRoomService.getAllRooms();

// Get grouped by backend
const { odob, spot } = await UnifiedRoomService.getRoomsGrouped();

// Create room on specific backend
await UnifiedRoomService.createRoom('odob', { name: 'New Company' });
```

---

## 🧪 Testing

### Manual Testing

```bash
# 1. Backend Selection
✓ Open app
✓ See backend selection screen
✓ Both options clearly visible

# 2. Auth Flow
✓ Choose backend → Login screen
✓ Register new account
✓ Login existing account
✓ Token persisted

# 3. Room Operations
✓ See rooms grouped by backend
✓ Select room → Navigate
✓ Create room
✓ Join room with code

# 4. Backend Switching
✓ Switch backend button works
✓ Logout and reselect
✓ Login to other backend
✓ See correct rooms
```

### Automated Tests

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- BackendSelectionScreen.test.tsx
```

---

## 📊 Backend Comparison

| Feature | OdobDaily | Spot Slimrich |
|---------|-----------|---------------|
| **Target Users** | Any organization | Human Plus & Slimrich clients |
| **Email Domain** | Any | @humanplus.co.id only |
| **Departments** | Manual creation | Slimrich API integration |
| **Google OAuth** | ✅ Yes | ❌ No |
| **Use Case** | Flexible for any company | Enterprise tracking |
| **Database** | MySQL (Host A) | MySQL (Host B) |

---

## 🎨 Design System

### Color Coding

**OdobDaily:**
- Primary: `#3B82F6` (Blue)
- Badge: "ODOB"
- Use for: Buttons, badges, highlights

**Spot Slimrich:**
- Primary: `#10B981` (Green)
- Badge: "SPOT"
- Use for: Buttons, badges, highlights

### UI Components

All screens follow consistent design:
- Backend badge at top
- Color-coded primary actions
- Grouped displays for multi-backend data
- Clear visual feedback

---

## 📚 Documentation

- **[Implementation Guide](DUAL_BACKEND_IMPLEMENTATION.md)** - Complete architecture details
- **[Migration Guide](MIGRATION_GUIDE.md)** - Migrate from single to dual backend
- **[Implementation Status](IMPLEMENTATION_STATUS.md)** - Current progress & TODO
- **[Quick Reference](QUICK_REFERENCE.md)** - Cheat sheet for developers

---

## 🐛 Troubleshooting

### Common Issues

**Backend Selection Not Showing**
```
Solution: Check RootNavigator auth hydration
File: src/navigation/RootNavigator.tsx
```

**API Calls Return 401**
```
Solution: Ensure correct client used
Pattern: const client = getClient(room.backend);
```

**Rooms Not Showing**
```
Solution: Check UnifiedRoomService returns backend field
File: src/services/unifiedRoomService.ts
```

**Can't Switch Backend**
```
Solution: Check logout clears auth state properly
File: src/stores/multiAuthStore.ts
```

---

## 🚀 Deployment

### Build for Production

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### Pre-deployment Checklist

- [ ] Environment variables set correctly
- [ ] Backend URLs point to production
- [ ] All features tested on both backends
- [ ] Backend switching works
- [ ] Error handling tested
- [ ] Performance optimized

---

## 📞 Support

**Issues & Questions:**
- Create issue on GitHub
- Check documentation first
- Include error logs and screenshots

**Backend API Documentation:**
- OdobDaily: See `API_DOCUMENTATION OdobDaily.md`
- Spot Slimrich: See `SpotSlimrich API_DOCUMENTATION.md`

---

## 🔮 Future Enhancements

### Short Term
- [ ] Smart backend detection from email
- [ ] Health monitoring per backend
- [ ] Offline mode per backend
- [ ] Performance metrics

### Long Term
- [ ] API Gateway migration (if 3+ backends)
- [ ] Cross-backend search
- [ ] Advanced admin features
- [ ] Real-time sync

---

## 👥 Contributors

- Development Team
- Backend API Teams (OdobDaily & Spot Slimrich)

---

## 📄 License

[Your License Here]

---

## 🎉 Acknowledgments

- React Native & Expo team
- Backend API teams
- All contributors

---

**Version:** 2.0 (Dual Backend)  
**Last Updated:** January 2026  
**Status:** In Development (75% Complete)

