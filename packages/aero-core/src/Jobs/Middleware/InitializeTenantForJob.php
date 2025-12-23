<?php

declare(strict_types=1);

namespace Aero\Core\Jobs\Middleware;

use Closure;

/**
 * Initialize Tenant For Job Middleware
 *
 * Automatically initializes tenancy for jobs that have a $tenant property.
 * This ensures jobs execute within the correct tenant context in SaaS mode.
 *
 * CRITICAL: Only runs in SaaS mode. Standalone mode bypasses tenancy.
 */
class InitializeTenantForJob
{
    /**
     * Handle the job.
     *
     * @param mixed $job
     * @param \Closure $next
     * @return mixed
     */
    public function handle($job, Closure $next)
    {
        // Only initialize tenancy in SaaS mode
        if (!is_saas_mode()) {
            return $next($job);
        }

        // Check if job has tenant property
        if (!property_exists($job, 'tenant') || !$job->tenant) {
            // Job doesn't need tenant context
            return $next($job);
        }

        try {
            // Initialize tenancy for this job
            tenancy()->initialize($job->tenant);

            // Execute the job
            $result = $next($job);

            return $result;
        } finally {
            // Always end tenancy to prevent context bleeding
            if (tenancy()->initialized) {
                tenancy()->end();
            }
        }
    }
}
