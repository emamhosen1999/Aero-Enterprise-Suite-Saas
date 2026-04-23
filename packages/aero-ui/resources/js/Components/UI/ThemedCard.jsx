import React from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { getStandardCardStyle, getStandardCardHeaderStyle } from '../../utils/theme/themeUtils';

/**
 * Get themed card style - USE getStandardCardStyle() instead
 * @deprecated - Use getStandardCardStyle() from themeUtils
 */
export const getThemedCardStyle = () => getStandardCardStyle();

/**
 * Standardized themed card header component
 * Uses new centralized theme utilities
 */
export const ThemedCardHeader = ({ children, className = '', ...props }) => (
    <CardHeader
        className={`aero-card-header border-b p-0 ${className}`}
        style={getStandardCardHeaderStyle()}
        {...props}
    >
        {children}
    </CardHeader>
);

/**
 * Standardized themed card body component
 */
export const ThemedCardBody = ({ children, className = 'p-6', ...props }) => (
    <CardBody className={className} {...props}>
        {children}
    </CardBody>
);

/**
 * Complete themed card component with standardized styling
 * Automatically applies .aero-card class
 */
export const ThemedCard = ({ children, className = '', ...props }) => (
    <Card 
        className={`aero-card transition-all duration-200 ${className}`}
        {...props}
    >
        {children}
    </Card>
);

/**
 * Legacy compatibility - use ThemedCard instead
 * @deprecated
 */
export const StandardCard = ThemedCard;

export default {
    ThemedCard,
    ThemedCardHeader,
    ThemedCardBody,
    getThemedCardStyle,
    StandardCard
};
