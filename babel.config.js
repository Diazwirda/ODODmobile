// Babel configuration for Metro bundler (Expo app build).
//
// When NativeWind v4 is installed (task 1.2), uncomment the nativewind preset
// and plugin. For Jest, jest-expo handles its own babel configuration separately
// (via expo/internal/babel-preset) and does not use this file.
//
// NOTE: This file is intentionally kept minimal to avoid conflicts with
// jest-expo's internal babel resolver. NativeWind-specific config is enabled
// automatically when nativewind is installed.

module.exports = function (api) {
  api.cache(true);

  // Resolve babel-preset-expo from expo's internal package (avoids hoisting issues
  // when babel-preset-expo is only present under node_modules/expo/node_modules/).
  const expoPresetPath = require.resolve('expo/internal/babel-preset');

  // Check if nativewind is installed
  let hasNativeWind = false;
  try {
    require.resolve('nativewind/babel');
    hasNativeWind = true;
  } catch {
    hasNativeWind = false;
  }

  if (hasNativeWind) {
    return {
      presets: [[expoPresetPath, { jsxImportSource: 'nativewind' }]],
      plugins: ['nativewind/babel'],
    };
  }

  // Default: standard Expo preset (compatible with jest-expo)
  return {
    presets: [[expoPresetPath]],
  };
};
