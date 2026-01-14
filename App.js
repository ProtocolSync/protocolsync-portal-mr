// Fix for Expo Monorepo hoisting issue
// node_modules/expo/AppEntry.js tries to import ../../App
// This file bridges that gap to the actual app location
export { default } from './apps/portal-mobile/App';
