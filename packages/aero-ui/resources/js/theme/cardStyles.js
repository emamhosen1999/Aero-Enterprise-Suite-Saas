/**
 * Card Style Definitions - v2.0
 * Preset card styles with Tailwind classes + theme color definitions
 * 
 * STRUCTURE:
 * - CARD_STYLES: 10 preset styles (modern, glass, neo, soft, corporate, minimal, elevated, bordered, flat, premium)
 * - Each style includes: Tailwind classes + theme colors/layout
 * - Metadata: category, preview, description for UI selection
 * - WCAG AA contrast validation utilities
 * 
 * @see ThemeContext.jsx for consumption
 * @see theme/index.js for applyThemeToDocument()
 */

/**
 * Convert hex/rgb color to RGB values
 * @param {string} color - Color in hex (#RRGGBB) or rgb(r,g,b) format
 * @returns {Object|null} {r, g, b} values 0-255, or null if invalid
 */
const parseColor = (color) => {
  if (!color) return null;
  
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16)
      };
    }
  }
  
  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    };
  }
  
  return null;
};

/**
 * Calculate relative luminance (WCAG formula)
 * @param {Object} rgb - {r, g, b} values 0-255
 * @returns {number} Relative luminance 0-1
 */
const getRelativeLuminance = (rgb) => {
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;
  
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Calculate WCAG contrast ratio between two colors
 * @param {string} foreground - Foreground color (text)
 * @param {string} background - Background color
 * @returns {number|null} Contrast ratio (1-21) or null if invalid colors
 */
export const getContrastRatio = (foreground, background) => {
  const fgRgb = parseColor(foreground);
  const bgRgb = parseColor(background);
  
  if (!fgRgb || !bgRgb) return null;
  
  const fgLuminance = getRelativeLuminance(fgRgb);
  const bgLuminance = getRelativeLuminance(bgRgb);
  
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Validate WCAG AA contrast (4.5:1 for normal text, 3:1 for large text)
 * @param {string} foreground - Foreground color
 * @param {string} background - Background color
 * @param {boolean} isLargeText - True if text is 18pt+ or 14pt+ bold
 * @returns {Object} {passes: boolean, ratio: number, level: string}
 */
export const validateContrast = (foreground, background, isLargeText = false) => {
  const ratio = getContrastRatio(foreground, background);
  
  if (ratio === null) {
    return { passes: false, ratio: 0, level: 'invalid', message: 'Invalid color format' };
  }
  
  const requiredRatio = isLargeText ? 3 : 4.5;
  const aaaPasses = isLargeText ? ratio >= 4.5 : ratio >= 7;
  
  return {
    passes: ratio >= requiredRatio,
    ratio: Math.round(ratio * 100) / 100,
    level: aaaPasses ? 'AAA' : (ratio >= requiredRatio ? 'AA' : 'fail'),
    message: ratio >= requiredRatio 
      ? `Passes WCAG ${aaaPasses ? 'AAA' : 'AA'} (${Math.round(ratio * 100) / 100}:1)`
      : `Fails WCAG AA (${Math.round(ratio * 100) / 100}:1, needs ${requiredRatio}:1)`
  };
};

/**
 * Validate all color pairs in a theme
 * @param {Object} theme - Theme object with colors property
 * @returns {Array} Array of validation warnings
 */
export const validateThemeContrast = (theme) => {
  if (!theme?.colors) return [];
  
  const warnings = [];
  const { colors } = theme;
  
  // Check foreground on background
  if (colors.foreground && colors.background) {
    const result = validateContrast(colors.foreground, colors.background);
    if (!result.passes) {
      warnings.push({
        pair: 'foreground/background',
        ...result
      });
    }
  }
  
  // Check foreground on content colors
  ['content1', 'content2', 'content3', 'content4'].forEach(contentKey => {
    if (colors.foreground && colors[contentKey]) {
      const result = validateContrast(colors.foreground, colors[contentKey]);
      if (!result.passes) {
        warnings.push({
          pair: `foreground/${contentKey}`,
          ...result
        });
      }
    }
  });
  
  // Check primary on background
  if (colors.primary && colors.background) {
    const result = validateContrast(colors.primary, colors.background);
    if (!result.passes) {
      warnings.push({
        pair: 'primary/background',
        ...result
      });
    }
  }
  
  return warnings;
};

export const CARD_STYLES = {
  modern: {
    key: 'modern',
    name: 'Modern',
    category: 'Modern',
    description: 'Clean, contemporary design with subtle gradients',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    classes: {
      base: 'transition-all duration-200 shadow-md hover:shadow-lg',
      header: 'border-b border-divider bg-gradient-to-r from-content1/50 to-content2/30 backdrop-blur-sm',
      body: 'bg-content1',
      footer: 'border-t border-divider bg-content1'
    },
    theme: {
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        background: '#FAFAFA',
        foreground: '#11181C',
        divider: '#E4E4E7',
        content1: '#FFFFFF',
        content2: '#F4F4F5',
        content3: '#E4E4E7',
        content4: '#D4D4D8'
      },
      layout: {
        fontFamily: 'Inter',
        borderRadius: '12px',
        borderWidth: '1px'
      }
    }
  },
  glass: {
    key: 'glass',
    name: 'Glass',
    category: 'Modern',
    description: 'Frosted glass effect with transparency',
    preview: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
    classes: {
      base: 'backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl',
      header: 'border-b border-white/20 backdrop-blur-md',
      body: 'bg-transparent',
      footer: 'border-t border-white/20 backdrop-blur-md'
    },
    theme: {
      colors: {
        primary: '#60a5fa',
        secondary: '#a78bfa',
        success: '#34d399',
        warning: '#fbbf24',
        danger: '#f87171',
        background: '#F8F9FA',
        foreground: '#1F2937',
        divider: 'rgba(255,255,255,0.2)',
        content1: 'rgba(255,255,255,0.8)',
        content2: 'rgba(255,255,255,0.6)',
        content3: 'rgba(255,255,255,0.4)',
        content4: 'rgba(255,255,255,0.2)'
      },
      layout: {
        fontFamily: 'Inter',
        borderRadius: '16px',
        borderWidth: '1px'
      }
    }
  },
  neo: {
    key: 'neo',
    name: 'Neomorphic',
    category: 'Modern',
    description: 'Soft shadows and subtle depth',
    preview: 'linear-gradient(145deg, #e6e6e6, #ffffff)',
    classes: {
      base: 'shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff] bg-gradient-to-br from-gray-50 to-white',
      header: 'bg-gradient-to-r from-gray-100 to-gray-50 shadow-inner',
      body: 'bg-white',
      footer: 'bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner'
    },
    theme: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        background: '#E0E0E0',
        foreground: '#1F2937',
        divider: '#C0C0C0',
        content1: '#FFFFFF',
        content2: '#F5F5F5',
        content3: '#EBEBEB',
        content4: '#D6D6D6'
      },
      layout: {
        fontFamily: 'Inter',
        borderRadius: '20px',
        borderWidth: '0px'
      }
    }
  },
  soft: {
    key: 'soft',
    name: 'Soft',
    category: 'Minimal',
    description: 'Gentle colors and rounded edges',
    preview: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
    classes: {
      base: 'shadow-sm border border-gray-200 bg-white rounded-2xl',
      header: 'bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-100',
      body: 'bg-white',
      footer: 'bg-gray-50 border-t border-gray-100'
    },
    theme: {
      colors: {
        primary: '#f59e0b',
        secondary: '#fbbf24',
        success: '#10b981',
        warning: '#f97316',
        danger: '#ef4444',
        background: '#FFFBF5',
        foreground: '#374151',
        divider: '#FDE68A',
        content1: '#FFFEF9',
        content2: '#FEF9EC',
        content3: '#FEF3C7',
        content4: '#FDE68A'
      },
      layout: {
        fontFamily: 'Inter',
        borderRadius: '16px',
        borderWidth: '1px'
      }
    }
  },
  corporate: {
    key: 'corporate',
    name: 'Corporate',
    category: 'Professional',
    description: 'Professional and business-oriented',
    preview: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
    classes: {
      base: 'shadow-lg border-2 border-blue-900 bg-gradient-to-br from-blue-50 to-white',
      header: 'bg-gradient-to-r from-blue-900 to-blue-800 text-white border-b-4 border-blue-700',
      body: 'bg-white',
      footer: 'bg-blue-50 border-t-2 border-blue-200'
    },
    theme: {
      colors: {
        primary: '#1e40af',
        secondary: '#1e3a8a',
        success: '#059669',
        warning: '#d97706',
        danger: '#dc2626',
        background: '#F0F4F8',
        foreground: '#1F2937',
        divider: '#BFDBFE',
        content1: '#FFFFFF',
        content2: '#EFF6FF',
        content3: '#DBEAFE',
        content4: '#BFDBFE'
      },
      layout: {
        fontFamily: 'system-ui',
        borderRadius: '8px',
        borderWidth: '2px'
      }
    }
  },
  minimal: {
    key: 'minimal',
    name: 'Minimal',
    category: 'Minimal',
    description: 'Clean and distraction-free',
    preview: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
    classes: {
      base: 'bg-white border border-gray-200 shadow-sm',
      header: 'border-b border-gray-100 bg-white',
      body: 'bg-white',
      footer: 'border-t border-gray-100 bg-white'
    },
    theme: {
      colors: {
        primary: '#000000',
        secondary: '#404040',
        success: '#16a34a',
        warning: '#ea580c',
        danger: '#dc2626',
        background: '#FFFFFF',
        foreground: '#000000',
        divider: '#E5E5E5',
        content1: '#FFFFFF',
        content2: '#FAFAFA',
        content3: '#F5F5F5',
        content4: '#E5E5E5'
      },
      layout: {
        fontFamily: 'Inter',
        borderRadius: '4px',
        borderWidth: '1px'
      }
    }
  },
  elevated: {
    key: 'elevated',
    name: 'Elevated',
    category: 'Modern',
    description: 'Prominent shadows and depth',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    classes: {
      base: 'shadow-2xl bg-white transform transition-transform hover:scale-[1.02]',
      header: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg',
      body: 'bg-white p-6',
      footer: 'bg-gradient-to-r from-gray-50 to-white shadow-inner'
    },
    theme: {
      colors: {
        primary: '#7c3aed',
        secondary: '#2563eb',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        background: '#F9FAFB',
        foreground: '#111827',
        divider: '#E5E7EB',
        content1: '#FFFFFF',
        content2: '#F9FAFB',
        content3: '#F3F4F6',
        content4: '#E5E7EB'
      },
      layout: {
        fontFamily: 'Inter',
        borderRadius: '12px',
        borderWidth: '0px'
      }
    }
  },
  bordered: {
    key: 'bordered',
    name: 'Bordered',
    category: 'Professional',
    description: 'Defined borders and structure',
    preview: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
    classes: {
      base: 'border-2 border-gray-300 bg-white shadow-sm',
      header: 'border-b-2 border-gray-300 bg-gray-50',
      body: 'bg-white',
      footer: 'border-t-2 border-gray-300 bg-gray-50'
    },
    theme: {
      colors: {
        primary: '#4b5563',
        secondary: '#6b7280',
        success: '#059669',
        warning: '#d97706',
        danger: '#dc2626',
        background: '#FFFFFF',
        foreground: '#1F2937',
        divider: '#D1D5DB',
        content1: '#FFFFFF',
        content2: '#F9FAFB',
        content3: '#F3F4F6',
        content4: '#E5E7EB'
      },
      layout: {
        fontFamily: 'Inter',
        borderRadius: '8px',
        borderWidth: '2px'
      }
    }
  },
  flat: {
    key: 'flat',
    name: 'Flat',
    category: 'Minimal',
    description: 'No shadows, pure flat design',
    preview: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    classes: {
      base: 'bg-blue-50 border-l-4 border-blue-500',
      header: 'bg-blue-100 border-b border-blue-200',
      body: 'bg-blue-50',
      footer: 'bg-blue-100 border-t border-blue-200'
    },
    theme: {
      colors: {
        primary: '#3b82f6',
        secondary: '#2563eb',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        background: '#EFF6FF',
        foreground: '#1E3A8A',
        divider: '#BFDBFE',
        content1: '#FFFFFF',
        content2: '#EFF6FF',
        content3: '#DBEAFE',
        content4: '#BFDBFE'
      },
      layout: {
        fontFamily: 'Inter',
        borderRadius: '0px',
        borderWidth: '0px'
      }
    }
  },
  premium: {
    key: 'premium',
    name: 'Premium',
    category: 'Professional',
    description: 'Luxury dark theme with gold accents',
    preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    classes: {
      base: 'bg-gradient-to-br from-gray-900 to-gray-800 border border-amber-600/30 shadow-2xl shadow-amber-500/10',
      header: 'bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-b border-amber-600/30 backdrop-blur-sm',
      body: 'bg-gray-900/50',
      footer: 'bg-gradient-to-r from-gray-900/50 to-gray-800/50 border-t border-amber-600/30'
    },
    theme: {
      colors: {
        primary: '#f59e0b',
        secondary: '#d97706',
        success: '#10b981',
        warning: '#fbbf24',
        danger: '#ef4444',
        background: '#0A0A0A',
        foreground: '#F5F5F5',
        divider: '#404040',
        content1: '#1A1A1A',
        content2: '#262626',
        content3: '#333333',
        content4: '#404040'
      },
      layout: {
        fontFamily: 'Georgia',
        borderRadius: '12px',
        borderWidth: '1px'
      }
    }
  }
};

