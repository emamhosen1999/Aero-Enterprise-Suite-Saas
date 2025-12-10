// Service Worker Configuration
// Handles environment-specific service worker behavior

export const SERVICE_WORKER_CONFIG = {
    // Disable service worker in development to prevent infinite reloads
    enableInDevelopment: false,
    
    // Only enable on production domains
    productionDomains: [
        'your-production-domain.com',
        'aero-enterprise.com'
    ],
    
    // Development indicators
    developmentIndicators: [
        'localhost',
        '127.0.0.1',
        '192.168.',
        '10.0.',
        '172.',
        'dev.',
        'staging.'
    ],
    
    // Check if current environment is development
    isDevelopment() {
        const hostname = window.location.hostname;
        return this.developmentIndicators.some(indicator => 
            hostname.includes(indicator)
        ) || window.location.port !== '';
    },
    
    // Check if service worker should be enabled
    shouldEnable() {
        if (this.isDevelopment() && !this.enableInDevelopment) {
            return false;
        }
        
        return 'serviceWorker' in navigator;
    },
    
    // Get appropriate service worker registration options
    getRegistrationOptions() {
        return {
            scope: '/',
            updateViaCache: 'none'
        };
    }
};

export default SERVICE_WORKER_CONFIG;
