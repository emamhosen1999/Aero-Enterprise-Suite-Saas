<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentifyDomainContext
{
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
    public function handle(Request $request, Closure $next): Response
    {
        $context = $this->identifyContext($request);

        // Store context in request attributes for use throughout the application
        $request->attributes->set('domain_context', $context);

        // Also store in session for use in views and elsewhere
        session(['domain_context' => $context]);

        return $next($request);
    }

    /**
     * Identify the domain context based on the request host.
     */
    protected function identifyContext(Request $request): string
    {
        $host = $request->getHost();

        // Check for admin domain (support both env var and pattern matching)
        $adminDomain = env('ADMIN_DOMAIN', 'admin.localhost');
        if ($this->matchesDomain($host, $adminDomain)) {
            return self::CONTEXT_ADMIN;
        }

        // Fallback: if host starts with 'admin.' it's likely admin domain
        if (str_starts_with($host, 'admin.')) {
            return self::CONTEXT_ADMIN;
        }

        // Check for central/platform domain
        $centralDomains = $this->getCentralDomains();
        foreach ($centralDomains as $centralDomain) {
            if ($this->matchesDomain($host, $centralDomain)) {
                return self::CONTEXT_PLATFORM;
            }
        }

        // If not admin or platform, it's a tenant subdomain
        return self::CONTEXT_TENANT;
    }

    /**
     * Get the list of central domains from config.
     *
     * @return array<string>
     */
    protected function getCentralDomains(): array
    {
        $domains = config('tenancy.central_domains', []);

        // Filter out admin domain from central domains
        $adminDomain = env('ADMIN_DOMAIN', 'admin.localhost');

        return array_filter($domains, function ($domain) use ($adminDomain) {
            return ! $this->matchesDomain($domain, $adminDomain);
        });
    }

    /**
     * Check if host matches a domain pattern.
     * Handles both exact matches and localhost with ports.
     */
    protected function matchesDomain(string $host, string $domain): bool
    {
        // Normalize by removing ports
        $hostWithoutPort = preg_replace('/:\d+$/', '', $host);
        $domainWithoutPort = preg_replace('/:\d+$/', '', $domain);

        return strtolower($hostWithoutPort) === strtolower($domainWithoutPort);
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
