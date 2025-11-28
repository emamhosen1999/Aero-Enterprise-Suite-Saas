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
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
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
    <meta name="apple-mobile-web-app-title" content="{{ config('app.name') }}">

    <!-- Icons & Favicons -->
    <link rel="icon" type="image/x-icon" href="{{ asset('assets/images/favicon.ico') }}">
    <link rel="icon" type="image/png" sizes="16x16" href="{{ asset('assets/images/favicon-16x16.png') }}">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('assets/images/favicon-32x32.png') }}">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('assets/images/apple-touch-icon.png') }}">
    <link rel="mask-icon" href="{{ asset('assets/images/safari-pinned-tab.svg') }}" color="#134e9d">

    <!-- DNS Prefetch for Performance -->
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    <link rel="dns-prefetch" href="//fonts.gstatic.com">
    <link rel="dns-prefetch" href="//translate.google.com">
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <!-- Font Loading with Display Swap -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fredoka:wght@300..700&family=JetBrains+Mono:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Title -->
    <title inertia>{{ config('app.name') }}</title>

    <!-- Critical CSS Inline (Optimized) -->
    <style>
        /* Critical CSS for immediate rendering */
        * {
            box-sizing: border-box;
        }

        html {
            line-height: 1.15;
            -webkit-text-size-adjust: 100%;
            scroll-behavior: smooth;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: var(--font-primary, 'Inter', sans-serif);
            font-size: 16px;
            line-height: 1.6;
            color: var(--text-color, #333);
            background-color: var(--bg-color, #ffffff);
            min-height: 100vh;
            overflow-x: hidden;
            transition: color 0.3s ease, background-color 0.3s ease;
        }

        /* Essential CSS Custom Properties */
        :root {
            --primary-color: #134e9d;
            --secondary-color: #f5841f;
            --text-color: #333;
            --bg-color: #ffffff;
            --shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            --border-radius: 8px;
            --transition: all 0.3s ease;
            --font-primary: 'Inter', 'Segoe UI', sans-serif;
        }

        /* Dark mode variables */
        [data-theme-mode="dark"] {
            --text-color: #ffffff;
            --bg-color: #0f1419;
            --shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
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

        /* Enhanced Background System - Theme-based patterns load immediately */
        body {
            /* Base background - will be overridden by dynamic theme system */
            background: var(--background, #ffffff);
            min-height: 100vh;
            transition: background 0.3s ease, background-color 0.3s ease;
            /* Remove any fixed background patterns to allow theme system control */
        }

        /* Dark mode fallback - also will be overridden by theme system */
        [data-theme-mode="dark"] body {
            background: var(--background, #0a0a0a);
        }

        /* Enhanced Loading Screen - Optimized Performance & UX */
        #app-loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                linear-gradient(135deg, rgba(20, 30, 48, 0.98) 0%, rgba(36, 59, 85, 0.95) 50%, rgba(59, 130, 246, 0.92) 100%),
                radial-gradient(circle at 20% 20%, rgba(14, 165, 233, 0.2) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%);
            background-size: cover, 400px 400px, 300px 300px;
            background-position: center, 20% 20%, 80% 80%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 1;
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(8px) saturate(150%);
            -webkit-backdrop-filter: blur(8px) saturate(150%);
            overflow: hidden;
            will-change: opacity, transform;
        }

        #app-loading.hidden {
            opacity: 0;
            pointer-events: none;
            transform: scale(1.02);
        }

        .loading-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(12px) saturate(180%);
            -webkit-backdrop-filter: blur(12px) saturate(180%);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.3),
                0 16px 64px rgba(0, 0, 0, 0.1),
                inset 0 1px 1px rgba(255, 255, 255, 0.1);
            animation: contentFloat 3s ease-in-out infinite;
            max-width: 380px;
            text-align: center;
            will-change: transform;
        }

        /* Optimized Loading Spinner */
        .loading-spinner {
            width: 80px;
            height: 80px;
            position: relative;
            margin-bottom: 1.5rem;
            will-change: transform;
        }

        .loading-spinner::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 3px solid transparent;
            border-top: 3px solid rgba(14, 165, 233, 0.8);
            border-right: 3px solid rgba(168, 85, 247, 0.6);
            border-radius: 50%;
            animation: spin 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
            box-shadow: 0 0 20px rgba(14, 165, 233, 0.3);
        }

        .loading-spinner::after {
            content: '';
            position: absolute;
            top: 12px;
            left: 12px;
            width: calc(100% - 24px);
            height: calc(100% - 24px);
            border: 2px solid transparent;
            border-bottom: 2px solid rgba(34, 197, 94, 0.7);
            border-left: 2px solid rgba(255, 200, 87, 0.5);
            border-radius: 50%;
            animation: spin 1s linear infinite reverse;
            box-shadow: 0 0 15px rgba(34, 197, 94, 0.2);
        }

        /* Optimized Logo */
        .loading-logo {
            width: 70px;
            height: 70px;
            margin-bottom: 1rem;
            position: relative;
            animation: logoFloat 2.5s ease-in-out infinite;
            will-change: transform;
        }

        .logo-circle {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #8b5cf6 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            box-shadow: 
                0 0 30px rgba(14, 165, 233, 0.4),
                0 0 60px rgba(59, 130, 246, 0.2),
                inset 0 2px 4px rgba(255, 255, 255, 0.2);
            animation: logoGlow 2s ease-in-out infinite alternate;
            will-change: box-shadow;
        }

        .logo-text {
            color: white;
            font-family: 'Inter', sans-serif;
            font-weight: 800;
            font-size: 1rem;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            letter-spacing: 1px;
        }

        .loading-text {
            color: white;
            font-size: 1.3rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 0.5rem;
            letter-spacing: 0.5px;
            background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .loading-subtitle {
            color: rgba(255, 255, 255, 0.85);
            font-size: 0.9rem;
            font-weight: 400;
            text-align: center;
            margin-bottom: 1rem;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        /* Optimized progress bar */
        .loading-progress {
            width: 100%;
            height: 3px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
            position: relative;
            margin-top: 0.5rem;
        }

        .loading-progress::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, 
                transparent, 
                rgba(14, 165, 233, 0.8) 50%, 
                rgba(168, 85, 247, 0.6)
            );
            animation: progressSlide 2s ease-in-out infinite;
            will-change: transform;
        }

        /* Optimized animations */
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @keyframes logoFloat {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-6px) scale(1.02); }
        }

        @keyframes logoGlow {
            0% { 
                box-shadow: 
                    0 0 30px rgba(14, 165, 233, 0.4),
                    0 0 60px rgba(59, 130, 246, 0.2),
                    inset 0 2px 4px rgba(255, 255, 255, 0.2);
            }
            100% { 
                box-shadow: 
                    0 0 40px rgba(14, 165, 233, 0.6),
                    0 0 80px rgba(59, 130, 246, 0.3),
                    inset 0 2px 4px rgba(255, 255, 255, 0.3);
            }
        }

        @keyframes contentFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
        }

        @keyframes progressSlide {
            0% { left: -100%; }
            100% { left: 100%; }
        }

        @keyframes fadeInUp {
            0% { 
                opacity: 0; 
                transform: translateY(15px);
            }
            100% { 
                opacity: 1; 
                transform: translateY(0);
            }
        }

        .loading-content {
            animation: fadeInUp 0.5s ease-out;
        }

        /* App container optimization */
        #app {
            opacity: 0;
            transition: opacity 0.25s ease-in;
            will-change: opacity;
        }

        #app.loaded {
            opacity: 1;
        }

        /* Performance optimizations */
        .persistent-layout {
            contain: layout style paint;
            will-change: contents;
        }

        .content-area {
            contain: layout;
            isolation: isolate;
        }

        /* Accessibility & Mobile optimizations */
        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
        }

        @media (max-width: 768px) {
            .loading-content {
                padding: 1.5rem 1rem;
                margin: 1rem;
                border-radius: 16px;
                max-width: 90vw;
            }

            .loading-logo {
                width: 60px;
                height: 60px;
                margin-bottom: 1rem;
            }

            .logo-text {
                font-size: 0.9rem;
            }

            .loading-spinner {
                width: 60px;
                height: 60px;
                margin-bottom: 1rem;
            }

            .loading-text {
                font-size: 1.1rem;
            }

            .loading-subtitle {
                font-size: 0.8rem;
            }
        }

        @media (max-width: 480px) {
            .loading-content {
                padding: 1rem 0.75rem;
                margin: 0.5rem;
            }

            .loading-logo {
                width: 50px;
                height: 50px;
            }

            .loading-spinner {
                width: 50px;
                height: 50px;
            }

            .loading-text {
                font-size: 1rem;
            }
        }

        /* Focus management */
        :focus-visible {
            outline: 2px solid var(--primary-color);
            outline-offset: 2px;
        }

        /* Print styles */
        @media print {
            body { background: white !important; color: black !important; }
            #app-loading { display: none !important; }
        }
    </style>
