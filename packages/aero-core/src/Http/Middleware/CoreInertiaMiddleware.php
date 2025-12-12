<?php

namespace Aero\Core\Http\Middleware;

use Aero\Core\Services\NavigationRegistry;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

/**
 * Handle Inertia Requests - Core Standalone Version
 *
 * This is a simplified, standalone middleware for aero-core that works
 * without any external module dependencies. For multi-tenant or platform
 * setups, the host application can extend this class.
 */
class CoreInertiaMiddleware extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     * Uses host app's view if available, otherwise falls back to package view.
     *
     * @var string
     */
    protected $rootView = 'app';

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
        $user = Auth::user();
        
        // Share branding with blade template
        $settings = $this->getSettingsProps();
        $branding = $settings['branding'] ?? [];
        \Illuminate\Support\Facades\View::share([
            'logoUrl' => $branding['logo'] ?? asset('assets/images/logo.png'),
            'logoLightUrl' => $branding['logo_light'] ?? $branding['logo'] ?? asset('assets/images/logo.png'),
            'logoDarkUrl' => $branding['logo_dark'] ?? $branding['logo'] ?? asset('assets/images/logo.png'),
            'faviconUrl' => $branding['favicon'] ?? asset('assets/images/favicon.ico'),
            'siteName' => $settings['site']['name'] ?? config('app.name', 'aeos365'),
        ]);

        return [
            ...parent::share($request),
            'auth' => $this->getAuthProps($user, $request),
            'app' => $this->getAppProps(),
            'url' => $request->getPathInfo(),
            'csrfToken' => csrf_token(),
            'locale' => app()->getLocale(),
            'navigation' => fn () => $this->getNavigationProps($user),
            'flash' => $this->getFlashProps($request),
            'settings' => $settings,
            'branding' => $branding,
            'theme' => [
                'defaultTheme' => 'OCEAN',
                'defaultBackground' => $branding['login_background'] ?? 'pattern-1',
                'darkMode' => $branding['dark_mode'] ?? false,
                'animations' => $branding['animations'] ?? true,
            ],
        ];
    }

    /**
     * Get authentication props.
     *
     * @return array<string, mixed>
     */
    protected function getAuthProps(?Authenticatable $user, Request $request): array
    {
        if (! $user) {
            return [
                'user' => null,
                'isAuthenticated' => false,
            ];
        }

        // Load user with relationships if available
        $userWithRelations = $user;
        if (method_exists($user, 'load') && class_exists('App\Models\User')) {
            try {
                $userWithRelations = \App\Models\User::with(['designation', 'department'])->find($user->id) ?? $user;
            } catch (\Throwable $e) {
                $userWithRelations = $user;
            }
        }

        $roles = method_exists($user, 'roles') && $user->roles ? $user->roles->pluck('name')->toArray() : [];
        $isSuperAdmin = in_array('Super Administrator', $roles) || in_array('tenant_super_administrator', $roles);

        return [
            'user' => [
                'id' => $userWithRelations->id,
                'name' => $userWithRelations->name,
                'email' => $userWithRelations->email,
                'user_name' => $userWithRelations->user_name ?? null,
                'profile_image' => $userWithRelations->profile_image ?? null,
                'avatar_url' => $userWithRelations->avatar_url ?? null,
                'active' => $userWithRelations->active ?? true,
                'roles' => $roles,
                'permissions' => method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name')->toArray() : [],
                'designation' => $userWithRelations->designation->title ?? null,
                'department' => $userWithRelations->department->name ?? null,
                'is_super_admin' => $isSuperAdmin,
            ],
            'isAuthenticated' => true,
            'sessionValid' => $request->session()->isStarted(),
            'roles' => $roles,
            'isSuperAdmin' => $isSuperAdmin,
        ];
    }

    /**
     * Get application props.
     *
     * @return array<string, mixed>
     */
    protected function getAppProps(): array
    {
        return [
            'name' => config('app.name', 'Aero Core'),
            'version' => config('aero.core.version', '1.0.0'),
            'environment' => config('app.env', 'production'),
            'debug' => config('app.debug', false),
            'locale' => config('app.locale', 'en'),
            'timezone' => config('app.timezone', 'UTC'),
        ];
    }

    /**
     * Get navigation props from NavigationRegistry.
     *
     * @return array<string, mixed>
     */
    protected function getNavigationProps(?Authenticatable $user): array
    {
        if (! $user) {
            return [
                'modules' => [],
                'items' => [],
            ];
        }

        try {
            $registry = app(NavigationRegistry::class);

            return $registry->toFrontend();
        } catch (\Throwable $e) {
            return [
                'modules' => [],
                'items' => [],
            ];
        }
    }

    /**
     * Get flash message props.
     *
     * @return array<string, mixed>
     */
    protected function getFlashProps(Request $request): array
    {
        return [
            'success' => fn () => $request->session()->get('success'),
            'error' => fn () => $request->session()->get('error'),
            'warning' => fn () => $request->session()->get('warning'),
            'info' => fn () => $request->session()->get('info'),
            'message' => fn () => $request->session()->get('message'),
        ];
    }

    /**
     * Get settings props.
     *
     * @return array<string, mixed>
     */
    protected function getSettingsProps(): array
    {
        // Try to load system settings if available
        $branding = $this->getBrandingSettings();
        
        return [
            'branding' => $branding,
            'site' => [
                'name' => config('app.name', 'aeos365'),
            ],
        ];
    }

    /**
     * Get branding settings from database or config.
     *
     * @return array<string, mixed>
     */
    protected function getBrandingSettings(): array
    {
        $defaultBranding = [
            'logo' => asset('assets/images/logo.png'),
            'logo_light' => asset('assets/images/logo.png'),
            'logo_dark' => asset('assets/images/logo.png'),
            'favicon' => asset('assets/images/favicon.ico'),
            'primary_color' => '#006FEE',
            'border_radius' => '12px',
            'border_width' => '2px',
            'font_family' => 'Inter',
            'login_background' => 'pattern-1',
            'dark_mode' => false,
            'animations' => true,
        ];

        try {
            // Try to load from SystemSetting if model exists
            if (class_exists('Aero\Core\Models\Shared\SystemSetting')) {
                $setting = \Aero\Core\Models\Shared\SystemSetting::current();
                if ($setting && $setting->branding) {
                    return array_merge($defaultBranding, $setting->branding);
                }
            }
        } catch (\Throwable $e) {
            // Database might not be set up yet, use defaults
        }

        return $defaultBranding;
    }
}
