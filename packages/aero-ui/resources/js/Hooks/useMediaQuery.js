import { useState, useEffect } from 'react';

/**
 * Convert MUI-style breakpoint queries to standard media queries
 */
const convertMUIBreakpoint = (query) => {
    const breakpoints = {
        'xs': '480px',
        'sm': '640px', 
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px'
    };

    // Handle down queries (theme.breakpoints.down('md'))
    if (query.includes('down')) {
        const breakpoint = query.match(/down\('(\w+)'\)/)?.[1];
        if (breakpoint && breakpoints[breakpoint]) {
            return `(max-width: ${breakpoints[breakpoint]})`;
        }
    }

    // Handle up queries  
    if (query.includes('up')) {
        const breakpoint = query.match(/up\('(\w+)'\)/)?.[1];
        if (breakpoint && breakpoints[breakpoint]) {
            return `(min-width: ${breakpoints[breakpoint]})`;
        }
    }

    // Return the query as-is if it's already a valid media query
    return query;
};

/**
 * Get initial match value synchronously to avoid hydration mismatch
 */
const getInitialMatch = (query) => {
    // Only run on client side
    if (typeof window === 'undefined') {
        return false;
    }
    
    const mediaQuery = query.includes('down') || query.includes('up')
        ? convertMUIBreakpoint(query)
        : query;
    
    return window.matchMedia(mediaQuery).matches;
};

/**
 * Custom hook to replace MUI's useMediaQuery
 * Provides responsive breakpoint detection using Tailwind breakpoints
 * 
 * Fixed: Now initializes with the correct value synchronously to prevent
 * incorrect data fetching on initial render (e.g., fetching desktop data
 * when the screen is actually mobile).
 */
export const useMediaQuery = (query) => {
    // Initialize with the correct value synchronously to avoid flash of incorrect content
    const [matches, setMatches] = useState(() => getInitialMatch(query));

    useEffect(() => {
        // Convert common breakpoint queries to standard media queries
        const mediaQuery = query.includes('down') || query.includes('up')
            ? convertMUIBreakpoint(query)
            : query;

        const mediaQueryList = window.matchMedia(mediaQuery);
        const updateMatches = () => setMatches(mediaQueryList.matches);

        // Set initial value (in case SSR value differs from client)
        updateMatches();

        // Listen for changes
        mediaQueryList.addEventListener('change', updateMatches);

        return () => {
            mediaQueryList.removeEventListener('change', updateMatches);
        };
    }, [query]);

    return matches;
};

export default useMediaQuery;
