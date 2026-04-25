/**
 * DEPRECATED — aeos365 design system v3 (2026-04-25)
 *
 * Card-style variants and dynamic theme color palettes were removed when the
 * aeos365 design system became the single source of truth. The system now
 * exposes exactly two card surfaces via CSS classes:
 *   - `.aeos-card`           (3% white wash, hairline border)
 *   - `.aeos-card-elevated`  (graphite + cyan-tint border + warm shadow)
 * plus `.aeos-glass`, `.aeos-bento`, `.aeos-cta-glass` for higher registers.
 *
 * This module is kept ONLY so legacy imports (`getCardStyle`, `CARD_STYLES`,
 * `validateThemeContrast`) don't crash. Every export resolves to aeos defaults.
 *
 * @see aeos365-design-system/project/colors_and_type.css
 * @see docs/superpowers/specs/2026-04-25-aeos365-design-system-foundation-design.md
 */

const AEOS_CARD = Object.freeze({
  name: 'aeos365',
  description: 'aeos365 design system — locked',
  classes: Object.freeze({
    base:   'aeos-card-elevated',
    header: 'aero-card-header',
    body:   '',
    footer: '',
  }),
  theme: Object.freeze({
    colors: Object.freeze({
      primary:    { DEFAULT: '#00E5FF', foreground: '#03040A' },
      secondary:  { DEFAULT: '#6366F1', foreground: '#FFFFFF' },
      success:    { DEFAULT: '#22C55E', foreground: '#03040A' },
      warning:    { DEFAULT: '#FFB347', foreground: '#03040A' },
      danger:     { DEFAULT: '#FF6B6B', foreground: '#FFFFFF' },
      background: '#03040A',
      foreground: '#E8EDF5',
      divider:    'rgba(255,255,255,0.06)',
      content1:   '#070B14',
      content2:   '#0D1120',
      content3:   '#131829',
      content4:   '#1A1F33',
    }),
    layout: Object.freeze({
      borderRadius: '12px',
      borderWidth:  '1px',
      fontFamily:   'DM Sans',
    }),
  }),
});

export const CARD_STYLES = Object.freeze({
  aeos:    AEOS_CARD,
  modern:  AEOS_CARD,
  default: AEOS_CARD,
  glass:   AEOS_CARD,
  neo:     AEOS_CARD,
  soft:    AEOS_CARD,
  corporate: AEOS_CARD,
  minimal: AEOS_CARD,
  elevated: AEOS_CARD,
  bordered: AEOS_CARD,
  flat:    AEOS_CARD,
  premium: AEOS_CARD,
});

export const getCardStyle = (/* name */) => AEOS_CARD;

export const getCardStyleOptions = () => [
  { key: 'aeos', name: 'aeos365', value: 'aeos', description: 'aeos365 design system — locked' },
];

/** Always returns no warnings — aeos palette is pre-validated. */
export const validateThemeContrast = () => [];

export default { CARD_STYLES, getCardStyle, getCardStyleOptions, validateThemeContrast };
