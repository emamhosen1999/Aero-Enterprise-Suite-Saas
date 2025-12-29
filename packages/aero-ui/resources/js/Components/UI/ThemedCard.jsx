import { Card, CardHeader, CardBody, CardFooter } from '@heroui/react';
import { useTheme } from '../../Context/ThemeContext';

/**
 * Get themed card style object using CSS variables (fallback)
 * @returns {Object} Style object for Card component
 */
export const getThemedCardStyle = () => ({
    background: `linear-gradient(135deg, 
        var(--theme-content1, #FAFAFA) 20%, 
        var(--theme-content2, #F4F4F5) 10%, 
        var(--theme-content3, #F1F3F4) 20%)`,
    borderColor: `var(--theme-divider, #E4E4E7)`,
    borderWidth: `var(--borderWidth, 2px)`,
    borderStyle: 'solid',
    borderRadius: `var(--borderRadius, 12px)`,
    fontFamily: `var(--fontFamily, "Inter")`,
});

/**
 * ThemedCard - A Card component with consistent theme styling
 * Now integrates Tailwind classes from cardStyles + CSS variables
 */
export const ThemedCard = ({ children, className = '', style = {}, ...props }) => {
    const { cardClasses } = useTheme();
    
    return (
        <Card 
            className={`transition-all duration-200 ${cardClasses?.base || ''} ${className}`}
            style={{ ...getThemedCardStyle(), ...style }}
            {...props}
        >
            {children}
        </Card>
    );
};

/**
 * ThemedCardHeader - Card header with bottom border
 * Applies Tailwind classes from cardStyles
 */
export const ThemedCardHeader = ({ children, className = '', style = {}, ...props }) => {
    const { cardClasses } = useTheme();
    
    return (
        <CardHeader 
            className={`border-b border-divider p-4 ${cardClasses?.header || ''} ${className}`}
            style={{ borderBottom: `1px solid var(--theme-divider, #E4E4E7)`, ...style }}
            {...props}
        >
            {children}
        </CardHeader>
    );
};

/**
 * ThemedCardBody - Card body with padding
 * Applies Tailwind classes from cardStyles
 */
export const ThemedCardBody = ({ children, className = '', style = {}, ...props }) => {
    const { cardClasses } = useTheme();
    
    return (
        <CardBody 
            className={`p-4 ${cardClasses?.body || ''} ${className}`}
            style={style}
            {...props}
        >
            {children}
        </CardBody>
    );
};

/**
 * ThemedCardFooter - Card footer with top border
 * Applies Tailwind classes from cardStyles
 */
export const ThemedCardFooter = ({ children, className = '', style = {}, ...props }) => {
    const { cardClasses } = useTheme();
    
    return (
        <CardFooter 
            className={`border-t border-divider p-4 ${cardClasses?.footer || ''} ${className}`}
            style={{ borderTop: `1px solid var(--theme-divider, #E4E4E7)`, ...style }}
            {...props}
        >
            {children}
        </CardFooter>
    );
};

export default ThemedCard;
