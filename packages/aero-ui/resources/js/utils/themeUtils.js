/**
 * Theme Utilities - v2.1
 * Centralized theme helper functions and constants
 */

import React from 'react';

/**
 * Get theme-aware border radius value for HeroUI components
 * Centralized version - use this instead of duplicating logic
 */
export const getThemeRadius = () => {
  if (typeof window === 'undefined' || !window.document) {
    return 'lg';
  }
  
  const rootStyles = getComputedStyle(document.documentElement);
  const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
  const radiusValue = parseInt(borderRadius);
  
  if (radiusValue === 0) return 'none';
  if (radiusValue <= 4) return 'sm';
  if (radiusValue <= 8) return 'md';
  if (radiusValue <= 16) return 'lg';
  return 'xl';
};

/**
 * Get current theme primary color
 */
export const getThemePrimary = () => {
  if (typeof window === 'undefined' || !window.document) {
    return '#006FEE';
  }
  
  const rootStyles = getComputedStyle(document.documentElement);
  return rootStyles.getPropertyValue('--theme-primary')?.trim() || '#006FEE';
};

/**
 * Check if current theme is dark mode
 */
export const isDarkMode = () => {
  if (typeof window === 'undefined' || !window.document) {
    return false;
  }
  
  return document.documentElement.classList.contains('dark');
};

/**
 * Get standardized card styling - USE THIS FOR ALL CARDS
 */
export const getStandardCardStyle = () => ({
  background: `linear-gradient(135deg, 
    var(--theme-content1, #FAFAFA) 20%, 
    var(--theme-content2, #F4F4F5) 10%, 
    var(--theme-content3, #E4E4E7) 20%)`,
  border: `var(--borderWidth, 2px) solid transparent`,
  borderRadius: `var(--borderRadius, 12px)`,
  fontFamily: `var(--fontFamily, "Inter")`,
  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
});

/**
 * Get standardized card header styling
 */
export const getStandardCardHeaderStyle = () => ({
  borderColor: `var(--theme-divider, #E4E4E7)`,
  background: `linear-gradient(135deg, 
    color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
    color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`
});

/**
 * Color status mapping for consistent chip/badge colors
 */
export const STATUS_COLORS = {
  active: 'success',
  inactive: 'danger', 
  pending: 'warning',
  processing: 'primary',
  completed: 'success',
  failed: 'danger',
  cancelled: 'default',
  approved: 'success',
  rejected: 'danger',
  draft: 'default'
};

/**
 * Get status color for chip/badge components
 */
export const getStatusColor = (status) => {
  return STATUS_COLORS[status?.toLowerCase()] || 'default';
};

/**
 * Theme-aware shadow values
 */
export const THEME_SHADOWS = {
  none: 'none',
  sm: '0 2px 8px -2px rgba(0,0,0,0.1)',
  md: '0 4px 15px -3px rgba(0,0,0,0.1)', 
  lg: '0 8px 25px -5px rgba(0,0,0,0.15)',
  xl: '0 12px 35px -8px rgba(0,0,0,0.2)',
  xxl: '0 20px 50px -12px rgba(0,0,0,0.25)'
};

/**
 * Get theme-appropriate shadow
 */
export const getThemeShadow = (size = 'sm') => {
  return THEME_SHADOWS[size] || THEME_SHADOWS.sm;
};

/**
 * Animation/transition presets
 */
export const THEME_TRANSITIONS = {
  gentle: 'cubic-bezier(0.4, 0, 0.2, 1)',
  snappy: 'cubic-bezier(0.4, 0, 0.1, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  duration: {
    fast: '150ms',
    normal: '200ms', 
    slow: '300ms'
  }
};

/**
 * Responsive breakpoint helpers
 */
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768, 
  desktop: 1024,
  wide: 1280
};

export const useResponsiveBreakpoints = () => {
  const [breakpoints, setBreakpoints] = React.useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false
  });

  React.useEffect(() => {
    const checkBreakpoints = () => {
      const width = window.innerWidth;
      setBreakpoints({
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.desktop,
        isDesktop: width >= BREAKPOINTS.desktop
      });
    };

    checkBreakpoints();
    window.addEventListener('resize', checkBreakpoints);
    return () => window.removeEventListener('resize', checkBreakpoints);
  }, []);

  return breakpoints;
};

export default {
  getThemeRadius,
  getThemePrimary,
  isDarkMode,
  getStandardCardStyle,
  getStandardCardHeaderStyle,
  getStatusColor,
  getThemeShadow,
  STATUS_COLORS,
  THEME_SHADOWS,
  THEME_TRANSITIONS,
  BREAKPOINTS,
  useResponsiveBreakpoints
};