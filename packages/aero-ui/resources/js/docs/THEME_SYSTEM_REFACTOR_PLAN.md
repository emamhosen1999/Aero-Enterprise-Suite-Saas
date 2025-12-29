# Theme System Architectural Refactor Plan

## Executive Summary

**Current State**: CRITICAL - Multiple conflicting theme systems operating independently  
**Target State**: Single source of truth with consistent APIs and data flow  
**Risk Level**: HIGH - Breaking changes required  
**Migration Path**: Phased with backward compatibility layer

---

## 1. Architecture Problems Identified

### 1.1 Dual Storage Systems
```javascript
// ThemeContext writes:
localStorage.setItem('heroui-theme-settings', JSON.stringify({
  mode: 'light',
  cardStyle: 'modern',
  layout: { fontFamily: 'Inter' },
  background: { type: 'color', color: '#ffffff' }
}));

// useThemeSync writes (CONFLICT):
localStorage.setItem('darkMode', 'true');
localStorage.setItem('selectedTheme', 'ocean');
localStorage.setItem('selectedFont', 'inter');
localStorage.setItem('aero-hr-background', 'pattern-glass-1');
```

### 1.2 Missing Exports in ThemeContext
```javascript
// ThemeSelector.jsx imports these:
import { useTheme, THEME_CONFIG, THEME_CATEGORIES } from '@/Context/ThemeContext';

// ThemeContext DOES NOT EXPORT:
- THEME_CONFIG
- THEME_CATEGORIES
```

### 1.3 Orphaned Utility (safeTheme.js)
- No integration with ThemeContext
- References non-existent `theme.glassCard` property
- Unused by any component

### 1.4 Incomplete Card Style Application
```javascript
// cardStyles.js defines:
{
  modern: {
    classes: { base, header, body, footer },
    theme: { colors, layout }
  }
}

// ThemedCard.jsx IGNORES classes, only uses CSS variables
```

---

## 2. Canonical Theme Data Model

### 2.1 Single Theme Shape (v2.0)
```typescript
interface ThemeSettings {
  // Core Identity
  version: '2.0';
  
  // Display Mode
  mode: 'light' | 'dark' | 'system';
  
  // Card Style Preset (PRIMARY DRIVER)
  cardStyle: CardStyleKey; // 'modern' | 'glass' | 'neo' | ...
  
  // Typography
  typography: {
    fontFamily: FontFamily;
    fontSize: 'sm' | 'md' | 'lg'; // NEW - consistent sizing
  };
  
  // Background (SIMPLIFIED)
  background: {
    type: 'color' | 'gradient';
    value: string; // Hex color or CSS gradient
  };
  
  // Layout Tokens (AUTO-DERIVED from cardStyle)
  layout: {
    borderRadius: string; // px value
    borderWidth: string;  // px value
    scale: '100%';        // FIXED
    disabledOpacity: '0.5'; // FIXED
  };
  
  // Color Palette (AUTO-DERIVED from cardStyle)
  colors: {
    // Semantic colors
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    
    // Surface levels
    background: string;
    foreground: string;
    content1: string;
    content2: string;
    content3: string;
    content4: string;
    divider: string;
    focus: string;
  };
  
  // Tailwind Classes (AUTO-DERIVED from cardStyle)
  cardClasses: {
    base: string;
    header: string;
    body: string;
    footer: string;
  };
}
```

### 2.2 Storage Keys (UNIFIED)
```javascript
// PRIMARY KEY (everything migrates here)
const THEME_STORAGE_KEY = 'aero-theme-settings-v2';

// DEPRECATED (migrate on read, delete after write)
const LEGACY_KEYS = [
  'heroui-theme-settings',
  'darkMode',
  'selectedTheme',
  'selectedFont',
  'aero-hr-background'
];
```

---

## 3. Refactored Core Architecture

