import { usePage } from '@inertiajs/react';
import { useTheme } from '@/Context/ThemeContext';

/**
 * Domain-aware branding hook with theme support
 * 
 * Returns the appropriate branding settings based on:
 * - Current domain context (tenant/admin/platform/public)
 * - Current theme mode (light/dark)
 * 
 * @returns {Object} Branding configuration with theme-aware logos, colors, and site info
 */
export function useBranding() {
    const { platformSettings, systemSettings, context, app } = usePage().props;
    
    // Get current theme (light/dark)
    let isDarkMode = false;
    try {
        const themeContext = useTheme();
        isDarkMode = themeContext?.isDarkMode || false;
    } catch (e) {
        // ThemeContext not available (e.g., in PublicLayout), check localStorage or system preference
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('theme');
            if (stored) {
                isDarkMode = stored === 'dark';
            } else {
                isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
        }
    }
    
    // Determine if we're in tenant context
    const isTenantContext = context === 'tenant';
    
    // Select appropriate settings based on context
    const settings = isTenantContext && systemSettings ? systemSettings : platformSettings;
    const branding = settings?.branding || {};
    
    // Get theme-aware logo (prioritize light/dark specific, fallback to generic logo)
    const logoLight = branding.logo_light || branding.logo || null;
    const logoDark = branding.logo_dark || branding.logo || null;
    const currentLogo = isDarkMode ? logoDark : logoLight;
    
    return {
        // Theme-aware logo (automatically switches based on theme)
        logo: currentLogo,
        
        // Explicit light/dark logos (for manual control)
        logoLight,
        logoDark,
        
        // Other logo variants
        squareLogo: branding.square_logo || null,
        favicon: branding.favicon || null,
        
        // Colors
        primaryColor: branding.primary_color || '#0f172a',
        accentColor: branding.accent_color || '#6366f1',
        
        // Site information
        siteName: settings?.site?.name || settings?.organization?.company_name || app?.name || 'aeos365',
        
        // Context and theme info
        isTenantContext,
        isDarkMode,
        
        // Raw settings for advanced use
        settings
    };
}
