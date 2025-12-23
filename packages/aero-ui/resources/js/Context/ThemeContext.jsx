import React, { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react';
import { heroUIThemes, applyThemeToDocument, generateHeroUIConfig } from '../theme/index';
import { getCardStyle, applyCardStyleTheme } from '../theme/cardStyles';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const defaultThemeSettings = {
  mode: 'light', // 'light' or 'dark'
  cardStyle: 'modern', // Selected card style (replaces activeTheme)
  layout: {
    fontFamily: 'Inter' // ONLY user-customizable layout option
  },
  background: {
    type: 'color', // 'color' only (NO images)
    color: '#ffffff' // Background color or gradient only
  }
  // customColors REMOVED - auto-generated from cardStyle
  // borderRadius REMOVED - comes from cardStyle
  // borderWidth REMOVED - comes from cardStyle
  // scale REMOVED - fixed at 100%
  // disabledOpacity REMOVED - fixed at 0.5
};

const readStoredTheme = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return defaultThemeSettings;
  }

  try {
    const savedTheme = localStorage.getItem('heroui-theme-settings');
    if (!savedTheme) {
      return defaultThemeSettings;
    }

    const parsedTheme = JSON.parse(savedTheme);
    return { ...defaultThemeSettings, ...parsedTheme };
  } catch (error) {
    console.warn('Failed to parse saved theme:', error);
    localStorage.removeItem('heroui-theme-settings');
    return defaultThemeSettings;
  }
};

export const ThemeProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [themeSettings, setThemeSettings] = useState(readStoredTheme);
  const [isHydrated, setIsHydrated] = useState(false);

  // Apply theme before paint to reduce flash and respect stored preference
  useLayoutEffect(() => {
    applyThemeToDocument(themeSettings);
    setIsInitialized(true);
  }, []);

  // Delay hydration flag slightly so loader is visible at least one frame
  useEffect(() => {
    if (!isInitialized) {
      return undefined;
    }

    const timer = setTimeout(() => setIsHydrated(true), 80); // small delay for visible paint
    return () => clearTimeout(timer);
  }, [isInitialized]);

  // Save theme to localStorage and apply when changed (but not during initial load)
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    // Save to localStorage
    try {
      localStorage.setItem('heroui-theme-settings', JSON.stringify(themeSettings));
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }
    
    // Apply theme
    applyThemeToDocument(themeSettings);
  }, [themeSettings, isInitialized]);

  const updateTheme = (newSettings) => {
    setThemeSettings(prev => {
      let updatedSettings = {
        ...prev,
        ...newSettings
      };

      // If cardStyle is being changed, apply the complete card style theme
      if (newSettings.cardStyle && newSettings.cardStyle !== prev.cardStyle) {
        updatedSettings = applyCardStyleTheme(newSettings.cardStyle, prev);
      }

      return updatedSettings;
    });
  };

  const toggleMode = () => {
    setThemeSettings(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light'
    }));
  };

  const resetTheme = () => {
    setThemeSettings({
      mode: 'light',
      cardStyle: 'modern',
      layout: {
        fontFamily: 'Inter'
      },
      background: {
        type: 'color',
        color: '#ffffff'
      }
    });
  };

  // Prevent unthemed flash; show lightweight loader until theme is applied
  if (!isHydrated) {
    return (
      <div className="fixed inset-0 z-[9999] grid place-items-center bg-[var(--theme-content1,#ffffff)] text-[var(--theme-foreground,#11181C)] transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--theme-divider,#e4e4e7)] border-t-[var(--theme-primary,#006fee)]" />
          <span className="text-sm font-medium">Applying theme...</span>
        </div>
      </div>
    );
  }

  // Get current card style configuration
  const getCurrentCardStyle = () => {
    return getCardStyle(themeSettings.cardStyle || 'modern');
  };

  // Convert heroUIThemes object to array format (kept for backward compatibility)
  const prebuiltThemes = Object.keys(heroUIThemes || {}).map(key => ({
    id: key,
    name: heroUIThemes[key]?.name || key,
    colors: [
      heroUIThemes[key]?.colors?.primary?.DEFAULT || heroUIThemes[key]?.colors?.primary || '#006FEE',
      heroUIThemes[key]?.colors?.secondary?.DEFAULT || heroUIThemes[key]?.colors?.secondary || '#17C964',
      heroUIThemes[key]?.colors?.success?.DEFAULT || heroUIThemes[key]?.colors?.success || '#17C964',
      heroUIThemes[key]?.colors?.warning?.DEFAULT || heroUIThemes[key]?.colors?.warning || '#F5A524',
      heroUIThemes[key]?.colors?.danger?.DEFAULT || heroUIThemes[key]?.colors?.danger || '#F31260'
    ],
    isDefault: key === 'heroui'
  }));

  // Generate the actual HeroUI theme object
  const getHeroUITheme = () => {
    return generateHeroUIConfig(themeSettings, themeSettings.mode === 'dark');
  };

  const value = {
    themeSettings,
    updateTheme,
    toggleMode,
    resetTheme,
    getHeroUITheme,
    getCurrentCardStyle,
    prebuiltThemes,
    heroUIThemes // Add this so components can access the themes directly
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
