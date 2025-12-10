/**
 * Glassy Styles Utility - HeroUI Theme Consistent
 * 
 * Provides consistent glassy/glass morphism styling utilities
 * that match the application's HeroUI theming approach
 */

// Base glassy styles using CSS custom properties
export const glassyFormControlStyles = {
    '& .MuiOutlinedInput-root': {
        background: `color-mix(in srgb, var(--theme-content1, #FAFAFA) 80%, transparent)`,
        backdropFilter: 'blur(16px) saturate(200%)',
        borderRadius: `var(--borderRadius, 12px)`,
        borderColor: `var(--theme-divider, #E4E4E7)`,
        borderWidth: `var(--borderWidth, 2px)`,
        fontFamily: `var(--fontFamily, 'Inter')`,
        '&:hover': {
            borderColor: `color-mix(in srgb, var(--theme-primary) 50%, transparent)`,
        },
        '&.Mui-focused': {
            borderColor: `var(--theme-primary)`,
            background: `color-mix(in srgb, var(--theme-content1, #FAFAFA) 90%, transparent)`,
        }
    },
    '& .MuiInputLabel-root': {
        color: `var(--theme-foreground-600)`,
        fontFamily: `var(--fontFamily, 'Inter')`,
        '&.Mui-focused': {
            color: `var(--theme-primary)`,
        }
    }
};

