<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Middleware;

use Illuminate\Http\Middleware\TrustHosts as Middleware;

/**
 * TrustHosts Middleware
 *
 * Prevents Host header spoofing attacks by only accepting requests
 * from known, trusted host patterns.
 *
 * Patterns are configured dynamically by AeroPlatformServiceProvider::configureTrustedHosts()
 * based on the PLATFORM_DOMAIN environment variable.
 *
 * Security Impact:
 * - Prevents attackers from spoofing Host headers to bypass domain-based access controls
 * - Prevents cache poisoning attacks using crafted Host headers
 * - Prevents malicious URL generation in emails (password reset, verification, etc.)
 *
 * @see https://laravel.com/docs/11.x/requests#configuring-trusted-hosts
 */
class TrustHosts extends Middleware
{
    /**
     * Get the host patterns that should be trusted.
     *
     * Returns patterns from config('app.trusted_hosts') which are
     * set by AeroPlatformServiceProvider::configureTrustedHosts().
     *
     * @return array<int, string|null>
     */
    public function hosts(): array
    {
        $configuredHosts = config('app.trusted_hosts', []);

        // If no patterns configured, use permissive defaults for development
        // In production, PLATFORM_DOMAIN should always be set
        if (empty($configuredHosts)) {
            return [
                $this->allSubdomainsOfApplicationUrl(),
            ];
        }

        return $configuredHosts;
    }
}
