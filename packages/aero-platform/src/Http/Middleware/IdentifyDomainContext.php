<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Middleware;

use Aero\Core\Traits\ParsesHostDomain;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class IdentifyDomainContext
{
    use ParsesHostDomain;
    /**
     * Domain context constants.
     */
    public const CONTEXT_ADMIN = 'admin';

    public const CONTEXT_PLATFORM = 'platform';

    public const CONTEXT_TENANT = 'tenant';

    /**
     * Handle an incoming request.
     *
     * Identifies whether the request is coming from:
     * - admin.platform.com (CONTEXT_ADMIN)
     * - platform.com (CONTEXT_PLATFORM)
     * - {tenant}.platform.com (CONTEXT_TENANT)
     *
     * Note: Database connection is set by SetDatabaseConnectionFromDomain
     * middleware which runs globally before sessions start.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        // 1. Identify and SET the domain context on request attributes
        $context = $this->identifyContext($request);
        $request->attributes->set('domain_context', $context);

        // 2. Only intercept the root path '/'
        if (! $request->is('/')) {
            return $next($request);
        }

        // 3. Handle Admin Domain (admin.domain.com)
        if ($context === self::CONTEXT_ADMIN) {
            if (Auth::guard('landlord')->check()) {
                return redirect()->route('admin.dashboard');
            }

            return redirect('/login');
        }

        // 4. Handle Platform Domain (domain.com) - The Landing Page
        if ($context === self::CONTEXT_PLATFORM) {

            // Check if installed
            if (! $this->isApplicationInstalled()) {
                return redirect('/install');
            }

            // Set root view for Inertia (since this bypasses HandleInertiaRequests)
            Inertia::setRootView('aero-ui::app');

            // Render Landing Page
            return Inertia::render('Platform/Public/Landing');
        }

        // 5. Handle Tenant Domain (tenant.domain.com)
        // Redirect to dashboard if authenticated, or login if not
        if ($context === self::CONTEXT_TENANT) {
            if (Auth::guard('web')->check()) {
                return redirect()->route('tenant.dashboard');
            }

            return redirect('/login');
        }

        // Fallback: Pass to next middleware
        return $next($request);
    }

    /**
     * Check if the application file lock exists and DB is accessible.
     */
    protected function isApplicationInstalled(): bool
    {
        // Check lock file
        if (! File::exists(storage_path('installed'))) {
            return false;
        }

        // Check Database
        try {
            DB::connection()->getPdo();
            // Assuming 'tenants' table is in the default/landlord connection
            if (! Schema::hasTable('tenants')) {
                return false;
            }
        } catch (\Throwable $e) {
            return false;
        }

        return true;
    }

    /**
     * Identify the domain context based on the request host.
     *
     * Auto-detects domain type from URL structure:
     * - admin.domain.com → CONTEXT_ADMIN
     * - domain.com → CONTEXT_PLATFORM
     * - {anything-else}.domain.com → CONTEXT_TENANT
     *
     * No .env configuration required - derives from current request.
     */
    protected function identifyContext(Request $request): string
    {
        $host = $request->getHost();

        // Use trait's helper methods for domain detection
        if ($this->isHostAdminDomain($host)) {
            return self::CONTEXT_ADMIN;
        }

        if ($this->isHostPlatformDomain($host)) {
            return self::CONTEXT_PLATFORM;
        }

        return self::CONTEXT_TENANT;
    }

    /**
     * Get the platform/base domain from current request.
     * Useful for generating cross-domain URLs.
     */
    public static function getPlatformDomain(Request $request): string
    {
        $instance = new self;

        return $instance->getPlatformDomainFromHost($request->getHost());
    }

    /**
     * Get the admin domain from current request.
     */
    public static function getAdminDomain(Request $request): string
    {
        $instance = new self;

        return $instance->getAdminDomainFromHost($request->getHost());
    }

    /**
     * Get a tenant domain from current request.
     */
    public static function getTenantDomain(Request $request, string $tenantSlug): string
    {
        $instance = new self;

        return $instance->getTenantDomainFromHost($request->getHost(), $tenantSlug);
    }

    /**
     * Static helper to get current context from request.
     */
    public static function getContext(Request $request): string
    {
        return $request->attributes->get('domain_context', self::CONTEXT_PLATFORM);
    }

    /**
     * Check if current context is admin.
     */
    public static function isAdmin(Request $request): bool
    {
        return self::getContext($request) === self::CONTEXT_ADMIN;
    }

    /**
     * Check if current context is platform.
     */
    public static function isPlatform(Request $request): bool
    {
        return self::getContext($request) === self::CONTEXT_PLATFORM;
    }

    /**
     * Check if current context is tenant.
     */
    public static function isTenant(Request $request): bool
    {
        return self::getContext($request) === self::CONTEXT_TENANT;
    }
}