export const glassyMenuStyles = {
    '& .MuiPaper-root': {
        background: `color-mix(in srgb, var(--theme-content1, #FAFAFA) 90%, transparent)`,
        backdropFilter: 'blur(16px) saturate(200%)',
        border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`,
        borderRadius: `var(--borderRadius, 12px)`,
        boxShadow: `0 8px 32px color-mix(in srgb, var(--theme-foreground) 10%, transparent)`,
    },
    '& .MuiMenuItem-root': {
        fontFamily: `var(--fontFamily, 'Inter')`,
        color: `var(--theme-foreground)`,
        '&:hover': {
            background: `color-mix(in srgb, var(--theme-primary) 10%, transparent)`,
        },
        '&.Mui-selected': {
            background: `color-mix(in srgb, var(--theme-primary) 20%, transparent)`,
            '&:hover': {
                background: `color-mix(in srgb, var(--theme-primary) 30%, transparent)`,
            }
        }
    }
};

export const glassyTextFieldStyles = {
    '& .MuiOutlinedInput-root': {
        background: `color-mix(in srgb, var(--theme-content1, #FAFAFA) 80%, transparent)`,
        backdropFilter: 'blur(16px) saturate(200%)',
        borderRadius: `var(--borderRadius, 12px)`,
        fontFamily: `var(--fontFamily, 'Inter')`,
        '& fieldset': {
            borderColor: `var(--theme-divider, #E4E4E7)`,
            borderWidth: `var(--borderWidth, 2px)`,
        },
        '&:hover fieldset': {
            borderColor: `color-mix(in srgb, var(--theme-primary) 50%, transparent)`,
        },
        '&.Mui-focused fieldset': {
            borderColor: `var(--theme-primary)`,
        }
    },
    '& .MuiInputLabel-root': {
        color: `var(--theme-foreground-600)`,
        fontFamily: `var(--fontFamily, 'Inter')`,
        '&.Mui-focused': {
            color: `var(--theme-primary)`,
        }
    },
    '& .MuiInputAdornment-root': {
        color: `var(--theme-foreground-600)`,
    }
};

// Helper functions for consistent theming
export const getFormControlStyles = (variant = 'default') => {
    const baseStyles = {
        '& .MuiOutlinedInput-root': {
            background: `color-mix(in srgb, var(--theme-content1, #FAFAFA) 80%, transparent)`,
            backdropFilter: 'blur(16px) saturate(200%)',
            borderRadius: `var(--borderRadius, 12px)`,
            fontFamily: `var(--fontFamily, 'Inter')`,
            '& fieldset': {
                borderColor: `var(--theme-divider, #E4E4E7)`,
                borderWidth: `var(--borderWidth, 2px)`,
            },
            '&:hover fieldset': {
                borderColor: `color-mix(in srgb, var(--theme-primary) 50%, transparent)`,
            },
            '&.Mui-focused fieldset': {
                borderColor: `var(--theme-primary)`,
            }
        },
        '& .MuiInputLabel-root': {
            color: `var(--theme-foreground-600)`,
            fontFamily: `var(--fontFamily, 'Inter')`,
            '&.Mui-focused': {
                color: `var(--theme-primary)`,
            }
        }
    };

    return baseStyles;
};

export const getTextFieldStyles = (variant = 'default') => {
    const baseStyles = {
        '& .MuiOutlinedInput-root': {
            background: `color-mix(in srgb, var(--theme-content1, #FAFAFA) 80%, transparent)`,
            backdropFilter: 'blur(16px) saturate(200%)',
            borderRadius: `var(--borderRadius, 12px)`,
            fontFamily: `var(--fontFamily, 'Inter')`,
            '& fieldset': {
                borderColor: `var(--theme-divider, #E4E4E7)`,
                borderWidth: `var(--borderWidth, 2px)`,
            },
            '&:hover fieldset': {
                borderColor: `color-mix(in srgb, var(--theme-primary) 50%, transparent)`,
            },
            '&.Mui-focused fieldset': {
                borderColor: `var(--theme-primary)`,
            }
        },
        '& .MuiInputLabel-root': {
            color: `var(--theme-foreground-600)`,
            fontFamily: `var(--fontFamily, 'Inter')`,
            '&.Mui-focused': {
                color: `var(--theme-primary)`,
            }
        },
        '& .MuiInputAdornment-root': {
            color: `var(--theme-foreground-600)`,
        }
    };

    // Add variant-specific styles
    if (variant === 'search') {
        baseStyles['& .MuiOutlinedInput-root']['& fieldset'].borderColor = `color-mix(in srgb, var(--theme-primary) 30%, transparent)`;
    }

    return baseStyles;
};

// Card styles for consistent theming
export const getCardStyles = (variant = 'default') => {
    return {
        background: `linear-gradient(to bottom right, 
            var(--theme-content1, #FAFAFA) 20%, 
            var(--theme-content2, #F4F4F5) 10%, 
            var(--theme-content3, #F1F3F4) 20%)`,
        backdropFilter: 'blur(16px) saturate(200%)',
        borderColor: `var(--theme-divider, #E4E4E7)`,
        borderWidth: `var(--borderWidth, 2px)`,
        borderRadius: `var(--borderRadius, 12px)`,
        fontFamily: `var(--fontFamily, 'Inter')`,
    };
};

// Button styles for consistent theming
export const getButtonStyles = (color = 'primary', variant = 'solid') => {
    const baseStyles = {
        fontFamily: `var(--fontFamily, 'Inter')`,
        borderRadius: `var(--borderRadius, 12px)`,
        borderWidth: `var(--borderWidth, 2px)`,
    };

    if (variant === 'bordered') {
        return {
            ...baseStyles,
            borderColor: `color-mix(in srgb, var(--theme-${color}) 30%, transparent)`,
            background: `color-mix(in srgb, var(--theme-${color}) 5%, transparent)`,
            color: `var(--theme-${color})`,
            '&:hover': {
                background: `color-mix(in srgb, var(--theme-${color}) 10%, transparent)`,
            }
        };
    }

    if (variant === 'flat') {
        return {
            ...baseStyles,
            background: `color-mix(in srgb, var(--theme-${color}) 15%, transparent)`,
            color: `var(--theme-${color})`,
            border: 'none',
            '&:hover': {
                background: `color-mix(in srgb, var(--theme-${color}) 25%, transparent)`,
            }
        };
    }

    // Default solid variant
    return {
        ...baseStyles,
        background: `linear-gradient(135deg, var(--theme-${color}), var(--theme-${color}-600))`,
        color: `var(--theme-${color}-foreground, white)`,
        border: 'none',
        '&:hover': {
            opacity: 0.9,
        }
    };
};

export default {
    glassyFormControlStyles,
    glassyMenuStyles,
    glassyTextFieldStyles,
    getFormControlStyles,
    getTextFieldStyles,
    getCardStyles,
    getButtonStyles
};