/**
 * Get card style by key with fallback
 */
export const getCardStyle = (key) => {
  return CARD_STYLES[key] || CARD_STYLES.modern;
};

/**
 * Get card style options with enhanced metadata for UI selection
 * Returns array grouped by category with preview info
 */
export const getCardStyleOptions = () => {
  const options = Object.entries(CARD_STYLES).map(([key, style]) => ({
    key: style.key,
    name: style.name,
    category: style.category,
    description: style.description,
    preview: style.preview,
    classes: style.classes,
    theme: style.theme
  }));
  
  // Group by category
  const grouped = {};
  options.forEach(option => {
    if (!grouped[option.category]) {
      grouped[option.category] = [];
    }
    grouped[option.category].push(option);
  });
  
  return {
    all: options,
    grouped,
    categories: Object.keys(grouped)
  };
};

/**
 * Apply card style theme to a theme object
 * Merges card style colors/layout with user overrides
 */
export const applyCardStyleTheme = (cardStyleKey, userTheme = {}) => {
  const cardStyle = getCardStyle(cardStyleKey);
  
  return {
    ...userTheme,
    cardStyle: cardStyleKey,
    colors: {
      ...cardStyle.theme.colors,
      ...(userTheme.colors || {})
    },
    layout: {
      ...cardStyle.theme.layout,
      ...(userTheme.layout || {})
    }
  };
};

export default {
  CARD_STYLES,
  getCardStyle,
  getCardStyleOptions,
  applyCardStyleTheme,
  getContrastRatio,
  validateContrast,
  validateThemeContrast
};
