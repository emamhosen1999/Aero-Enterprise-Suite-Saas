/**
 * Safe Theme Utilities - v2.0
 * Migration, validation, and normalization for unified theme storage
 * 
 * KEY CHANGES:
 * - Unified storage key: aero-theme-settings-v2
 * - Consolidated from 5 conflicting legacy keys
 * - Automatic migration from v1 to v2 shape
 * - Validation and normalization layer
 * 
 * THEME SHAPE v2.0:
 * {
 *   version: '2.0',
 *   mode: 'light' | 'dark' | 'system',
 *   cardStyle: string,
 *   typography: {
 *     fontFamily: string,
 *     fontSize: string
 *   },
 *   background: {
 *     type: 'color',
 *     value: string
 *   }
 * }
 */

export const THEME_STORAGE_KEY = 'aero-theme-settings-v2';

// Legacy storage keys (for migration)
const LEGACY_KEYS = [
  'heroui-theme-settings',
  'heroui-current-theme',
  'heroui-theme-mode',
  'theme-settings',
  'current-theme'
];

/**
 * Get default theme settings
 */
export const getDefaultTheme = () => ({
  version: '2.0',
  mode: 'system',
  cardStyle: 'modern',
  typography: {
    fontFamily: 'Inter',
    fontSize: '16px'
  },
  background: {
    type: 'color',
    value: ''
  }
});

/**
 * Normalize theme object to v2.0 shape
 * Handles partial updates and missing fields
 */
export const normalizeTheme = (theme) => {
  const defaults = getDefaultTheme();
  
  return {
    version: '2.0',
    mode: theme?.mode || defaults.mode,
    cardStyle: theme?.cardStyle || defaults.cardStyle,
    typography: {
      fontFamily: theme?.typography?.fontFamily || theme?.layout?.fontFamily || defaults.typography.fontFamily,
      fontSize: theme?.typography?.fontSize || defaults.typography.fontSize
    },
    background: {
      type: theme?.background?.type || defaults.background.type,
      value: theme?.background?.value || defaults.background.value
    }
  };
};

/**
 * Validate theme object structure
 */
export const validateTheme = (theme) => {
  if (!theme || typeof theme !== 'object') {
    return false;
  }
  
  // Check required top-level fields
  if (!theme.mode || !theme.cardStyle) {
    return false;
  }
  
  // Check typography structure
  if (!theme.typography || !theme.typography.fontFamily) {
    return false;
  }
  
  // Check background structure
  if (!theme.background || !theme.background.type) {
    return false;
  }
  
  return true;
};

/**
 * Migrate legacy theme data to v2.0
 * Attempts to read from old storage keys and convert to new format
 */
export const migrateTheme = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Check for existing v2 data first
  const existingV2 = localStorage.getItem(THEME_STORAGE_KEY);
  if (existingV2) {
    try {
      const parsed = JSON.parse(existingV2);
      if (parsed.version === '2.0') {
        return parsed;
      }
    } catch (e) {
      console.warn('[safeTheme] Failed to parse existing v2 theme', e);
    }
  }
  
  // Try migrating from legacy keys
  let migrated = {
    version: '2.0',
    mode: 'system',
    cardStyle: 'modern',
    typography: {
      fontFamily: 'Inter',
      fontSize: '16px'
    },
    background: {
      type: 'color',
      value: ''
    }
  };
  
  // Attempt to read from each legacy key
  LEGACY_KEYS.forEach(key => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        
        // Extract mode
        if (parsed.mode) {
          migrated.mode = parsed.mode;
        }
        if (parsed.theme) {
          migrated.cardStyle = parsed.theme;
        }
        if (parsed.cardStyle) {
          migrated.cardStyle = parsed.cardStyle;
        }
        
        // Extract typography/layout
        if (parsed.layout?.fontFamily) {
          migrated.typography.fontFamily = parsed.layout.fontFamily;
        }
        if (parsed.typography?.fontFamily) {
          migrated.typography.fontFamily = parsed.typography.fontFamily;
        }
        
        // Extract background
        if (parsed.background) {
          migrated.background = {
            type: parsed.background.type || 'color',
            value: parsed.background.value || ''
          };
        }
      }
    } catch (e) {
      // Silently skip invalid legacy data
    }
  });
  
  return migrated;
};

/**
 * Clean up legacy storage keys after migration
 * Call this after successfully saving v2 theme
 */
export const cleanupLegacyKeys = () => {
  if (typeof window === 'undefined') {
    return;
  }
  
  LEGACY_KEYS.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[safeTheme] Failed to remove legacy key: ${key}`, e);
    }
  });
};

/**
 * Safe theme getter with migration
 * Returns normalized theme or default
 */
export const getSafeTheme = () => {
  // Try migration first
  const migrated = migrateTheme();
  if (migrated && validateTheme(migrated)) {
    return normalizeTheme(migrated);
  }
  
  // Fallback to default
  return getDefaultTheme();
};

/**
 * Safe theme setter with validation
 * Automatically normalizes and validates before saving
 */
export const setSafeTheme = (theme) => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const normalized = normalizeTheme(theme);
    
    if (!validateTheme(normalized)) {
      console.error('[safeTheme] Invalid theme structure:', normalized);
      return false;
    }
    
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(normalized));
    cleanupLegacyKeys();
    return true;
  } catch (e) {
    console.error('[safeTheme] Failed to save theme:', e);
    return false;
  }
};

export default {
  THEME_STORAGE_KEY,
  getDefaultTheme,
  normalizeTheme,
  validateTheme,
  migrateTheme,
  cleanupLegacyKeys,
  getSafeTheme,
  setSafeTheme
};
