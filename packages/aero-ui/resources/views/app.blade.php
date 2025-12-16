<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="ltr">

<head>
    <!-- Essential Meta Tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=yes maximum-scale=1 user-scalable=yes">
    <meta http-equiv=" X-UA-Compatible" content="IE=edge">
    <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />

    <!-- Security & Performance -->
    @production
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
    @endproduction
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="X-XSS-Protection" content="1; mode=block">
    <meta name="referrer" content="strict-origin-when-cross-origin">

    <!-- SEO & Social Meta -->
    <meta name="description" content="{{ config('app.name') }} - Comprehensive Enterprise Resource Planning System for efficient business management">
    <meta name="keywords" content="ERP, Enterprise Resource Planning, Business Management, HR Management">
    <meta name="author" content="Emam Hosen">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#134e9d">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="{{ config('app.name') }}">
    <meta property="og:description" content="Comprehensive Enterprise Resource Planning System">
    <meta property="og:image" content="{{ asset('assets/images/og-image.png') }}">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:site_name" content="{{ config('app.name') }}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ config('app.name') }}">
    <meta name="twitter:description" content="Comprehensive Enterprise Resource Planning System">
    <meta name="twitter:image" content="{{ asset('assets/images/twitter-card.png') }}">

    <!-- PWA Configuration -->
    <link rel="manifest" href="{{ asset('/manifest.json') }}">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="{{ $siteName ?? config('app.name') }}">

    <!-- Favicon - Only render if favicon/logo URLs are set -->
    @if(!empty($faviconUrl))
    <link rel="icon" type="image/x-icon" href="{{ $faviconUrl }}">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ $faviconUrl }}">
    @endif
    @if(!empty($logoUrl))
    <link rel="apple-touch-icon" sizes="180x180" href="{{ $logoUrl }}">
    @endif

    <!-- DNS Prefetch for Performance -->
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    <link rel="dns-prefetch" href="//fonts.gstatic.com">
    <link rel="dns-prefetch" href="//translate.google.com">
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <!-- Font Loading -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- Critical Theming CSS -->
    <style>
        /* Theme CSS Variables */
        :root {
            --primary-color: #134e9d;
            --secondary-color: #f5841f;
        }

        /* Screen Reader Only */
        .sr-only {
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
        }

        /* Loading Screen */
        #app-loading {
            position: fixed;
            inset: 0;
            background: linear-gradient(135deg, rgba(248, 250, 252, 0.98), rgba(226, 232, 240, 0.92));
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: opacity 0.4s ease;
        }

        .dark #app-loading,
        [data-theme-mode="dark"] #app-loading {
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(51, 65, 85, 0.92));
        }

        #app-loading.hidden {
            opacity: 0;
            pointer-events: none;
        }

        .loading-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(16px);
            border-radius: var(--borderRadius, 16px);
            border: 1px solid rgba(0, 0, 0, 0.08);
            max-width: 280px;
        }

        .dark .loading-content,
        [data-theme-mode="dark"] .loading-content {
            background: rgba(30, 41, 59, 0.8);
            border-color: rgba(255, 255, 255, 0.1);
        }

        .loading-logo {
            width: 80px;
            height: 80px;
            margin-bottom: 1rem;
            border-radius: var(--borderRadius, 12px);
            overflow: hidden;
        }

        .loading-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            background: white;
        }

        .loading-logo-fallback {
            display: none;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: 700;
            color: white;
        }

        .loading-spinner {
            width: 40px;
            height: 40px;
            margin-bottom: 1rem;
            border: 3px solid rgba(0, 0, 0, 0.08);
            border-top-color: var(--theme-primary, #3b82f6);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        .dark .loading-spinner,
        [data-theme-mode="dark"] .loading-spinner {
            border-color: rgba(255, 255, 255, 0.1);
            border-top-color: var(--theme-primary, #60a5fa);
        }

        .loading-text {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--theme-foreground, #1e293b);
            font-family: var(--fontFamily, 'Inter', sans-serif);
        }

        .dark .loading-text,
        [data-theme-mode="dark"] .loading-text {
            color: var(--theme-foreground, #f1f5f9);
        }

        .loading-subtitle {
            font-size: 0.8rem;
            color: var(--theme-default-500, #64748b);
            font-family: var(--fontFamily, 'Inter', sans-serif);
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        #app {
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        #app.loaded {
            opacity: 1;
        }

        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                transition-duration: 0.01ms !important;
            }
        }

        @media print {
            #app-loading { display: none !important; }
        }
    </style>
</head>

<body class="light text-foreground bg-background">
    <!-- Skip Navigation Link for Accessibility -->
    <a href="#main-content" class="sr-only sr-only-focusable" style="position: absolute; top: -40px; left: 6px; z-index: 10001; color: white; background: var(--primary-color); padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold;">
        Skip to main content
    </a>

    <!-- Loading Screen -->
    <div id="app-loading" role="status" aria-live="polite" aria-label="Loading application">
        <div class="loading-content" role="presentation">
            <div class="loading-logo" aria-hidden="true">
                <img src="{{ $logoUrl ?? asset('assets/images/logo.png') }}" alt=""
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="loading-logo-fallback">
                    {{ substr($siteName ?? 'aeos365', 0, 1) }}
                </div>
            </div>
            <div class="loading-spinner" aria-hidden="true"></div>
            <div class="loading-text" aria-hidden="true">{{ $siteName ?? 'aeos365' }}</div>
            <div class="loading-subtitle" aria-hidden="true">Preparing your workspace...</div>
            <span class="sr-only" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;">Loading {{ $siteName ?? 'aeos365' }}, please wait...</span>
        </div>
    </div>

    @routes
    @inertiaHead
    @viteReactRefresh
    @vite(['vendor/aero/ui/resources/css/app.css', 'vendor/aero/ui/resources/js/app.jsx'])
    
    <!-- Main Inertia App Container -->
    @inertia

    <!-- Enhanced Loading Management -->
    <script>
        // Enhanced Loading Management for Optimized Performance
        window.AppLoader = {
            hideLoading: function() {
                const loading = document.getElementById('app-loading');
                const app = document.getElementById('app');

                if (loading && app) {
                    // Smooth fade out with optimized timing
                    loading.style.opacity = '0';
                    app.classList.add('loaded');

                    // Remove loading screen from DOM after transition completes
                    setTimeout(() => {
                        if (loading && loading.style.opacity === '0') {
                            loading.remove();
                        }
                    }, 400); // Optimized timing
                }
            },

            showLoading: function(message = 'Loading...', subtitle = 'Please wait...') {
                // Only show loading for initial page load or file uploads
                // Regular Inertia navigation is handled by LoadingIndicator React component
                let loading = document.getElementById('app-loading');
                const app = document.getElementById('app');

                // Don't recreate loading screen once app is initialized
                if (!loading) {
                    return; // Don't create new loading screen after initial load
                }

                if (loading && app) {
                    loading.style.opacity = '1';
                    loading.style.pointerEvents = 'auto';
                    app.classList.remove('loaded');
                    
                    // Update messages
                    const loadingText = loading.querySelector('.loading-text');
                    const loadingSubtitle = loading.querySelector('.loading-subtitle');
                    if (loadingText) loadingText.textContent = message;
                    if (loadingSubtitle) loadingSubtitle.textContent = subtitle;
                }
            },

            updateLoadingMessage: function(message, subtitle = '') {
                const loadingText = document.querySelector('.loading-text');
                const loadingSubtitle = document.querySelector('.loading-subtitle');
                
                if (loadingText) loadingText.textContent = message;
                if (loadingSubtitle) loadingSubtitle.textContent = subtitle;
            }
        };

        // Optimized Inertia.js progress and loading management for enhanced performance
        document.addEventListener('DOMContentLoaded', function() {
            let appReady = false;
            
            // Listen for Inertia events - but don't show #app-loading for navigations
            // The React LoadingIndicator component handles all Inertia navigation loading states
            document.addEventListener('inertia:start', function(event) {
                // Only show loading for file uploads or very specific scenarios
                // Regular navigation is handled by the React LoadingIndicator component
                if (event.detail.visit.hasFiles) {
                    window.AppLoader.showLoading('Uploading...', 'Please wait...');
                }
            });

            document.addEventListener('inertia:progress', function(event) {
                // Optimized progress handling
                if (event.detail.progress && event.detail.progress.percentage) {
                    const percentage = Math.round(event.detail.progress.percentage);
                    window.AppLoader.updateLoadingMessage(
                        'Loading...', 
                        `${percentage}% complete`
                    );
                }
            });

            document.addEventListener('inertia:finish', function(event) {
                // Hide loading immediately for optimized navigation
                if (appReady) {
                    setTimeout(() => {
                        window.AppLoader.hideLoading();
                    }, 50); // Faster response
                }
            });

            // Optimized app initialization
            const initializeApp = () => {
                if (!appReady) {
                    window.AppLoader.updateLoadingMessage(
                        'Initializing', 
                        'Setting up components...'
                    );
                    
                    // Hide loading after optimized timing
                    setTimeout(() => {
                        appReady = true;
                        window.AppLoader.hideLoading();
                    }, 600); // Optimized from 800ms
                }
            };

            // Enhanced fallbacks with better timing
            
            // 1. When DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initializeApp);
            } else {
                initializeApp();
            }
            
            // 2. When window loads
            window.addEventListener('load', initializeApp);
            
            // 3. Enhanced React readiness check
            const checkReactReady = () => {
                if (window.React || document.querySelector('[data-reactroot]') || document.querySelector('#app > *')) {
                    initializeApp();
                    return true;
                }
                return false;
            };
            
            // Optimized React check interval
            let reactCheckCount = 0;
            const reactCheckInterval = setInterval(() => {
                reactCheckCount++;
                if (checkReactReady() || reactCheckCount > 15) { // Reduced from 20 checks
                    clearInterval(reactCheckInterval);
                }
            }, 100);
            
            // 4. Reduced fallback timeout
            setTimeout(() => {
                if (!appReady) {
                    console.warn('App loading timed out, forcing hide');
                    appReady = true;
                    window.AppLoader.hideLoading();
                }
            }, 2000); // Reduced from 3000ms
        });

        // Performance monitoring
        window.addEventListener('load', function() {
            if ('performance' in window) {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        console.log('Page load time:', Math.round(perfData.loadEventEnd - perfData.loadEventStart), 'ms');
                        console.log('DOM ready time:', Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart), 'ms');
                    }
                }, 100);
            }
        });

        // Enhanced error handling - just log errors, don't show loading screen
        window.addEventListener('error', function(e) {
            console.error('Unhandled error:', e.error);
            // Just hide loading if it's visible, don't show error UI
            window.AppLoader.hideLoading();
        });

        window.addEventListener('unhandledrejection', function(e) {
            console.error('Unhandled promise rejection:', e.reason);
            // Just hide loading if it's visible
            window.AppLoader.hideLoading();
        });

        // Page visibility change handling
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                // Ensure loading screen is hidden when page becomes visible
                setTimeout(() => {
                    window.AppLoader.hideLoading();
                }, 200);
            }
        });

        // Detect if user navigates away and back
        window.addEventListener('pageshow', function(event) {
            if (event.persisted) {
                // Page was restored from cache, ensure loading is hidden
                window.AppLoader.hideLoading();
            }
        });
    </script>

   
</body>

</html>
