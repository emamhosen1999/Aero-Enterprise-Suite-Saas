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
        }

        [data-theme-mode="dark"] {
            --text-color: #f1f5f9;
            --bg-color: #0f172a;
        }

        /* Platform Loading Screen */
        #app-loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 50%, #f59e0b 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: opacity 0.4s ease;
        }

        .loading-content {
            text-align: center;
            color: white;
            padding: 2rem;
        }

        .loading-logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: logoFloat 2.5s ease-in-out infinite;
        }

        @keyframes logoFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }

        .loading-spinner {
            width: 48px;
            height: 48px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .loading-text {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        .loading-subtitle {
            font-size: 1rem;
            opacity: 0.9;
            font-weight: 400;
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
    <div id="app-loading" aria-label="Loading">
        <div class="loading-content">
            <div class="loading-logo">
                <img src="{{ $logoUrl ?? asset('assets/images/logo.png') }}" alt="{{ $siteName ?? 'aeos365' }}" style="width: 80px; height: 80px; object-fit: contain;" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display: none; width: 80px; height: 80px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 16px; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: white;">
                    {{ substr($siteName ?? 'aeos365', 0, 1) }}
                </div>
            </div>
            <div class="loading-spinner"></div>
            <div class="loading-text">{{ $siteName ?? 'aeos365' }}</div>
            <div class="loading-subtitle">Preparing your experience...</div>
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
