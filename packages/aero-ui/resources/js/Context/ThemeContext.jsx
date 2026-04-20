import React, { createContext, useContext, useState, useLayoutEffect } from 'react';
import { applyThemeToDocument, resolveEffectiveMode, VALID_MODES } from '../theme/index';
import { getCardStyle, getCardStyleOptions, CARD_STYLES, validateThemeContrast } from '../theme/cardStyles';
import { getThemePresetOptions, applyThemePreset } from '../theme/themePresets';
import { BACKGROUND_PRESETS } from '../theme/backgroundPresets';
import { getThemeRadius, getStatusColor, STATUS_COLORS } from '../utils/themeUtils';
import { 
  normalizeTheme, 
  validateTheme, 
  migrateTheme, 
  cleanupLegacyKeys,
  getDefaultTheme,
  THEME_STORAGE_KEY,
  VALID_MODES as SAFE_THEME_MODES
} from '../utils/safeTheme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ====================
// EXPORTED CONSTANTS (for components)
// ====================

export const CARD_STYLE_OPTIONS = getCardStyleOptions();
export const THEME_PRESET_OPTIONS = getThemePresetOptions();
export const BACKGROUND_PRESET_OPTIONS = BACKGROUND_PRESETS;

export const FONT_OPTIONS = [
  { key: 'inter', name: 'Inter', value: 'Inter' },
  { key: 'roboto', name: 'Roboto', value: 'Roboto' },
  { key: 'outfit', name: 'Outfit', value: 'Outfit' },
  { key: 'poppins', name: 'Poppins', value: 'Poppins' },
  { key: 'georgia', name: 'Georgia', value: 'Georgia' },
];

export const MODE_OPTIONS = VALID_MODES; // ['light', 'dim', 'dark', 'midnight', 'system']

export const FONT_SIZE_OPTIONS = [
  { key: 'sm', name: 'Small', value: 'sm' },
  { key: 'md', name: 'Medium', value: 'md' },
  { key: 'lg', name: 'Large', value: 'lg' },
];

// Export utility functions for components
export { getThemeRadius, getStatusColor, STATUS_COLORS };

// ====================
// STORAGE UTILITIES
// ====================

/**
 * Read theme from storage with migration support
 */
const readStoredTheme = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return getDefaultTheme();
  }

  try {
    // Try new v2.0 key first
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return normalizeTheme(parsed);
    }

    // Attempt migration from legacy keys
    const migrated = migrateTheme();
    if (migrated) {
      console.log('🎨 Theme: Migrated from legacy storage');
      saveTheme(migrated); // Persist migrated version immediately
      return migrated;
    }

    return getDefaultTheme();
  } catch (error) {
    console.error('Theme read error:', error);
    return getDefaultTheme();
  }
};

/**
 * Save theme to storage (atomic write with validation)
 */
const saveTheme = (theme) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  try {
    const normalized = normalizeTheme(theme);
    
    if (!validateTheme(normalized)) {
      console.error('[ThemeContext] Invalid theme structure, skipping save:', normalized);
      return;
    }
    
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(normalized));
    
    // Clean up legacy keys after successful write
    cleanupLegacyKeys();
  } catch (error) {
    console.error('Theme save error:', error);
  }
};

// ====================
// THEME PROVIDER
// ====================

