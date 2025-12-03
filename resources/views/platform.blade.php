<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="ltr">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">

    <!-- Security -->
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="X-XSS-Protection" content="1; mode=block">

    <!-- SEO -->
    <meta name="description" content="aeos365 - Complete SaaS Platform for Business Management. HR, Project Management, Finance, CRM, and more.">
    <meta name="keywords" content="SaaS, Enterprise, HR Management, Project Management, CRM, Business Software">
    <meta name="author" content="aeos365">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#0ea5e9">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="aeos365 - Enterprise SaaS Platform">
    <meta property="og:description" content="Complete SaaS solution for business management">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:site_name" content="aeos365">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="aeos365">
    <meta name="twitter:description" content="Complete SaaS solution for business management">

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="{{ $faviconUrl ?? asset('assets/images/favicon.ico') }}">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ $faviconUrl ?? asset('assets/images/favicon-32x32.png') }}">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <title inertia>{{ $siteName ?? 'aeos365' }}</title>

    <style>
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
            font-family: 'Inter', 'Segoe UI', sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #1e293b;
            background-color: #ffffff;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        :root {
            --primary-color: #0ea5e9;
            --secondary-color: #8b5cf6;
            --accent-color: #f59e0b;
            --text-color: #1e293b;
            --bg-color: #ffffff;
            --theme-primary: #3b82f6;
            --theme-success: #22c55e;
            --theme-warning: #f59e0b;
            --theme-secondary: #a855f7;
            --borderRadius: 16px;
            --fontFamily: 'Inter', sans-serif;
        }

        [data-theme-mode="dark"] {
            --text-color: #f1f5f9;
            --bg-color: #0f172a;
            --theme-primary: #60a5fa;
            --theme-success: #4ade80;
        }

        /* Unified Loading Screen - Theme-Aware with Smooth Transitions */
        #app-loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            /* Light mode gradient */
            background: 
                linear-gradient(135deg, 
                    rgba(248, 250, 252, 0.98) 0%, 
                    rgba(241, 245, 249, 0.95) 50%, 
                    rgba(226, 232, 240, 0.92) 100%
                );
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 1;
            transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), 
                        transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
                        background 0.3s ease;
            overflow: hidden;
            will-change: opacity, transform;
        }

        /* Dark mode loading screen */
        [data-theme-mode="dark"] #app-loading,
        .dark #app-loading {
            background: 
                linear-gradient(135deg, 
                    rgba(15, 23, 42, 0.98) 0%, 
                    rgba(30, 41, 59, 0.95) 50%, 
                    rgba(51, 65, 85, 0.92) 100%
                );
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
            padding: 2.5rem 3rem;
            /* Light mode glassmorphism */
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border-radius: var(--borderRadius, 20px);
            border: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.08),
                0 16px 48px rgba(0, 0, 0, 0.04),
                inset 0 1px 1px rgba(255, 255, 255, 0.8);
            max-width: 320px;
            text-align: center;
            will-change: transform;
            transition: all 0.3s ease;
            animation: fadeInUp 0.5s ease-out;
        }

        /* Dark mode glassmorphism */
        [data-theme-mode="dark"] .loading-content,
        .dark .loading-content {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.4),
                0 16px 48px rgba(0, 0, 0, 0.2),
                inset 0 1px 1px rgba(255, 255, 255, 0.05);
        }

        /* Squared Logo Container - Medium Size */
        .loading-logo {
            width: 100px;
            height: 100px;
            margin-bottom: 1.5rem;
            position: relative;
            border-radius: var(--borderRadius, 16px);
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .loading-logo:hover {
            transform: scale(1.05);
        }

        [data-theme-mode="dark"] .loading-logo,
        .dark .loading-logo {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        .loading-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: var(--borderRadius, 16px);
            background: white;
        }

        [data-theme-mode="dark"] .loading-logo img,
        .dark .loading-logo img {
            background: rgba(30, 41, 59, 0.5);
        }

        /* Fallback logo letter */
        .loading-logo-fallback {
            display: none;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, var(--theme-primary, #3b82f6) 0%, #8b5cf6 100%);
            border-radius: var(--borderRadius, 16px);
            align-items: center;
            justify-content: center;
            font-size: 42px;
            font-weight: 700;
            color: white;
            text-transform: uppercase;
        }

        /* Loading Spinner - Dual ring style from app.blade */
        .loading-spinner {
            width: 48px;
            height: 48px;
            position: relative;
            margin-bottom: 1.25rem;
            will-change: transform;
        }

        .loading-spinner::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 3px solid rgba(0, 0, 0, 0.08);
            border-top: 3px solid var(--theme-primary, #3b82f6);
            border-right: 3px solid var(--theme-success, #22c55e);
            border-radius: 50%;
            animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        [data-theme-mode="dark"] .loading-spinner::before,
        .dark .loading-spinner::before {
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top: 3px solid var(--theme-primary, #60a5fa);
            border-right: 3px solid var(--theme-success, #4ade80);
        }

        .loading-spinner::after {
            content: '';
            position: absolute;
            top: 8px;
            left: 8px;
            width: calc(100% - 16px);
            height: calc(100% - 16px);
            border: 2px solid transparent;
            border-bottom: 2px solid var(--theme-warning, #f59e0b);
            border-left: 2px solid var(--theme-secondary, #a855f7);
            border-radius: 50%;
            animation: spin 0.8s linear infinite reverse;
        }

        .loading-text {
            font-size: 1.25rem;
            font-weight: 600;
            text-align: center;
            margin-bottom: 0.5rem;
            letter-spacing: 0.02em;
            color: var(--text-color, #1e293b);
            font-family: var(--fontFamily, 'Inter', sans-serif);
            transition: color 0.3s ease;
        }

        [data-theme-mode="dark"] .loading-text,
        .dark .loading-text {
            color: #f1f5f9;
        }

        .loading-subtitle {
            font-size: 0.875rem;
            font-weight: 400;
            text-align: center;
            color: #64748b;
            font-family: var(--fontFamily, 'Inter', sans-serif);
            transition: color 0.3s ease;
        }

        [data-theme-mode="dark"] .loading-subtitle,
        .dark .loading-subtitle {
            color: #94a3b8;
        }

        /* Animations */
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
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

        /* Responsive */
        @media (max-width: 768px) {
            .loading-content {
                padding: 2rem 1.5rem;
                margin: 1rem;
                max-width: 90vw;
            }

            .loading-logo {
                width: 80px;
                height: 80px;
            }

            .loading-logo-fallback {
                font-size: 36px;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
            }

            .loading-text {
                font-size: 1.1rem;
            }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                transition-duration: 0.01ms !important;
            }
        }

        #app {
            opacity: 0;
            transition: opacity 0.4s ease;
        }

        #app.loaded {
            opacity: 1;
        }
    </style>
</head>

<body>
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
            <div class="loading-subtitle" aria-hidden="true">Preparing your experience...</div>
            <span class="sr-only" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;">Loading {{ $siteName ?? 'aeos365' }}, please wait...</span>
        </div>
    </div>

    @routes
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])

    @inertiaHead
    @inertia

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Hide loading screen when React is ready
            const hideLoading = () => {
                const loading = document.getElementById('app-loading');
                const app = document.getElementById('app');
                
                if (loading && app) {
                    loading.style.opacity = '0';
                    app.classList.add('loaded');
                    
                    setTimeout(() => {
                        loading.remove();
                    }, 400);
                }
            };

            // Check if React content is loaded
            const checkReady = () => {
                if (document.querySelector('#app > *')) {
                    hideLoading();
                    return true;
                }
                return false;
            };

            // Try immediately
            if (!checkReady()) {
                // Check periodically
                let attempts = 0;
                const interval = setInterval(() => {
                    attempts++;
                    if (checkReady() || attempts > 30) {
                        clearInterval(interval);
                        if (attempts > 30) hideLoading();
                    }
                }, 100);
            }

            // Fallback timeout
            setTimeout(hideLoading, 3000);
        });
    </script>
</body>
</html>
