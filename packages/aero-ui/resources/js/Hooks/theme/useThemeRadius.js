import { useMemo } from 'react';

/**
 * Returns a HeroUI-compatible radius token derived from the CSS variable
 * `--borderRadius`.
 *
 * This centralizes the (previously duplicated) logic used across pages/tables.
 */
export const useThemeRadius = () => {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return 'lg';
    }

    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    const radiusValue = parseInt(borderRadius, 10);

    if (Number.isNaN(radiusValue)) {
      return 'lg';
    }

    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 16) return 'lg';
    return 'full';
  }, []);
};

export default useThemeRadius;
