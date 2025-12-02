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
    <meta name="description" content="aeos365 - Admin Dashboard">
    <meta name="robots" content="noindex, nofollow">
    <meta name="theme-color" content="#1e3a5f">

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="{{ $faviconUrl ?? asset('assets/images/favicon.ico') }}">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ $faviconUrl ?? asset('assets/images/favicon-32x32.png') }}">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <title inertia>{{ $siteName ?? config('app.name', 'aeos365') }}</title>

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
            background-color: #f8fafc;
            min-height: 100vh;
        }

        :root {
            --primary-color: #1e3a5f;
            --secondary-color: #3b82f6;
            --text-color: #1e293b;
            --bg-color: #f8fafc;
        }

        [data-theme-mode="dark"] {
            --text-color: #f1f5f9;
            --bg-color: #0f172a;
        }

        /* Admin Loading Screen */
        #app-loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
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
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255, 255, 255, 0.2);
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .loading-text {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .loading-subtitle {
            font-size: 0.875rem;
            opacity: 0.8;
        }

        #app {
            opacity: 0;
            transition: opacity 0.3s ease;
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
            <div class="loading-text">{{ $siteName ?? 'aeos365' }} - Admin</div>
            <div class="loading-subtitle">Loading dashboard...</div>
        </div>
    </div>

    @routes
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])

    @inertiaHead
    @inertia

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                const loading = document.getElementById('app-loading');
                const app = document.getElementById('app');
                
                if (loading && app) {
                    loading.style.opacity = '0';
                    app.classList.add('loaded');
                    
                    setTimeout(() => {
                        loading.remove();
                    }, 300);
                }
            }, 500);
        });
    </script>
</body>
</html>
