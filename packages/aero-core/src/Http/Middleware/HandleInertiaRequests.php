<?php

namespace Aero\Core\Http\Middleware;

use Aero\Core\Http\Resources\SystemSettingResource;
use Aero\Core\Models\SystemSetting;
use Aero\Core\Services\NavigationRegistry;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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
    protected $rootView = 'aero-ui::app';

    protected bool $resolvedSystemSetting = false;

    protected ?SystemSetting $cachedSystemSetting = null;

    /**
     * Handle the incoming request.
     * 
     * In SaaS mode on central/admin domains, skip this middleware entirely
     * and let Platform's HandleInertiaRequests handle everything.
     * 
     * In standalone mode or on tenant domains, this middleware handles Inertia requests.
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, \Closure $next)
    {
        // In SaaS mode, skip on central/admin domains - Platform handles those
        if (is_saas_mode() && class_exists('Aero\Platform\Http\Middleware\IdentifyDomainContext')) {
            $context = $request->attributes->get('domain_context');
            
            // On admin/platform domains, let Platform's middleware handle everything
            // Using constants from Platform's IdentifyDomainContext
            $adminContext = \Aero\Platform\Http\Middleware\IdentifyDomainContext::CONTEXT_ADMIN;
            $platformContext = \Aero\Platform\Http\Middleware\IdentifyDomainContext::CONTEXT_PLATFORM;
            
            if (in_array($context, [$adminContext, $platformContext], true)) {
                return $next($request);
            }
        }

        // Intercept root route "/" and redirect appropriately (standalone mode or tenant context)
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
     * Uses aero-ui package's app.blade.php view.
     */
    public function rootView(Request $request): string
    {
        return 'aero-ui::app';
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
        // In SaaS mode with Platform active:
        // - Admin context: Platform's HandleInertiaRequests provides everything
        // - Tenant context: Core provides tenant navigation, Platform provides tenant-specific props
        $context = $request->attributes->get('domain_context', 'tenant');
        $isSaaSMode = is_saas_mode();
        
        // Skip sharing props for admin/platform contexts in SaaS mode
        // Platform's HandleInertiaRequests handles those contexts completely
        if ($isSaaSMode && ($context === 'admin' || $context === 'platform')) {
            return parent::share($request);
        }

        try {
            $user = $request->user();
        } catch (QueryException $exception) {
            // If the users table is missing on this connection (often during early tenant setup),
            // avoid crashing Inertia sharing and proceed as unauthenticated.
            if ($exception->getCode() === '42S02') {
                Log::warning('Skipping auth user share because users table is missing', [
                    'path' => $request->path(),
                    'host' => $request->getHost(),
                ]);
                $user = null;
            } else {
                throw $exception;
            }
        }

        $systemSetting = $this->systemSetting();
        $systemSettingsPayload = $systemSetting
            ? SystemSettingResource::make($systemSetting)->resolve($request)
            : null;

        $organization = $systemSettingsPayload['organization'] ?? [];
        $branding = $systemSettingsPayload['branding'] ?? [];
        $companyName = $organization['company_name'] ?? config('app.name', 'Aero ERP');

        // Share branding with blade template - use null fallback to show letter fallback
        View::share([
            'logoUrl' => $branding['logo_light'] ?? $branding['logo'] ?? null,
            'logoLightUrl' => $branding['logo_light'] ?? $branding['logo'] ?? null,
            'logoDarkUrl' => $branding['logo_dark'] ?? $branding['logo'] ?? null,
            'faviconUrl' => $branding['favicon'] ?? null,
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
        if (! $user) {
            return [
                'user' => null,
                'isAuthenticated' => false,
            ];
        }

        $roles = $user->roles?->pluck('name')->toArray() ?? [];
        $isSuperAdmin = in_array('Super Administrator', $roles) || in_array('tenant_super_administrator', $roles);

        // Get permissions safely - may fail if permissions table doesn't exist
        $permissions = [];
        try {
            if (method_exists($user, 'getAllPermissions')) {
                $permissions = $user->getAllPermissions()->pluck('name')->toArray();
            }
        } catch (\Throwable $e) {
            // Permissions table may not exist - using module access instead
            $permissions = [];
        }

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url ?? null,
                'roles' => $roles,
                'permissions' => $permissions,
                'is_super_admin' => $isSuperAdmin,
            ],
            'isAuthenticated' => true,
            'sessionValid' => true,
            'isSuperAdmin' => $isSuperAdmin,
        ];
    }

    /**
     * Get navigation items from NavigationRegistry.
     * Returns a flat array of navigation items ready for frontend.
     */
    protected function getNavigationProps($user): array
    {
        if (! $user) {
            return [];
        }

        try {
            if (app()->bound(NavigationRegistry::class)) {
                $registry = app(NavigationRegistry::class);

                // Tenant context: only return tenant-scoped navigation
                $navigation = $registry->toFrontend('tenant');

                // Debug: Log navigation data
                \Log::debug('Navigation data:', [
                    'count' => count($navigation),
                    'items' => $navigation,
                ]);

                return $navigation;
            }
        } catch (Throwable $e) {
            \Log::error('Navigation error: '.$e->getMessage());
        }

        return [];
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
