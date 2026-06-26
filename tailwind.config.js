/** @type {import('tailwindcss').Config} */
// NativeWind v4 Tailwind configuration
// Activated once nativewind and tailwindcss are installed (task 1.2)
module.exports = {
  // Scan all source files for class names
  content: [
    './App.tsx',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  // Include the NativeWind preset for React Native support
  presets: [
    // Uncomment after installing NativeWind (task 1.2):
    // require('nativewind/preset'),
  ],
  theme: {
    extend: {
      // Project-specific theme extensions go here
    },
  },
  plugins: [],
};
