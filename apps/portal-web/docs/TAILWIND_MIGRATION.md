# Tailwind CSS Migration Guide

## Setup Complete ✓
- Tailwind CSS installed
- `tailwind.config.js` configured with design tokens from `design.json`
- `postcss.config.js` created
- `index.css` updated with Tailwind directives
- Lato font imported

## Design Token Mapping

### Colors
- `bg-brand-primary` → #1E3A52
- `bg-brand-secondary` → #9AAAB5
- `text-brand-primary` → #1E3A52
- `bg-background-page` → #F9FAFB
- `bg-background-card` → #FFFFFF

### Common Class Mappings

#### Containers
```
style={{ padding: '24px' }} → className="p-6"
style={{ backgroundColor: 'white' }} → className="bg-white"
style={{ borderRadius: '8px' }} → className="rounded-lg"
style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} → className="shadow"
```

#### Text
```
style={{ fontSize: '14px' }} → className="text-sm"
style={{ fontWeight: '600' }} → className="font-semibold"
style={{ color: '#111827' }} → className="text-gray-900"
style={{ color: '#6b7280' }} → className="text-gray-500"
```

#### Layout
```
style={{ display: 'flex' }} → className="flex"
style={{ gap: '16px' }} → className="gap-4"
style={{ maxWidth: '1400px' }} → className="max-w-7xl"
style={{ margin: '0 auto' }} → className="mx-auto"
```

#### Badges
Create reusable badge components with Tailwind classes instead of inline styles.

## Migration Order
1. ✓ Setup Tailwind
2. Create component CSS classes
3. Convert Users.tsx
4. Convert DelegationLog.tsx
5. Convert other components
6. Remove all inline styles
7. Test and verify

## Components with Inline Styles
- Users.tsx (41 instances)
- DelegationLog.tsx (many instances)
- UserProfileDisplay.tsx
- CustomLayout.tsx
- CustomMenu.tsx
- Login.tsx
- Card.tsx
