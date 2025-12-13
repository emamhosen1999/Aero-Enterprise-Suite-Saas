import { useEffect } from 'react';

/**
 * Hook to synchronize theme settings across authentication and main app pages
 * Ensures consistent background patterns, theme modes, and color schemes
 */
export const useThemeSync = () => {
    useEffect(() => {
        // Get all saved theme settings
        const savedBackground = localStorage.getItem('aero-hr-background') || 'pattern-glass-1';
        const savedThemeMode = localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light';
        const savedTheme = localStorage.getItem('selectedTheme') || 'ocean';
        const savedFont = localStorage.getItem('selectedFont') || 'inter';
        
        // Apply all theme attributes to document root
        document.documentElement.setAttribute('data-background', savedBackground);
        document.documentElement.setAttribute('data-theme-mode', savedThemeMode);
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.documentElement.setAttribute('data-font', savedFont);
        
        // Update CSS custom properties for theme colors
        const themeConfigs = {
            ocean: {
                primary: '14, 165, 233',
                secondary: '2, 132, 199'
            },
            sunset: {
                primary: '251, 146, 60',
                secondary: '249, 115, 22'
            },
            forest: {
                primary: '34, 197, 94',
                secondary: '22, 163, 74'
            },
            lavender: {
                primary: '168, 85, 247',
                secondary: '147, 51, 234'
            },
            rose: {
                primary: '244, 63, 94',
                secondary: '225, 29, 72'
            },
            midnight: {
                primary: '99, 102, 241',
                secondary: '79, 70, 229'
            }
        };
        
        const currentTheme = themeConfigs[savedTheme] || themeConfigs.ocean;
        document.documentElement.style.setProperty('--theme-primary-rgb', currentTheme.primary);
        document.documentElement.style.setProperty('--theme-secondary-rgb', currentTheme.secondary);
        
        // Ensure body background transitions smoothly
        document.body.style.transition = 'background 0.3s ease';
        
        // Force a repaint to ensure all styles apply correctly
        requestAnimationFrame(() => {
            // Trigger a reflow to ensure background patterns apply
            document.body.style.transform = 'translateZ(0)';
            requestAnimationFrame(() => {
                document.body.style.transform = '';
            });
        });
        
        // Return current theme settings
        return {
            background: savedBackground,
            themeMode: savedThemeMode,
            theme: savedTheme,
            font: savedFont
        };
    }, []);
    
    // Utility function to update theme settings
    const updateTheme = (updates) => {
        if (updates.background) {
            localStorage.setItem('aero-hr-background', updates.background);
            document.documentElement.setAttribute('data-background', updates.background);
        }
        
        if (updates.themeMode !== undefined) {
            localStorage.setItem('darkMode', updates.themeMode === 'dark');
            document.documentElement.setAttribute('data-theme-mode', updates.themeMode);
        }
        
        if (updates.theme) {
            localStorage.setItem('selectedTheme', updates.theme);
            document.documentElement.setAttribute('data-theme', updates.theme);
        }
        
        if (updates.font) {
            localStorage.setItem('selectedFont', updates.font);
            document.documentElement.setAttribute('data-font', updates.font);
        }
    };
    
    return { updateTheme };
};

/**
 * Hook specifically for authentication pages to ensure theme consistency
 */
export const useAuthThemeSync = () => {
    useEffect(() => {
        // Enhanced theme sync for auth pages
        const themeSync = () => {
            const savedSettings = {
                background: localStorage.getItem('aero-hr-background') || 'pattern-glass-1',
                themeMode: localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light',
                theme: localStorage.getItem('selectedTheme') || 'ocean',
                font: localStorage.getItem('selectedFont') || 'inter'
            };
            
            // Get theme color configuration for CSS custom properties
            const savedThemeColor = localStorage.getItem('themeColor');
            let themeColorObj;
            try {
                themeColorObj = savedThemeColor ? JSON.parse(savedThemeColor) : {
                    name: "OCEAN", 
                    primary: "#0ea5e9", 
                    secondary: "#0284c7"
                };
            } catch {
                themeColorObj = {
                    name: "OCEAN", 
                    primary: "#0ea5e9", 
                    secondary: "#0284c7"
                };
            }
            
            // Helper function to convert hex to RGB
            const hexToRgb = (hex) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                if (result) {
                    const r = parseInt(result[1], 16);
                    const g = parseInt(result[2], 16);
                    const b = parseInt(result[3], 16);
                    return `${r}, ${g}, ${b}`;
                }
                return '14, 165, 233'; // fallback to ocean blue
            };
            
            // Apply CSS custom properties for theme colors (critical for background patterns)
            const root = document.documentElement;
            root.style.setProperty('--theme-primary-rgb', hexToRgb(themeColorObj.primary));
            root.style.setProperty('--theme-secondary-rgb', hexToRgb(themeColorObj.secondary));
            root.style.setProperty('--theme-primary', themeColorObj.primary);
            root.style.setProperty('--theme-secondary', themeColorObj.secondary);
            
            // Apply all attributes to document root
            Object.entries(savedSettings).forEach(([key, value]) => {
                if (key === 'themeMode') {
                    document.documentElement.setAttribute('data-theme-mode', value);
                    // Also apply to body for immediate effect
                    document.body.setAttribute('data-theme-mode', value);
                } else {
                    document.documentElement.setAttribute(`data-${key}`, value);
                }
            });
            
            // Force immediate background application
            document.documentElement.setAttribute('data-background', savedSettings.background);
            
            // Special handling for auth page backgrounds
            if (savedSettings.background.startsWith('pattern-glass')) {
                // Ensure glass patterns work properly on auth pages
                document.body.classList.add('auth-page-background');
                
                // Add a subtle overlay to improve readability on auth forms
                const existingOverlay = document.querySelector('.auth-background-overlay');
                if (!existingOverlay) {
                    const overlay = document.createElement('div');
                    overlay.className = 'auth-background-overlay';
                    overlay.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(${savedSettings.themeMode === 'dark' ? '15, 20, 25' : '255, 255, 255'}, 0.02);
                        backdrop-filter: blur(0.5px);
                        pointer-events: none;
                        z-index: -1;
                    `;
                    document.body.appendChild(overlay);
                }
            }
            
            // Force a reflow to ensure background patterns apply immediately
            requestAnimationFrame(() => {
                // Trigger style recalculation
                document.body.style.transform = 'translateZ(0)';
                requestAnimationFrame(() => {
                    document.body.style.transform = '';
                });
            });
            
            return savedSettings;
        };
        
        // Initial sync
        const settings = themeSync();
        
        // Listen for theme changes from other tabs/windows
        const handleStorageChange = (e) => {
            if (e.key && (e.key.startsWith('aero-hr-') || e.key === 'darkMode' || e.key === 'selectedTheme' || e.key === 'selectedFont' || e.key === 'themeColor')) {
                themeSync();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        // Cleanup
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            document.body.classList.remove('auth-page-background');
            const overlay = document.querySelector('.auth-background-overlay');
            if (overlay) {
                overlay.remove();
            }
        };
    }, []);
};

export default useThemeSync;
