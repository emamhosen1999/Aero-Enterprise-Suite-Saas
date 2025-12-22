/**
 * useCardStyle Hook
 * 
 * Custom React hook for applying card styles to HeroUI Card components.
 * Automatically applies the selected card style classes from ThemeContext.
 * 
 * Usage:
 * ```jsx
 * import { Card, CardHeader, CardBody } from '@heroui/react';
 * import { useCardStyle } from '@/hooks/useCardStyle';
 * 
 * function MyComponent() {
 *   const cardClasses = useCardStyle();
 *   
 *   return (
 *     <Card className={cardClasses.base}>
 *       <CardHeader className={cardClasses.header}>
 *         Title
 *       </CardHeader>
 *       <CardBody className={cardClasses.body}>
 *         Content
 *       </CardBody>
 *     </Card>
 *   );
 * }
 * ```
 */

import { useMemo } from 'react';
import { useTheme } from '@/Context/ThemeContext';
import { getCardStyle } from '@/theme/cardStyles';

/**
 * Get card style classes based on current theme settings
 * @returns {Object} Card style classes { base, header, body, footer }
 */
export const useCardStyle = () => {
  const { themeSettings } = useTheme();
  
  const cardClasses = useMemo(() => {
    const styleName = themeSettings?.cardStyle || 'modern';
    const style = getCardStyle(styleName);
    
    return {
      base: style.classes.base,
      header: style.classes.header,
      body: style.classes.body,
      footer: style.classes.footer,
    };
  }, [themeSettings?.cardStyle]);
  
  return cardClasses;
};

/**
 * Get current card style name
 * @returns {string} Current card style name
 */
export const useCardStyleName = () => {
  const { themeSettings } = useTheme();
  return themeSettings?.cardStyle || 'modern';
};

/**
 * Get card style configuration including theme colors and layout
 * @returns {Object} Complete card style configuration
 */
export const useCardStyleConfig = () => {
  const { themeSettings } = useTheme();
  
  const config = useMemo(() => {
    const styleName = themeSettings?.cardStyle || 'modern';
    return getCardStyle(styleName);
  }, [themeSettings?.cardStyle]);
  
  return config;
};

export default useCardStyle;
