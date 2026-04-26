/**
 * aeos365 Theme Engine — v3 (Foundation Pass)
 *
 * Locked to two modes per the aeos365 design system:
 *   - "aeos"        (dark, canonical)
 *   - "aeos-light"  (light)
 *   - "system"      (resolves via prefers-color-scheme)
 *
 * @see aeos365-design-system/project/colors_and_type.css
 * @see docs/superpowers/specs/2026-04-25-aeos365-design-system-foundation-design.md
 */

/**
 * Valid mode values for the theme system.
 * Legacy modes ('light', 'dim', 'dark', 'midnight') are migrated on first
 * load and no longer accepted as inputs.
 */
export const VALID_MODES = ['aeos', 'aeos-light', 'system'];

/**
 * Resolve "system" against prefers-color-scheme.
 * Returns the canonical mode the document should render as.
 */
export const resolveEffectiveMode = (mode) => {
  if (mode === 'aeos' || mode === 'aeos-light') return mode;
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
      return 'aeos';
    }
    return 'aeos-light';
  }
  return 'aeos';
};

/**
 * Valid density values — affects spacing/font tokens.
 */
export const VALID_DENSITIES = ['compact', 'cozy', 'comfortable'];

/**
 * Valid intensity values — affects accent intensity (no new colors).
 *   - "brand"         (default — canonical aeos cyan/amber/indigo)
 *   - "soft"          (lower-saturation pastel reading mode)
 *   - "high-contrast" (brighter accents + denser borders for accessibility)
 */
export const VALID_INTENSITIES = ['brand', 'soft', 'high-contrast'];

/**
 * Valid contrast values — accessibility add-on (independent of intensity).
 */
export const VALID_CONTRASTS = ['standard', 'high'];

/**
 * Apply theme settings to <html>:
 *   - toggle "aeos" / "aeos-light" / "dark" classes
 *   - set data-aeos-density / data-aeos-intensity / data-aeos-contrast attrs
 *   - set data-reduce-motion attr
 */
export const applyThemeToDocument = (theme = {}) => {
  if (typeof window === 'undefined' || !window.document) return;

  const html = document.documentElement;
  const body = document.body;

  const effective = resolveEffectiveMode(theme.mode);
  const isDark = effective === 'aeos';

  // Always namespace under "aeos"
  html.classList.add('aeos');
  body?.classList.add('aeos');

  if (isDark) {
    html.classList.remove('aeos-light');
    body?.classList.remove('aeos-light');
    html.classList.add('dark');
  } else {
    html.classList.add('aeos-light');
    body?.classList.add('aeos-light');
    html.classList.remove('dark');
  }

  // Density variant
  if (theme.density && VALID_DENSITIES.includes(theme.density) && theme.density !== 'comfortable') {
    html.setAttribute('data-aeos-density', theme.density);
  } else {
    html.removeAttribute('data-aeos-density');
  }

  // Intensity variant
  if (theme.intensity && VALID_INTENSITIES.includes(theme.intensity) && theme.intensity !== 'brand') {
    html.setAttribute('data-aeos-intensity', theme.intensity);
  } else {
    html.removeAttribute('data-aeos-intensity');
  }

  // Contrast variant
  if (theme.contrast && VALID_CONTRASTS.includes(theme.contrast) && theme.contrast !== 'standard') {
    html.setAttribute('data-aeos-contrast', theme.contrast);
  } else {
    html.removeAttribute('data-aeos-contrast');
  }

  // Reduce motion accessibility flag
  if (theme.reduceMotion) {
    html.setAttribute('data-reduce-motion', 'true');
  } else {
    html.removeAttribute('data-reduce-motion');
  }

  // Clear any legacy attribute that older CSS branched on
  html.removeAttribute('data-dark-variant');
};

/**
 * Compatibility helper for legacy code that read the document's primary color
 * out of `--theme-primary`. Returns the aeos cyan token value.
 */
export const getThemePrimaryColor = () => {
  if (typeof window === 'undefined' || !window.document) return '#00E5FF';
  const v = getComputedStyle(document.documentElement).getPropertyValue('--aeos-cyan')?.trim();
  return v || '#00E5FF';
};

/**
 * Stub — older code expected a precomputed card style object.
 * The aeos system delivers card styling via CSS classes (.aeos-card,
 * .aeos-card-elevated, .aeos-glass, .aeos-bento), so we just return a
 * neutral shape with the canonical token references.
 */
export const getStandardCardStyle = () => ({
  borderRadius: '12px',
  borderWidth: '1px',
  fontFamily: 'DM Sans',
});

export default {
  applyThemeToDocument,
  getThemePrimaryColor,
  getStandardCardStyle,
  VALID_MODES,
  resolveEffectiveMode,
};
