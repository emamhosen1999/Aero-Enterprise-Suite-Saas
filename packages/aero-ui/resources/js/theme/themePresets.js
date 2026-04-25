/**
 * DEPRECATED — aeos365 design system v3 (2026-04-25)
 *
 * Theme presets were removed when aeos365 became the single, locked brand.
 * The system has exactly one theme with two modes (`aeos` / `aeos-light`).
 *
 * This module is kept ONLY so legacy imports don't crash. All exports
 * resolve to aeos defaults.
 *
 * @see docs/superpowers/specs/2026-04-25-aeos365-design-system-foundation-design.md
 */

const AEOS_PRESET = Object.freeze({
  key: 'aeos',
  name: 'aeos365',
  category: 'aeos365',
  description: 'aeos365 design system — locked',
  preview: Object.freeze({
    primary: '#00E5FF',
    background: '#03040A',
    card: 'aeos',
  }),
  config: Object.freeze({
    mode: 'aeos',
    cardStyle: 'aeos',
    typography: { fontFamily: 'DM Sans', fontSize: 'md' },
    background: { type: 'color', value: 'transparent' },
  }),
});

export const THEME_PRESETS = Object.freeze({ aeos: AEOS_PRESET, default: AEOS_PRESET });

export const getThemePresetOptions = () => [
  { key: 'aeos', name: 'aeos365', value: 'aeos', description: 'aeos365 design system — locked' },
];

export const applyThemePreset = (/* presetKey, updateTheme */) => AEOS_PRESET;

export default { THEME_PRESETS, getThemePresetOptions, applyThemePreset };
