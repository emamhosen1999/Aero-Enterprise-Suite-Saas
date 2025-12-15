<?php

declare(strict_types=1);

namespace Aero\Core\Traits;

use Illuminate\Http\Request;

/**
 * ParsesHostDomain Trait
 *
 * Provides domain parsing utilities for auto-detecting domain context
 * from URL structure without requiring .env configuration.
 *
 * Domain Pattern Recognition:
 * - admin.domain.com → Admin subdomain (central)
 * - domain.com → Platform/root domain (central)
 * - {tenant}.domain.com → Tenant subdomain
 *
 * Used by:
 * - IdentifyDomainContext middleware
 * - SetDatabaseConnectionFromDomain middleware
 * - InitializeTenancyIfNotCentral middleware
 * - SaaSTenantScope service
 */
trait ParsesHostDomain
{
    /**
     * Parse a host into subdomain and base domain parts.
     *
     * Examples:
     * - "admin.aeos365.test" → ['subdomain' => 'admin', 'baseDomain' => 'aeos365.test']
     * - "aeos365.test" → ['subdomain' => null, 'baseDomain' => 'aeos365.test']
     * - "tenant1.aeos365.test" → ['subdomain' => 'tenant1', 'baseDomain' => 'aeos365.test']
     * - "localhost" → ['subdomain' => null, 'baseDomain' => 'localhost']
     * - "admin.localhost" → ['subdomain' => 'admin', 'baseDomain' => 'localhost']
     * - "127.0.0.1" → ['subdomain' => null, 'baseDomain' => '127.0.0.1']
     *
     * @return array{subdomain: string|null, baseDomain: string}
     */
    protected function parseHost(string $host): array
    {
        // Remove port if present
        $host = preg_replace('/:\d+$/', '', $host);

        // Handle IP addresses specially (no subdomain possible)
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return ['subdomain' => null, 'baseDomain' => $host];
        }

        // Handle localhost specially
        if ($host === 'localhost') {
            return ['subdomain' => null, 'baseDomain' => $host];
        }

        $parts = explode('.', $host);

        // Single part (e.g., "localhost") - no subdomain
        if (count($parts) === 1) {
            return ['subdomain' => null, 'baseDomain' => $host];
        }

        // Two parts (e.g., "aeos365.test", "example.com") - no subdomain
        if (count($parts) === 2) {
            return ['subdomain' => null, 'baseDomain' => $host];
        }

        // Three+ parts - first part is subdomain, rest is base domain
        // e.g., "admin.aeos365.test" → subdomain="admin", baseDomain="aeos365.test"
        // e.g., "tenant.example.co.uk" → subdomain="tenant", baseDomain="example.co.uk"
        $subdomain = array_shift($parts);
        $baseDomain = implode('.', $parts);

        return ['subdomain' => $subdomain, 'baseDomain' => $baseDomain];
    }

    /**
     * Check if a host is on a central domain.
     *
     * Central domains are:
     * - Root domains (no subdomain): domain.com, aeos365.test
     * - Admin subdomain: admin.domain.com
     * - localhost, 127.0.0.1
     *
     * Tenant domains are:
     * - Any other subdomain: tenant1.domain.com, acme.aeos365.test
     */
    protected function isHostOnCentralDomain(string $host): bool
    {
        $parsed = $this->parseHost($host);

        // No subdomain = platform/central domain
        if ($parsed['subdomain'] === null) {
            return true;
        }

        // Admin subdomain = central domain
        if ($parsed['subdomain'] === 'admin') {
            return true;
        }

        // Any other subdomain = tenant domain
        return false;
    }

    /**
     * Check if a host is the admin subdomain.
     */
    protected function isHostAdminDomain(string $host): bool
    {
        $parsed = $this->parseHost($host);

        return $parsed['subdomain'] === 'admin';
    }

    /**
     * Check if a host is the platform/root domain (no subdomain).
     */
    protected function isHostPlatformDomain(string $host): bool
    {
        $parsed = $this->parseHost($host);

        return $parsed['subdomain'] === null;
    }

    /**
     * Check if a host is a tenant subdomain.
     */
    protected function isHostTenantDomain(string $host): bool
    {
        $parsed = $this->parseHost($host);

        return $parsed['subdomain'] !== null && $parsed['subdomain'] !== 'admin';
    }

    /**
     * Get the platform/base domain from a host.
     * Strips any subdomain and returns the root domain.
     *
     * Examples:
     * - "admin.aeos365.test" → "aeos365.test"
     * - "tenant1.aeos365.test" → "aeos365.test"
     * - "aeos365.test" → "aeos365.test"
     */
    protected function getPlatformDomainFromHost(string $host): string
    {
        $parsed = $this->parseHost($host);

        return $parsed['baseDomain'];
    }

    /**
     * Get the admin domain for a given host.
     *
     * Example: "aeos365.test" → "admin.aeos365.test"
     */
    protected function getAdminDomainFromHost(string $host): string
    {
        $baseDomain = $this->getPlatformDomainFromHost($host);

        return 'admin.' . $baseDomain;
    }

    /**
     * Build a tenant domain for a given tenant slug.
     *
     * Example: getTenantDomainFromHost("aeos365.test", "acme") → "acme.aeos365.test"
     */
    protected function getTenantDomainFromHost(string $host, string $tenantSlug): string
    {
        $baseDomain = $this->getPlatformDomainFromHost($host);

        return $tenantSlug . '.' . $baseDomain;
    }

    /**
     * Get the subdomain from a host (tenant slug).
     * Returns null if no subdomain or if it's the admin subdomain.
     *
     * Example: "acme.aeos365.test" → "acme"
     */
    protected function getTenantSlugFromHost(string $host): ?string
    {
        $parsed = $this->parseHost($host);

        if ($parsed['subdomain'] === null || $parsed['subdomain'] === 'admin') {
            return null;
        }

        return $parsed['subdomain'];
    }

    /**
     * Get the current host from request, with port stripped.
     */
    protected function getCurrentHost(?Request $request = null): string
    {
        $request = $request ?? request();

        if (! $request) {
            return 'localhost';
        }

        return preg_replace('/:\d+$/', '', $request->getHost());
    }
}
