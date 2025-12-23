<?php

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    /**
     * The application's global HTTP middleware stack.
     */
    protected $middleware = [
        // Aero\Platform\Http\Middleware\TrustHosts::class,
        Aero\Platform\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\HandleCors::class,
        Aero\Platform\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
        Aero\Platform\Http\Middleware\TrimStrings::class,
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
        Aero\Platform\Http\Middleware\SetDatabaseConnectionFromDomain::class, // Set DB connection based on domain BEFORE sessions
        Aero\Platform\Http\Middleware\DeviceAuthMiddleware::class, // Global device authentication
    ];

    /**
     * The application's route middleware groups.
     */
    protected $middlewareGroups = [
        'web' => [
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            Aero\Platform\Http\Middleware\SetLocale::class, // Locale detection before Inertia
            Aero\Platform\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            Aero\Platform\Http\Middleware\Cors::class,
        ],

        'api' => [
            // \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
    ];

    /**
     * The application's middleware aliases.
     */
    protected $middlewareAliases = [
        'auth' => Aero\Platform\Http\Middleware\Authenticate::class,
        'auth.basic' => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
        'auth.session' => \Illuminate\Session\Middleware\AuthenticateSession::class,
        'cache.headers' => \Illuminate\Http\Middleware\SetCacheHeaders::class,
        'can' => \Illuminate\Auth\Middleware\Authorize::class,
        'guest' => \Aero\Core\Http\Middleware\RedirectIfAuthenticated::class,
        'password.confirm' => \Illuminate\Auth\Middleware\RequirePassword::class,
        'precognitive' => \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
        'signed' => \Illuminate\Routing\Middleware\ValidateSignature::class,
        'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
        'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
        // Spatie Permission Middleware
        'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
        'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
        'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        // Custom Security Middleware
        'api_security' => Aero\Platform\Http\Middleware\ApiSecurityMiddleware::class,
        'custom_permission' => Aero\Platform\Http\Middleware\PermissionMiddleware::class,
        'role_hierarchy' => Aero\Platform\Http\Middleware\RoleHierarchyMiddleware::class,
        // Super Admin Protection Middleware (Compliance: Section 13)
        'platform.super_admin' => Aero\Platform\Http\Middleware\PlatformSuperAdmin::class,
        'tenant.super_admin' => Aero\Platform\Http\Middleware\TenantSuperAdmin::class,
        // Module Permission Registry Middleware
        'module' => Aero\Platform\Http\Middleware\CheckModuleAccess::class,
        // Device auth is now global middleware - no need for alias
        'platform.domain' => Aero\Platform\Http\Middleware\EnsurePlatformDomain::class,
        // Subscription Enforcement for Tenant Apps
        'subscription' => Aero\Platform\Http\Middleware\EnforceSubscription::class,
        // Tenant Setup Check - ensures admin and onboarding are completed
        'tenant.setup' => Aero\Platform\Http\Middleware\EnsureTenantIsSetup::class,
        // Redirect to admin-setup if no admin user exists
        'redirect.if.no.admin' => Aero\Platform\Http\Middleware\RedirectIfNoAdmin::class,
        // Maintenance Mode Gatekeeper (Global + Tenant level)
        'maintenance' => Aero\Platform\Http\Middleware\CheckMaintenanceMode::class,
    ];
}
