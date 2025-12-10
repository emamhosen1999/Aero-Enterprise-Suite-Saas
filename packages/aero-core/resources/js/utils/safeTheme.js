/**
 * Safe Theme Utility
 * Provides fallback values for theme properties to prevent undefined access errors
 */

/**
 * Default glass card styles for fallback
 */
const defaultGlassCard = {
    light: {
        backdropFilter: 'blur(24px) saturate(180%)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.10) 100%)',
        border: '1.5px solid rgba(255,255,255,0.25)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18), 0 1.5px 8px 0 rgba(255,255,255,0.12) inset',
        borderRadius: '28px',
        borderHighlight: '1.5px solid rgba(255,255,255,0.35)'
    },
    dark: {
        backdropFilter: 'blur(24px) saturate(180%)',
        background: 'linear-gradient(135deg, rgba(40,40,60,0.60) 0%, rgba(40,40,60,0.20) 100%)',
        border: '1.5px solid rgba(255,255,255,0.10)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.28), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset',
        borderRadius: '28px',
        borderHighlight: '1.5px solid rgba(255,255,255,0.18)'
    }
};

/**
 * Default theme color for fallback
 */
const defaultThemeColor = {
    name: "DEFAULT",
    className: "bg-blue-600/25 text-blue-600 font-bold",
    backgroundColor: 'rgba(255, 255, 255, 0.60)'
};

/**
 * Safe theme storage utility
 */
export const safeLocalStorage = {
    getItem: (key, fallback = null) => {
        try {
            const item = localStorage.getItem(key);
            return item !== null ? item : fallback;
        } catch (error) {
            console.warn(`localStorage.getItem failed for key "${key}":`, error);
            return fallback;
        }
    },
    
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn(`localStorage.setItem failed for key "${key}":`, error);
        }
    },
    
    getJSON: (key, fallback = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch (error) {
            console.warn(`localStorage.getJSON failed for key "${key}":`, error);
            return fallback;
        }
    },
    
    setJSON: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn(`localStorage.setJSON failed for key "${key}":`, error);
        }
    }
};

/**
 * Creates a safe theme object with guaranteed glassCard properties
 * @param {Object} theme - The theme object from useTheme hook
 * @param {boolean} darkMode - Whether dark mode is enabled
 * @returns {Object} Safe theme object with guaranteed properties
 */
export function createSafeTheme(theme, darkMode = false) {
    const baseTheme = theme || {};
    
    // Ensure glassCard exists with proper fallbacks
    const glassCard = baseTheme.glassCard || defaultGlassCard[darkMode ? 'dark' : 'light'];
    
    return {
        ...baseTheme,
        glassCard: {
            ...defaultGlassCard[darkMode ? 'dark' : 'light'],
            ...glassCard
        },
        // Add other safe defaults as needed
        palette: baseTheme.palette || {
            mode: darkMode ? 'dark' : 'light',
            primary: { main: '#667eea' },
            secondary: { main: '#764ba2' }
        },
        breakpoints: baseTheme.breakpoints || {
            down: (size) => `(max-width:${size === 'md' ? '768px' : '640px'})`
        }
    };
}

/**
 * Custom hook for safe theme management
 * @param {Function} useTheme - The useTheme hook from the project
 * @returns {Object} Object containing theme, darkMode, themeColor and setters
 */
export function useSafeTheme(useTheme) {
    const [darkMode, setDarkMode] = useState(() => 
        safeLocalStorage.getItem('darkMode') === 'true'
    );
    
    const [themeColor, setThemeColor] = useState(() => 
        safeLocalStorage.getJSON('themeColor', {
            ...defaultThemeColor,
            backgroundColor: darkMode ? 'rgba(31, 38, 59, 0.55)' : 'rgba(255, 255, 255, 0.60)'
        })
    );
    
    // Get theme from hook with error handling
    let rawTheme;
    try {
        rawTheme = useTheme(darkMode, themeColor);
    } catch (error) {
        console.warn('useTheme hook failed, using fallback theme:', error);
        rawTheme = null;
    }
    
    // Create safe theme
    const safeTheme = createSafeTheme(rawTheme, darkMode);
    
    // Persist settings
    useEffect(() => {
        safeLocalStorage.setItem('darkMode', darkMode);
        safeLocalStorage.setJSON('themeColor', themeColor);
    }, [darkMode, themeColor]);
    
    return {
        theme: safeTheme,
        darkMode,
        themeColor,
        setDarkMode,
        setThemeColor
    };
}

/**
 * Validates if a theme object has the required glassCard properties
 * @param {Object} theme - Theme object to validate
 * @returns {boolean} True if theme has valid glassCard properties
 */
export function validateTheme(theme) {
    if (!theme || typeof theme !== 'object') return false;
    
    const requiredGlassCardProps = [
        'backdropFilter',
        'background',
        'border',
        'boxShadow',
        'borderRadius'
    ];
    
    return theme.glassCard && 
           typeof theme.glassCard === 'object' &&
           requiredGlassCardProps.every(prop => 
               typeof theme.glassCard[prop] === 'string'
           );
}

/**
 * Debug utility to log theme information
 * @param {Object} theme - Theme object to debug
 * @param {string} componentName - Name of component for logging
 */
export function debugTheme(theme, componentName = 'Unknown') {
    console.group(`Theme Debug - ${componentName}`);
    console.log('Theme object:', theme);
    console.log('Has glassCard:', !!theme?.glassCard);
    console.log('Theme valid:', validateTheme(theme));
    
    if (theme?.glassCard) {
        console.log('GlassCard properties:', Object.keys(theme.glassCard));
    }
    
    console.groupEnd();
}

export default {
    createSafeTheme,
    useSafeTheme,
    validateTheme,
    debugTheme,
    safeLocalStorage,
    defaultGlassCard,
    defaultThemeColor
};
