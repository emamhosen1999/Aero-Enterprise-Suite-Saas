<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="ltr">

<head>
    <!-- Essential Meta Tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=yes maximum-scale=1 user-scalable=yes">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- SEO & Basic Meta -->
    <meta name="description" content="{{ config('app.name', 'Aero Core') }} - Enterprise Application">
    <meta name="author" content="Aero Suite">
    <meta name="theme-color" content="#134e9d">

    <!-- Title -->
    <title inertia>{{ config('app.name', 'Aero Core') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">

    <!-- Inertia Head -->
    @inertiaHead

    <!-- Ziggy Routes -->
    @routes

    <!-- Vite Assets -->
    @vite(['vendor/aero/core/resources/css/app.css', 'vendor/aero/core/resources/js/app.jsx'])

    <!-- Critical CSS for Theme Variables -->
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
            --borderRadius: 12px;
            --borderWidth: 2px;
            --fontFamily: 'Inter', 'Segoe UI', sans-serif;
        }

        /* Dark mode variables */
        [data-theme-mode="dark"],
        .dark {
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

        /* Enhanced Background System */
        body {
            background: var(--background, #ffffff);
            min-height: 100vh;
            transition: background 0.3s ease, background-color 0.3s ease;
        }

        [data-theme-mode="dark"] body,
        .dark body {
            background: var(--background, #0a0a0a);
        }
    </style>
</head>

<body class="font-sans antialiased">
    <!-- Inertia App -->
    @inertia
</body>

</html>
