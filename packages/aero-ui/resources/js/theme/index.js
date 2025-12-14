/**
 * HeroUI Theme System
 * Based on HeroUI v2.8.2 theme structure
 * Provides consistent theming across the application
 */

// HeroUI base theme colors
export const heroUIThemes = {
  heroui: {
    name: 'HeroUI',
    layout: {
      fontFamily: 'Inter',
      borderRadius: '12px',
      borderWidth: '2px',
      scale: '100%',
      disabledOpacity: '0.5'
    },
    background: {
      type: 'color',
      color: '#ffffff'
    },
    colors: {
      background: '#FFFFFF',
      foreground: '#11181C',
      divider: '#E4E4E7',
      focus: '#006FEE',
      content1: '#FFFFFF',
      content2: '#F4F4F5',
      content3: '#E4E4E7',
      content4: '#D4D4D8',
      default: {
        '50': '#F9FAFB',
        '100': '#F3F4F6',
        '200': '#E5E7EB',
        '300': '#D1D5DB',
        '400': '#9CA3AF',
        '500': '#6B7280',
        '600': '#4B5563',
        '700': '#374151',
        '800': '#1F2937',
        '900': '#111827',
        DEFAULT: '#71717A',
        foreground: '#FFFFFF'
      },
      primary: {
        '50': '#EFF6FF',
        '100': '#DBEAFE',
        '200': '#BFDBFE',
        '300': '#93C5FD',
        '400': '#60A5FA',
        '500': '#3B82F6',
        '600': '#2563EB',
        '700': '#1D4ED8',
        '800': '#1E40AF',
        '900': '#1E3A8A',
        DEFAULT: '#006FEE',
        foreground: '#FFFFFF'
      },
      secondary: {
        '50': '#F0FDF4',
        '100': '#DCFCE7',
        '200': '#BBF7D0',
        '300': '#86EFAC',
        '400': '#4ADE80',
        '500': '#22C55E',
        '600': '#16A34A',
        '700': '#15803D',
        '800': '#166534',
        '900': '#14532D',
        DEFAULT: '#17C964',
        foreground: '#FFFFFF'
      },
      success: {
        '50': '#F0FDF4',
        '100': '#DCFCE7',
        '200': '#BBF7D0',
        '300': '#86EFAC',
        '400': '#4ADE80',
        '500': '#22C55E',
        '600': '#16A34A',
        '700': '#15803D',
        '800': '#166534',
        '900': '#14532D',
        DEFAULT: '#17C964',
        foreground: '#FFFFFF'
      },
      warning: {
        '50': '#FFFBEB',
        '100': '#FEF3C7',
        '200': '#FDE68A',
        '300': '#FCD34D',
        '400': '#FBBF24',
        '500': '#F59E0B',
        '600': '#D97706',
        '700': '#B45309',
        '800': '#92400E',
        '900': '#78350F',
        DEFAULT: '#F5A524',
        foreground: '#FFFFFF'
      },
      danger: {
        '50': '#FEF2F2',
        '100': '#FEE2E2',
        '200': '#FECACA',
        '300': '#FCA5A5',
        '400': '#F87171',
        '500': '#EF4444',
        '600': '#DC2626',
        '700': '#B91C1C',
        '800': '#991B1B',
        '900': '#7F1D1D',
        DEFAULT: '#F31260',
        foreground: '#FFFFFF'
      }
    }
  },
  modern: {
    name: 'Modern',
    layout: {
      fontFamily: 'Roboto',
      borderRadius: '4px',
      borderWidth: '1px',
      scale: '110%',
      disabledOpacity: '0.6'
    },
    background: {
      type: 'color',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    colors: {
      background: '#F8FAFC',
      foreground: '#1E293B',
      divider: '#CBD5E1',
      focus: '#0070F3',
      content1: '#FFFFFF',
      content2: '#F1F5F9',
      content3: '#E2E8F0',
      content4: '#CBD5E1',
      default: {
        DEFAULT: '#71717A',
        foreground: '#FFFFFF'
      },
      primary: {
        DEFAULT: '#0070F3',
        foreground: '#FFFFFF'
      },
      secondary: {
        DEFAULT: '#7928CA',
        foreground: '#FFFFFF'
      },
      success: {
        DEFAULT: '#10B981',
        foreground: '#FFFFFF'
      },
      warning: {
        DEFAULT: '#FF4785',
        foreground: '#FFFFFF'
      },
      danger: {
        DEFAULT: '#FF0080',
        foreground: '#FFFFFF'
      }
    }
  },
  elegant: {
    name: 'Elegant',
    layout: {
      fontFamily: 'Playfair Display',
      borderRadius: '0px',
      borderWidth: '3px',
      scale: '95%',
      disabledOpacity: '0.4'
    },
    background: {
      type: 'color',
      color: 'linear-gradient(45deg, #f3f4f6 0%, #e5e7eb 50%, #d1d5db 100%)'
    },
    colors: {
      background: '#FAFAFA',
      foreground: '#1F2937',
      divider: '#D1D5DB',
      focus: '#374151',
      content1: '#FFFFFF',
      content2: '#F9FAFB',
      content3: '#F3F4F6',
      content4: '#E5E7EB',
      default: {
        DEFAULT: '#71717A',
        foreground: '#FFFFFF'
      },
      primary: {
        DEFAULT: '#1F2937',
        foreground: '#FFFFFF'
      },
      secondary: {
        DEFAULT: '#F59E0B',
        foreground: '#FFFFFF'
      },
      success: {
        DEFAULT: '#10B981',
        foreground: '#FFFFFF'
      },
      warning: {
        DEFAULT: '#F59E0B',
        foreground: '#FFFFFF'
      },
      danger: {
        DEFAULT: '#EF4444',
        foreground: '#FFFFFF'
      }
    }
  },
  coffee: {
    name: 'Coffee',
    layout: {
      fontFamily: 'Poppins',
      borderRadius: '20px',
      borderWidth: '4px',
      scale: '105%',
      disabledOpacity: '0.3'
    },
    background: {
      type: 'color',
      color: 'linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #CD853F 100%)'
    },
    colors: {
      background: '#FEF7ED',
      foreground: '#451A03',
      divider: '#D97706',
      focus: '#92400E',
      content1: '#FFFBEB',
      content2: '#FEF3C7',
      content3: '#FDE68A',
      content4: '#F59E0B',
      default: {
        DEFAULT: '#71717A',
        foreground: '#FFFFFF'
      },
      primary: {
        DEFAULT: '#8B4513',
        foreground: '#FFFFFF'
      },
      secondary: {
        DEFAULT: '#D2691E',
        foreground: '#FFFFFF'
      },
      success: {
        DEFAULT: '#CD853F',
        foreground: '#FFFFFF'
      },
      warning: {
        DEFAULT: '#DEB887',
        foreground: '#000000'
      },
      danger: {
        DEFAULT: '#F5DEB3',
        foreground: '#000000'
      }
    }
  },
  emerald: {
    name: 'Emerald',
    background: {
      type: 'color',
      color: '#ffffff'
    },
    colors: {
      background: '#FFFFFF',
      foreground: '#11181C',
      divider: '#E4E4E7',
      focus: '#047857',
      content1: '#FFFFFF',
      content2: '#F4F4F5',
      content3: '#E4E4E7',
      content4: '#D4D4D8',
      default: {
        DEFAULT: '#71717A',
        foreground: '#FFFFFF'
      },
      primary: {
        DEFAULT: '#047857',
        foreground: '#FFFFFF'
      },
      secondary: {
        DEFAULT: '#059669',
        foreground: '#FFFFFF'
      },
      success: {
        DEFAULT: '#10B981',
        foreground: '#FFFFFF'
      },
      warning: {
        DEFAULT: '#34D399',
        foreground: '#000000'
      },
      danger: {
        DEFAULT: '#6EE7B7',
        foreground: '#000000'
      }
    }
  }
};

// Dark mode color variants
export const darkModeColors = {
  background: '#000000',
  foreground: '#ECEDEE',
  divider: '#27272A',
  focus: '#006FEE',
  content1: '#18181B',
  content2: '#27272A',
  content3: '#3F3F46',
  content4: '#52525B'
};

// Font families
export const fontFamilies = [
  { name: 'Inter', value: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' },
  { name: 'Roboto', value: 'Roboto, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, "Noto Sans", sans-serif' },
  { name: 'Outfit', value: 'Outfit, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' },
  { name: 'Lora', value: 'Lora, ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }
];

// Border radius options
export const radiusOptions = [
  { name: 'none', value: '0px' },
  { name: 'sm', value: '4px' },
  { name: 'md', value: '8px' },
  { name: 'lg', value: '12px' },
  { name: 'full', value: '9999px' }
];

// Border width options
export const borderWidthOptions = [
  { name: 'thin', value: '1px' },
  { name: 'medium', value: '2px' },
  { name: 'thick', value: '3px' }
];

// Scaling options
export const scalingOptions = ['90%', '95%', '100%', '105%', '110%'];

// Opacity options for disabled elements
export const opacityOptions = ['0.3', '0.4', '0.5', '0.6', '0.7'];

/**
 * Get theme configuration by name
 */
export const getTheme = (themeName = 'heroui') => {
  return heroUIThemes[themeName] || heroUIThemes.heroui;
};

/**
 * Generate HeroUI theme configuration
 */
export const generateHeroUIConfig = (theme, isDark = false) => {
  const baseTheme = getTheme(theme.activeTheme);
  
  return {
    light: {
      layout: theme.layout || {},
      colors: {
        ...baseTheme.colors,
        ...(isDark ? {} : {
          background: '#FFFFFF',
          foreground: '#11181C',
          content1: '#FFFFFF',
          content2: '#F4F4F5',
          content3: '#E4E4E7',
          content4: '#D4D4D8'
        })
      }
    },
    dark: {
      layout: theme.layout || {},
      colors: {
        ...baseTheme.colors,
        ...(isDark ? darkModeColors : {})
      }
    }
  };
};

/**
 * Apply theme to document
 */
export const applyThemeToDocument = (theme) => {
  const root = document.documentElement;
  const isDark = theme.mode === 'dark';
  
  // Set data attributes
  root.setAttribute('data-theme', theme.mode);
  root.setAttribute('data-active-theme', theme.activeTheme);
  
  // Get theme colors - use custom colors if activeTheme is 'custom'
  let themeColors;
  if (theme.activeTheme === 'custom' && theme.customColors) {
    themeColors = theme.customColors;
  } else {
    const baseTheme = getTheme(theme.activeTheme);
    themeColors = isDark ? { ...baseTheme.colors, ...darkModeColors } : baseTheme.colors;
  }
  
  // Apply CSS custom properties for semantic colors
  root.style.setProperty('--background', themeColors.background);
  root.style.setProperty('--foreground', themeColors.foreground);
  root.style.setProperty('--primary', typeof themeColors.primary === 'object' ? themeColors.primary.DEFAULT : themeColors.primary);
  root.style.setProperty('--secondary', typeof themeColors.secondary === 'object' ? themeColors.secondary.DEFAULT : themeColors.secondary);
  root.style.setProperty('--success', typeof themeColors.success === 'object' ? themeColors.success.DEFAULT : themeColors.success);
  root.style.setProperty('--warning', typeof themeColors.warning === 'object' ? themeColors.warning.DEFAULT : themeColors.warning);
  root.style.setProperty('--danger', typeof themeColors.danger === 'object' ? themeColors.danger.DEFAULT : themeColors.danger);
  root.style.setProperty('--default', typeof themeColors.default === 'object' ? themeColors.default.DEFAULT : themeColors.default);
  
  // Apply theme variables with --theme- prefix for consistency
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
  
  // Apply layout properties
  if (theme.layout) {
    Object.entries(theme.layout).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }
  
  // Apply simplified background settings
  if (theme.background) {
    const body = document.body;
    
    // Clean up any existing overlays
    const overlay = document.getElementById('background-overlay');
    if (overlay) overlay.remove();
    
    if (theme.background.type === 'color' && theme.background.color) {
      // Reset any image properties
      body.style.setProperty('background-image', '', 'important');
      body.style.setProperty('background-size', '', 'important');
      body.style.setProperty('background-position', '', 'important');
      body.style.setProperty('background-repeat', '', 'important');
      body.style.setProperty('background-attachment', '', 'important');
      
      // Apply color/gradient background - avoid shorthand background property
      if (theme.background.color.includes('gradient')) {
        // For gradients, we need to use background-image instead of background
        body.style.setProperty('background-image', theme.background.color, 'important');
        body.style.setProperty('background-color', '', 'important');
      } else {
        body.style.setProperty('background-color', theme.background.color, 'important');
        body.style.setProperty('background-image', '', 'important');
      }
    } else if (theme.background.type === 'image' && theme.background.image) {
      // Reset color properties
      body.style.setProperty('background-color', '', 'important');
      
      // Validate the image URL/data
      if (theme.background.image.startsWith('data:image/') || 
          theme.background.image.startsWith('http://') || 
          theme.background.image.startsWith('https://') ||
          theme.background.image.startsWith('/') ||
          theme.background.image.includes('.')) {
        
        // Apply image background using individual properties only
        body.style.setProperty('background-image', `url("${theme.background.image}")`, 'important');
        body.style.setProperty('background-size', theme.background.size || 'cover', 'important');
        body.style.setProperty('background-position', theme.background.position || 'center', 'important');
        body.style.setProperty('background-repeat', theme.background.repeat || 'no-repeat', 'important');
        body.style.setProperty('background-attachment', 'fixed', 'important');
      } else {
        console.error('Invalid image URL/data:', theme.background.image);
      }
    } else {
      // Reset to default - clear all background properties
      body.style.setProperty('background-image', '', 'important');
      body.style.setProperty('background-size', '', 'important');
      body.style.setProperty('background-position', '', 'important');
      body.style.setProperty('background-repeat', '', 'important');
      body.style.setProperty('background-attachment', '', 'important');
      body.style.setProperty('background-color', '', 'important');
    }
  }

  // Set font family
  if (theme.layout?.fontFamily) {
    root.style.fontFamily = theme.layout.fontFamily;
  }
  
  // Toggle dark class for HeroUI
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

const DEFAULT_PRIMARY = '#006FEE';

export const hexToRgba = (hex, alpha = 1) => {
  if (!hex) {
    return `rgba(0, 111, 238, ${alpha})`;
  }

  let normalized = hex.replace('#', '').trim();
  if (normalized.length === 3) {
    normalized = normalized.split('').map((char) => char + char).join('');
  }

  if (normalized.length !== 6 || Number.isNaN(Number.parseInt(normalized, 16))) {
    return `rgba(0, 111, 238, ${alpha})`;
  }

  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const readPrimaryFromSettings = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const saved = localStorage.getItem('heroui-theme-settings');
    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved);
    return parsed?.customColors?.primary || null;
  } catch (error) {
    console.warn('Failed to parse theme settings while reading primary color:', error);
    return null;
  }
};

const readPrimaryFromCss = () => {
  if (typeof window === 'undefined' || !window.document) {
    return null;
  }

  const root = document.documentElement;
  const computed = window.getComputedStyle(root);
  const candidates = [
    computed.getPropertyValue('--theme-primary'),
    computed.getPropertyValue('--primary'),
  ];

  const match = candidates.find((value) => value && value.trim().length);
  return match ? match.trim() : null;
};

export const getThemePrimaryColor = () => {
  const fromSettings = readPrimaryFromSettings();
  if (fromSettings) {
    return fromSettings;
  }

  const fromCss = readPrimaryFromCss();
  if (fromCss) {
    return fromCss;
  }

  return DEFAULT_PRIMARY;
};

export default {
  heroUIThemes,
  darkModeColors,
  fontFamilies,
  radiusOptions,
  borderWidthOptions,
  scalingOptions,
  getTheme,
  generateHeroUIConfig,
  applyThemeToDocument,
  getThemePrimaryColor,
  hexToRgba
};
