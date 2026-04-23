/**
 * Complete Theme Preset System - v2.1
 * Predefined theme combinations for quick selection
 */

import { BACKGROUND_PRESETS } from './backgroundPresets';

export const THEME_PRESETS = {
  'default': {
    key: 'default',
    name: 'Default',
    category: 'Business',
    description: 'Clean modern interface perfect for business applications',
    preview: {
      primary: '#006FEE',
      background: '#FAFAFA',
      card: 'modern'
    },
    config: {
      mode: 'light',
      cardStyle: 'modern',
      typography: {
        fontFamily: 'DM Sans',
        fontSize: '16px'
      },
      background: {
        type: 'color',
        value: ''
      }
    }
  },

  'corporate-blue': {
    key: 'corporate-blue',
    name: 'Corporate Blue',
    category: 'Business', 
    description: 'Professional blue theme ideal for enterprise applications',
    preview: {
      primary: '#1e40af',
      background: '#f8fafc',
      card: 'corporate'
    },
    config: {
      mode: 'light',
      cardStyle: 'corporate',
      typography: {
        fontFamily: 'DM Sans',
        fontSize: '16px'
      },
      background: BACKGROUND_PRESETS['cool-blue']
    }
  },

  'warm-minimal': {
    key: 'warm-minimal',
    name: 'Warm Minimal',
    category: 'Creative',
    description: 'Soft colors with rounded edges for creative workflows',
    preview: {
      primary: '#f59e0b',
      background: '#fffef9',
      card: 'soft'
    },
    config: {
      mode: 'light',
      cardStyle: 'soft',
      typography: {
        fontFamily: 'DM Sans',
        fontSize: '16px'
      },
      background: BACKGROUND_PRESETS['warm-white']
    }
  },

  'glass-modern': {
    key: 'glass-modern',
    name: 'Glass Modern',
    category: 'Creative',
    description: 'Frosted glass effects with beautiful transparency',
    preview: {
      primary: '#60a5fa',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      card: 'glass'
    },
    config: {
      mode: 'light',
      cardStyle: 'glass',
      typography: {
        fontFamily: 'DM Sans',
        fontSize: '16px'
      },
      background: BACKGROUND_PRESETS['sunset']
    }
  },

  'neomorphic': {
    key: 'neomorphic',
    name: 'Neomorphic',
    category: 'Creative',
    description: 'Soft 3D-like elements with subtle depth',
    preview: {
      primary: '#3b82f6',
      background: '#e0e0e0',
      card: 'neo'
    },
    config: {
      mode: 'light',
      cardStyle: 'neo',
      typography: {
        fontFamily: 'DM Sans',
        fontSize: '16px'
      },
      background: {
        type: 'color',
        value: '#E0E0E0'
      }
    }
  },

  'dark-premium': {
    key: 'dark-premium',
    name: 'Dark Premium',
    category: 'Professional',
    description: 'Luxury dark theme with gold accents',
    preview: {
      primary: '#f59e0b',
      background: '#0a0a0a',
      card: 'premium'
    },
    config: {
      mode: 'dark',
      cardStyle: 'premium',
      typography: {
        fontFamily: 'Georgia',
        fontSize: '16px'
      },
      background: {
        type: 'color',
        value: '#0A0A0A'
      }
    }
  },

  'high-contrast': {
    key: 'high-contrast',
    name: 'High Contrast',
    category: 'Accessibility',
    description: 'Maximum contrast for accessibility compliance',
    preview: {
      primary: '#000000',
      background: '#ffffff',
      card: 'bordered'
    },
    config: {
      mode: 'light',
      cardStyle: 'bordered',
      typography: {
        fontFamily: 'DM Sans',
        fontSize: '18px'
      },
      background: {
        type: 'color',
        value: '#FFFFFF'
      }
    }
  },

  'ocean-breeze': {
    key: 'ocean-breeze',
    name: 'Ocean Breeze',
    category: 'Creative',
    description: 'Calming blue gradients with soft patterns',
    preview: {
      primary: '#0ea5e9',
      background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
      card: 'glass'
    },
    config: {
      mode: 'light',
      cardStyle: 'glass',
      typography: {
        fontFamily: 'DM Sans',
        fontSize: '16px'
      },
      background: BACKGROUND_PRESETS['ocean']
    }
  },

  'forest-grid': {
    key: 'forest-grid',
    name: 'Forest Grid',
    category: 'Creative',
    description: 'Nature-inspired with subtle grid patterns',
    preview: {
      primary: '#059669',
      background: '#f0fdf4',
      card: 'elevated'
    },
    config: {
      mode: 'light',
      cardStyle: 'elevated',
      typography: {
        fontFamily: 'DM Sans',
        fontSize: '16px'
      },
      background: {
        ...BACKGROUND_PRESETS['grid'],
        value: {
          ...BACKGROUND_PRESETS['grid'].value,
          color: '#bbf7d0'
        }
      }
    }
  },

  'minimal-dots': {
    key: 'minimal-dots',
    name: 'Minimal Dots',
    category: 'Minimal',
    description: 'Clean interface with subtle dot patterns',
    preview: {
      primary: '#6366f1',
      background: '#fafafa',
      card: 'minimal'
    },
    config: {
      mode: 'light',
      cardStyle: 'minimal',
      typography: {
        fontFamily: 'DM Sans',
        fontSize: '16px'
      },
      background: BACKGROUND_PRESETS['dots']
    }
  }
};

/**
 * Get theme presets grouped by category
 */
export const getThemePresetOptions = () => {
  const options = Object.values(THEME_PRESETS);
  
  const grouped = {};
  options.forEach(preset => {
    if (!grouped[preset.category]) {
      grouped[preset.category] = [];
    }
    grouped[preset.category].push(preset);
  });
  
  return {
    all: options,
    grouped,
    categories: Object.keys(grouped)
  };
};

/**
 * Get theme preset by key
 */
export const getThemePreset = (key) => {
  return THEME_PRESETS[key] || THEME_PRESETS.default;
};

/**
 * Apply theme preset configuration
 */
export const applyThemePreset = (presetKey, updateThemeFunction) => {
  const preset = getThemePreset(presetKey);
  if (preset && updateThemeFunction) {
    updateThemeFunction(preset.config);
  }
  return preset;
};

export default {
  THEME_PRESETS,
  getThemePresetOptions,
  getThemePreset,
  applyThemePreset
};