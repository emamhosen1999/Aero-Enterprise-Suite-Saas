/**
 * HeroUI Theme System - v2.1
 * Enhanced theme application with background presets and utilities
 * 
 * ARCHITECTURAL IMPROVEMENTS:
 * - Integrated background preset system
 * - Centralized theme utilities
 * - Enhanced pattern and image support
 * 
 * @see cardStyles.js for card theme definitions
 * @see backgroundPresets.js for background options
 * @see themePresets.js for complete theme presets
 * @see themeUtils.js for centralized utilities
 * @see ThemeContext.jsx for theme state management
 */

import { getCardStyle } from './cardStyles';
import { applyBackground } from './backgroundPresets';
import { getStandardCardStyle } from '../utils/themeUtils';

/**
 * Get the current theme's primary color from CSS variable or fallback
 * @returns {string} Hex color code
 */
export const getThemePrimaryColor = () => {
  if (typeof window === 'undefined' || !window.document) {
    return '#006FEE'; // Default primary color
  }
  
  const rootStyles = getComputedStyle(document.documentElement);
  const primaryColor = rootStyles.getPropertyValue('--theme-primary')?.trim();
  
  return primaryColor || '#006FEE';
};

/**
 * Dark mode color palettes — graduated darkness levels
 * 
 * dim:      Soft dark with blue-gray undertones (like Twitter/X "Dim")
 * dark:     Standard dark surfaces (zinc-based)
 * midnight: True black AMOLED-friendly surfaces
 */
const DARK_PALETTES = {
  dim: {
    background: '#15202B',
    foreground: '#E7E9EA',
    divider: '#38444D',
    content1: '#1A2733',
    content2: '#22303C',
    content3: '#2C3E50',
    content4: '#3D5468',
  },
  dark: {
    background: '#18181B',
    foreground: '#FAFAFA',
    divider: '#27272A',
    content1: '#1C1C1E',
    content2: '#27272A',
    content3: '#3F3F46',
    content4: '#52525B',
  },
  midnight: {
    background: '#000000',
    foreground: '#FAFAFA',
    divider: '#1A1A1A',
    content1: '#0A0A0A',
    content2: '#141414',
    content3: '#1E1E1E',
    content4: '#282828',
  },
};

/**
 * Valid mode values for the theme system
 */
export const VALID_MODES = ['light', 'dim', 'dark', 'midnight', 'system'];

/**
 * Resolve the effective dark palette key from a mode value.
 * Returns null for light mode (no dark overrides needed).
 */
export const resolveEffectiveMode = (mode) => {
  if (mode === 'light') return null;
  if (mode === 'dim' || mode === 'dark' || mode === 'midnight') return mode;
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
      return 'dark';
    }
    return null;
  }
  return null;
};

/**
 * Apply theme settings to document (CSS variables + dark mode class)
 * 
 * @param {Object} theme - Theme settings object with shape:
 *   {
 *     mode: 'light' | 'dim' | 'dark' | 'midnight' | 'system',
 *     cardStyle: string,
 *     typography: { fontFamily: string, fontSize: string },
 *     background: { type: 'color', value: string }
 *   }
 */
export const applyThemeToDocument = (theme) => {
  if (typeof window === 'undefined' || !window.document) {
    return;
  }

  const root = document.documentElement;
  
  // Resolve the effective dark palette (null = light mode)
  const effectiveMode = resolveEffectiveMode(theme.mode);
  const isDark = effectiveMode !== null;

  // Get colors from card style
  const cardStyle = getCardStyle(theme.cardStyle || 'modern');
  let themeColors = cardStyle.theme.colors;
  
  // Override with the appropriate dark palette if needed
  if (isDark && DARK_PALETTES[effectiveMode]) {
    themeColors = { ...themeColors, ...DARK_PALETTES[effectiveMode] };
  }
  
  // Apply semantic color CSS variables (--theme- prefix for consistency)
  root.style.setProperty('--theme-primary', typeof themeColors.primary === 'object' ? themeColors.primary.DEFAULT : themeColors.primary);
  root.style.setProperty('--theme-secondary', typeof themeColors.secondary === 'object' ? themeColors.secondary.DEFAULT : themeColors.secondary);
  root.style.setProperty('--theme-success', typeof themeColors.success === 'object' ? themeColors.success.DEFAULT : themeColors.success);
  root.style.setProperty('--theme-warning', typeof themeColors.warning === 'object' ? themeColors.warning.DEFAULT : themeColors.warning);
  root.style.setProperty('--theme-danger', typeof themeColors.danger === 'object' ? themeColors.danger.DEFAULT : themeColors.danger);
  root.style.setProperty('--theme-background', themeColors.background || '#FFFFFF');
  root.style.setProperty('--theme-foreground', themeColors.foreground || '#000000');
  root.style.setProperty('--theme-divider', themeColors.divider || '#E4E4E7');
  
  // Apply content colors
  if (themeColors.content1) root.style.setProperty('--theme-content1', themeColors.content1);
  if (themeColors.content2) root.style.setProperty('--theme-content2', themeColors.content2);
  if (themeColors.content3) root.style.setProperty('--theme-content3', themeColors.content3);
  if (themeColors.content4) root.style.setProperty('--theme-content4', themeColors.content4);
  
  // Apply layout properties from card style + user overrides
  const layoutProps = {
    ...cardStyle.theme.layout,
    ...(theme.typography && { fontFamily: theme.typography.fontFamily })
  };
  
  // Apply layout CSS variables
  if (layoutProps) {
    Object.entries(layoutProps).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }
  
  // Apply background settings using enhanced background system
  if (theme.background) {
    applyBackground(theme.background, theme.backgroundOpacity || 1);
  }

  // Set font family on root
  if (layoutProps?.fontFamily) {
    root.style.fontFamily = layoutProps.fontFamily;
  }
  
  // Toggle dark class for HeroUI components
  // All dark variants (dim, dark, midnight) need the .dark class for HeroUI
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Set data attribute for dark variant so CSS can differentiate
  // Enables selectors like [data-dark-variant="dim"], [data-dark-variant="midnight"]
  if (isDark) {
    root.setAttribute('data-dark-variant', effectiveMode);
  } else {
    root.removeAttribute('data-dark-variant');
  }
};

export default {
  applyThemeToDocument,
  getThemePrimaryColor,
  getStandardCardStyle,
  VALID_MODES,
  resolveEffectiveMode,
};
