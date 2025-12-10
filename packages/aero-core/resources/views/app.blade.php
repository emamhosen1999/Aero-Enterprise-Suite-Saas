<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>{{ config('app.name', 'Aero ERP') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Scripts -->
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.jsx', "resources/css/app.css"])
    @inertiaHead

    <script>
        // Set application mode for frontend
        window.Aero = window.Aero || {};
        window.Aero.mode = '{{ config("aero.mode", "standalone") }}';
        window.Aero.modules = window.Aero.modules || {};
    </script>

    {{-- Inject Runtime Modules (Standalone Mode) --}}
    @if(config('aero.mode') === 'standalone' && function_exists('getRuntimeModules'))
        @php
            $runtimeModules = getRuntimeModules();
        @endphp

        @foreach($runtimeModules as $module)
            {{-- Load module CSS if exists --}}
            @if(isset($module['css']) && file_exists(public_path($module['css'])))
                <link rel="stylesheet" href="{{ asset($module['css']) }}">
            @endif

            {{-- Load module JavaScript --}}
            @if(isset($module['js']) && file_exists(public_path($module['js'])))
                <script>
                    console.log('[Aero] Loading runtime module: {{ $module['name'] }}');
                </script>
                
                {{-- Load shared dependencies first (if not already loaded) --}}
                @if(!isset($sharedDepsLoaded))
                    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
                    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
                    @php $sharedDepsLoaded = true; @endphp
                @endif

                {{-- Load module bundle --}}
                <script src="{{ asset($module['js']) }}" defer></script>

                {{-- Register module with Aero --}}
                <script>
                    // Wait for module to load, then register
                    (function() {
                        const moduleName = '{{ $module['name'] }}';
                        const checkInterval = setInterval(function() {
                            // Check if module's global variable is available
                            // e.g., window.AeroHrm for aero-hrm module
                            const globalName = 'Aero' + moduleName.charAt(0).toUpperCase() + moduleName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                            
                            if (window[globalName]) {
                                window.Aero.registerModule(moduleName.charAt(0).toUpperCase() + moduleName.slice(1), window[globalName]);
                                clearInterval(checkInterval);
                            }
                        }, 50);

                        // Timeout after 10 seconds
                        setTimeout(() => clearInterval(checkInterval), 10000);
                    })();
                </script>
            @endif
        @endforeach
    @endif
</head>
<body class="font-sans antialiased">
    @inertia
</body>
</html>
