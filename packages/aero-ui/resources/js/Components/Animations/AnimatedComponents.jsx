import React from 'react';
import { Paper, Card, CardContent, Box } from '@mui/material';
import { ScrollFadeIn, HoverScale } from './SmoothAnimations';

/**
 * Enhanced Card Components with Smooth Animations
 * 
 * Features:
 * - Scroll-triggered fade-in animations
 * - Smooth hover effects
 * - Customizable animation timing
 * - Material-UI integration
 * - Performance optimized
 */

export const AnimatedPaper = ({ 
    children, 
    delay = 0,
    direction = 'up',
    hoverScale = 1.02,
    elevation = 1,
    sx = {},
    className = '',
    ...props 
}) => {
    return (
        <ScrollFadeIn delay={delay} direction={direction}>
            <HoverScale scale={hoverScale}>
                <Paper
                    elevation={elevation}
                    sx={{
                        transition: 'all 0.3s ease',
                        ...sx
                    }}
                    className={className}
                    {...props}
                >
                    {children}
                </Paper>
            </HoverScale>
        </ScrollFadeIn>
    );
};

export const AnimatedCard = ({ 
    children, 
    delay = 0,
    direction = 'up',
    hoverScale = 1.02,
    sx = {},
    className = '',
    ...props 
}) => {
    return (
        <ScrollFadeIn delay={delay} direction={direction}>
            <HoverScale scale={hoverScale}>
                <Card
                    sx={{
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: (theme) => theme.shadows[8],
                        },
                        ...sx
                    }}
                    className={className}
                    {...props}
                >
                    {children}
                </Card>
            </HoverScale>
        </ScrollFadeIn>
    );
};

export const AnimatedCardContent = ({ 
    children, 
    delay = 0.1,
    direction = 'up',
    sx = {},
    className = '',
    ...props 
}) => {
    return (
        <ScrollFadeIn delay={delay} direction={direction}>
            <CardContent
                sx={{
                    transition: 'all 0.3s ease',
                    ...sx
                }}
                className={className}
                {...props}
            >
                {children}
            </CardContent>
        </ScrollFadeIn>
    );
};

export const AnimatedBox = ({ 
    children, 
    delay = 0,
    direction = 'up',
    hoverScale,
    sx = {},
    className = '',
    ...props 
}) => {
    const BoxComponent = hoverScale ? (
        <HoverScale scale={hoverScale}>
            <Box
                sx={{
                    transition: 'all 0.3s ease',
                    ...sx
                }}
                className={className}
                {...props}
            >
                {children}
            </Box>
        </HoverScale>
    ) : (
        <Box
            sx={{
                transition: 'all 0.3s ease',
                ...sx
            }}
            className={className}
            {...props}
        >
            {children}
        </Box>
    );

    return (
        <ScrollFadeIn delay={delay} direction={direction}>
            {BoxComponent}
        </ScrollFadeIn>
    );
};

// Grid item with animation
export const AnimatedGridItem = ({ 
    children, 
    delay = 0,
    direction = 'up',
    hoverScale = 1.01,
    sx = {},
    className = '',
    ...props 
}) => {
    return (
        <ScrollFadeIn delay={delay} direction={direction}>
            <HoverScale scale={hoverScale}>
                <Box
                    sx={{
                        transition: 'all 0.3s ease',
                        ...sx
                    }}
                    className={className}
                    {...props}
                >
                    {children}
                </Box>
            </HoverScale>
        </ScrollFadeIn>
    );
};

// Table row with animation
export const AnimatedTableRow = ({ 
    children, 
    delay = 0,
    index = 0,
    sx = {},
    className = '',
    ...props 
}) => {
    return (
        <ScrollFadeIn 
            delay={delay + (index * 0.05)} 
            direction="up"
            distance={10}
            duration={0.3}
        >
            <Box
                component="tr"
                sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        backgroundColor: (theme) => 
                            theme.palette.mode === 'dark' 
                                ? 'rgba(255,255,255,0.05)' 
                                : 'rgba(0,0,0,0.02)',
                    },
                    ...sx
                }}
                className={className}
                {...props}
            >
                {children}
            </Box>
        </ScrollFadeIn>
    );
};

// List item with animation
export const AnimatedListItem = ({ 
    children, 
    delay = 0,
    index = 0,
    direction = 'left',
    sx = {},
    className = '',
    ...props 
}) => {
    return (
        <ScrollFadeIn 
            delay={delay + (index * 0.08)} 
            direction={direction}
            distance={20}
            duration={0.4}
        >
            <Box
                sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateX(4px)',
                        backgroundColor: (theme) => 
                            theme.palette.mode === 'dark' 
                                ? 'rgba(255,255,255,0.05)' 
                                : 'rgba(0,0,0,0.02)',
                    },
                    ...sx
                }}
                className={className}
                {...props}
            >
                {children}
            </Box>
        </ScrollFadeIn>
    );
};

export default {
    AnimatedPaper,
    AnimatedCard,
    AnimatedCardContent,
    AnimatedBox,
    AnimatedGridItem,
    AnimatedTableRow,
    AnimatedListItem
};
