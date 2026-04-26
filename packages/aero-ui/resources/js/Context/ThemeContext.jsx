import React, { createContext, useContext, useState, useLayoutEffect, useMemo, useCallback } from 'react';
import {
  applyThemeToDocument,
  resolveEffectiveMode,
  VALID_MODES,
  VALID_DENSITIES,
  VALID_INTENSITIES,
  VALID_CONTRASTS,
} from '../theme/index';

/**
 * aeos365 Theme Provider — v3 (Foundation Pass)
 *
 * The provider used to manage tenant-driven color presets, card-style
 * variants, font choices, density, and a four-step dark scale (light / dim /
 * dark / midnight). The aeos365 design system locks all of those decisions:
 * one brand, one font triad, one dark-canonical palette. So the API surface
 * here is dramatically simpler.
 *
 * Public state:
 *   { mode, isDark, reduceMotion }
 * Public actions:
 *   { setMode, toggleMode, setReduceMotion, resetTheme }
 *
 * Legacy fields (themeSettings, cardStyle, typography, background, colors,
 * layout, cardClasses, *Options, applyPreset, getThemeRadius, getStatusColor,
 * STATUS_COLORS, CARD_STYLES) are kept as no-op shims that return aeos-on-brand
 * defaults so pre-migration consumers keep rendering. Each call site should
 * eventually drop these in favour of `var(--aeos-*)` tokens.
 *
 * @see docs/superpowers/specs/2026-04-25-aeos365-design-system-foundation-design.md
 */

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ──────────────────────────────────────────────────────────────────────────
// Storage
// ──────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'aeos:theme';
const LEGACY_KEYS = [
  'aero-theme-v2',
  'heroui-theme-settings',
  'aero-theme',
  'theme-settings',
];

const DEFAULT_STATE = Object.freeze({
  mode: 'aeos',                // 'aeos' | 'aeos-light' | 'system'
  density: 'comfortable',      // 'comfortable' | 'cozy' | 'compact'
  intensity: 'brand',          // 'brand' | 'soft' | 'high-contrast'
  contrast: 'standard',        // 'standard' | 'high'
  reduceMotion: false,
});

const migrateLegacyMode = (legacyMode) => {
  switch (legacyMode) {
    case 'light':                 return 'aeos-light';
    case 'dim':
    case 'dark':
    case 'midnight':              return 'aeos';
    case 'system':                return 'system';
    case 'aeos':
    case 'aeos-light':            return legacyMode;
    default:                      return 'aeos';
  }
};

const readStored = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { ...DEFAULT_STATE };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        mode:         VALID_MODES.includes(parsed?.mode) ? parsed.mode : 'aeos',
        density:      VALID_DENSITIES.includes(parsed?.density) ? parsed.density : 'comfortable',
        intensity:    VALID_INTENSITIES.includes(parsed?.intensity) ? parsed.intensity : 'brand',
        contrast:     VALID_CONTRASTS.includes(parsed?.contrast) ? parsed.contrast : 'standard',
        reduceMotion: !!parsed?.reduceMotion,
      };
    }

    // One-shot migration from legacy storage keys
    for (const key of LEGACY_KEYS) {
      const legacy = localStorage.getItem(key);
      if (!legacy) continue;
      try {
        const parsed = JSON.parse(legacy);
        const next = {
          mode: migrateLegacyMode(parsed?.mode || parsed?.theme || parsed),
          reduceMotion: !!parsed?.reduceMotion,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        // Best-effort cleanup of legacy keys
        LEGACY_KEYS.forEach((k) => {
          try { localStorage.removeItem(k); } catch { /* noop */ }
        });
        return next;
      } catch { /* try next key */ }
    }
  } catch (err) {
    console.warn('[ThemeProvider] storage read failed:', err);
  }
  return { ...DEFAULT_STATE };
};

const persist = (state) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[ThemeProvider] storage write failed:', err);
  }
};

// ──────────────────────────────────────────────────────────────────────────
// Deprecated stub helpers — log once
// ──────────────────────────────────────────────────────────────────────────

