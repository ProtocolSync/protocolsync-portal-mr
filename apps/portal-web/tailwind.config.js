import { designTokens } from './src/design-tokens';

/** @type {import('tailwindcss').Config} */
export default {
  important: true,
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: designTokens.color.brand.primary,
          secondary: designTokens.color.brand.secondary,
          accentGreen: designTokens.color.brand.accentGreen,
        },
        text: {
          DEFAULT: designTokens.color.text.default,
          subtle: designTokens.color.text.subtle,
          inverse: designTokens.color.text.inverse,
          error: designTokens.color.text.error,
          success: designTokens.color.text.success,
        },
        background: {
          page: designTokens.color.background.page,
          card: designTokens.color.background.card,
          focus: designTokens.color.background.focus,
        },
      },
      fontFamily: {
        sans: [designTokens.typography.fontFamily.primary, 'sans-serif'],
      },
      fontSize: {
        xxs: designTokens.typography.fontSize.xxs,
        xs: designTokens.typography.fontSize.xs,
        s: designTokens.typography.fontSize.s,
        m: designTokens.typography.fontSize.m,
        l: designTokens.typography.fontSize.l,
        xl: designTokens.typography.fontSize.xl,
        xxl: designTokens.typography.fontSize.xxl,
      },
      fontWeight: {
        regular: designTokens.typography.fontWeight.regular,
        semibold: designTokens.typography.fontWeight.semibold,
        bold: designTokens.typography.fontWeight.bold,
      },
      spacing: {
        xxs: designTokens.spacing.xxs,
        xs: designTokens.spacing.xs,
        s: designTokens.spacing.s,
        m: designTokens.spacing.m,
        l: designTokens.spacing.l,
        xl: designTokens.spacing.xl,
      },
      borderRadius: {
        none: designTokens.borderRadius.none,
        DEFAULT: designTokens.borderRadius.default,
        round: designTokens.borderRadius.round,
      },
      boxShadow: {
        default: designTokens.shadow.default,
        lifted: designTokens.shadow.lifted,
      },
    },
  },
  plugins: [],
}