</head>

<body>
    <!-- Skip Navigation Link for Accessibility -->
    <a href="#main-content" class="sr-only sr-only-focusable" style="position: absolute; top: -40px; left: 6px; z-index: 10001; color: white; background: var(--primary-color); padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold;">
        Skip to main content
    </a>

    <!-- Enhanced Loading Screen with Optimized UX -->
    <div id="app-loading" aria-label="Loading application">
        <div class="loading-content">
            <!-- Optimized Logo -->
            <div class="loading-logo">
                <img src="{{ asset('assets/images/logo.png') }}" alt="Logo" style="width: 80px; height: 80px; object-fit: contain; border-radius: 12px;" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                
            </div>
            
            <!-- Optimized Loading Spinner -->
            <div class="loading-spinner" role="status" aria-label="Loading">
            </div>
            
            <!-- Text Content -->
            <div class="loading-text">Hello</div>
            <div class="loading-subtitle">Preparing your workspace...</div>
            
            <!-- Progress Bar -->
            <div class="loading-progress"></div>
        </div>
    </div>
    <!-- Inertia & Vite Scripts -->
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])

    @inertiaHead
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
                let loading = document.getElementById('app-loading');
                const app = document.getElementById('app');

                // Create loading screen if it doesn't exist
                if (!loading) {
                    loading = document.createElement('div');
                    loading.id = 'app-loading';
                    loading.setAttribute('aria-label', 'Loading application');
                    loading.innerHTML = `
                        <div class="loading-content">
                            <div class="loading-logo">
                                <img src="{{ asset('assets/images/logo.png') }}" alt="Logo" style="width: 160px; height: 160px; object-fit: contain; border-radius: 12px;" 
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                               
                            </div>
                            
                            <div class="loading-spinner" role="status" aria-label="Loading"></div>
                            
                            <div class="loading-text">${message}</div>
                            <div class="loading-subtitle">${subtitle}</div>
                            
                            <div class="loading-progress"></div>
                        </div>
                    `;
                    document.body.appendChild(loading);
                }

                if (loading && app) {
                    loading.style.opacity = '1';
                    loading.style.pointerEvents = 'auto';
                    app.classList.remove('loaded');
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
            
            // Listen for Inertia events with optimized handling
            document.addEventListener('inertia:start', function(event) {
                // Check if this is an authentication-related request
                const url = event.detail.visit.url;
                const urlString = typeof url === 'string' ? url : (url ? url.toString() : '');
                const isAuthRequest = urlString.includes('/login') || urlString.includes('/register') || urlString.includes('/logout') || urlString.includes('/password');
                
                // For optimized loading, only show for non-GET requests or slow operations
                if ((event.detail.visit.method !== 'get' || event.detail.visit.hasFiles) && !isAuthRequest) {
                    window.AppLoader.showLoading('Processing...', 'Please wait...');
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

        // Enhanced error handling
        window.addEventListener('error', function(e) {
            console.error('Unhandled error:', e.error);
            // Hide loading screen on error but show error message
            window.AppLoader.updateLoadingMessage('Error Loading', 'Attempting to recover...');
            setTimeout(() => {
                // Instead of full reload, try to navigate to dashboard
                if (window.Inertia) {
                    window.Inertia.visit('/dashboard');
                } else {
                    window.AppLoader.hideLoading();
                }
            }, 1500);
        });

        window.addEventListener('unhandledrejection', function(e) {
            console.error('Unhandled promise rejection:', e.reason);
            // Hide loading screen on error
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

    <!-- Structured Data for SEO -->
    <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "{{ config('app.name') }}",
            "description": "Comprehensive Enterprise Resource Planning System",
            "url": "{{ url('/') }}",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web Browser",
            "offers": {
                "@type": "Offer",
                "category": "Enterprise Software"
            },
            "author": {
                "@type": "Person",
                "name": "Emam Hosen"
            }
        }
    </script>
</body>

</html>