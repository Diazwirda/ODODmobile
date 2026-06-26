const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = defineConfig([
  globalIgnores(['dist/*', '.expo/*', 'node_modules/*', 'android/*', 'ios/*']),
  ...expoConfig,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // TypeScript strictness — on top of what eslint-config-expo provides
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
]);
