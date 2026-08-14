# EAS Build Fix - August 14, 2026

## Problem Summary
EAS Build was failing with multiple errors preventing APK generation for QA testing.

## Issues Found and Fixed

### 1. TypeScript Compilation Error
**Error**: `rulesApi.list()` was being called with arguments but the function signature expected 0 arguments.

**Location**: `src/screens/rules/RulesScreen.tsx` line 50

**Fix**: Updated `src/api/rules.ts` to accept optional pagination parameters:
```typescript
list: (params?: { page?: number; per_page?: number }) => 
  activeClient().get<Rule[]>('/rules', { params })
```

### 2. NativeWind v4 Dependency Conflict
**Error**: Metro bundler couldn't resolve `react-native-css-interop/jsx-runtime`
- NativeWind v4 requires `react-native-css-interop` which depends on `react-native-worklets@0.10.x - 0.11.x`
- We had downgraded to `react-native-worklets@0.8.3` to fix AGP 8.x build issues
- This created an incompatible dependency tree

**Solution**: Downgraded to NativeWind v2 which is more stable and doesn't have these peer dependency conflicts.

**Changes Made**:
- `package.json`: Downgraded `nativewind` from `^4.2.6` to `^2.0.11`
- `package.json`: Downgraded `tailwindcss` from `^3.4.19` to `3.3.2`
- `babel.config.js`: Changed from v4 config (jsxImportSource) to v2 config (plugin-based)
- `metro.config.js`: Removed `withNativeWind` wrapper and global.css reference
- `tailwind.config.js`: Removed v4-specific preset configuration

### 3. Previous Fixes (from earlier build attempts)
- Fixed `android/gradle.properties`: Removed local JDK path that didn't exist on EAS servers
- Downgraded `react-native-worklets` from 0.9.2 to 0.8.3 (AGP 8.x compatibility)
- Installed `expo-build-properties@~56.0.24` for Android SDK configuration
- Created `.easignore` to reduce upload size
- Deleted orphaned `RegisterScreen.tsx` file

## Build Status
**Build ID**: 9643005f-4ce8-40d9-9a70-b1715699c776
**Build URL**: https://expo.dev/accounts/diazwirda/projects/odob-mobile/builds/9643005f-4ce8-40d9-9a70-b1715699c776
**Status**: In progress (JavaScript bundling succeeded, Gradle build running)

## Verification Steps
1. ✅ TypeScript compilation clean: `npx tsc --noEmit`
2. ✅ JavaScript bundling successful: `npx expo export --platform android`
3. ⏳ EAS Build in progress: Check build URL above for final status

## Next Steps
Once the build completes successfully:
1. Download the APK from the EAS build page
2. Share the download link with QA team
3. QA can install the APK directly on Android devices for testing

## Dependencies Changed
```json
"nativewind": "^2.0.11",  // was ^4.2.6
"tailwindcss": "3.3.2",    // was ^3.4.19
```

## Files Modified
- `src/api/rules.ts` (TypeScript fix)
- `src/screens/rules/RulesScreen.tsx` (removed `as any`)
- `package.json` (downgraded NativeWind)
- `babel.config.js` (v4 → v2 config)
- `metro.config.js` (removed withNativeWind)
- `tailwind.config.js` (removed v4 preset)
