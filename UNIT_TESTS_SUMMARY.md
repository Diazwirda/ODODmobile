# Unit Tests Summary - ODOB Mobile

## ✅ Test Status

**All tests are passing!** 🎉

- **Test Suites**: 4 passed, 4 total
- **Tests**: 38 passed, 38 total
- **Run Time**: ~9-10 seconds (fast execution)
- **Date Created**: January 2025

---

## 📦 What Was Tested

### 1. **File Download Utilities** (`src/utils/__tests__/fileDownload.test.ts`)

Tests for downloading and sharing files with native dialogs:

✅ `generateFilename()` - Creates timestamped filenames
- Excel files: `Report_2026-01-15T10-30-45.xlsx`
- PDF files: `Report_2026-01-15T10-30-45.pdf`
- CSV files: `Data_2026-01-15T10-30-45.csv`

✅ `getExtensionFromMimeType()` - Converts MIME types to extensions
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` → `xlsx`
- `application/pdf` → `pdf`
- `text/csv` → `csv`
- Unknown types → `bin`

✅ `downloadFile()` - Downloads files from remote URLs
- Success scenario with progress tracking
- Handles download failures
- Proper error handling

✅ `shareFile()` - Shares files via native share dialog
- Success with system share dialog
- Returns false if sharing unavailable
- Error handling

✅ `downloadAndShare()` - Combined download + share
- End-to-end flow
- Proper error propagation

**Total: 12 tests**

---

### 2. **Toast/Error Handler** (`src/utils/__tests__/toast.test.ts`)

Tests for API error handling and user-friendly error messages:

✅ `handleApiError()` - Converts HTTP errors to Indonesian messages
- **401**: "Sesi Anda telah berakhir. Silakan login kembali."
- **403**: "Anda tidak memiliki akses untuk melakukan aksi ini."
- **404**: "Data yang diminta tidak ditemukan."
- **409**: "Room aktif belum dipilih."
- **422**: Returns first validation error from `errors` object
- **502**: "Server sedang bermasalah. Silakan coba lagi beberapa saat lagi."
- **No response**: "Tidak ada koneksi internet. Periksa jaringan Anda."
- **Default**: "Terjadi kesalahan. Silakan coba lagi."

✅ `getValidationErrors()` - Extracts validation errors
- Returns object of field → error message for 422 responses
- Returns null for non-422 errors
- Handles missing errors gracefully

**Total: 9 tests**

---

### 3. **Room Store** (`src/stores/__tests__/roomStore.test.ts`)

Tests for Zustand state management of room/company selection:

✅ **Initialization**
- Starts with empty rooms array
- `activeRoom` is null
- `activeRoomRole` is null
- `isLoading` is false

✅ **Setting Active Room**
- Sets room with admin role correctly
- Sets room with reporter role correctly
- Normalizes legacy `user_role` field to `membership_role`
- Uses role as fallback for `can_manage` when undefined

✅ **Clearing Active Room**
- Resets `activeRoom` to null
- Resets `activeRoomRole` to null

**Total: 6 tests**

---

### 4. **App Navbar Component** (`src/components/__tests__/AppNavbar.test.tsx`)

Tests for the main navigation bar with user menu:

✅ **Rendering**
- Displays title prop
- Shows user avatar with initials (e.g., "John Doe" → "JD")

✅ **Menu Toggle**
- Menu hidden by default
- Shows menu when avatar pressed
- Displays "Keluar" (logout) button

✅ **Conditional Button Logic**
- "Ganti Perusahaan" button **hidden** when NOT in a room (`activeRoom === null`)
- "Ganti Perusahaan" button **shown** when in a room (`activeRoom !== null`)

✅ **Actions**
- "Ganti Perusahaan" calls `clearActiveRoom()` and navigates back
- "Keluar" calls `logoutFromBackend()` with correct backend

**Total: 11 tests**

---

## 🧪 Test Configuration

### Dependencies
```json
{
  "jest": "^29.7.0",
  "jest-expo": "56.0.5",
  "@testing-library/react-native": "^12.9.0",
  "@testing-library/jest-native": "^5.4.3",
  "@react-native/jest-preset": "0.85.3",
  "@types/jest": "^29.5.14"
}
```

### Files
- **`jest.config.js`** - Jest configuration with `jest-expo` preset
- **`jest.setup.js`** - Mocks for Expo modules (FileSystem, Sharing, StatusBar, Keychain, AsyncStorage)

### Commands
```bash
npm test                # Run all tests once
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```

---

## 🎯 Coverage Goals

### Current Coverage
- **Overall**: ~6-10% (because only 4 modules are tested)
- **Tested Modules**: 47-88% coverage

### Target Coverage
- **Phase 1** (Current): Core utilities, stores, and critical components ✅
- **Phase 2** (Future): API services, screens, form validation
- **Phase 3** (Future): E2E tests with Detox or Maestro
- **Goal**: 80% overall code coverage

---

## 🚀 Running Tests

### Quick Start
```bash
# Install dependencies (if not already installed)
npm install

