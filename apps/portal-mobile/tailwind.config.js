const nativewindPreset = require('@protocolsync/shared-styles/mobile/nativewind-preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require("nativewind/preset"), nativewindPreset],
  theme: {
    extend: {
      // Mobile-specific extensions (if any)
    },
  },
  plugins: [],
};
