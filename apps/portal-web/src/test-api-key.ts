// Test API Key Configuration
// Run this in the browser console to verify the API key is loaded

console.log('🔍 API Key Configuration Test');
console.log('================================');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('VITE_API_KEY:', import.meta.env.VITE_API_KEY ? 
  `${import.meta.env.VITE_API_KEY.substring(0, 10)}...` : '❌ NOT FOUND');
console.log('================================');

if (!import.meta.env.VITE_API_KEY) {
  console.error('⚠️ VITE_API_KEY is not loaded!');
  console.log('Solutions:');
  console.log('1. Make sure .env file has: VITE_API_KEY=ps_...');
  console.log('2. Restart the Vite dev server: npm run dev');
  console.log('3. Clear browser cache and reload');
} else {
  console.log('✅ API Key is loaded correctly');
}
