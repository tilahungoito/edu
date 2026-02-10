'use client';

import { createTheme, alpha } from '@mui/material/styles';
import type { } from '@mui/x-data-grid/themeAugmentation';

/**
 * Tigray Education Bureau Professional Theme
 * Features:
 * - Modern depth and shadows
 * - Sophisticated typography (Inter & Outfit)
 * - Glassmorphism ready color transitions
 * - Vibrant accent colors for high engagement
 */

declare module '@mui/material/Chip' {
  interface ChipPropsVariantOverrides {
    soft: true;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    soft: true;
  }
}

const primaryMain = '#0F172A'; // Slate 900
const primaryLight = '#334155'; // Slate 700
const primaryDark = '#020617'; // Slate 950

const secondaryMain = '#2563EB'; // Blue 600
const secondaryLight = '#60A5FA'; // Blue 400
const secondaryDark = '#1D4ED8'; // Blue 700

const successMain = '#10B981'; // Emerald 500
const warningMain = '#F59E0B'; // Amber 500
const errorMain = '#EF4444'; // Red 500

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: primaryMain,
      light: primaryLight,
      dark: primaryDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: secondaryMain,
      light: secondaryLight,
      dark: secondaryDark,
      contrastText: '#FFFFFF',
    },
    success: {
      main: successMain,
      contrastText: '#FFFFFF',
    },
    warning: {
      main: warningMain,
      contrastText: '#FFFFFF',
    },
    error: {
      main: errorMain,
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
    },
    divider: alpha('#64748B', 0.12),
  },
  typography: {
    fontFamily: '"Inter", "Outfit", "Roboto", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.1,
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#1E293B',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#64748B',
    },
    subtitle1: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    // Custom elevation for cards
    '0 0 0 1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    ...Array(17).fill('none'),
  ] as any,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 20px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${primaryMain} 0%, ${primaryLight} 100%)`,
          boxShadow: '0 4px 14px 0 rgba(15, 23, 42, 0.39)',
          '&:hover': {
            background: `linear-gradient(135deg, ${primaryLight} 0%, ${primaryMain} 100%)`,
            boxShadow: '0 6px 20px rgba(15, 23, 42, 0.23)',
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${secondaryMain} 0%, ${secondaryLight} 100%)`,
          boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)',
          '&:hover': {
            background: `linear-gradient(135deg, ${secondaryLight} 0%, ${secondaryMain} 100%)`,
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.23)',
          },
        },
      },
      variants: [
        {
          props: { variant: 'soft' as any },
          style: ({ theme, ownerState }: any) => {
            const color = (ownerState.color === 'inherit' || !ownerState.color) ? 'primary' : ownerState.color;
            return {
              backgroundColor: alpha(theme.palette[color].main, 0.1),
              color: theme.palette[color].dark,
              '&:hover': {
                backgroundColor: alpha(theme.palette[color].main, 0.2),
              },
            };
          },
        },
      ],
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
      variants: [
        {
          props: { variant: 'soft' as any },
          style: ({ theme, ownerState }: any) => {
            const color = (ownerState.color === 'default' || !ownerState.color) ? 'primary' : ownerState.color;
            return {
              backgroundColor: alpha(theme.palette[color].main, 0.12),
              color: theme.palette[color].dark,
              border: 'none',
            };
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: '1px solid',
          borderColor: alpha('#E2E8F0', 0.8),
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: secondaryMain,
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 20,
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          color: primaryMain,
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: alpha('#E2E8F0', 0.5),
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid',
          borderColor: alpha('#E2E8F0', 0.5),
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s',
            '&:hover fieldset': {
              borderColor: secondaryLight,
            },
            '&.Mui-focused fieldset': {
              borderWidth: 2,
            },
          },
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  ...theme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#94A3B8',
      light: '#CBD5E1',
      dark: '#475569',
      contrastText: '#000000',
    },
    background: {
      default: '#020617',
      paper: '#0F172A',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
    },
  },
});

export default theme;