# Run all tests
npm test
```

### Expected Output
```
PASS  src/utils/__tests__/toast.test.ts
PASS  src/utils/__tests__/fileDownload.test.ts
PASS  src/stores/__tests__/roomStore.test.ts
PASS  src/components/__tests__/AppNavbar.test.tsx

Test Suites: 4 passed, 4 total
Tests:       38 passed, 38 total
Snapshots:   0 total
Time:        ~9-10s
```

---

## 📝 What's NOT Tested Yet

### API Services
- `src/api/admin.ts`
- `src/api/auth.ts`
- `src/api/rooms.ts`
- `src/api/rules.ts`
- `src/api/reports.ts`

### Screens
- Login/Register screens
- Room list screen
- Export screen
- Report screens
- Admin screens

### Form Validation
- `react-hook-form` with `zod` schemas
- Field-level validation
- Form submission handling

### Navigation
- Stack navigation
- Tab navigation
- Deep linking

### Services
- `UnifiedRoomService`
- `UnifiedAuthService`

---

## 🔍 Debugging Tests

### Run Single Test File
```bash
npm test -- fileDownload.test
```

### Run Specific Test
```bash
npm test -- -t "should generate filename"
```

### Run with Verbose Output
```bash
npm test -- --verbose
```

### Watch Mode (Auto-rerun on file changes)
```bash
npm run test:watch
```

---

## 📚 Best Practices Used

1. **AAA Pattern** (Arrange-Act-Assert)
   - Clear test structure
   - Easy to read and maintain

2. **Clear Test Names**
   - Descriptive test names like "should show Ganti Perusahaan button when in a room"
   - Easy to understand what's being tested

3. **Proper Mocking**
   - External dependencies mocked (Expo modules, navigation, stores)
   - Isolated unit tests

4. **Cleanup**
   - `beforeEach()` resets state
   - `jest.clearAllMocks()` prevents test pollution

5. **Real-World Scenarios**
   - Tests match actual user flows
   - Edge cases covered (network errors, missing data, etc.)

---

## 🛠️ Adding New Tests

### For Utils
```typescript
// src/utils/__tests__/myUtil.test.ts
import { myFunction } from '../myUtil';

describe('myUtil', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### For Components
```typescript
// src/components/__tests__/MyComponent.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent title="Test" />);
    expect(getByText('Test')).toBeTruthy();
  });
});
```

### For Stores
```typescript
// src/stores/__tests__/myStore.test.ts
import { act } from '@testing-library/react-native';
import { useMyStore } from '../myStore';

describe('myStore', () => {
  it('should update state', () => {
    act(() => {
      useMyStore.getState().setData('value');
    });
    expect(useMyStore.getState().data).toBe('value');
  });
});
```

---

## 📖 Resources

- **Jest Docs**: https://jestjs.io/docs/getting-started
- **React Native Testing Library**: https://callstack.github.io/react-native-testing-library/
- **Testing Best Practices**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
- **Expo Testing**: https://docs.expo.dev/develop/unit-testing/

---

## ✨ Next Steps

1. **Add API Tests** - Test API service functions
2. **Add Screen Tests** - Test critical user flows
3. **Add Form Tests** - Test validation and submission
4. **Set Up CI/CD** - Run tests automatically on push/PR
5. **Add Coverage Badge** - Show test coverage in README
6. **E2E Tests** - Add Detox or Maestro for full app testing

---

**Happy Testing!** 🧪✨

*Last Updated: 2026-08-18*
