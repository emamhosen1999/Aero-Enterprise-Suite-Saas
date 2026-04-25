/**
 * DEPRECATED — aeos365 design system v3 (2026-04-25)
 *
 * Background presets (patterns, images, gradients, custom colors) were removed
 * when aeos365 locked the visual language. The single canonical background is
 * `--aeos-obsidian` with optional `.aeos-grid-bg` texture and `--aeos-grad-mesh`
 * radial mesh on hero/CTA backdrops.
 *
 * This module is kept ONLY so legacy imports don't crash.
 *
 * @see docs/superpowers/specs/2026-04-25-aeos365-design-system-foundation-design.md
 */

export const BACKGROUND_TYPES = Object.freeze({
  color:    'color',
  gradient: 'gradient',
  pattern:  'pattern',
  image:    'image',
  texture:  'texture',
});

const AEOS_BG = Object.freeze({
  type: BACKGROUND_TYPES.color,
  name: 'Obsidian',
  category: 'aeos365',
  value: 'var(--aeos-obsidian)',
  description: 'aeos365 page surface — locked',
});

export const BACKGROUND_PRESETS = Object.freeze({
  obsidian: AEOS_BG,
  default:  AEOS_BG,
});

/**
 * No-op — aeos applies its background via the `.aeos` namespace + tokens.
 * Older callers passed in `{type, value}`; we ignore and rely on tokens.
 */
export const applyBackground = (/* background, opacity */) => undefined;

export default { BACKGROUND_TYPES, BACKGROUND_PRESETS, applyBackground };
