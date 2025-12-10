import React from 'react';
import { Box, Paper, Container } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * Enhanced Content Wrapper Components
 * 
 * These components provide:
 * - Proper elevation and shadows for content when header/footer are sticky
 * - Glassmorphism effects that work with background patterns
 * - Responsive design with mobile optimizations
 * - Performance optimizations
 * - Consistent spacing and layout
 */

// Styled components for better performance
const StyledContentContainer = styled(Box)(({ theme, elevation = 'medium' }) => {
    const elevationStyles = {
        none: {
            boxShadow: 'none',
            background: 'transparent',
            border: 'none'
        },
        low: {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            background: 'rgba(255, 255, 255, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
        },
        medium: {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.08)',
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
        },
        high: {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), 0 16px 64px rgba(0, 0, 0, 0.12)',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
        }
    };

    const currentElevation = elevationStyles[elevation] || elevationStyles.medium;

    return {
        position: 'relative',
        borderRadius: '16px',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        margin: '16px',
        padding: '24px',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        contain: 'layout style paint',
        willChange: 'background-color, box-shadow',
        zIndex: 1,
        ...currentElevation,

        // Dark mode styles
        [theme.breakpoints.up('sm')]: {
            margin: '24px',
            padding: '32px',
        },

        // Dark mode overrides
        '.dark &': {
            background: elevation === 'none' ? 'transparent' : 'rgba(15, 20, 25, 0.85)',
            boxShadow: elevation === 'none' ? 'none' : '0 4px 16px rgba(0, 0, 0, 0.3), 0 8px 32px rgba(0, 0, 0, 0.2)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
        },

        // Mobile optimizations
        [theme.breakpoints.down('md')]: {
            backdropFilter: 'blur(8px) saturate(150%)',
            WebkitBackdropFilter: 'blur(8px) saturate(150%)',
            margin: '8px',
            padding: '16px',
            borderRadius: '12px',
        },

        // Reduced motion
        '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
        }
    };
});

const StyledPageContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    position: 'relative',
    
    // Ensure proper stacking context
    isolation: 'isolate',
    
    // Performance optimization
    contain: 'layout',
}));

const StyledSection = styled(Box)(({ theme, variant = 'default' }) => {
    const variants = {
        default: {},
        card: {
            background: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px) saturate(150%)',
            WebkitBackdropFilter: 'blur(8px) saturate(150%)',
        },
        hero: {
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            borderRadius: '20px',
            padding: '40px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            textAlign: 'center',
        }
    };

    return {
        position: 'relative',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        ...variants[variant],

        // Dark mode styles
        '.dark &': {
            ...(variant === 'card' && {
                background: 'rgba(15, 20, 25, 0.6)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
            }),
            ...(variant === 'hero' && {
                background: 'linear-gradient(135deg, rgba(15, 20, 25, 0.4) 0%, rgba(15, 20, 25, 0.2) 100%)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
            }),
        },

        // Mobile optimizations
        [theme.breakpoints.down('md')]: {
            ...(variant === 'card' && {
                padding: '16px',
                borderRadius: '8px',
            }),
            ...(variant === 'hero' && {
                padding: '24px',
                borderRadius: '16px',
            }),
        },
    };
});

// Main content wrapper component
export const ContentWrapper = React.memo(({ 
    children, 
    elevation = 'medium',
    maxWidth = 'xl',
    className = '',
    sx = {},
    ...props 
}) => (
    <StyledPageContainer className={`content-area ${className}`} sx={sx} {...props}>
        <StyledContentContainer elevation={elevation}>
            {maxWidth ? (
                <Container maxWidth={maxWidth} disableGutters>
                    {children}
                </Container>
            ) : (
                children
            )}
        </StyledContentContainer>
    </StyledPageContainer>
));

ContentWrapper.displayName = 'ContentWrapper';

// Page container for full-page layouts
export const PageContainer = React.memo(({ 
    children, 
    className = '',
    sx = {},
    ...props 
}) => (
    <StyledPageContainer className={`page-container ${className}`} sx={sx} {...props}>
        {children}
    </StyledPageContainer>
));

PageContainer.displayName = 'PageContainer';

// Section wrapper for content sections
export const SectionWrapper = React.memo(({ 
    children, 
    variant = 'default',
    className = '',
    sx = {},
    ...props 
}) => (
    <StyledSection variant={variant} className={`section-wrapper ${className}`} sx={sx} {...props}>
        {children}
    </StyledSection>
));

SectionWrapper.displayName = 'SectionWrapper';

// Card wrapper for individual content cards
export const CardWrapper = React.memo(({ 
    children, 
    elevation = 'low',
    className = '',
    sx = {},
    ...props 
}) => (
    <StyledContentContainer 
        elevation={elevation} 
        className={`card-wrapper glass-card ${className}`} 
        sx={{ 
            margin: '8px',
            padding: '16px',
            ...sx 
        }} 
        {...props}
    >
        {children}
    </StyledContentContainer>
));

CardWrapper.displayName = 'CardWrapper';

// Dashboard wrapper with optimized grid layout
export const DashboardWrapper = React.memo(({ 
    children, 
    className = '',
    sx = {},
    ...props 
}) => (
    <StyledPageContainer className={`dashboard-container ${className}`} sx={sx} {...props}>
        <StyledContentContainer elevation="low">
            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(auto-fit, minmax(300px, 1fr))',
                        md: 'repeat(auto-fit, minmax(350px, 1fr))',
                    },
                    '& > *': {
                        minWidth: 0, // Prevent grid blowout
                    }
                }}
            >
                {children}
            </Box>
        </StyledContentContainer>
    </StyledPageContainer>
));

DashboardWrapper.displayName = 'DashboardWrapper';

// Table wrapper with proper elevation
export const TableWrapper = React.memo(({ 
    children, 
    className = '',
    sx = {},
    ...props 
}) => (
    <StyledContentContainer 
        elevation="medium" 
        className={`table-wrapper ${className}`} 
        sx={{ 
            padding: 0,
            overflow: 'hidden',
            ...sx 
        }} 
        {...props}
    >
        {children}
    </StyledContentContainer>
));

TableWrapper.displayName = 'TableWrapper';

// Form wrapper with appropriate spacing
export const FormWrapper = React.memo(({ 
    children, 
    maxWidth = 'md',
    className = '',
    sx = {},
    ...props 
}) => (
    <StyledPageContainer className={`form-container ${className}`} sx={sx} {...props}>
        <StyledContentContainer elevation="medium">
            <Container maxWidth={maxWidth} disableGutters>
                <Box
                    component="form"
                    sx={{
                        '& .MuiTextField-root': { mb: 2 },
                        '& .MuiFormControl-root': { mb: 2 },
                        '& .MuiButton-root': { mt: 2 },
                    }}
                >
                    {children}
                </Box>
            </Container>
        </StyledContentContainer>
    </StyledPageContainer>
));

FormWrapper.displayName = 'FormWrapper';

// Modal content wrapper
export const ModalContentWrapper = React.memo(({ 
    children, 
    className = '',
    sx = {},
    ...props 
}) => (
    <StyledContentContainer 
        elevation="high" 
        className={`modal-content ${className}`} 
        sx={{
            margin: 0,
            maxHeight: '90vh',
            overflow: 'auto',
            ...sx
        }} 
        {...props}
    >
        {children}
    </StyledContentContainer>
));

ModalContentWrapper.displayName = 'ModalContentWrapper';

export default ContentWrapper;
