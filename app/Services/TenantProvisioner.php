<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

/**
 * TenantProvisioner Service
 *
 * Handles the creation and provisioning of new tenants.
 *
 * The provisioning flow:
 * 1. Validate and prepare tenant data
 * 2. Create Tenant record in central database
 * 3. Create Domain record for the tenant
 * 4. stancl/tenancy automatically:
 *    - Fires TenantCreated event
 *    - JobPipeline executes: CreateDatabase -> MigrateDatabase -> SeedDatabase
 * 5. Tenant is ready for use
 */
class TenantProvisioner
{
    /**
     * Create a new tenant from registration payload.
     *
     * @param  array  $payload  Registration data from multi-step wizard
     */
    public function createFromRegistration(array $payload): Tenant
    {
        $account = $payload['account'] ?? [];
        $details = $payload['details'] ?? [];
        $plan = $payload['plan'] ?? [];

        $trialEndsAt = now()->addDays((int) config('platform.trial_days', 14));
        $modules = $this->cleanModules($plan['modules'] ?? []);

        // Resolve plan_id from slug if provided
        $planId = $this->resolvePlanId($plan['plan_slug'] ?? null);

        // Create tenant - this triggers the TenantCreated event
        // which automatically creates the database and runs migrations
        $tenant = Tenant::create([
            'id' => (string) Str::uuid(),
            'name' => (string) Arr::get($details, 'name'),
            'type' => (string) Arr::get($account, 'type', 'company'),
            'subdomain' => (string) Arr::get($details, 'subdomain'),
            'email' => (string) Arr::get($details, 'email'),
            'phone' => Arr::get($details, 'phone'),
            'plan_id' => $planId,
            'subscription_plan' => Arr::get($plan, 'billing_cycle'),
            'modules' => $modules,
            'trial_ends_at' => $trialEndsAt,
            'subscription_ends_at' => null,
            'status' => Tenant::STATUS_PENDING, // Will be activated after verification/payment
            'maintenance_mode' => false,
            // Flexible data stored in JSON column
            'data' => [
                'owner_name' => Arr::get($details, 'owner_name'),
                'owner_email' => Arr::get($details, 'owner_email', Arr::get($details, 'email')),
                'owner_phone' => Arr::get($details, 'owner_phone'),
                'team_size' => Arr::get($details, 'team_size'),
                'industry' => Arr::get($details, 'industry'),
                'notes' => Arr::get($plan, 'notes'),
                'registration_ip' => request()->ip(),
                'registered_at' => now()->toIso8601String(),
            ],
        ]);

        // Create the primary domain for tenant routing
        $tenant->domains()->create([
            'domain' => $this->buildDomain(Arr::get($details, 'subdomain')),
            'is_primary' => true,
        ]);

        return $tenant;
    }

    /**
     * Resolve plan UUID from slug.
     */
    private function resolvePlanId(?string $planSlug): ?string
    {
        if (! $planSlug) {
            return null;
        }

        return Plan::where('slug', $planSlug)->value('id');
    }

    private function cleanModules(array $modules): array
    {
        return array_values(array_unique(array_filter(array_map(
            static fn ($module) => $module !== null
                ? Str::slug((string) $module, '_')
                : null,
            $modules
        ))));
    }

    private function buildDomain(?string $subdomain): string
    {
        $baseDomain = config('platform.central_domain', 'localhost');
        $cleanSubdomain = Str::slug((string) $subdomain);

        return sprintf('%s.%s', $cleanSubdomain, $baseDomain);
    }
}
