# API Key Missing Error - Quick Fix

## Problem
API calls return:
```json
{
  "success": false,
  "error": "API key required",
  "message": "Please provide a valid API key in the X-API-Key header"
}
```

## Root Cause
The Vite dev server needs to be **restarted** after adding or changing environment variables in `.env` file.

## Solution

### Step 1: Verify .env File
```bash
cd protocolsync-portal
cat .env | grep VITE_API_KEY
```

Should show:
```
VITE_API_KEY=ps_9578e3af7e5cc54c5b9d6634649d7bb777ee282912522bd7b35a54f67ac3b849
```

### Step 2: Restart Vite Dev Server

**Kill existing server:**
```bash
# Press Ctrl+C in the terminal running npm run dev
# OR
pkill -f "vite"
```

**Start fresh:**
```bash
cd protocolsync-portal
npm run dev
```

### Step 3: Verify API Key is Loaded

Open the portal in browser and check the console. You should see:
```
🔑 API Configuration Check:
- VITE_API_URL: http://localhost:3000/api/v1
- VITE_API_KEY: ps_9578e3af7e... (69 chars)
```

If you see `❌ NOT FOUND`, the environment variable wasn't loaded. Restart the dev server.

### Step 4: Test API Calls

Navigate around the portal. Check browser DevTools → Network tab:
- ✅ All requests to `localhost:3000` should include `X-API-Key` header
- ✅ No "API key required" errors

## Debugging

### Check if API key is being sent

Open browser DevTools → Network tab → Click on any API request → Headers tab

Look for:
```
Request Headers:
  X-API-Key: ps_9578e3af7e5cc54c5b9d6634649d7bb777ee282912522bd7b35a54f67ac3b849
```

### Check console logs

In the browser console, look for:
```
[DataProvider] Adding API key to headers
```

If you see:
```
[DataProvider] ⚠️ VITE_API_KEY not found in environment!
```

Then **restart the dev server**.

## Common Mistakes

❌ **Wrong:**
```env
API_KEY=ps_...           # Missing VITE_ prefix
REACT_APP_API_KEY=ps_... # Wrong prefix (that's for Create React App)
```

✅ **Correct:**
```env
VITE_API_KEY=ps_9578e3af7e5cc54c5b9d6634649d7bb777ee282912522bd7b35a54f67ac3b849
```

## Why Does This Happen?

**Vite's Environment Variable Behavior:**
1. Vite only reads `.env` files **at startup**
2. Changes to `.env` require a **full restart**
3. Hot Module Replacement (HMR) does NOT reload env variables
4. Only variables prefixed with `VITE_` are exposed to client code

## Production Build

For production builds, environment variables are **baked into the bundle** at build time:

```bash
npm run build
```

If you change the `.env` file, you must **rebuild**:
```bash
rm -rf dist
npm run build
```

## Quick Test Command

Test API call with curl to verify backend accepts the key:
```bash
curl -H "X-API-Key: ps_9578e3af7e5cc54c5b9d6634649d7bb777ee282912522bd7b35a54f67ac3b849" \
  http://localhost:3000/api/v1/companies/12/sites
```

Should return data, not "API key required" error.

## Summary

**The most common fix:**
1. Kill the dev server (Ctrl+C)
2. Run `npm run dev` again
3. Refresh browser
4. Check console for API key confirmation
5. Test API calls

✅ Done!
