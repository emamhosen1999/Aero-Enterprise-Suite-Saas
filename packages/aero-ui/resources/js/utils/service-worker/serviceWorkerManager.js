// Service Worker Registration and Management
// This module handles service worker registration, updates, and version control

import SERVICE_WORKER_CONFIG from './serviceWorkerConfig.js';

class ServiceWorkerManager {
    constructor() {
        this.registration = null;
        this.isUpdateAvailable = false;
        this.callbacks = {
            onUpdateAvailable: [],
            onInstalled: [],
            onError: []
        };
    }

    // Register service worker
    async register() {
        if (!SERVICE_WORKER_CONFIG.shouldEnable()) {
            console.log('Service Worker registration skipped:', {
                isDevelopment: SERVICE_WORKER_CONFIG.isDevelopment(),
                hostname: window.location.hostname
            });
            return false;
        }

        try {
            this.registration = await navigator.serviceWorker.register('/service-worker.js', 
                SERVICE_WORKER_CONFIG.getRegistrationOptions()
            );

            console.log('Service Worker registered:', this.registration);

            // Set up event listeners
            this.setupEventListeners();

            // Check for updates immediately
            await this.checkForUpdates();

            return true;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            this.notifyError(error);
            return false;
        }
    }

    // Set up event listeners for service worker
    setupEventListeners() {
        if (!this.registration) return;

        // Listen for waiting service worker
        this.registration.addEventListener('updatefound', () => {
            const newWorker = this.registration.installing;
            
            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // New update available
                            this.isUpdateAvailable = true;
                            this.notifyUpdateAvailable();
                        } else {
                            // First install
                            this.notifyInstalled();
                        }
                    }
                });
            }
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleMessage(event.data);
        });

        // Listen for controller change (after update)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker controller changed');
            // Temporarily disable automatic reload to prevent infinite reload loops
            // window.location.reload();
        });
    }

    // Handle messages from service worker
    handleMessage(data) {
        switch (data.type) {
            case 'VERSION_UPDATE_AVAILABLE':
                console.log('Version update available:', data);
                this.isUpdateAvailable = true;
                this.notifyUpdateAvailable(data);
                break;
            case 'CACHE_UPDATED':
                console.log('Cache updated:', data);
                break;
            default:
                console.log('Unknown message from service worker:', data);
        }
    }

    // Check for service worker updates
    async checkForUpdates() {
        if (!this.registration) return false;

        try {
            await this.registration.update();
            return true;
        } catch (error) {
            console.error('Failed to check for updates:', error);
            return false;
        }
    }

    // Activate waiting service worker
    async activateUpdate() {
        if (!this.registration || !this.registration.waiting) {
            throw new Error('No update available');
        }

        // Tell the waiting service worker to skip waiting
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        return new Promise((resolve) => {
            navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
        });
    }

    // Clear all caches
    async clearCaches() {
        try {
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
                console.log('All caches cleared');
            }

            // Also tell service worker to clear its caches
            if (this.registration?.active) {
                const messageChannel = new MessageChannel();
                return new Promise((resolve) => {
                    messageChannel.port1.onmessage = (event) => {
                        resolve(event.data.success);
                    };
                    this.registration.active.postMessage(
                        { type: 'CLEAR_CACHE' },
                        [messageChannel.port2]
                    );
                });
            }

            return true;
        } catch (error) {
            console.error('Failed to clear caches:', error);
            return false;
        }
    }

    // Check version with service worker
    async checkVersion() {
        if (!this.registration?.active) return false;

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.hasUpdate);
            };
            this.registration.active.postMessage(
                { type: 'CHECK_VERSION' },
                [messageChannel.port2]
            );
        });
    }

    // Unregister service worker
    async unregister() {
        if (!this.registration) return true;

        try {
            const result = await this.registration.unregister();
            console.log('Service Worker unregistered:', result);
            this.registration = null;
            return result;
        } catch (error) {
            console.error('Failed to unregister service worker:', error);
            return false;
        }
    }

    // Event callbacks
    onUpdateAvailable(callback) {
        this.callbacks.onUpdateAvailable.push(callback);
    }

    onInstalled(callback) {
        this.callbacks.onInstalled.push(callback);
    }

    onError(callback) {
        this.callbacks.onError.push(callback);
    }

    // Notify methods
    notifyUpdateAvailable(data = {}) {
        this.callbacks.onUpdateAvailable.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in update available callback:', error);
            }
        });
    }

    notifyInstalled() {
        this.callbacks.onInstalled.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error in installed callback:', error);
            }
        });
    }

    notifyError(error) {
        this.callbacks.onError.forEach(callback => {
            try {
                callback(error);
            } catch (error) {
                console.error('Error in error callback:', error);
            }
        });
    }

    // Get registration status
    getStatus() {
        return {
            isRegistered: !!this.registration,
            isUpdateAvailable: this.isUpdateAvailable,
            state: this.registration?.active?.state || 'not-registered'
        };
    }
}

// Create singleton instance
const serviceWorkerManager = new ServiceWorkerManager();

// Auto-register when module loads (only in production or when explicitly enabled)
const shouldRegister = SERVICE_WORKER_CONFIG.shouldEnable();

if (shouldRegister) {
    // Register after page load to avoid blocking
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => serviceWorkerManager.register(), 1000);
        });
    } else {
        setTimeout(() => serviceWorkerManager.register(), 1000);
    }
} else {
    console.log('Service Worker registration skipped:', {
        isDevelopment: SERVICE_WORKER_CONFIG.isDevelopment(),
        hostname: window.location.hostname,
        reason: SERVICE_WORKER_CONFIG.isDevelopment() ? 'Development environment' : 'Service Worker not supported'
    });
}

export default serviceWorkerManager;