### 3.1 ThemeContext (SINGLE SOURCE OF TRUTH)
```javascript
// packages/aero-ui/resources/js/Context/ThemeContext.jsx

import { createContext, useContext, useState, useLayoutEffect } from 'react';
import { applyThemeToDocument } from '@/theme/index';
import { getCardStyle, CARD_STYLES } from '@/theme/cardStyles';
import { migrateTheme, validateTheme, normalizeTheme } from '@/utils/safeTheme';

const ThemeContext = createContext();

// EXPORTED CONSTANTS (for ThemeSelector, drawers, etc.)
export const CARD_STYLE_OPTIONS = Object.keys(CARD_STYLES).map(key => ({
  key,
  ...CARD_STYLES[key].meta
}));

export const FONT_OPTIONS = [
  { key: 'inter', name: 'Inter', value: 'Inter, sans-serif' },
  { key: 'roboto', name: 'Roboto', value: 'Roboto, sans-serif' },
  { key: 'outfit', name: 'Outfit', value: 'Outfit, sans-serif' },
  { key: 'poppins', name: 'Poppins', value: 'Poppins, sans-serif' },
];

export const MODE_OPTIONS = ['light', 'dark', 'system'];

// DEFAULT THEME
const DEFAULT_THEME = {
  version: '2.0',
  mode: 'light',
  cardStyle: 'modern',
  typography: {
    fontFamily: 'Inter',
    fontSize: 'md'
  },
  background: {
    type: 'color',
    value: '#ffffff'
  }
};

// READ THEME (with migration + normalization)
const readStoredTheme = () => {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  
  try {
    // Try new key first
    const stored = localStorage.getItem('aero-theme-settings-v2');
    if (stored) {
      const parsed = JSON.parse(stored);
      return normalizeTheme(parsed);
    }
    
    // Migrate from legacy keys
    const migrated = migrateTheme();
    if (migrated) {
      saveTheme(migrated); // Persist migrated version
      return migrated;
    }
    
    return DEFAULT_THEME;
  } catch (error) {
    console.error('Theme read error:', error);
    return DEFAULT_THEME;
  }
};

// SAVE THEME (atomic write with validation)
const saveTheme = (theme) => {
  try {
    const validated = validateTheme(theme);
    localStorage.setItem('aero-theme-settings-v2', JSON.stringify(validated));
    
    // Clean up legacy keys
    ['heroui-theme-settings', 'darkMode', 'selectedTheme', 'selectedFont', 'aero-hr-background']
      .forEach(key => localStorage.removeItem(key));
      
  } catch (error) {
    console.error('Theme save error:', error);
  }
};

export const ThemeProvider = ({ children }) => {
  const [themeSettings, setThemeSettings] = useState(readStoredTheme);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Apply theme BEFORE paint (reduce flash)
  useLayoutEffect(() => {
    applyThemeToDocument(themeSettings);
    setTimeout(() => setIsHydrated(true), 50);
  }, []);
  
  // Sync on changes
  useLayoutEffect(() => {
    if (!isHydrated) return;
    saveTheme(themeSettings);
    applyThemeToDocument(themeSettings);
  }, [themeSettings, isHydrated]);
  
  // PUBLIC API
  const updateTheme = (updates) => {
    setThemeSettings(prev => {
      const next = normalizeTheme({ ...prev, ...updates });
      return next;
    });
  };
  
  const toggleMode = () => {
    setThemeSettings(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light'
    }));
  };
  
  const resetTheme = () => {
    setThemeSettings(DEFAULT_THEME);
  };
  
  // Derived state (always fresh)
  const currentCardStyle = getCardStyle(themeSettings.cardStyle);
  const colors = currentCardStyle.theme.colors;
  const layout = currentCardStyle.theme.layout;
  const cardClasses = currentCardStyle.classes;
  
  if (!isHydrated) {
    return <LoadingScreen />;
  }
  
  return (
    <ThemeContext.Provider value={{
      // Settings (mutable)
      themeSettings,
      
      // Derived state (read-only)
      mode: themeSettings.mode,
      cardStyle: themeSettings.cardStyle,
      colors,
      layout,
      cardClasses,
      
      // Actions
      updateTheme,
      toggleMode,
      resetTheme,
      
      // Metadata (for selectors)
      cardStyleOptions: CARD_STYLE_OPTIONS,
      fontOptions: FONT_OPTIONS,
      modeOptions: MODE_OPTIONS,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 3.2 safeTheme.js (VALIDATION & MIGRATION)
```javascript
// packages/aero-ui/resources/js/utils/safeTheme.js

import { CARD_STYLES } from '@/theme/cardStyles';

/**
 * Normalize theme to v2.0 shape
 */
export function normalizeTheme(theme) {
  const cardStyle = CARD_STYLES[theme.cardStyle] ? theme.cardStyle : 'modern';
  
  return {
    version: '2.0',
    mode: ['light', 'dark', 'system'].includes(theme.mode) ? theme.mode : 'light',
    cardStyle,
    typography: {
      fontFamily: theme.typography?.fontFamily || theme.layout?.fontFamily || 'Inter',
      fontSize: theme.typography?.fontSize || 'md'
    },
    background: {
      type: ['color', 'gradient'].includes(theme.background?.type) ? theme.background.type : 'color',
      value: theme.background?.color || theme.background?.value || '#ffffff'
    }
  };
}

/**
 * Validate theme (clamp values, enforce constraints)
 */
