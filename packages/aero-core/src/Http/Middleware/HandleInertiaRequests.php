<?php

namespace Aero\Core\Http\Middleware;

use Aero\Core\Http\Resources\SystemSettingResource;
use Aero\Core\Models\SystemSetting;
use Aero\Core\Services\NavigationRegistry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\View;
use Inertia\Middleware;
use Throwable;

/**
 * Handle Inertia Requests - Core Package Middleware
 *
 * This is the primary Inertia middleware for aero-core package.
 * It provides all shared props, handles root route redirection,
 * and integrates with NavigationRegistry.
 */
class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'aero-core::app';

    protected bool $resolvedSystemSetting = false;

    protected ?SystemSetting $cachedSystemSetting = null;

    /**
     * Handle the incoming request.
     * Intercepts root route to redirect to dashboard or login.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, \Closure $next)
    {
        // Intercept root route "/" and redirect appropriately
        // This ensures the package works without modifying host app routes
        if ($request->is('/') || $request->path() === '/') {
            if (Auth::check()) {
                return redirect('/dashboard');
            }
            return redirect('/login');
        }

        return parent::handle($request, $next);
    }

    /**
     * Get the root view.
     * Uses host app's view if available, otherwise package view.
     */
    public function rootView(Request $request): string
    {
        // Use host app's app.blade.php if it exists
        if (view()->exists('app')) {
            return 'app';
        }

        // Fall back to package's view
        return 'aero-core::app';
    }

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
        $user = $request->user();
        
        $systemSetting = $this->systemSetting();
        $systemSettingsPayload = $systemSetting
            ? SystemSettingResource::make($systemSetting)->resolve($request)
            : null;
            
        $organization = $systemSettingsPayload['organization'] ?? [];
        $branding = $systemSettingsPayload['branding'] ?? [];
        $companyName = $organization['company_name'] ?? config('app.name', 'Aero ERP');

        // Share branding with blade template
        View::share([
            'logoUrl' => $branding['logo_light'] ?? $branding['logo'] ?? asset('assets/images/logo.png'),
            'logoLightUrl' => $branding['logo_light'] ?? $branding['logo'] ?? asset('assets/images/logo.png'),
            'logoDarkUrl' => $branding['logo_dark'] ?? $branding['logo'] ?? asset('assets/images/logo.png'),
            'faviconUrl' => $branding['favicon'] ?? asset('assets/images/favicon.ico'),
            'siteName' => $companyName,
        ]);

        return [
            ...parent::share($request),
            'auth' => $this->getAuthProps($user),
            'app' => [
                'name' => $companyName,
                'version' => config('app.version', '1.0.0'),
                'environment' => config('app.env', 'production'),
            ],
            'systemSettings' => $systemSettingsPayload,
            'branding' => $branding,
            'theme' => [
                'defaultTheme' => 'OCEAN',
                'defaultBackground' => data_get($branding, 'login_background', 'pattern-1'),
                'darkMode' => data_get($branding, 'dark_mode', false),
                'animations' => data_get($branding, 'animations', true),
            ],
            'url' => $request->getPathInfo(),
            'csrfToken' => csrf_token(),
            'locale' => App::getLocale(),
            'translations' => fn () => $this->getTranslations(),
            'navigation' => fn () => $this->getNavigationProps($user),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
            ],
        ];
    }

    /**
     * Get authentication props.
     *
     * @return array<string, mixed>
     */
    protected function getAuthProps($user): array
    {
        if (!$user) {
            return [
                'user' => null,
                'isAuthenticated' => false,
            ];
        }

        $roles = $user->roles?->pluck('name')->toArray() ?? [];
        $isSuperAdmin = in_array('Super Administrator', $roles) || in_array('tenant_super_administrator', $roles);

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url ?? null,
                'roles' => $roles,
                'permissions' => method_exists($user, 'getAllPermissions') 
                    ? $user->getAllPermissions()->pluck('name')->toArray() 
                    : [],
                'is_super_admin' => $isSuperAdmin,
            ],
            'isAuthenticated' => true,
            'sessionValid' => true,
            'isSuperAdmin' => $isSuperAdmin,
        ];
    }

    /**
     * Get navigation props from NavigationRegistry.
     *
     * @return array<string, mixed>
     */
    protected function getNavigationProps($user): array
    {
        if (!$user) {
            return [
                'modules' => [],
                'items' => [],
            ];
        }

        try {
            if (app()->bound(NavigationRegistry::class)) {
                $registry = app(NavigationRegistry::class);
                return $registry->toFrontend();
            }
        } catch (Throwable $e) {
            // Silently fail
        }

        return [
            'modules' => [],
            'items' => [],
        ];
    }

    /**
     * Get translations for the current locale.
     *
     * @return array<string, mixed>
     */
    protected function getTranslations(): array
    {
        $locale = App::getLocale();
        $translations = [];

        // Load JSON translations
        $jsonPath = lang_path("{$locale}.json");
        if (file_exists($jsonPath)) {
            $jsonTranslations = json_decode(file_get_contents($jsonPath), true);
            if ($jsonTranslations) {
                $translations = $jsonTranslations;
            }
        }

        return $translations;
    }

    /**
     * Get system setting (cached).
     */
    protected function systemSetting(): ?SystemSetting
    {
        if ($this->resolvedSystemSetting) {
            return $this->cachedSystemSetting;
        }

        $this->resolvedSystemSetting = true;

        try {
            $this->cachedSystemSetting = SystemSetting::current();
        } catch (Throwable $exception) {
            $this->cachedSystemSetting = null;
        }

        return $this->cachedSystemSetting;
    }
}
