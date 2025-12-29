/**
 * HeroUI Theme System - v2.0
 * Simplified theme application utilities
 * 
 * ARCHITECTURAL CHANGE:
 * - heroUIThemes object REMOVED (was 400+ lines of redundant theme definitions)
 * - Use CARD_STYLES from cardStyles.js instead
 * - This file now only contains applyThemeToDocument() for CSS variable application
 * 
 * @see cardStyles.js for theme definitions
 * @see ThemeContext.jsx for theme state management
 */

import { getCardStyle } from './cardStyles';

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
 * Dark mode color overrides
 */
const darkModeColors = {
  background: '#18181B',
  foreground: '#FAFAFA',
  divider: '#27272A',
  content1: '#1C1C1E',
  content2: '#27272A',
  content3: '#3F3F46',
  content4: '#52525B',
};

/**
 * Apply theme settings to document (CSS variables + dark mode class)
 * 
 * @param {Object} theme - Theme settings object with shape:
 *   {
 *     mode: 'light' | 'dark' | 'system',
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
  
  // Determine dark mode
  const isDark = theme.mode === 'dark' || 
    (theme.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Get colors from card style
  const cardStyle = getCardStyle(theme.cardStyle || 'modern');
  let themeColors = cardStyle.theme.colors;
  
  // Override with dark mode colors if needed
  if (isDark) {
    themeColors = { ...themeColors, ...darkModeColors };
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
  
  // Apply background settings
  if (theme.background) {
    const body = document.body;
    
    // Clean up any existing overlays
    const overlay = document.getElementById('background-overlay');
    if (overlay) overlay.remove();
    
    if (theme.background.type === 'color' && theme.background.value) {
      // Reset image properties
      body.style.setProperty('background-image', '', 'important');
      body.style.setProperty('background-size', '', 'important');
      body.style.setProperty('background-position', '', 'important');
      body.style.setProperty('background-repeat', '', 'important');
      body.style.setProperty('background-attachment', '', 'important');
      
      // Apply color/gradient
      if (theme.background.value.includes('gradient')) {
        body.style.setProperty('background-image', theme.background.value, 'important');
        body.style.setProperty('background-color', '', 'important');
      } else {
        body.style.setProperty('background-color', theme.background.value, 'important');
        body.style.setProperty('background-image', '', 'important');
      }
    } else {
      // Reset to default
      body.style.setProperty('background-image', '', 'important');
      body.style.setProperty('background-size', '', 'important');
      body.style.setProperty('background-position', '', 'important');
      body.style.setProperty('background-repeat', '', 'important');
      body.style.setProperty('background-attachment', '', 'important');
      body.style.setProperty('background-color', '', 'important');
    }
  }

  // Set font family on root
  if (layoutProps?.fontFamily) {
    root.style.fontFamily = layoutProps.fontFamily;
  }
  
  // Toggle dark class for HeroUI components
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export default {
  applyThemeToDocument,
  getThemePrimaryColor
};
