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
     * Determine the root template based on domain context.
     */
    public function rootView(Request $request): string
    {
        $context = $this->getDomainContext($request);

        return match ($context) {
            IdentifyDomainContext::CONTEXT_ADMIN => 'admin',
            IdentifyDomainContext::CONTEXT_PLATFORM => 'platform',
            IdentifyDomainContext::CONTEXT_TENANT => 'app',
            default => 'app',
        };
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

        // Share context-specific data
        return match ($context) {
            IdentifyDomainContext::CONTEXT_ADMIN => $this->shareAdminProps($request),
            IdentifyDomainContext::CONTEXT_PLATFORM => $this->sharePlatformProps($request),
            IdentifyDomainContext::CONTEXT_TENANT => $this->shareTenantProps($request),
            default => $this->sharePlatformProps($request),
        };
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
     * @return array<string, mixed>
     */
    protected function shareAdminProps(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? $user->toArray() : null,
                'isAuthenticated' => (bool) $user,
                'isSuperAdmin' => $user?->hasRole('super-admin') ?? false,
            ],
            'context' => 'admin',
            'app' => [
                'name' => config('app.name', 'Aero Enterprise Suite').' - Admin',
                'version' => config('app.version', '1.0.0'),
                'environment' => config('app.env', 'production'),
            ],
            'url' => $request->getPathInfo(),
            'csrfToken' => session('csrfToken'),
            'locale' => App::getLocale(),
            'translations' => fn () => $this->getTranslations(),
        ];
    }

    /**
     * Share props for platform/public site (platform.com).
     *
     * @return array<string, mixed>
     */
    protected function sharePlatformProps(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => null,
                'isAuthenticated' => false,
            ],
            'context' => 'platform',
            'app' => [
                'name' => config('app.name', 'Aero Enterprise Suite'),
                'version' => config('app.version', '1.0.0'),
                'environment' => config('app.env', 'production'),
            ],
            'platform' => [
                'modules' => $this->getAvailableModules(),
                'plans' => $this->getSubscriptionPlans(),
            ],
            'url' => $request->getPathInfo(),
            'csrfToken' => session('csrfToken'),
            'locale' => App::getLocale(),
            'translations' => fn () => $this->getTranslations(),
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

        // Get company settings for the tenant
        $companySettings = null;
        try {
            $companySettings = CompanySetting::first();
        } catch (\Exception $e) {
            // Table might not exist yet for new tenants
        }

        $companyName = $companySettings?->companyName ?? config('app.name', 'Aero Enterprise Suite');

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
                'accessibleModules' => fn () => $user
                    ? app(ModulePermissionService::class)->getNavigationForUser($user)
                    : [],
            ],
            'context' => 'tenant',
            'tenant' => [
                'id' => tenant('id'),
                'name' => tenant('name'),
                'subdomain' => tenant('subdomain'),
            ],
            'companySettings' => $companySettings,
            'theme' => [
                'defaultTheme' => 'OCEAN',
                'defaultBackground' => 'pattern-1',
                'darkMode' => false,
                'animations' => true,
            ],
            'app' => [
                'name' => $companyName,
                'version' => config('app.version', '1.0.0'),
                'debug' => config('app.debug', false),
                'environment' => config('app.env', 'production'),
            ],
            'url' => $request->getPathInfo(),
            'csrfToken' => session('csrfToken'),
            'locale' => App::getLocale(),
            'fallbackLocale' => config('app.fallback_locale', 'en'),
            'supportedLocales' => SetLocale::getSupportedLocales(),
            'translations' => fn () => $this->getTranslations(),
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
