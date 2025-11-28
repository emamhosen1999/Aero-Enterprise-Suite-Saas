<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class TenantProvisioner
{
    public function createFromRegistration(array $payload): Tenant
    {
        $account = $payload['account'] ?? [];
        $details = $payload['details'] ?? [];
        $plan = $payload['plan'] ?? [];

        $trialEndsAt = now()->addDays((int) config('platform.trial_days', 14));
        $modules = $this->cleanModules($plan['modules'] ?? []);

        $tenant = Tenant::create([
            'id' => (string) Str::uuid(),
            'name' => (string) Arr::get($details, 'name'),
            'type' => (string) Arr::get($account, 'type', 'company'),
            'subdomain' => (string) Arr::get($details, 'subdomain'),
            'email' => (string) Arr::get($details, 'email'),
            'phone' => Arr::get($details, 'phone'),
            'subscription_plan' => Arr::get($plan, 'billing_cycle'),
            'modules' => $modules,
            'trial_ends_at' => $trialEndsAt,
            'subscription_ends_at' => null,
            'data' => [
                'team_size' => Arr::get($details, 'team_size'),
                'notes' => Arr::get($plan, 'notes'),
            ],
        ]);

        $tenant->domains()->create([
            'domain' => $this->buildDomain(Arr::get($details, 'subdomain')),
        ]);

        return $tenant;
    }

    private function cleanModules(array $modules): array
    {
        return array_values(array_unique(array_filter(array_map(static fn ($module) => $module !== null
            ? Str::slug((string) $module, '_')
            : null, $modules))));
    }

    private function buildDomain(?string $subdomain): string
    {
        $baseDomain = config('platform.central_domain', 'localhost');
        $cleanSubdomain = Str::slug((string) $subdomain);

        return sprintf('%s.%s', $cleanSubdomain, $baseDomain);
    }
}
