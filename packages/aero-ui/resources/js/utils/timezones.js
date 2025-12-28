/**
 * Comprehensive timezone list for use across the application.
 * Organized by region for easy selection in dropdown menus.
 * 
 * Each timezone has:
 * - key: IANA timezone identifier (used for storage and server-side operations)
 * - label: Human-readable display name
 * - region: Geographic region for grouping (optional)
 * - offset: Approximate UTC offset for sorting (optional)
 */

export const TIMEZONES = [
    // Americas
    { key: 'America/New_York', label: 'Eastern Time (US & Canada)', region: 'Americas', offset: -5 },
    { key: 'America/Chicago', label: 'Central Time (US & Canada)', region: 'Americas', offset: -6 },
    { key: 'America/Denver', label: 'Mountain Time (US & Canada)', region: 'Americas', offset: -7 },
    { key: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)', region: 'Americas', offset: -8 },
    { key: 'America/Anchorage', label: 'Alaska', region: 'Americas', offset: -9 },
    { key: 'Pacific/Honolulu', label: 'Hawaii', region: 'Americas', offset: -10 },
    { key: 'America/Toronto', label: 'Eastern Time (Canada)', region: 'Americas', offset: -5 },
    { key: 'America/Vancouver', label: 'Pacific Time (Canada)', region: 'Americas', offset: -8 },
    { key: 'America/Mexico_City', label: 'Mexico City', region: 'Americas', offset: -6 },
    { key: 'America/Sao_Paulo', label: 'Brasilia', region: 'Americas', offset: -3 },
    { key: 'America/Buenos_Aires', label: 'Buenos Aires', region: 'Americas', offset: -3 },
    { key: 'America/Lima', label: 'Lima, Bogota, Quito', region: 'Americas', offset: -5 },
    { key: 'America/Santiago', label: 'Santiago', region: 'Americas', offset: -4 },
    
    // Europe
    { key: 'Europe/London', label: 'London (GMT/BST)', region: 'Europe', offset: 0 },
    { key: 'Europe/Paris', label: 'Paris, Berlin, Rome', region: 'Europe', offset: 1 },
    { key: 'Europe/Madrid', label: 'Madrid, Barcelona', region: 'Europe', offset: 1 },
    { key: 'Europe/Amsterdam', label: 'Amsterdam, Brussels', region: 'Europe', offset: 1 },
    { key: 'Europe/Stockholm', label: 'Stockholm, Oslo', region: 'Europe', offset: 1 },
    { key: 'Europe/Athens', label: 'Athens, Helsinki', region: 'Europe', offset: 2 },
    { key: 'Europe/Moscow', label: 'Moscow', region: 'Europe', offset: 3 },
    { key: 'Europe/Istanbul', label: 'Istanbul', region: 'Europe', offset: 3 },
    
    // Asia
    { key: 'Asia/Dubai', label: 'Dubai, Abu Dhabi', region: 'Asia', offset: 4 },
    { key: 'Asia/Karachi', label: 'Karachi, Islamabad', region: 'Asia', offset: 5 },
    { key: 'Asia/Kolkata', label: 'Mumbai, New Delhi', region: 'Asia', offset: 5.5 },
    { key: 'Asia/Dhaka', label: 'Dhaka', region: 'Asia', offset: 6 },
    { key: 'Asia/Bangkok', label: 'Bangkok, Jakarta', region: 'Asia', offset: 7 },
    { key: 'Asia/Singapore', label: 'Singapore, Kuala Lumpur', region: 'Asia', offset: 8 },
    { key: 'Asia/Hong_Kong', label: 'Hong Kong', region: 'Asia', offset: 8 },
    { key: 'Asia/Shanghai', label: 'Beijing, Shanghai', region: 'Asia', offset: 8 },
    { key: 'Asia/Taipei', label: 'Taipei', region: 'Asia', offset: 8 },
    { key: 'Asia/Tokyo', label: 'Tokyo, Osaka', region: 'Asia', offset: 9 },
    { key: 'Asia/Seoul', label: 'Seoul', region: 'Asia', offset: 9 },
    { key: 'Asia/Manila', label: 'Manila', region: 'Asia', offset: 8 },
    
    // Australia & Pacific
    { key: 'Australia/Sydney', label: 'Sydney, Melbourne', region: 'Pacific', offset: 10 },
    { key: 'Australia/Brisbane', label: 'Brisbane', region: 'Pacific', offset: 10 },
    { key: 'Australia/Perth', label: 'Perth', region: 'Pacific', offset: 8 },
    { key: 'Australia/Adelaide', label: 'Adelaide', region: 'Pacific', offset: 9.5 },
    { key: 'Pacific/Auckland', label: 'Auckland, Wellington', region: 'Pacific', offset: 12 },
    { key: 'Pacific/Fiji', label: 'Fiji', region: 'Pacific', offset: 12 },
    
    // Africa
    { key: 'Africa/Cairo', label: 'Cairo', region: 'Africa', offset: 2 },
    { key: 'Africa/Johannesburg', label: 'Johannesburg, Cape Town', region: 'Africa', offset: 2 },
    { key: 'Africa/Lagos', label: 'Lagos, Accra', region: 'Africa', offset: 1 },
    { key: 'Africa/Nairobi', label: 'Nairobi, Addis Ababa', region: 'Africa', offset: 3 },
    { key: 'Africa/Casablanca', label: 'Casablanca', region: 'Africa', offset: 1 },
    
    // UTC
    { key: 'UTC', label: 'UTC (Coordinated Universal Time)', region: 'UTC', offset: 0 },
];

/**
 * Get timezones grouped by region
 * @returns {Object} Timezones organized by region
 */
export const getTimezonesByRegion = () => {
    const grouped = {};
    TIMEZONES.forEach(tz => {
        if (!grouped[tz.region]) {
            grouped[tz.region] = [];
        }
        grouped[tz.region].push(tz);
    });
    return grouped;
};

/**
 * Get timezone label by key
 * @param {string} key - IANA timezone identifier
 * @returns {string} Human-readable label or the key if not found
 */
export const getTimezoneLabel = (key) => {
    const tz = TIMEZONES.find(t => t.key === key);
    return tz ? tz.label : key;
};

/**
 * Get timezone options formatted for HeroUI Select
 * @returns {Array} Array of {key, label} objects
 */
export const getTimezoneOptions = () => {
    return TIMEZONES.map(tz => ({
        key: tz.key,
        label: tz.label
    }));
};

/**
 * Detect user's timezone from browser
 * @returns {string} IANA timezone identifier or 'UTC' as fallback
 */
export const detectUserTimezone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
        return 'UTC';
    }
};

export default TIMEZONES;
