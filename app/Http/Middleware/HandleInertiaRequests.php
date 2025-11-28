<?php

namespace App\Http\Middleware;

use App\Models\CompanySetting;
use App\Services\Module\ModulePermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Check if route requires authentication and redirect immediately if not authenticated
        // This prevents sharing any authenticated data to unauthenticated users
        if (! $request->user() && ! $this->isPublicRoute($request)) {
            // For Inertia requests, we need to handle this carefully
            // The auth middleware will handle the actual redirect
            // But we ensure no authenticated data is shared
        }

        $user = $request->user();
        $userWithRelations = $user ? \App\Models\User::with(['designation', 'attendanceType'])->find($user->id) : null;

        // Get company settings for global use
        $companySettings = CompanySetting::first();
        $companyName = $companySettings?->companyName ?? config('app.name', 'DBEDC ERP');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $userWithRelations ? [
                    ...$userWithRelations->toArray(),
                    'attendance_type' => $userWithRelations->attendanceType ? [
                        'id' => $userWithRelations->attendanceType->id,
                        'name' => $userWithRelations->attendanceType->name,
                        'slug' => $userWithRelations->attendanceType->slug,
                    ] : null,
                ] : null,
                'isAuthenticated' => (bool) $user,
                'sessionValid' => $user && $request->session()->isStarted(),
                'roles' => $user ? $user->roles->pluck('name')->toArray() : [],
                'permissions' => $user ? $user->getAllPermissions()->pluck('name')->toArray() : [],
                'designation' => $userWithRelations?->designation?->title,
                // Module-based navigation from Module Permission Registry
                'accessibleModules' => fn () => $user
                    ? app(ModulePermissionService::class)->getNavigationForUser($user)
                    : [],
            ],

            // Company Settings
            'companySettings' => $companySettings,

            // Theme and UI Configuration
            'theme' => [
                'defaultTheme' => 'OCEAN',
                'defaultBackground' => 'pattern-1',
                'darkMode' => false,
                'animations' => true,
            ],

            // Application Configuration
            'app' => [
                'name' => $companyName,
                'version' => config('app.version', '1.0.0'),
                'debug' => config('app.debug', false),
                'environment' => config('app.env', 'production'),
            ],

            'url' => $request->getPathInfo(),
            'csrfToken' => session('csrfToken'),

            // Localization - shared on every request
            'locale' => App::getLocale(),
            'fallbackLocale' => config('app.fallback_locale', 'en'),
            'supportedLocales' => SetLocale::getSupportedLocales(),
            'translations' => fn () => $this->getTranslations(),
        ];
    }

    /**
     * Get translations for the current locale.
     *
     * Translations are loaded lazily to avoid performance impact on every request.
     * Only the necessary namespaces are loaded based on the current route.
     *
     * @return array<string, mixed>
     */
    protected function getTranslations(): array
    {
        $locale = App::getLocale();
        $translations = [];

        // Always load common translations
        $namespaces = ['common', 'navigation', 'validation'];

        // Add route-specific translations
        $routeName = request()->route()?->getName() ?? '';
        if (str_contains($routeName, 'dashboard')) {
            $namespaces[] = 'dashboard';
        }
        if (str_contains($routeName, 'employee') || str_contains($routeName, 'department') || str_contains($routeName, 'designation') || str_contains($routeName, 'leave') || str_contains($routeName, 'attendance')) {
            $namespaces[] = 'hr';
        }
        if (str_contains($routeName, 'device')) {
            $namespaces[] = 'device';
        }

        // Load PHP translation files
        foreach ($namespaces as $namespace) {
            $path = lang_path("{$locale}/{$namespace}.php");
            if (file_exists($path)) {
                $translations[$namespace] = require $path;
            }
        }

        // Load JSON translations (flat keys for simple lookups)
        $jsonPath = lang_path("{$locale}.json");
        if (file_exists($jsonPath)) {
            $jsonTranslations = json_decode(file_get_contents($jsonPath), true);
            if ($jsonTranslations) {
                $translations = array_merge($translations, $jsonTranslations);
            }
        }

        return $translations;
    }

    /**
     * Check if the current route is public (doesn't require authentication).
     */
    protected function isPublicRoute(Request $request): bool
    {
        $publicRoutes = [
            'login',
            'register',
            'password.request',
            'password.reset',
            'password.email',
            'password.update',
            'verification.notice',
        ];

        $currentRoute = $request->route();

        if (! $currentRoute) {
            return false;
        }

        $routeName = $currentRoute->getName();

        return in_array($routeName, $publicRoutes) ||
               str_starts_with($request->path(), 'login') ||
               str_starts_with($request->path(), 'register') ||
               str_starts_with($request->path(), 'forgot-password') ||
               str_starts_with($request->path(), 'reset-password');
    }
}
