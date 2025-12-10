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
        
        // Module registration helper
        window.Aero.register = function(name, pages) {
            console.log('[Aero] Registering module:', name);
            window.Aero.modules[name] = pages;
        };
    </script>

    {{-- Inject Runtime Modules (Standalone Mode) --}}
    @if(config('aero.mode') === 'standalone')
        @php
            $injectableModules = app('aero.module')->getInjectableModules();
        @endphp

        @if(count($injectableModules) > 0)
            <script>
                console.log('[Aero] Loading {{ count($injectableModules) }} runtime modules');
            </script>

            @foreach($injectableModules as $module)
                {{-- Load module CSS if exists --}}
                @if(isset($module['assets']['css']) && file_exists(public_path($module['assets']['css'])))
                    <link rel="stylesheet" href="{{ asset($module['assets']['css']) }}">
                @endif

                {{-- Load module JavaScript --}}
                @if(isset($module['assets']['js']))
                    <script>
                        console.log('[Aero] Loading module: {{ $module['display_name'] }} ({{ $module['short_name'] }})');
                    </script>
                    
                    {{-- Load module bundle as ES module --}}
                    <script type="module" src="{{ asset($module['assets']['js']) }}"></script>
                @endif
            @endforeach
        @endif
    @endif
</head>
<body class="font-sans antialiased">
    @inertia
</body>
</html>
