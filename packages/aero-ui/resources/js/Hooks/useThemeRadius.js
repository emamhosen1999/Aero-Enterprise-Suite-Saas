import { useMemo } from 'react';

/**
 * Valid HeroUI radius values
 * @typedef {'none' | 'sm' | 'md' | 'lg' | 'full'} RadiusValue
 */

/**
 * Maps CSS border-radius pixel values to HeroUI radius prop values
 * @param {number} radiusValue - The pixel value of border-radius
 * @returns {RadiusValue} - The corresponding HeroUI radius value
 */
const mapRadiusToHeroUI = (radiusValue) => {
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 16) return 'lg';
    return 'full';
};

/**
 * Gets the current theme border-radius value from CSS custom properties
 * @returns {RadiusValue} - The HeroUI radius value based on theme settings
 */
export const getThemeRadius = () => {
    if (typeof window === 'undefined') return 'lg';
    
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    
    const radiusValue = parseInt(borderRadius);
    return mapRadiusToHeroUI(radiusValue);
};

/**
 * Hook to get the current theme border-radius as a HeroUI radius prop value.
 * Extracts the --borderRadius CSS custom property and maps it to HeroUI values.
 * 
 * @example
 * const radius = useThemeRadius();
 * <Button radius={radius}>Click me</Button>
 * 
 * @returns {RadiusValue} - The HeroUI radius value ('none', 'sm', 'md', 'lg', 'full')
 */
export const useThemeRadius = () => {
    // Memoize to avoid recalculating on every render
    // Note: This won't automatically update if theme changes - for that, 
    // consider using useEffect with a MutationObserver on CSS custom properties
    const radius = useMemo(() => getThemeRadius(), []);
    
    return radius;
};

export default useThemeRadius;
