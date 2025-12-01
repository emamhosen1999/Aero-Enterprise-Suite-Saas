import { usePage } from '@inertiajs/react';

/**
 * Domain-aware branding hook
 * 
 * Returns the appropriate branding settings based on the current domain context:
 * - Tenant domain: Uses systemSettings.branding (tenant-specific branding)
 * - Admin/Platform/Public domains: Uses platformSettings.branding (platform-level branding)
 * 
 * @returns {Object} Branding configuration with logos, colors, and site info
 */
export function useBranding() {
    const { platformSettings, systemSettings, context, app } = usePage().props;
    
    // Determine if we're in tenant context
    const isTenantContext = context === 'tenant';
    
    // Select appropriate settings based on context
    const settings = isTenantContext && systemSettings ? systemSettings : platformSettings;
    
    return {
        // Logo variants
        logo: settings?.branding?.logo || null,
        squareLogo: settings?.branding?.square_logo || null,
        favicon: settings?.branding?.favicon || null,
        
        // Colors
        primaryColor: settings?.branding?.primary_color || '#0f172a',
        accentColor: settings?.branding?.accent_color || '#6366f1',
        
        // Site information
        siteName: settings?.site?.name || app?.name || 'Aero Enterprise Suite',
        
        // Context info
        isTenantContext,
        
        // Raw settings for advanced use
        settings
    };
}
