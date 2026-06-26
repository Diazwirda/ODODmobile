/** @type {import('jest').Config} */
const config = {
  // Use jest-expo preset as base — handles React Native + Expo module mocks
  // and sets up the correct Babel transformer (expo/internal/babel-preset)
  preset: 'jest-expo',

  // Override the babel-jest transform to explicitly bypass babel.config.js
  // (which is for Metro/app builds only) and use expo's internal preset directly.
  // This avoids @babel/core@7.29+ strict validation errors from @react-native/babel-preset.
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        // Disable project-level babel.config.js — use expo's internal preset
        configFile: false,
        babelrc: false,
        presets: [require.resolve('expo/internal/babel-preset')],
        caller: { name: 'metro', bundler: 'metro', platform: 'ios' },
      },
    ],
  },

  // Transpile packages that ship ESM or need Babel transform beyond the preset defaults.
  // Extend the default list to include nativewind and react-native-config.
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '(jest-)?react-native' +
      '|@react-native(-community)?' +
      '|expo(nent)?' +
      '|@expo(nent)?/.*' +
      '|@expo-google-fonts/.*' +
      '|react-navigation' +
      '|@react-navigation/.*' +
      '|nativewind' +
      '|tailwindcss' +
      '|react-native-config' +
      '))',
  ],

  // Module name mapper — path aliases matching tsconfig.json + static file stubs
  moduleNameMapper: {
    // Path aliases from tsconfig.json "paths"
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@stores/(.*)$': '<rootDir>/src/stores/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',

    // Stub out CSS imports (NativeWind global.css is not needed at test time)
    '\\.(css)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // File extensions Jest resolves
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
    '**/?(*.)+(spec|test)-[jt]s?(x)',
  ],

  // Collect coverage from src/
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
};

module.exports = config;
