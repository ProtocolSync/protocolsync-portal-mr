import sharedPreset from '@protocolsync/shared-styles/tailwind-preset';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [sharedPreset],
  important: true,
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Portal-web specific extensions (if any)
    },
  },
  plugins: [],
}
