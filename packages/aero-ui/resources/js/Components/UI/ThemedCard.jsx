import { Card, CardHeader, CardBody, CardFooter } from '@heroui/react';

/**
 * Get themed card style object using CSS variables
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
 * Uses CSS variables for dynamic theming support
 */
export const ThemedCard = ({ children, className = '', ...props }) => {
    return (
        <Card 
            className={`transition-all duration-200 ${className}`}
            style={getThemedCardStyle()}
            {...props}
        >
            {children}
        </Card>
    );
};

/**
 * ThemedCardHeader - Card header with bottom border
 */
export const ThemedCardHeader = ({ children, className = '', ...props }) => {
    return (
        <CardHeader 
            className={`border-b border-divider p-4 ${className}`}
            style={{ borderBottom: `1px solid var(--theme-divider, #E4E4E7)` }}
            {...props}
        >
            {children}
        </CardHeader>
    );
};

/**
 * ThemedCardBody - Card body with padding
 */
export const ThemedCardBody = ({ children, className = '', ...props }) => {
    return (
        <CardBody 
            className={`p-4 ${className}`}
            {...props}
        >
            {children}
        </CardBody>
    );
};

/**
 * ThemedCardFooter - Card footer with top border
 */
export const ThemedCardFooter = ({ children, className = '', ...props }) => {
    return (
        <CardFooter 
            className={`border-t border-divider p-4 ${className}`}
            style={{ borderTop: `1px solid var(--theme-divider, #E4E4E7)` }}
            {...props}
        >
            {children}
        </CardFooter>
    );
};

export default ThemedCard;
