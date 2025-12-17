<?php

namespace Aero\Platform\Http\Middleware;

use Aero\Core\Services\NavigationRegistry;
use Aero\Platform\Http\Resources\PlatformSettingResource;
use Aero\Platform\Http\Resources\SystemSettingResource;
use Aero\Platform\Models\Module;
use Aero\Platform\Models\PlatformSetting;
use Aero\Platform\Models\SystemSetting;
use Aero\Platform\Services\Module\RoleModuleAccessService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;
use Inertia\Middleware;
use Throwable;

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

    protected bool $resolvedPlatformSetting = false;

    protected ?PlatformSetting $cachedPlatformSetting = null;

    /**
     * Handle the incoming request.
     *
     * Root "/" handling is delegated to IdentifyDomainContext middleware
     * which runs before this and handles domain-specific redirects.
     * This middleware focuses solely on Inertia response handling.
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next)
    {
        // Delegate all Inertia response handling to parent
        return parent::handle($request, $next);
    }

    /**
     * Check if the application file lock exists and DB is accessible.
     */
    protected function isApplicationInstalled(): bool
    {
        $lockFile = storage_path('installed');

        // Check 1: Installation lock file must exist
        if (! File::exists($lockFile)) {
            return false;
        }

        // Check 2: Database must be accessible
        try {
            DB::connection()->getPdo();
        } catch (\Throwable $e) {
            \Log::warning('Installation check: Database connection failed', ['error' => $e->getMessage()]);

            return false;
        }

        // Check 3: Required tables must exist
        try {
            if (! Schema::hasTable('tenants')) {
                \Log::warning('Installation check: tenants table not found');

                return false;
            }
        } catch (\Throwable $e) {
            \Log::warning('Installation check: Schema check failed', ['error' => $e->getMessage()]);

            return false;
        }

        return true;
    }

    /**
     * Determine the root template based on domain context.
     * All views come from aero-ui package.
     */
    public function rootView(Request $request): string
    {
        // Both central and tenant contexts use the same aero-ui view
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
        $context = $this->getDomainContext($request);

        \Log::info('=== HandleInertiaRequests::share START ===', [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'context' => $context,
            'session_id' => $request->hasSession() ? $request->session()->getId() : 'NO_SESSION',
            'session_started' => $request->hasSession() && $request->session()->isStarted(),
        ]);

        // Share context-specific data
        $result = match ($context) {
            IdentifyDomainContext::CONTEXT_ADMIN => $this->shareAdminProps($request),
            IdentifyDomainContext::CONTEXT_PLATFORM => $this->sharePlatformProps($request),
            IdentifyDomainContext::CONTEXT_TENANT => $this->shareTenantProps($request),
            default => $this->sharePlatformProps($request),
        };

        \Log::info('=== HandleInertiaRequests::share END ===', [
            'context' => $context,
            'auth_user_id' => $result['auth']['user']['id'] ?? 'NULL',
            'auth_isAuthenticated' => $result['auth']['isAuthenticated'] ?? false,
        ]);

        return $result;
    }

    /**
     * Get the domain context from the request.
     */
    protected function getDomainContext(Request $request): string
    {
        return $request->attributes->get('domain_context', IdentifyDomainContext::CONTEXT_PLATFORM);
    }

    /**
     * Share props for admin panel (admin.platform.com).
     *
     * Uses the LANDLORD guard to get the authenticated super admin user.
     *
     * @return array<string, mixed>
     */
    protected function shareAdminProps(Request $request): array
    {
        // Skip database queries if installation is not complete
        if ($request->routeIs('installation.*') || $request->is('install*')) {
            // Use .env values for installation context - null for logos so frontend shows letter fallback
            View::share([
                'logoUrl' => null,
                'logoLightUrl' => null,
                'logoDarkUrl' => null,
                'faviconUrl' => null,
                'siteName' => config('app.name', 'aeos365'),
            ]);

            return [
                ...parent::share($request),
                'auth' => ['user' => null, 'isAuthenticated' => false],
                'context' => 'installation',
                'app' => [
                    'name' => config('app.name', 'aeos365'),
                    'version' => config('app.version', '1.0.0'),
                    'environment' => config('app.env', 'production'),
                ],
                'platformSettings' => [
                    'branding' => [
                        'logo' => null,
                        'logo_light' => null,
                        'logo_dark' => null,
                        'favicon' => null,
                        'primary_color' => '#006FEE',
                        'border_radius' => '12px',
                        'border_width' => '2px',
                        'font_family' => 'Inter',
                    ],
                    'site' => [
                        'name' => config('app.name', 'aeos365'),
                    ],
                ],
            ];
        }

        // IMPORTANT: Use landlord guard, not default web guard
        /** @var \App\Models\LandlordUser|null $user */
        $user = null;
        $platformSetting = null;
        $platformSettingsPayload = null;

        \Log::info('=== shareAdminProps: Starting auth check ===', [
            'session_id' => $request->hasSession() ? $request->session()->getId() : 'NO_SESSION',
            'session_started' => $request->hasSession() && $request->session()->isStarted(),
            'cookie_session_id' => $request->cookies->get(config('session.cookie')),
        ]);

        try {
            // Check session data directly
            if ($request->hasSession()) {
                $sessionData = $request->session()->all();
                $landlordKey = collect(array_keys($sessionData))->first(fn($k) => str_starts_with($k, 'login_landlord_'));
                
                \Log::info('=== shareAdminProps: Session data ===', [
                    'session_keys' => array_keys($sessionData),
                    'landlord_key' => $landlordKey,
                    'landlord_user_id_in_session' => $landlordKey ? $sessionData[$landlordKey] : null,
                ]);
            }

            $user = \Illuminate\Support\Facades\Auth::guard('landlord')->user();
            
            \Log::info('=== shareAdminProps: Auth guard result ===', [
                'guard_check' => \Illuminate\Support\Facades\Auth::guard('landlord')->check(),
                'user_id' => $user?->id,
                'user_name' => $user?->name,
                'user_email' => $user?->email,
            ]);
        } catch (\Exception $e) {
            // Database might not be set up yet, skip user loading
            \Log::warning('HandleInertiaRequests - Auth error', ['error' => $e->getMessage()]);
        }

        try {
            $platformSetting = $this->platformSetting();
        } catch (\Exception $e) {
            // Database might not be set up yet
        }
        $platformSettingsPayload = $platformSetting
            ? PlatformSettingResource::make($platformSetting)->resolve($request)
            : null;

        // Share branding with blade template - use null fallback to show letter fallback
        $branding = $platformSettingsPayload['branding'] ?? [];
        View::share([
            'logoUrl' => $branding['logo_light'] ?? $branding['logo'] ?? null,
            'logoLightUrl' => $branding['logo_light'] ?? $branding['logo'] ?? null,
            'logoDarkUrl' => $branding['logo_dark'] ?? $branding['logo'] ?? null,
            'faviconUrl' => $branding['favicon'] ?? null,
            'siteName' => $platformSettingsPayload['site']['name'] ?? config('app.name', 'aeos365'),
        ]);

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'avatar_url' => $user->avatar_url,
                    'initials' => $user->initials,
                    // Module access data for non-super-admin users
                    'module_access' => $user && ! $user->isSuperAdmin()
                        ? $this->getUserModuleAccess($user)
                        : null,
                    'accessible_modules' => $user && ! $user->isSuperAdmin()
                        ? $this->getUserAccessibleModules($user)
                        : null,
                    'modules_lookup' => $user && ! $user->isSuperAdmin()
                        ? $this->getModulesLookup()
                        : null,
                    'sub_modules_lookup' => $user && ! $user->isSuperAdmin()
                        ? $this->getSubModulesLookup()
                        : null,
                    'is_super_admin' => $user?->isSuperAdmin() ?? false,
                    'is_platform_super_admin' => $user?->hasRole('Super Administrator') ?? false,
                ] : null,
                'isAuthenticated' => (bool) $user,
                'sessionValid' => $user && $request->hasSession() && $request->session()->isStarted(),
                'isSuperAdmin' => $user?->isSuperAdmin() ?? false,
                'isAdmin' => $user?->isAdmin() ?? false,
                'role' => $user?->role,
                // Compliance: Section 10 - Frontend Super Admin flags
                'isPlatformSuperAdmin' => $user?->hasRole('Super Administrator') ?? false,
                'isTenantSuperAdmin' => false, // Admin context = platform only
            ],
            'context' => 'admin',
            'app' => [
                'name' => ($platformSettingsPayload['site']['name'] ?? config('app.name', 'aeos365')).' - Admin',
                'version' => config('app.version', '1.0.0'),
                'environment' => config('app.env', 'production'),
                'debug' => config('app.debug', false),
            ],
            'platformSettings' => $platformSettingsPayload,
            // Maintenance mode status for admin context
            'maintenance' => fn () => $this->getAdminMaintenanceStatus(),
            'url' => $request->getPathInfo(),
            'csrfToken' => csrf_token(),
            'locale' => App::getLocale(),
            'translations' => fn () => $this->getTranslations(),
            // SaaS Frontend Data - admin context always has full access
            'aero' => [
                'mode' => config('aero.mode', 'saas'),
                'subscriptions' => [], // Admin has access to all modules by default
            ],
            // Navigation from backend NavigationRegistry (module.php driven)
            'navigation' => fn () => $this->getNavigationProps($user),
            'flash' => [
                'success' => $request->hasSession() ? $request->session()->get('success') : null,
                'error' => $request->hasSession() ? $request->session()->get('error') : null,
                'warning' => $request->hasSession() ? $request->session()->get('warning') : null,
                'info' => $request->hasSession() ? $request->session()->get('info') : null,
            ],
        ];
    }

    /**
     * Share props for platform/public site (platform.com).
     *
     * @return array<string, mixed>
     */
    protected function sharePlatformProps(Request $request): array
    {
        // Skip database queries if installation is not complete
        if ($request->routeIs('installation.*') || $request->is('install*')) {
            // Use null for logos so frontend shows letter fallback
            View::share([
                'logoUrl' => null,
                'logoLightUrl' => null,
                'logoDarkUrl' => null,
                'faviconUrl' => null,
                'siteName' => config('app.name', 'aeos365'),
            ]);

            return [
                ...parent::share($request),
                'context' => 'platform',
                'auth' => ['user' => null, 'isAuthenticated' => false],
                'app' => [
                    'name' => config('app.name', 'aeos365'),
                    'version' => config('app.version', '1.0.0'),
                    'environment' => config('app.env', 'production'),
                ],
                'platformSettings' => [
                    'branding' => [
                        'logo' => null,
                        'logo_light' => null,
                        'logo_dark' => null,
                        'favicon' => null,
                        'primary_color' => '#006FEE',
                        'border_radius' => '12px',
                        'border_width' => '2px',
                        'font_family' => 'Inter',
                    ],
                    'site' => [
                        'name' => config('app.name', 'aeos365'),
                    ],
                ],
            ];
        }

        $platformSetting = $this->platformSetting();
        $platformSettingsPayload = $platformSetting
            ? PlatformSettingResource::make($platformSetting)->resolve($request)
            : null;

        // Share branding with blade template - use null fallback to show letter fallback
        $branding = $platformSettingsPayload['branding'] ?? [];
        View::share([
            'logoUrl' => $branding['logo_light'] ?? $branding['logo'] ?? null,
            'logoLightUrl' => $branding['logo_light'] ?? $branding['logo'] ?? null,
            'logoDarkUrl' => $branding['logo_dark'] ?? $branding['logo'] ?? null,
            'faviconUrl' => $branding['favicon'] ?? null,
            'siteName' => $platformSettingsPayload['site']['name'] ?? config('app.name', 'aeos365'),
        ]);

        // Get maintenance status for platform context
        $maintenanceStatus = PlatformSetting::getMaintenanceStatus();
        $isDebugMode = config('app.debug', false);

        return [
            ...parent::share($request),
            'auth' => [
                'user' => null,
                'isAuthenticated' => false,
            ],
            'context' => 'platform',
            'app' => [
                'name' => $platformSettingsPayload['site']['name'] ?? config('app.name', 'aeos365'),
                'version' => config('app.version', '1.0.0'),
                'environment' => config('app.env', 'production'),
                'debug' => $isDebugMode,
            ],
            'platformSettings' => $platformSettingsPayload,
            'platform' => [
                'modules' => $this->getAvailableModules(),
                'plans' => $this->getSubscriptionPlans(),
            ],
            'maintenance' => [
                'enabled' => $maintenanceStatus['enabled'],
                'message' => $maintenanceStatus['message'],
                'endsAt' => $maintenanceStatus['ends_at'],
                'skipVerification' => $maintenanceStatus['enabled'] || $isDebugMode,
            ],
            'url' => $request->getPathInfo(),
            'csrfToken' => $request->hasSession() ? session('csrfToken') : null,
            'locale' => App::getLocale(),
            'translations' => fn () => $this->getTranslations(),
            // SaaS Frontend Data - platform context for public site
            'aero' => [
                'mode' => config('aero.mode', 'saas'),
                'subscriptions' => [], // Public pages don't need subscriptions
            ],
            'flash' => [
                'success' => $request->hasSession() ? $request->session()->get('success') : null,
                'error' => $request->hasSession() ? $request->session()->get('error') : null,
                'warning' => $request->hasSession() ? $request->session()->get('warning') : null,
                'info' => $request->hasSession() ? $request->session()->get('info') : null,
            ],
        ];
    }

    /**
     * Share props for tenant application ({tenant}.platform.com).
     *
     * @return array<string, mixed>
     */
    protected function shareTenantProps(Request $request): array
    {
        $user = $request->user();
        $userWithRelations = $user ? \App\Models\User::with(['designation', 'attendanceType'])->find($user->id) : null;

        $systemSetting = $this->systemSetting();
        $systemSettingsPayload = $systemSetting
            ? SystemSettingResource::make($systemSetting)->resolve($request)
            : null;
        $organization = $systemSettingsPayload['organization'] ?? [];
        $companyName = $organization['company_name'] ?? config('app.name', 'aeos365');
        $branding = $systemSettingsPayload['branding'] ?? [];
        $legacyCompanySettings = $this->formatLegacyCompanySettings($organization);

        // Share branding with blade template (tenant uses logo_light for main logo) - use null fallback
        View::share([
            'logoUrl' => $branding['logo_light'] ?? null,
            'logoLightUrl' => $branding['logo_light'] ?? null,
            'logoDarkUrl' => $branding['logo_dark'] ?? null,
            'faviconUrl' => $branding['favicon'] ?? null,
            'siteName' => $organization['company_name'] ?? config('app.name', 'aeos365'),
        ]);

        // Get tenant plan limits for feature gating
        $tenantPlanLimits = $this->getTenantPlanLimits();

        // Check if user is tenant super admin (bypasses module access checks)
        $isTenantSuperAdmin = $user?->hasRole('tenant_super_administrator') ?? false;

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
                    // Module access data for dynamic access checking
                    'module_access' => $user && ! $isTenantSuperAdmin
                        ? $this->getTenantUserModuleAccess($user)
                        : null,
                    'accessible_modules' => $user && ! $isTenantSuperAdmin
                        ? $this->getTenantUserAccessibleModules($user)
                        : null,
                    'modules_lookup' => $user && ! $isTenantSuperAdmin
                        ? $this->getModulesLookup()
                        : null,
                    'sub_modules_lookup' => $user && ! $isTenantSuperAdmin
                        ? $this->getSubModulesLookup()
                        : null,
                    'is_super_admin' => $isTenantSuperAdmin,
                    'is_tenant_super_admin' => $isTenantSuperAdmin,
                ] : null,
                'isAuthenticated' => (bool) $user,
                'sessionValid' => $user && $request->session()->isStarted(),
                'roles' => $user ? $user->roles->pluck('name')->toArray() : [],
                'designation' => $userWithRelations?->designation?->title,

                // Compliance: Section 10 - Frontend Super Admin flags
                'isPlatformSuperAdmin' => $user?->hasRole('Super Administrator') ?? false,
                'isTenantSuperAdmin' => $isTenantSuperAdmin,
                'isSuperAdmin' => $isTenantSuperAdmin, // Tenant context: Super Admin = Tenant Super Admin
            ],
            'context' => 'tenant',
            'tenant' => [
                'id' => tenant('id'),
                'name' => tenant('name'),
                'subdomain' => tenant('subdomain'),
                'status' => tenant('status'),
                'modules' => tenant('modules') ?? [],
                'activeModules' => fn () => $this->getTenantActiveModules(),
                'onTrial' => tenant()?->isOnTrial() ?? false,
                'trialEndsAt' => tenant('trial_ends_at'),
            ],
            'modules' => fn () => $this->getAllModules(),
            'moduleHierarchy' => fn () => $this->getModuleHierarchy(),
            'planLimits' => $tenantPlanLimits,
            'impersonation' => [
                'active' => $request->session()->has('impersonated_by_platform'),
                'started_at' => $request->session()->get('impersonation_started_at'),
            ],
            'companySettings' => $legacyCompanySettings,
            'systemSettings' => $systemSettingsPayload,
            'branding' => $branding,
            'theme' => [
                'defaultTheme' => 'OCEAN',
                'defaultBackground' => data_get($branding, 'login_background', 'pattern-1'),
                'darkMode' => data_get($branding, 'dark_mode', false),
                'animations' => data_get($branding, 'animations', true),
            ],
            'app' => [
                'name' => $companyName,
                'version' => config('app.version', '1.0.0'),
                'debug' => config('app.debug', false),
                'environment' => config('app.env', 'production'),
            ],
            'url' => $request->getPathInfo(),
            'csrfToken' => $request->hasSession() ? session('csrfToken') : null,
            'locale' => App::getLocale(),
            'fallbackLocale' => config('app.fallback_locale', 'en'),
            'supportedLocales' => SetLocale::getSupportedLocales(),
            'translations' => fn () => $this->getTranslations(),
            // SaaS Frontend Data - enables React to show/hide module links
            'aero' => [
                'mode' => config('aero.mode', 'saas'),
                'subscriptions' => fn () => $this->getTenantSubscribedModules(),
            ],
            // Maintenance mode status for tenant context
            'maintenance' => fn () => $this->getTenantMaintenanceStatus(),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
                'email_results' => $request->session()->get('email_results'),
                'invitation_errors' => $request->session()->get('invitation_errors'),
            ],
        ];
    }

    /**
     * Get maintenance mode status for tenant context.
     *
     * Checks both platform-level and tenant-level maintenance mode.
     *
     * @return array<string, mixed>
     */
    protected function getTenantMaintenanceStatus(): array
    {
        $isDebugMode = config('app.debug', false);
        $tenant = tenant();
        
        // Check platform-level maintenance
        $platformMaintenance = PlatformSetting::getMaintenanceStatus();
        $platformMaintenanceEnabled = $platformMaintenance['enabled'] ?? false;
        
        // Check tenant-level maintenance
        $tenantMaintenanceEnabled = $tenant && method_exists($tenant, 'isInMaintenanceMode') 
            ? $tenant->isInMaintenanceMode() 
            : false;
        
        $isMaintenanceMode = $platformMaintenanceEnabled || $tenantMaintenanceEnabled;
        
        return [
            'enabled' => $isMaintenanceMode,
            'platformEnabled' => $platformMaintenanceEnabled,
            'tenantEnabled' => $tenantMaintenanceEnabled,
            'message' => $isMaintenanceMode 
                ? ($tenantMaintenanceEnabled ? 'Workspace is in maintenance mode' : $platformMaintenance['message'])
                : null,
            'endsAt' => $platformMaintenance['ends_at'] ?? null,
            'skipVerification' => $isMaintenanceMode || $isDebugMode,
        ];
    }

    /**
     * Get maintenance mode status for admin context.
     *
     * Admin context only checks platform-level maintenance mode.
     *
     * @return array<string, mixed>
     */
    protected function getAdminMaintenanceStatus(): array
    {
        $isDebugMode = config('app.debug', false);
        $platformMaintenance = PlatformSetting::getMaintenanceStatus();
        $isMaintenanceMode = $platformMaintenance['enabled'] ?? false;
        
        return [
            'enabled' => $isMaintenanceMode,
            'message' => $platformMaintenance['message'] ?? null,
            'endsAt' => $platformMaintenance['ends_at'] ?? null,
            'skipVerification' => $isMaintenanceMode || $isDebugMode,
        ];
    }

    /**
     * Get tenant plan limits for feature gating.
     *
     * Returns an array of feature limits based on the tenant's subscription plan.
     *
     * @return array<string, mixed>
     */
    protected function getTenantPlanLimits(): array
    {
        if (! tenant()) {
            return [];
        }

        $tenant = tenant();
        $plan = $tenant->plan;

        // Default limits if no plan
        $defaultLimits = [
            'max_users' => 5,
            'max_storage_gb' => 1,
            'max_projects' => 3,
            'max_documents' => 100,
            'features' => [
                'api_access' => false,
                'custom_branding' => false,
                'priority_support' => false,
                'audit_logs' => true,
                'two_factor_auth' => true,
                'sso' => false,
                'webhooks' => false,
                'custom_domains' => false,
            ],
        ];

        if (! $plan) {
            return $defaultLimits;
        }

        // Get plan-specific limits from plan features
        $planFeatures = $plan->features ?? [];

        return [
            'max_users' => $planFeatures['max_users'] ?? $defaultLimits['max_users'],
            'max_storage_gb' => $planFeatures['max_storage_gb'] ?? $defaultLimits['max_storage_gb'],
            'max_projects' => $planFeatures['max_projects'] ?? $defaultLimits['max_projects'],
            'max_documents' => $planFeatures['max_documents'] ?? $defaultLimits['max_documents'],
            'features' => array_merge($defaultLimits['features'], $planFeatures['features'] ?? []),
            'plan_name' => $plan->name,
            'plan_id' => $plan->id,
            'billing_cycle' => $tenant->subscription_plan,
        ];
    }

    /**
     * Get available modules for the platform.
     *
     * @return array<string, mixed>
     */
    protected function getAvailableModules(): array
    {
        // Return available modules for registration
        return [
            ['id' => 'hr', 'name' => 'HR Management', 'price' => 20, 'description' => 'Complete HR solution'],
            ['id' => 'project', 'name' => 'Project Management', 'price' => 20, 'description' => 'Project & task tracking'],
            ['id' => 'finance', 'name' => 'Finance', 'price' => 20, 'description' => 'Financial management'],
            ['id' => 'crm', 'name' => 'CRM', 'price' => 20, 'description' => 'Customer relationship management'],
            ['id' => 'inventory', 'name' => 'Inventory', 'price' => 20, 'description' => 'Stock management'],
            ['id' => 'pos', 'name' => 'POS', 'price' => 20, 'description' => 'Point of sale'],
            ['id' => 'dms', 'name' => 'Document Management', 'price' => 20, 'description' => 'Document storage & workflow'],
            ['id' => 'quality', 'name' => 'Quality Management', 'price' => 20, 'description' => 'Quality control & assurance'],
            ['id' => 'analytics', 'name' => 'Analytics', 'price' => 20, 'description' => 'Business intelligence'],
            ['id' => 'compliance', 'name' => 'Compliance', 'price' => 20, 'description' => 'Regulatory compliance'],
        ];
    }

    /**
     * Get subscription plans.
     *
     * @return array<string, mixed>
     */
    protected function getSubscriptionPlans(): array
    {
        return [
            [
                'id' => 'monthly',
                'name' => 'Monthly',
                'price_per_module' => 20,
                'billing_cycle' => 'monthly',
                'discount' => 0,
            ],
            [
                'id' => 'yearly',
                'name' => 'Yearly',
                'price_per_module' => 200,
                'billing_cycle' => 'yearly',
                'discount' => 17, // ~17% discount (12 months for price of 10)
            ],
        ];
    }

    /**
     * Get navigation items from NavigationRegistry.
     * Returns a flat array of navigation items ready for frontend.
     *
     * @param  mixed  $user  The authenticated user (LandlordUser or null)
     */
    protected function getNavigationProps($user): array
    {
        if (! $user) {
            return [];
        }

        try {
            if (app()->bound(NavigationRegistry::class)) {
                $registry = app(NavigationRegistry::class);

                // Platform context: only return platform-scoped navigation
                return $registry->toFrontend('platform');
            }
        } catch (\Throwable $e) {
            \Log::error('Navigation error: '.$e->getMessage());
        }

        return [];
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

    protected function formatLegacyCompanySettings(array $organization): array
    {
        if (empty($organization)) {
            return [];
        }

        $address = trim(implode(' ', array_filter([
            $organization['address_line1'] ?? null,
            $organization['address_line2'] ?? null,
        ])));

        return array_filter([
            'companyName' => $organization['company_name'] ?? null,
            'contactPerson' => $organization['contact_person'] ?? null,
            'address' => $address ?: null,
            'country' => $organization['country'] ?? null,
            'city' => $organization['city'] ?? null,
            'state' => $organization['state'] ?? null,
            'postalCode' => $organization['postal_code'] ?? null,
            'email' => $organization['support_email'] ?? null,
            'phoneNumber' => $organization['support_phone'] ?? null,
            'mobileNumber' => $organization['support_phone'] ?? null,
            'fax' => $organization['fax'] ?? null,
            'websiteUrl' => $organization['website_url'] ?? null,
        ], static fn ($value) => $value !== null && $value !== '');
    }

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

    protected function platformSetting(): ?PlatformSetting
    {
        if ($this->resolvedPlatformSetting) {
            return $this->cachedPlatformSetting;
        }

        $this->resolvedPlatformSetting = true;

        try {
            $this->cachedPlatformSetting = PlatformSetting::current();
        } catch (Throwable $exception) {
            $this->cachedPlatformSetting = null;
        }

        return $this->cachedPlatformSetting;
    }

    /**
     * Get tenant's active modules based on subscription.
     *
     * @return array<int, array{id: int, code: string, name: string, icon: string, limits: mixed}>
     */
    protected function getTenantActiveModules(): array
    {
        $tenant = tenant();

        if (! $tenant) {
            return [];
        }

        // Cache tenant's active modules for 5 minutes
        $cacheKey = "tenant_active_modules:{$tenant->id}";

        return Cache::remember($cacheKey, 300, function () use ($tenant) {
            $subscription = $tenant->currentSubscription;

            if (! $subscription || ! $subscription->plan) {
                // Return only core modules if no subscription
                return Module::where('is_core', true)
                    ->where('is_active', true)
                    ->get(['id', 'code', 'name', 'icon'])
                    ->map(fn ($module) => [
                        'id' => $module->id,
                        'code' => $module->code,
                        'name' => $module->name,
                        'icon' => $module->icon,
                        'limits' => null,
                    ])
                    ->toArray();
            }

            // Get modules from subscription plan
            return $subscription->plan
                ->modules()
                ->where('is_active', true)
                ->get(['modules.id', 'modules.code', 'modules.name', 'modules.icon', 'plan_module.limits'])
                ->map(fn ($module) => [
                    'id' => $module->id,
                    'code' => $module->code,
                    'name' => $module->name,
                    'icon' => $module->icon,
                    'limits' => $module->pivot->limits ?? null,
                ])
                ->toArray();
        });
    }

    /**
     * Get a simple array of module codes the tenant is subscribed to.
     *
     * This is used by the frontend to determine which module links to show.
     * Returns module codes like: ['hrm', 'crm', 'core']
     *
     * @return array<string>
     */
    protected function getTenantSubscribedModules(): array
    {
        $tenant = tenant();

        if (! $tenant) {
            return [];
        }

        // Cache for 5 minutes
        $cacheKey = "tenant_subscribed_modules:{$tenant->id}";

        return Cache::remember($cacheKey, 300, function () use ($tenant) {
            $moduleCodes = [];

            // Always include core modules
            $coreModules = Module::where('is_core', true)
                ->where('is_active', true)
                ->pluck('code')
                ->toArray();
            $moduleCodes = array_merge($moduleCodes, $coreModules);

            // Get modules from subscription plan
            $subscription = $tenant->currentSubscription;
            if ($subscription && $subscription->plan) {
                $planModules = $subscription->plan
                    ->modules()
                    ->where('is_active', true)
                    ->pluck('modules.code')
                    ->toArray();
                $moduleCodes = array_merge($moduleCodes, $planModules);
            }

            // Also check direct plan relationship (legacy)
            if ($tenant->plan) {
                $directPlanModules = $tenant->plan
                    ->modules()
                    ->where('is_active', true)
                    ->pluck('modules.code')
                    ->toArray();
                $moduleCodes = array_merge($moduleCodes, $directPlanModules);
            }

            // Check tenant's custom modules array (manual grants)
            if (! empty($tenant->modules) && is_array($tenant->modules)) {
                $moduleCodes = array_merge($moduleCodes, $tenant->modules);
            }

            return array_unique($moduleCodes);
        });
    }

    /**
     * Get all available modules in the system.
     *
     * @return array<int, array{id: int, code: string, name: string, description: string, icon: string, category: string, is_core: bool}>
     */
    protected function getAllModules(): array
    {
        return Cache::remember('all_modules', 3600, function () {
            return Module::where('is_active', true)
                ->orderBy('priority')
                ->get(['id', 'code', 'name', 'description', 'icon', 'category', 'is_core'])
                ->toArray();
        });
    }

    /**
     * Get complete module hierarchy for frontend (modules → submodules → components → actions).
     */
    protected function getModuleHierarchy(): array
    {
        return Cache::remember('frontend_module_hierarchy', 600, function () {
            $modules = Module::active()
                ->ordered()
                ->with([
                    'subModules' => fn ($q) => $q->where('is_active', true)->orderBy('priority'),
                    'subModules.components' => fn ($q) => $q->where('is_active', true),
                    'subModules.components.actions',
                ])
                ->get();

            return $modules->map(function ($module) {
                return [
                    'id' => $module->id,
                    'code' => $module->code,
                    'name' => $module->name,
                    'description' => $module->description,
                    'icon' => $module->icon,
                    'category' => $module->category,
                    'is_core' => $module->is_core,
                    'route_prefix' => $module->route_prefix,
                    'submodules' => $module->subModules->map(function ($subModule) {
                        return [
                            'id' => $subModule->id,
                            'code' => $subModule->code,
                            'name' => $subModule->name,
                            'description' => $subModule->description,
                            'icon' => $subModule->icon,
                            'route' => $subModule->route,
                            'components' => $subModule->components->map(function ($component) {
                                return [
                                    'id' => $component->id,
                                    'code' => $component->code,
                                    'name' => $component->name,
                                    'description' => $component->description,
                                    'type' => $component->type,
                                    'route' => $component->route,
                                    'actions' => $component->actions->map(function ($action) {
                                        return [
                                            'id' => $action->id,
                                            'code' => $action->code,
                                            'name' => $action->name,
                                            'description' => $action->description,
                                        ];
                                    })->values()->toArray(),
                                ];
                            })->values()->toArray(),
                        ];
                    })->values()->toArray(),
                ];
            })->toArray();
        });
    }

    /**
     * Get user's module access tree (for admin/landlord users).
     *
     * Returns the access tree structure for frontend access checking.
     *
     * @param  \App\Models\LandlordUser  $user
     * @return array<string, array>
     */
    protected function getUserModuleAccess($user): array
    {
        if (! $user) {
            return [];
        }

        $cacheKey = "landlord_user_module_access:{$user->id}";

        return Cache::remember($cacheKey, 600, function () use ($user) {
            $roleModuleAccessService = app(RoleModuleAccessService::class);

            // Get all roles for the user
            $roles = $user->roles ?? collect();
            if ($roles->isEmpty()) {
                return [
                    'modules' => [],
                    'sub_modules' => [],
                    'components' => [],
                    'actions' => [],
                ];
            }

            // Aggregate access from all roles
            $allModuleIds = collect();
            $allSubModuleIds = collect();
            $allComponentIds = collect();
            $allActions = collect();

            foreach ($roles as $role) {
                $accessTree = $roleModuleAccessService->getRoleAccessTree($role);
                $allModuleIds = $allModuleIds->merge($accessTree['modules'] ?? []);
                $allSubModuleIds = $allSubModuleIds->merge($accessTree['sub_modules'] ?? []);
                $allComponentIds = $allComponentIds->merge($accessTree['components'] ?? []);
                $allActions = $allActions->merge($accessTree['actions'] ?? []);
            }

            return [
                'modules' => $allModuleIds->unique()->values()->toArray(),
                'sub_modules' => $allSubModuleIds->unique()->values()->toArray(),
                'components' => $allComponentIds->unique()->values()->toArray(),
                'actions' => $allActions->unique(fn ($a) => $a['id'])->values()->toArray(),
            ];
        });
    }

    /**
     * Get accessible modules for the user (for admin/landlord users).
     *
     * @param  \App\Models\LandlordUser  $user
     * @return array<int, array{id: int, code: string, name: string}>
     */
    protected function getUserAccessibleModules($user): array
    {
        if (! $user) {
            return [];
        }

        $cacheKey = "landlord_user_accessible_modules:{$user->id}";

        return Cache::remember($cacheKey, 600, function () use ($user) {
            $roleModuleAccessService = app(RoleModuleAccessService::class);

            $roles = $user->roles ?? collect();
            if ($roles->isEmpty()) {
                return [];
            }

            $allModuleIds = collect();
            foreach ($roles as $role) {
                $moduleIds = $roleModuleAccessService->getAccessibleModuleIds($role);
                $allModuleIds = $allModuleIds->merge($moduleIds);
            }

            $uniqueModuleIds = $allModuleIds->unique()->values()->toArray();

            return Module::whereIn('id', $uniqueModuleIds)
                ->where('is_active', true)
                ->get(['id', 'code', 'name'])
                ->toArray();
        });
    }

    /**
     * Get modules lookup (id => code mapping).
     *
     * @return array<int, string>
     */
    protected function getModulesLookup(): array
    {
        return Cache::remember('modules_lookup', 3600, function () {
            return Module::where('is_active', true)
                ->pluck('code', 'id')
                ->toArray();
        });
    }

    /**
     * Get submodules lookup (id => "module.submodule" mapping).
     *
     * @return array<int, string>
     */
    protected function getSubModulesLookup(): array
    {
        return Cache::remember('sub_modules_lookup', 3600, function () {
            return \App\Models\SubModule::with('module')
                ->where('is_active', true)
                ->get()
                ->mapWithKeys(function ($subModule) {
                    return [$subModule->id => $subModule->module->code.'.'.$subModule->code];
                })
                ->toArray();
        });
    }

    /**
     * Get module access for a tenant user.
     *
     * @param  \App\Models\User  $user
     * @return array<string, array>
     */
    protected function getTenantUserModuleAccess($user): array
    {
        if (! $user || ! tenant()) {
            return [];
        }

        $cacheKey = "tenant_user_module_access:{$user->id}";

        return Cache::remember($cacheKey, 600, function () use ($user) {
            $roleModuleAccessService = app(RoleModuleAccessService::class);

            // Get all roles for the user
            $roles = $user->roles ?? collect();
            if ($roles->isEmpty()) {
                return [
                    'modules' => [],
                    'sub_modules' => [],
                    'components' => [],
                    'actions' => [],
                ];
            }

            // Aggregate access from all roles
            $allModuleIds = collect();
            $allSubModuleIds = collect();
            $allComponentIds = collect();
            $allActions = collect();

            foreach ($roles as $role) {
                $accessTree = $roleModuleAccessService->getRoleAccessTree($role);
                $allModuleIds = $allModuleIds->merge($accessTree['modules'] ?? []);
                $allSubModuleIds = $allSubModuleIds->merge($accessTree['sub_modules'] ?? []);
                $allComponentIds = $allComponentIds->merge($accessTree['components'] ?? []);
                $allActions = $allActions->merge($accessTree['actions'] ?? []);
            }

            // Filter by tenant's active modules
            $tenantActiveModuleIds = $this->getTenantActiveModuleIds();

            return [
                'modules' => $allModuleIds->unique()->filter(fn ($id) => in_array($id, $tenantActiveModuleIds))->values()->toArray(),
                'sub_modules' => $allSubModuleIds->unique()->values()->toArray(),
                'components' => $allComponentIds->unique()->values()->toArray(),
                'actions' => $allActions->unique(fn ($a) => $a['id'])->values()->toArray(),
            ];
        });
    }

    /**
     * Get accessible modules for a tenant user.
     *
     * @param  \App\Models\User  $user
     * @return array<int, array{id: int, code: string, name: string}>
     */
    protected function getTenantUserAccessibleModules($user): array
    {
        if (! $user || ! tenant()) {
            return [];
        }

        $cacheKey = "tenant_user_accessible_modules:{$user->id}";

        return Cache::remember($cacheKey, 600, function () use ($user) {
            $roleModuleAccessService = app(RoleModuleAccessService::class);

            $roles = $user->roles ?? collect();
            if ($roles->isEmpty()) {
                return [];
            }

            $allModuleIds = collect();
            foreach ($roles as $role) {
                $moduleIds = $roleModuleAccessService->getAccessibleModuleIds($role);
                $allModuleIds = $allModuleIds->merge($moduleIds);
            }

            $uniqueModuleIds = $allModuleIds->unique()->values()->toArray();

            // Filter by tenant's active modules
            $tenantActiveModuleIds = $this->getTenantActiveModuleIds();
            $filteredModuleIds = array_intersect($uniqueModuleIds, $tenantActiveModuleIds);

            return Module::whereIn('id', $filteredModuleIds)
                ->where('is_active', true)
                ->get(['id', 'code', 'name'])
                ->toArray();
        });
    }

    /**
     * Get tenant's active module IDs.
     *
     * @return array<int>
     */
    protected function getTenantActiveModuleIds(): array
    {
        if (! tenant()) {
            return [];
        }

        $cacheKey = 'tenant_active_module_ids:'.tenant('id');

        return Cache::remember($cacheKey, 1800, function () {
            $activeModules = $this->getTenantActiveModules();

            return collect($activeModules)->pluck('id')->toArray();
        });
    }
}
