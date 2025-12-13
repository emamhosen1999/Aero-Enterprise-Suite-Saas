// Service Worker Emergency Reset
// Use this to completely reset service workers and caches in case of infinite reload issues

export const emergencyServiceWorkerReset = async () => {
    console.log('🚨 Emergency Service Worker Reset initiated...');
    
    try {
        // 1. Unregister all service workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log(`Found ${registrations.length} service worker registrations`);
            
            for (const registration of registrations) {
                await registration.unregister();
                console.log('✅ Service worker unregistered:', registration.scope);
            }
        }
        
        // 2. Clear all caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            console.log(`Found ${cacheNames.length} caches to clear`);
            
            for (const cacheName of cacheNames) {
                await caches.delete(cacheName);
                console.log('✅ Cache cleared:', cacheName);
            }
        }
        
        // 3. Clear relevant localStorage items (including translations)
        const itemsToRemove = [
            'app_version',
            'app_version_timestamp',
            'app_version_last_check',
            'sw_version',
            'sw_update_available',
            'translations_cache_v4',
            'translations_cache_v5',
            'glassERP_performance_baseline',
        ];
        
        itemsToRemove.forEach(item => {
            if (localStorage.getItem(item)) {
                localStorage.removeItem(item);
                console.log('✅ localStorage item removed:', item);
            }
        });
        
        console.log('🎉 Emergency reset completed successfully!');
        console.log('💡 Please refresh the page to continue with a clean state.');
        
        return {
            success: true,
            message: 'Service workers and caches cleared successfully'
        };
        
    } catch (error) {
        console.error('❌ Emergency reset failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Clear all application caches without unregistering service worker
 * Use this to force fresh data without full reset
 */
export const clearAllCaches = async () => {
    console.log('🧹 Clearing all application caches...');
    
    try {
        // Clear browser caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
                await caches.delete(cacheName);
            }
            console.log(`✅ Cleared ${cacheNames.length} browser caches`);
        }
        
        // Clear translation cache
        const translationKeys = [
            'translations_cache_v4',
            'translations_cache_v5',
        ];
        translationKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log('✅ Cleared translation cache:', key);
            }
        });
        
        // Clear performance data
        if (localStorage.getItem('glassERP_performance_baseline')) {
            localStorage.removeItem('glassERP_performance_baseline');
            console.log('✅ Cleared performance baseline');
        }
        
        console.log('🎉 All caches cleared! Reload to fetch fresh data.');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Failed to clear caches:', error);
        return { success: false, error: error.message };
    }
};

// Auto-execute if called directly from console
if (typeof window !== 'undefined') {
    window.emergencyServiceWorkerReset = emergencyServiceWorkerReset;
    window.clearAllCaches = clearAllCaches;
    console.log('🔧 Cache utilities available:');
    console.log('   - window.emergencyServiceWorkerReset() - Full reset');
    console.log('   - window.clearAllCaches() - Clear data caches only');
}

export default emergencyServiceWorkerReset;
