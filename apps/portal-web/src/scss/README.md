# SCSS Architecture

This directory contains the SCSS stylesheets for ProtocolSync Portal, following CoreUI's SCSS architecture pattern.

## Structure

```
scss/
├── style.scss           # Main entry point (imported in main.tsx)
├── _variables.scss      # Design tokens and SCSS variables
└── README.md           # This file
```

## Files

### style.scss
Main stylesheet that:
- Imports Tailwind directives
- Imports design token variables
- Defines base styles and CSS custom properties
- Provides utility classes
- Contains modal and CoreUI layout styles

### _variables.scss
Contains all design tokens as SCSS variables:
- Brand colors (primary, secondary, accent greens)
- Text colors
- Background colors
- Spacing values
- Shadows
- Typography (fonts, sizes, weights)

Based on `design.json` - ProtocolSync brand identity.

## Usage

The SCSS is automatically compiled by Vite when you run:
- `npm run dev` - Development mode with hot reload
- `npm run build` - Production build

## Adding New Styles

1. **Variables**: Add to `_variables.scss`
2. **Global styles**: Add to `style.scss` 
3. **Component-specific**: Create new partial files (e.g., `_components.scss`)

## SCSS Features

You can now use SCSS features like:
- Variables: `$color-brand-primary`
- Nesting
- Mixins and functions
- Imports and partials
- Math operations

## Compatibility

- Works with Tailwind CSS via PostCSS
- Compatible with CoreUI SCSS architecture
- Vite handles compilation automatically (requires `sass` package)