const _warned = new Set();
const _warnOnce = (name) => {
  if (_warned.has(name)) return;
  _warned.add(name);
  if (typeof console !== 'undefined') {
    // eslint-disable-next-line no-console
    console.warn(
      `[aeos] ${name} is deprecated. The aeos365 design system locks brand colors, fonts, and card styles. ` +
      `Use var(--aeos-*) tokens or .aeos-* helper classes instead.`
    );
  }
};

// ──────────────────────────────────────────────────────────────────────────
// Static option lists (legacy compat — empty / single-option)
// ──────────────────────────────────────────────────────────────────────────

export const MODE_OPTIONS = [
  { key: 'aeos',       name: 'Dark (default)', value: 'aeos' },
  { key: 'aeos-light', name: 'Light',          value: 'aeos-light' },
  { key: 'system',     name: 'System',         value: 'system' },
];

// Legacy stubs — preserved so import-by-name doesn't crash
export const CARD_STYLE_OPTIONS       = [{ key: 'aeos', name: 'aeos365', value: 'aeos' }];
export const THEME_PRESET_OPTIONS     = [{ key: 'aeos', name: 'aeos365', value: 'aeos' }];
export const BACKGROUND_PRESET_OPTIONS = [{ key: 'obsidian', name: 'Obsidian', value: 'obsidian' }];
export const FONT_OPTIONS             = [{ key: 'dm-sans', name: 'DM Sans', value: 'DM Sans' }];
export const FONT_SIZE_OPTIONS        = [{ key: 'md', name: 'Medium', value: 'md' }];

// Status color stubs (return aeos tokens)
export const STATUS_COLORS = Object.freeze({
  success: 'var(--aeos-success)',
  warning: 'var(--aeos-warning)',
  danger:  'var(--aeos-danger)',
  info:    'var(--aeos-info)',
});

export const getStatusColor = (name) => STATUS_COLORS[name] || STATUS_COLORS.info;
export const getThemeRadius = () => '12px';

// ──────────────────────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────────────────────

