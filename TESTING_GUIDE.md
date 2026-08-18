# Testing Guide - ODOB Mobile

## 📋 Overview

Project ini menggunakan **Jest** dan **React Native Testing Library** untuk unit testing.

## 🧪 Test Structure

```
src/
├── components/
│   └── __tests__/
│       └── AppNavbar.test.tsx
├── stores/
│   └── __tests__/
│       └── roomStore.test.ts
└── utils/
    └── __tests__/
        ├── fileDownload.test.ts
        └── toast.test.ts
```

## 🚀 Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- fileDownload.test
```

## 📊 Current Test Coverage

### Utils
- ✅ **fileDownload.ts** - File download and sharing utilities
  - `generateFilename()` - Generate filename with timestamp
  - `getExtensionFromMimeType()` - Get file extension from MIME type
  - `downloadFile()` - Download file from URL
  - `shareFile()` - Share file with system dialog
  - `downloadAndShare()` - Download and share in one step
  
- ✅ **toast.ts** - Error handling utilities
  - `handleApiError()` - Parse and format API errors (status codes 401, 403, 404, 409, 422, 502)
  - `getValidationErrors()` - Extract validation errors from 422 responses

### Stores
- ✅ **roomStore.ts** - Room state management
  - Initialize with empty values
  - Set active room with admin role
  - Set active room with reporter role
  - Normalize room with legacy user_role field
  - Use role as fallback for can_manage when undefined
  - Clear active room

### Components
- ✅ **AppNavbar.tsx** - App navigation bar
  - Render title and user avatar with initials
  - Show/hide dropdown menu on avatar press
  - Conditional "Ganti Perusahaan" button (only shows when activeRoom exists)
  - Navigate back and clear room when "Ganti Perusahaan" pressed
  - Logout functionality

**Test Summary:**
- ✅ 4 test suites (all passing)
- ✅ 38 tests (all passing)
- ⏱️ Average run time: ~9-10 seconds

## 🔧 Writing New Tests

### Test Template for Utils

```typescript
import { myFunction } from '../myUtil';

describe('myUtil', () => {
  describe('myFunction', () => {
    it('should do something', () => {
      const result = myFunction('input');
      expect(result).toBe('expected');
    });

    it('should handle edge cases', () => {
      expect(() => myFunction(null)).toThrow();
    });
  });
});
```

### Test Template for Components

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent title="Test" />);
    expect(getByText('Test')).toBeTruthy();
  });

  it('should handle user interaction', () => {
    const mockFn = jest.fn();
    const { getByText } = render(
      <MyComponent onPress={mockFn} />
    );
    
    fireEvent.press(getByText('Button'));
    expect(mockFn).toHaveBeenCalled();
  });
});
```

### Test Template for Stores (Zustand)

```typescript
import { act } from '@testing-library/react-native';
import { useMyStore } from '../myStore';

describe('myStore', () => {
  beforeEach(() => {
    act(() => {
      useMyStore.setState({ data: null });
    });
  });

  it('should update state', () => {
    act(() => {
      useMyStore.getState().setData('new value');
    });

    const store = useMyStore.getState();
    expect(store.data).toBe('new value');
  });
});
```

## 🎯 What to Test

### ✅ DO Test:
- **Business logic** (utils, helpers, calculations)
- **State management** (stores, reducers)
- **Component behavior** (user interactions, conditional rendering)
- **API error handling**
- **Edge cases** (null, undefined, empty arrays, etc.)

### ❌ DON'T Test:
- **External libraries** (axios, react-navigation, expo)
- **Trivial functions** (getters, setters without logic)
- **Styles** (unless critical for functionality)
- **Third-party component internals**

## 🔍 Debugging Tests

### Run Single Test with Verbose Output
```bash
npm test -- --verbose myTest.test
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "${file}"],
  "console": "integratedTerminal"
}
```

## 📝 Test Best Practices

### 1. **AAA Pattern** (Arrange-Act-Assert)
```typescript
it('should calculate total', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];
  
  // Act
  const total = calculateTotal(items);
  
  // Assert
  expect(total).toBe(30);
});
```

### 2. **Clear Test Names**
```typescript
// ❌ Bad
it('works', () => { ... });

// ✅ Good
it('should return sum of all item prices', () => { ... });
```

### 3. **One Assertion Per Test** (when possible)
```typescript
// ❌ Bad
it('should handle user', () => {
  expect(user.name).toBe('John');
  expect(user.age).toBe(30);
  expect(user.email).toBe('john@example.com');
});

// ✅ Good
it('should set user name', () => {
  expect(user.name).toBe('John');
});

it('should set user age', () => {
  expect(user.age).toBe(30);
});
```

### 4. **Clean Up After Tests**
```typescript
describe('MyComponent', () => {
  beforeEach(() => {
    // Setup
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    jest.restoreAllMocks();
  });
});
```

## 🎨 Mocking Guide

### Mock Functions
```typescript
const mockFn = jest.fn();
mockFn.mockReturnValue('value');
mockFn.mockResolvedValue('async value');
```

### Mock Modules
```typescript
jest.mock('../myModule', () => ({
  myFunction: jest.fn(() => 'mocked'),
}));
```

### Mock Stores
```typescript
jest.mock('../../stores/myStore', () => ({
  useMyStore: jest.fn(() => ({
    data: 'mocked data',
    setData: jest.fn(),
  })),
}));
```

## 📈 CI/CD Integration

Tests run automatically on:
- **Pre-commit** (optional, via husky)
- **Pull requests** (via GitHub Actions)
- **Before deployment**

### GitHub Actions Example
``yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
```

## 📚 Resources

- **Jest Docs**: https://jestjs.io/docs/getting-started
- **React Native Testing Library**: https://callstack.github.io/react-native-testing-library/
- **Testing Best Practices**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

## 🎯 Next Steps

### To Add:
- [ ] API integration tests
- [ ] Screen navigation tests  
- [ ] Form validation tests
- [ ] E2E tests (Detox/Maestro)
- [ ] Snapshot tests for critical UI

### Coverage Goals:
- **Target**: 80% code coverage
- **Current**: Run `npm run test:coverage` to see

---

**Happy Testing!** 🧪✨
