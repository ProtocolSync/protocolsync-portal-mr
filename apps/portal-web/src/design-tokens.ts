// Design tokens exported from design.json
export const designTokens = {
  color: {
    brand: {
      primary: '#1E3A52',
      secondary: '#9AAAB5',
      accentGreen: '#005C4D',
      accentGreen100: '#B2E6DF',
      accentGreen300: '#008A75',
      accentGreen500: '#005C4D',
      accentGreen700: '#004739',
      accentGreen900: '#00332A',
    },
    text: {
      default: '#1E3A52',
      subtle: '#6C7A89',
      inverse: '#FFFFFF',
      error: '#CC0000',
      success: '#388E3C',
    },
    background: {
      page: '#F9FAFB',
      card: '#FFFFFF',
      focus: '#E0E6EB',
    },
  },
  typography: {
    fontFamily: {
      primary: 'Lato',
    },
    fontSize: {
      xxs: '0.75rem',   // 12px
      xs: '0.875rem',   // 14px
      s: '1rem',        // 16px
      m: '1rem',        // 16px
      l: '1.5rem',      // 24px
      xl: '2rem',       // 32px
      xxl: '2.5rem',    // 40px
    },
    fontWeight: {
      regular: 400,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    xxs: '0.25rem',   // 4px
    xs: '0.5rem',     // 8px
    s: '1rem',        // 16px
    m: '1.5rem',      // 24px
    l: '2rem',        // 32px
    xl: '3rem',       // 48px
  },
  borderRadius: {
    none: '0',
    default: '4px',
    round: '50%',
  },
  shadow: {
    default: '0 2px 4px rgba(0, 0, 0, 0.1)',
    lifted: '0 8px 16px rgba(0, 0, 0, 0.15)',
  },
} as const;

export type DesignTokens = typeof designTokens;