export const ThemeProvider = ({ children }) => {
  const [state, setState] = useState(readStored);
  const [isHydrated, setIsHydrated] = useState(false);

  // Apply BEFORE paint to reduce flash
  useLayoutEffect(() => {
    applyThemeToDocument(state);
    const t = setTimeout(() => setIsHydrated(true), 30);
    return () => clearTimeout(t);
  }, []);

  useLayoutEffect(() => {
    if (!isHydrated) return;
    persist(state);
    applyThemeToDocument(state);
  }, [state, isHydrated]);

  // Re-resolve "system" when OS preference flips
  useLayoutEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    if (state.mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemeToDocument(state);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [state]);

  const setMode = useCallback((mode) => {
    if (!VALID_MODES.includes(mode)) return;
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const toggleMode = useCallback(() => {
    setState((prev) => {
      // Cycle: aeos → aeos-light → system → aeos
      const next = prev.mode === 'aeos' ? 'aeos-light' :
                   prev.mode === 'aeos-light' ? 'system' : 'aeos';
      return { ...prev, mode: next };
    });
  }, []);

  const setReduceMotion = useCallback((value) => {
    setState((prev) => ({ ...prev, reduceMotion: !!value }));
  }, []);

  const setDensity = useCallback((density) => {
    if (!VALID_DENSITIES.includes(density)) return;
    setState((prev) => ({ ...prev, density }));
  }, []);

  const setIntensity = useCallback((intensity) => {
    if (!VALID_INTENSITIES.includes(intensity)) return;
    setState((prev) => ({ ...prev, intensity }));
  }, []);

  const setContrast = useCallback((contrast) => {
    if (!VALID_CONTRASTS.includes(contrast)) return;
    setState((prev) => ({ ...prev, contrast }));
  }, []);

  const resetTheme = useCallback(() => {
    setState({ ...DEFAULT_STATE });
  }, []);

  // ── Legacy stub: updateTheme accepts the old shape and routes to setMode ──
  const updateTheme = useCallback((updates) => {
    if (!updates || typeof updates !== 'object') return;
    _warnOnce('updateTheme(...)');
    setState((prev) => {
      let nextMode = prev.mode;
      if (typeof updates.mode === 'string') {
        nextMode = VALID_MODES.includes(updates.mode)
          ? updates.mode
          : migrateLegacyMode(updates.mode);
      }
      return {
        ...prev,
        mode: nextMode,
        reduceMotion: typeof updates.reduceMotion === 'boolean'
          ? updates.reduceMotion
          : prev.reduceMotion,
      };
    });
  }, []);

  const applyPreset = useCallback((/* presetKey */) => {
    _warnOnce('applyPreset(...)');
    return null;
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────
  const effectiveMode = resolveEffectiveMode(state.mode);
  const isDark = effectiveMode === 'aeos';

  // Legacy themeSettings shape — components read .typography, .background,
  // .cardStyle, .primaryColor etc. We supply aeos-on-brand defaults so they
  // don't crash. Memoised so reference identity is stable per render.
  const themeSettings = useMemo(() => ({
    mode: state.mode,
    reduceMotion: state.reduceMotion,
    density: state.density,
    intensity: state.intensity,
    contrast: state.contrast,
    cardStyle: 'aeos',
    primaryColor: '#00E5FF',
    defaultRadius: 'md',
    typography: { fontFamily: 'DM Sans', fontSize: 'md' },
    background: { type: 'color', value: 'transparent' },
  }), [state.mode, state.reduceMotion, state.density, state.intensity, state.contrast]);

  // Legacy stubs returning aeos colors / layout for components that read them
  const colors = useMemo(() => ({
    primary:    isDark ? '#00E5FF' : '#00A3B8',
    secondary:  '#6366F1',
    success:    '#22C55E',
    warning:    '#FFB347',
    danger:     '#FF6B6B',
    info:       '#00E5FF',
    background: isDark ? '#03040A' : '#F8FAFC',
    foreground: isDark ? '#E8EDF5' : '#0F172A',
    divider:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)',
    content1:   isDark ? '#070B14' : '#FFFFFF',
    content2:   isDark ? '#0D1120' : '#F1F5F9',
    content3:   isDark ? '#131829' : '#E2E8F0',
    content4:   isDark ? '#1A1F33' : '#CBD5E1',
  }), [isDark]);

  const layout = useMemo(() => ({
    borderRadius: '12px',
    borderWidth:  '1px',
    fontFamily:   'DM Sans',
  }), []);

  const cardClasses = useMemo(() => ({
    base:   'aeos-card-elevated',
    header: 'aero-card-header',
    body:   '',
    footer: '',
  }), []);

  const value = useMemo(() => ({
    // ── Canonical aeos surface ──
    mode: state.mode,
    effectiveMode,
    isDark,
    isDarkMode: isDark,           // legacy alias used by useBranding
    density: state.density,
    intensity: state.intensity,
    contrast: state.contrast,
    reduceMotion: state.reduceMotion,
    isHydrated,
    setMode,
    toggleMode,
    setDensity,
    setIntensity,
    setContrast,
    setReduceMotion,
    resetTheme,

    // ── Legacy-compat surface (deprecated, kept on-brand) ──
    themeSettings,
    theme: themeSettings,
    cardStyle: 'aeos',
    typography: themeSettings.typography,
    background: themeSettings.background,
    colors,
    layout,
    cardClasses,
    contrastWarnings: [],
    updateTheme,
    applyPreset,
    getThemeRadius: () => '12px',
    getStatusColor,
    cardStyleOptions:       CARD_STYLE_OPTIONS,
    themePresetOptions:     THEME_PRESET_OPTIONS,
    backgroundPresetOptions: BACKGROUND_PRESET_OPTIONS,
    fontOptions:            FONT_OPTIONS,
    modeOptions:            MODE_OPTIONS,
    fontSizeOptions:        FONT_SIZE_OPTIONS,
    CARD_STYLES: { aeos: { name: 'aeos365' } },
    STATUS_COLORS,
  }), [
    state.mode, state.reduceMotion, state.density, state.intensity, state.contrast,
    effectiveMode, isDark, isHydrated,
    setMode, toggleMode, setReduceMotion, setDensity, setIntensity, setContrast, resetTheme,
    themeSettings, colors, layout, cardClasses,
    updateTheme, applyPreset,
  ]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