export const ThemeProvider = ({ children }) => {
  const [themeSettings, setThemeSettings] = useState(readStoredTheme);
  const [isHydrated, setIsHydrated] = useState(false);

  // Apply theme BEFORE paint (reduce flash)
  useLayoutEffect(() => {
    applyThemeToDocument(themeSettings);
    // Small delay to ensure CSS variables are applied
    const timer = setTimeout(() => setIsHydrated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Sync on changes (after hydration)
  useLayoutEffect(() => {
    if (!isHydrated) return;
    
    saveTheme(themeSettings);
    applyThemeToDocument(themeSettings);
  }, [themeSettings, isHydrated]);

  // ====================
  // PUBLIC API
  // ====================

  /**
   * Apply a complete theme preset
   */
  const applyPreset = (presetKey) => {
    const preset = applyThemePreset(presetKey, updateTheme);
    return preset;
  };

  /**
   * Update theme settings (partial update with normalization)
   */
  const updateTheme = (updates) => {
    setThemeSettings(prev => {
      const next = normalizeTheme({ ...prev, ...updates });
      return next;
    });
  };

  /**
   * Toggle through appearance modes: light → dim → dark → midnight → light
   * If currently on 'system', resolves to the next mode after the effective appearance.
   */
  const toggleMode = () => {
    setThemeSettings(prev => {
      const cycle = ['light', 'dim', 'dark', 'midnight'];
      
      // Determine which position in the cycle we're at
      let currentIdx;
      if (prev.mode === 'system') {
        // Resolve system to its effective mode, then advance
        const effective = resolveEffectiveMode('system');
        currentIdx = cycle.indexOf(effective || 'light');
      } else {
        currentIdx = cycle.indexOf(prev.mode);
        if (currentIdx === -1) currentIdx = 0;
      }
      
      const nextIdx = (currentIdx + 1) % cycle.length;
      return { ...prev, mode: cycle[nextIdx] };
    });
  };

  /**
   * Set specific mode (light, dim, dark, midnight, or system)
   */
  const setMode = (mode) => {
    if (VALID_MODES.includes(mode)) {
      setThemeSettings(prev => ({
        ...prev,
        mode
      }));
    }
  };

  /**
   * Reset theme to default settings
   */
  const resetTheme = () => {
    setThemeSettings(getDefaultTheme());
  };

  // ====================
  // DERIVED STATE (always fresh from cardStyle)
  // ====================

  const currentCardStyle = getCardStyle(themeSettings.cardStyle);
  const colors = currentCardStyle.theme.colors;
  const layout = currentCardStyle.theme.layout;
  const cardClasses = currentCardStyle.classes;
  
  // WCAG contrast validation (development only)
  const contrastWarnings = React.useMemo(() => {
    if (process.env.NODE_ENV === 'production') return [];
    
    const warnings = validateThemeContrast({ colors });
    if (warnings.length > 0) {
      console.warn('[ThemeContext] Contrast warnings for card style "' + themeSettings.cardStyle + '":', warnings);
    }
    return warnings;
  }, [colors, themeSettings.cardStyle]);

  // ====================
  // LOADING SCREEN - Optimized for perceived performance
  // ====================

  // Render children immediately with fade-in transition instead of blocking
  // This allows layout to render while theme applies, reducing perceived load time
  if (!isHydrated) {
    return (
      <ThemeContext.Provider value={{
        themeSettings: getDefaultTheme(),
        mode: 'light',
        isDark: false,
        cardStyle: 'modern',
        typography: { fontFamily: 'Inter', fontSize: 'base' },
        background: { type: 'color', value: '' },
        colors: {},
        layout: {},
        cardClasses: {},
        contrastWarnings: [],
        updateTheme: () => {},
        toggleMode: () => {},
        resetTheme: () => {},
        cardStyleOptions: CARD_STYLE_OPTIONS,
        fontOptions: FONT_OPTIONS,
        modeOptions: MODE_OPTIONS,
        fontSizeOptions: FONT_SIZE_OPTIONS,
        CARD_STYLES,
      }}>
        <div className="opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]">
          {children}
        </div>
        <style>{`
          @keyframes fadeIn {
            to { opacity: 1; }
          }
        `}</style>
      </ThemeContext.Provider>
    );
  }

  // ====================
  // CONTEXT VALUE
  // ====================

  const isDark = resolveEffectiveMode(themeSettings.mode) !== null;

  const value = {
    // Current settings (mutable)
    themeSettings,
    isHydrated,
    
    // Shorthand accessors (read-only)
    mode: themeSettings.mode,
    isDark,
    cardStyle: themeSettings.cardStyle,
    typography: themeSettings.typography,
    background: themeSettings.background,
    
    // Derived state (auto-updated from cardStyle)
    colors,
    layout,
    cardClasses,
    contrastWarnings,
    
    // Actions
    updateTheme,
    toggleMode,
    setMode,
    resetTheme,
    applyPreset,
    
    // Utility functions
    getThemeRadius: () => getThemeRadius(),
    getStatusColor,
    
    // Metadata (for selectors and drawers)
    cardStyleOptions: CARD_STYLE_OPTIONS,
    themePresetOptions: THEME_PRESET_OPTIONS,
    backgroundPresetOptions: BACKGROUND_PRESET_OPTIONS,
    fontOptions: FONT_OPTIONS,
    modeOptions: MODE_OPTIONS,
    fontSizeOptions: FONT_SIZE_OPTIONS,
    
    // Direct access to registry
    CARD_STYLES,
    STATUS_COLORS,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
