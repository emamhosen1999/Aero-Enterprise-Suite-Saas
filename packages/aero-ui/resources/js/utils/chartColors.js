/**
 * Centralized chart color palette derived from CSS theme variables.
 * All recharts components MUST use these instead of hardcoded hex values.
 */

/**
 * Get a single theme color from CSS variable with fallback
 */
export const getChartColor = (variable, fallback) => {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)?.trim() || fallback;
};

/**
 * Standard chart color palette — use for multi-series charts and pie charts
 * References CSS variables so they update with theme changes
 */
export const CHART_COLORS = [
  'var(--theme-primary, #006FEE)',
  'var(--theme-success, #17C964)',
  'var(--theme-warning, #F5A524)',
  'var(--theme-danger, #F31260)',
  'var(--theme-secondary, #9353D3)',
  'var(--chart-color-6, #0EA5E9)',
  'var(--chart-color-7, #EC4899)',
  'var(--chart-color-8, #F97316)',
];

/**
 * Semantic chart colors — use for specific data meanings
 */
export const CHART_SEMANTIC = {
  primary: 'var(--theme-primary, #006FEE)',
  success: 'var(--theme-success, #17C964)',
  warning: 'var(--theme-warning, #F5A524)',
  danger: 'var(--theme-danger, #F31260)',
  info: 'var(--theme-secondary, #9353D3)',
  muted: 'var(--theme-default-400, #A1A1AA)',
};

/**
 * Chart axis/grid colors — derived from theme divider
 */
export const CHART_AXIS = {
  grid: 'var(--theme-divider, #E4E4E7)',
  tick: 'var(--theme-default-500, #71717A)',
  label: 'var(--theme-foreground, #11181C)',
};

/**
 * Get computed hex values (needed for canvas/gradient operations where CSS vars don't work)
 */
export const getComputedChartColors = () => {
  if (typeof window === 'undefined') {
    return ['#006FEE', '#17C964', '#F5A524', '#F31260', '#9353D3', '#0EA5E9', '#EC4899', '#F97316'];
  }
  const root = getComputedStyle(document.documentElement);
  return [
    root.getPropertyValue('--theme-primary')?.trim() || '#006FEE',
    root.getPropertyValue('--theme-success')?.trim() || '#17C964',
    root.getPropertyValue('--theme-warning')?.trim() || '#F5A524',
    root.getPropertyValue('--theme-danger')?.trim() || '#F31260',
    root.getPropertyValue('--theme-secondary')?.trim() || '#9353D3',
    root.getPropertyValue('--chart-color-6')?.trim() || '#0EA5E9',
    root.getPropertyValue('--chart-color-7')?.trim() || '#EC4899',
    root.getPropertyValue('--chart-color-8')?.trim() || '#F97316',
  ];
};
