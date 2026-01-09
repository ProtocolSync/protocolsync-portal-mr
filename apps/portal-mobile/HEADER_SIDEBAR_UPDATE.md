# Mobile App UI Update - Web Portal Design Match

**Date**: January 8, 2026
**Update**: Header and Sidebar to match web portal

---

## What Was Built

### 1. AppHeader Component ✅

**Location**: `src/components/common/AppHeader.tsx`

**Features:**
- ✅ White background with shadow (matches web)
- ✅ Hamburger menu button (toggles sidebar)
- ✅ User profile display (Hello, [First Name] + Company name)
- ✅ Role switcher dropdown (ADMIN, SITE ADMIN, TRIAL LEAD, SITE USER)
- ✅ Sign Out button (purple/indigo color)
- ✅ Responsive layout

**Design Details:**
```
┌─────────────────────────────────────────────────────────┐
│ ☰  Dashboard    Hello, David    [ADMIN ▼]  [Sign Out] │
│                 Cancer Center                           │
└─────────────────────────────────────────────────────────┘
```

### 2. AppSidebar Component ✅

**Location**: `src/components/common/AppSidebar.tsx`

**Features:**
- ✅ Dark green background (matches web sidebar)
- ✅ Protocol Sync logo at top
- ✅ Role-based navigation menu
- ✅ Section headers (MANAGEMENT, COMPLIANCE, ACCOUNT, etc.)
- ✅ Active route highlighting
- ✅ Footer with version info

**Navigation Structure:**

**CRO Admin:**
```
PROTOCOL SYNC
─────────────
📊 Dashboard

MANAGEMENT
🏢 Sites
👤 Site Administrators
👥 Users

COMPLIANCE
📊 Reports

ACCOUNT
💳 Billing
❓ Help
```

**Site Admin:**
```
PROTOCOL SYNC
─────────────
📊 Dashboard

TRIALS
🔬 Manage Trials

MANAGEMENT
👥 Site Users

COMPLIANCE
📊 Reports

SUPPORT
❓ Help
```

**Trial Lead:**
```
PROTOCOL SYNC
─────────────
📊 Dashboard

TRIAL MANAGEMENT
📄 Protocol Versions
📋 Delegation Log

SUPPORT
❓ Help
```

**Site User:**
```
PROTOCOL SYNC
─────────────
📊 Dashboard

PROTOCOLS
📄 My Protocols

SUPPORT
❓ Help
```

### 3. Updated Navigation ✅

**Location**: `src/navigation/AppNavigator.tsx`

**Changes:**
- ✅ Custom drawer content using AppSidebar
- ✅ Custom header using AppHeader
- ✅ Drawer width: 280px
- ✅ Header shows on all screens
- ✅ Hamburger menu toggles drawer

---

## Visual Comparison

### Before (Old Mobile):
```
┌──────────────────────────────┐
│ ☰ Dashboard      [Logout]    │  ← Green header
└──────────────────────────────┘
```

### After (New - Matches Web):
```
┌──────────────────────────────────────────┐
│ ☰  Dashboard  Hello, David  [ADMIN ▼]   │  ← White header
│               Cancer Center  [Sign Out]  │
└──────────────────────────────────────────┘
```

---

## Color Scheme

**Header:**
- Background: `#FFFFFF` (white)
- Border: `#E5E7EB` (light gray)
- Text: `#1E3A52` (dark blue - brand primary)
- Role Button: `#005C4D` (accent green)
- Sign Out: `#6366F1` (indigo/purple)

**Sidebar:**
- Background: `#004739` (green700)
- Active Item: White text with white left border
- Section Headers: `rgba(255, 255, 255, 0.6)` (60% white)
- Normal Items: `rgba(255, 255, 255, 0.9)` (90% white)

---

## Components Structure

```
AppNavigator
├── DrawerNavigator
│   ├── Custom Header (AppHeader)
│   │   ├── Hamburger Menu
│   │   ├── Title
│   │   ├── User Info
│   │   ├── Role Switcher (Menu)
│   │   └── Sign Out Button
│   │
│   └── Custom Drawer (AppSidebar)
│       ├── Logo Header
│       ├── Navigation Items (role-based)
│       │   ├── Main section
│       │   ├── Management section
│       │   ├── Compliance section
│       │   └── Account/Support section
│       └── Footer
│
└── Screens
    └── HomeScreen (CRO Admin Dashboard)
```

---

## How It Works

### 1. Hamburger Menu Click
```typescript
<TouchableOpacity onPress={onMenuPress}>
  // Opens drawer from left
</TouchableOpacity>
```

### 2. Role Switcher
```typescript
<Menu visible={roleMenuVisible}>
  // Shows dropdown with available roles
  // Filters based on user's current role
  // Admin can switch to all roles
  // Site Admin can switch to trial_lead, site_user
  // Trial Lead can switch to site_user
  // Site User cannot switch
</Menu>
```

### 3. Navigation Items
```typescript
const getNavigationItems = () => {
  const role = user?.role || 'site_user';
  // Returns different menu items based on role
  // Each item has: label, icon, screen, section
}
```

### 4. Active Route Highlighting
```typescript
props.state.routeNames[props.state.index] === item.screen
  ? styles.navItemActive  // White background + left border
  : styles.navItem        // Normal state
```

---

## Responsive Behavior

**Desktop/Tablet (width > 768px):**
- Sidebar can stay open
- Header shows full user info
- More horizontal space

**Mobile (width < 768px):**
- Sidebar slides in from left
- Header is compact
- User info may truncate with ellipsis

---

## Testing Checklist

### Header
- [ ] Hamburger menu opens/closes sidebar
- [ ] User name displays correctly
- [ ] Company name displays correctly
- [ ] Role switcher shows correct role
- [ ] Role switcher dropdown works
- [ ] Sign Out button logs out user

### Sidebar
- [ ] Logo displays correctly
- [ ] Navigation items show for correct role
- [ ] Clicking items navigates (or shows "coming soon")
- [ ] Active route is highlighted
- [ ] Sections are properly grouped
- [ ] Footer shows version info
- [ ] Sidebar closes on navigation (mobile)

### Visual
- [ ] Header has white background
- [ ] Header has bottom border/shadow
- [ ] Sidebar has dark green background
- [ ] Colors match web portal
- [ ] Icons display correctly
- [ ] Text is readable

---

## Next Steps

### Immediate
1. Test on web (press `w`)
2. Test on Android (press `a`)
3. Test on iOS (press `i`)

### Phase 5.3
1. Implement actual navigation (screens for Sites, Users, etc.)
2. Implement role switching logic
3. Add more screens as defined in navigation
4. Test on physical devices

---

## Files Modified

**New Files:**
- `src/components/common/AppHeader.tsx`
- `src/components/common/AppSidebar.tsx`

**Modified Files:**
- `src/navigation/AppNavigator.tsx`

---

## Known Limitations

**Current:**
- ✅ Header and sidebar UI complete
- ✅ Role-based menu items
- ❌ Role switching not implemented (shows menu but doesn't change)
- ❌ Most navigation screens don't exist yet (Home/Dashboard only)
- ❌ Help chat not implemented

**TODO:**
- Implement role switching logic
- Create placeholder screens for all menu items
- Add screen-specific headers (change title per screen)
- Implement Help chat widget

---

**Status**: ✅ Header and Sidebar complete and match web portal design!

Restart the app to see the new header and sidebar:
```bash
npm run dev:mobile
```

Press `w` to test in web browser. Click the hamburger menu to see the sidebar! 🎉
