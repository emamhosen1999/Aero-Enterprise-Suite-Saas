/**
 * aeos365 design-system component library — single barrel export.
 *
 *   import { AeosCard, AeosButton, AeosBadge, AeosKpi, ... } from '@/Components/aeos';
 *
 * The library is the canonical surface for building feature pages. Pages
 * should compose from these primitives only — NO inline colors, NO raw HTML
 * with hand-rolled token references. Style logic is fully encapsulated; if
 * you need a new variant, extend the relevant component, don't bypass it.
 *
 * @see aeos365-design-system/project/
 * @see docs/superpowers/specs/2026-04-25-aeos365-design-system-foundation-design.md
 */

export { default as AeosCard } from './AeosCard';
export { default as AeosButton } from './AeosButton';
export { default as AeosBadge } from './AeosBadge';
export { default as AeosIconTile } from './AeosIconTile';
export { default as AeosKpi } from './AeosKpi';
export { default as AeosKpiRow } from './AeosKpiRow';
export { default as AeosPanel } from './AeosPanel';
export { default as AeosFeedRow } from './AeosFeedRow';
export { default as AeosPageHeader } from './AeosPageHeader';
export { default as AeosDivider } from './AeosDivider';

export {
  AeosKicker,
  AeosLabelMono,
  AeosDisplayHero,
  AeosDisplaySection,
  AeosH3,
  AeosStatNumber,
  AeosMonoNum,
  AeosTextGradient,
} from './AeosTypography';
