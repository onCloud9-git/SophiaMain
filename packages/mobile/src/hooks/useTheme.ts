import { SoftUITheme, Theme } from '../constants/theme';

/**
 * Hook for accessing the Soft UI theme throughout the app
 */
export const useTheme = (): Theme => {
  return SoftUITheme;
};

/**
 * Type-safe theme access hook
 */
export const useColors = () => {
  return SoftUITheme.colors;
};

export const useSpacing = () => {
  return SoftUITheme.spacing;
};

export const useShadows = () => {
  return SoftUITheme.shadows;
};

export const useTypography = () => {
  return SoftUITheme.typography;
};