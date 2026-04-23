import { useMemo } from 'react';
import { useTheme } from '@/Context/ThemeContext';
import { resolveEffectiveMode } from '@/theme/index';

/**
 * Hook that provides computed theme colors for complex components
 * that need JavaScript color values (charts, canvas, SVG).
 * 
 * Returns the current theme palette without hardcoding.
 */
export const useThemeColors = () => {
  const { colors, mode } = useTheme();

  const isDark = useMemo(() => {
    return resolveEffectiveMode(mode) !== null;
  }, [mode]);

  return useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        primary: '#006FEE',
        foreground: '#11181C',
        background: '#FFFFFF',
        content1: '#FAFAFA',
        content2: '#F4F4F5',
        divider: '#E4E4E7',
        success: '#17C964',
        warning: '#F5A524',
        danger: '#F31260',
        secondary: '#9353D3',
        isDark: false,
      };
    }

    const root = getComputedStyle(document.documentElement);
    const get = (v, fb) => root.getPropertyValue(v)?.trim() || fb;

    return {
      primary: get('--theme-primary', '#006FEE'),
      foreground: get('--theme-foreground', '#11181C'),
      background: get('--theme-background', '#FFFFFF'),
      content1: get('--theme-content1', '#FAFAFA'),
      content2: get('--theme-content2', '#F4F4F5'),
      divider: get('--theme-divider', '#E4E4E7'),
      success: get('--theme-success', '#17C964'),
      warning: get('--theme-warning', '#F5A524'),
      danger: get('--theme-danger', '#F31260'),
      secondary: get('--theme-secondary', '#9353D3'),
      isDark,
    };
  }, [colors, isDark]);
};
