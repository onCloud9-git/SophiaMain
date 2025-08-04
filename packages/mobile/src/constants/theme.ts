/**
 * Sophia AI Soft UI Design System
 * Design tokens and theme configuration for consistent UI
 */

// Color palette for Soft UI design
export const Colors = {
  // Background colors
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F3F6',
  
  // Primary colors
  primary: '#667EEA',
  primaryLight: '#7C85F2',
  primaryDark: '#5A67D8',
  
  // Semantic colors
  success: '#48BB78',
  successLight: '#68D391',
  warning: '#ECC94B',
  warningLight: '#F6E05E',
  error: '#F56565',
  errorLight: '#FC8181',
  
  // Text colors
  text: {
    primary: '#2D3748',
    secondary: '#718096',
    disabled: '#A0AEC0',
    inverse: '#FFFFFF',
  },
  
  // Border colors
  border: {
    default: '#E2E8F0',
    focused: '#667EEA',
    disabled: '#F7FAFC',
  },
  
  // Shadow colors for neumorphic design
  shadow: {
    light: 'rgba(255, 255, 255, 0.8)',
    dark: 'rgba(174, 174, 192, 0.4)',
    primary: 'rgba(102, 126, 234, 0.3)',
  },
  
  // Gradient definitions
  gradients: {
    primary: ['#667EEA', '#764BA2'],
    success: ['#48BB78', '#38A169'],
    surface: ['#FFFFFF', '#F7FAFC'],
  },
} as const;

// Spacing system based on 4px grid
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// Border radius for soft UI elements
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
} as const;

// Typography scale
export const Typography = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
} as const;

// Neumorphic shadow definitions
export const Shadows = {
  // Small shadow for buttons and small elements
  sm: {
    shadowColor: '#174c6b',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  // Medium shadow for cards
  md: {
    shadowColor: '#174c6b',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  // Large shadow for modals and overlays
  lg: {
    shadowColor: '#174c6b',
    shadowOffset: { width: 12, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  // Inset shadow for pressed states
  inset: {
    shadowColor: '#174c6b',
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 0,
  },
} as const;

// Animation durations and easing
export const Animations = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const;

// Icon sizes
export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Layout constants
export const Layout = {
  screen: {
    padding: Spacing.lg,
    paddingSmall: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
    margin: Spacing.md,
  },
  button: {
    height: 48,
    paddingHorizontal: Spacing.lg,
  },
  input: {
    height: 48,
    paddingHorizontal: Spacing.md,
  },
} as const;

// Complete theme object
export const SoftUITheme = {
  colors: Colors,
  spacing: Spacing,
  borderRadius: BorderRadius,
  typography: Typography,
  shadows: Shadows,
  animations: Animations,
  iconSizes: IconSizes,
  layout: Layout,
} as const;

export type Theme = typeof SoftUITheme;
export type ThemeColors = typeof Colors;
export type ThemeSpacing = typeof Spacing;