export function validateTheme(theme) {
  const normalized = normalizeTheme(theme);
  
  // Additional validation logic
  if (!normalized.background.value.match(/^(#|rgb|linear-gradient)/)) {
    normalized.background.value = '#ffffff';
  }
  
  return normalized;
}

/**
 * Migrate legacy theme data
 */
export function migrateTheme() {
  const legacy = {};
  
  // Read old heroui-theme-settings
  try {
    const old = localStorage.getItem('heroui-theme-settings');
    if (old) Object.assign(legacy, JSON.parse(old));
  } catch {}
  
  // Read old useThemeSync keys
  legacy.mode = localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light';
  legacy.cardStyle = localStorage.getItem('selectedTheme') || 'modern';
  legacy.typography = { fontFamily: localStorage.getItem('selectedFont') || 'Inter' };
  legacy.background = {
    type: 'color',
    value: localStorage.getItem('aero-hr-background') || '#ffffff'
  };
  
  return Object.keys(legacy).length > 0 ? normalizeTheme(legacy) : null;
}
```

---

## 4. Component Alignment

### 4.1 ThemedCard (RESPOND TO THEME)
```javascript
import { Card } from '@heroui/react';
import { useTheme } from '@/Context/ThemeContext';

export const ThemedCard = ({ children, className = '', ...props }) => {
  const { cardClasses, layout, colors } = useTheme();
  
  return (
    <Card
      className={`${cardClasses.base} ${className}`}
      style={{
        borderRadius: layout.borderRadius,
        borderWidth: layout.borderWidth,
        background: `var(--theme-content1, ${colors.content1})`,
        borderColor: `var(--theme-divider, ${colors.divider})`
      }}
      {...props}
    >
      {children}
    </Card>
  );
};
```

### 4.2 ThemeSelector (USE CONTEXT METADATA)
```javascript
import { useTheme } from '@/Context/ThemeContext';

export const ThemeSelector = () => {
  const { 
    cardStyle, 
    cardStyleOptions, 
    updateTheme 
  } = useTheme();
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {cardStyleOptions.map(option => (
        <Card
          key={option.key}
          isPressable
          isSelected={cardStyle === option.key}
          onPress={() => updateTheme({ cardStyle: option.key })}
        >
          <CardBody>
            <h3>{option.name}</h3>
            <p>{option.description}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};
```

### 4.3 Drawers (IDENTICAL UPDATE API)
```javascript
// Both ThemeSettingDrawer and SimplifiedThemeSettingDrawer use:
const { updateTheme, resetTheme, toggleMode } = useTheme();

// Update card style
updateTheme({ cardStyle: 'glass' });

// Update font
updateTheme({ typography: { fontFamily: 'Roboto' } });

// Reset
resetTheme();
```

---

## 5. Migration Strategy

### Phase 1: Add Backward Compatibility Layer (Non-Breaking)
- Create `migrateTheme()` in safeTheme.js
- ThemeContext reads both old + new keys
- Write to both keys temporarily

### Phase 2: Update All Components (Internal)
- Refactor ThemeContext with new shape
- Update ThemedCard to use cardClasses
- Fix ThemeSelector imports
- Align both drawers to same API

### Phase 3: Deprecation Warnings (1 release cycle)
- Console warnings when legacy keys detected
- Migration guide in docs

### Phase 4: Remove Legacy (Breaking)
- Delete old storage keys
- Remove useThemeSync.jsx (replaced by ThemeContext)
- Archive safeTheme legacy code

---

## 6. Testing Checklist

- [ ] Theme persists across page reloads
- [ ] Card styles apply instantly on change
- [ ] Dark mode toggle affects all components
- [ ] Font changes apply to all text
- [ ] Background changes apply to body
- [ ] Reset clears storage and restores defaults
- [ ] Legacy theme data migrates correctly
- [ ] No localStorage conflicts between systems
- [ ] Vendor builds match source behavior
- [ ] No flash of unstyled content (FOUC)

---

## 7. File Changes Required

### REFACTOR (Major Changes)
- `Context/ThemeContext.jsx` - Single source of truth
- `utils/safeTheme.js` - Add normalization + migration
- `Components/UI/ThemedCard.jsx` - Use cardClasses from context
- `Components/UI/ThemeSelector.jsx` - Fix imports, use context metadata
- `theme/cardStyles.js` - Export CARD_STYLES constant
- `theme/index.js` - Export applyThemeToDocument + helpers

### ALIGN (Minor Changes)
- `Components/ThemeSettingDrawer.jsx` - Use unified API
- `Components/SimplifiedThemeSettingDrawer.jsx` - Use unified API

### DEPRECATE (Remove)
- `Hooks/useThemeSync.jsx` - Functionality moved to ThemeContext

### NEW
- `docs/THEME_MIGRATION_GUIDE.md` - User-facing migration docs

---

## 8. Success Criteria

✅ **Single Storage Key**: All theme data in `aero-theme-settings-v2`  
✅ **No Conflicting Systems**: useThemeSync removed, ThemeContext is only authority  
✅ **Instant Updates**: Theme changes reflect immediately across all components  
✅ **Card Classes Applied**: ThemedCard uses Tailwind classes from cardStyles  
✅ **Consistent APIs**: Both drawers, selector, and cards use same update pattern  
✅ **Vendor Parity**: Host and vendor builds behave identically  
✅ **Migration Safe**: Legacy themes auto-upgrade without data loss  

---

## Next Steps

1. **Review this plan** - Confirm architectural direction
2. **Approve breaking changes** - Acknowledge migration impact
3. **Execute refactor** - Implement in phases
4. **Test extensively** - All scenarios validated
5. **Deploy with docs** - Migration guide for users
