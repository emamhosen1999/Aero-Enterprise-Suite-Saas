<?php

declare(strict_types=1);

namespace Aero\Platform\Services;

use Aero\Platform\Models\Tenant;

class RegistrationIdentityStatusService
{
    /**
     * @return array{status: string, available: bool, resumable: bool, message: string}
     */
    public function checkSubdomain(string $subdomain): array
    {
        if (! $this->isSubdomainFormatValid($subdomain)) {
            return [
                'status' => 'unavailable',
                'available' => false,
                'resumable' => false,
                'message' => 'Invalid subdomain format. Use lowercase letters, numbers, and hyphens only.',
            ];
        }

        if ($this->isReservedSubdomain($subdomain)) {
            return [
                'status' => 'unavailable',
                'available' => false,
                'resumable' => false,
                'message' => 'This subdomain is reserved.',
            ];
        }

        $tenant = Tenant::query()
            ->where('subdomain', $subdomain)
            ->latest('updated_at')
            ->first();

        return $this->resolveTenantIdentityStatus($tenant, 'subdomain');
    }

    /**
     * @return array{status: string, available: bool, resumable: bool, message: string}
     */
    public function checkEmail(string $email): array
    {
        $tenant = Tenant::query()
            ->where('email', $email)
            ->latest('updated_at')
            ->first();

        return $this->resolveTenantIdentityStatus($tenant, 'email');
    }

    /**
     * @return array{status: string, available: bool, resumable: bool, message: string}
     */
    private function resolveTenantIdentityStatus(?Tenant $tenant, string $field): array
    {
        if (! $tenant) {
            return [
                'status' => 'available',
                'available' => true,
                'resumable' => false,
                'message' => ucfirst($field).' is available.',
            ];
        }

        if (in_array($tenant->status, [Tenant::STATUS_ACTIVE, Tenant::STATUS_PROVISIONING, Tenant::STATUS_SUSPENDED], true)) {
            return [
                'status' => 'unavailable',
                'available' => false,
                'resumable' => false,
                'message' => 'Already in use by an existing workspace.',
            ];
        }

        if ($tenant->status === Tenant::STATUS_PENDING) {
            if ($tenant->updated_at && $tenant->updated_at->gt(now()->subMinutes($this->pendingLockMinutes()))) {
                return [
                    'status' => 'unavailable',
                    'available' => false,
                    'resumable' => false,
                    'message' => 'A registration attempt is in progress. Please try again shortly.',
                ];
            }

            return [
                'status' => 'available_to_resume',
                'available' => false,
                'resumable' => true,
                'message' => 'A previous registration attempt exists and can be resumed.',
            ];
        }

        if ($tenant->status === Tenant::STATUS_FAILED) {
            if ($tenant->updated_at && $tenant->updated_at->gt(now()->subHours($this->reclaimWindowHours()))) {
                return [
                    'status' => 'unavailable',
                    'available' => false,
                    'resumable' => false,
                    'message' => 'This identity is temporarily locked. Please try again later.',
                ];
            }

            return [
                'status' => 'available_to_resume',
                'available' => false,
                'resumable' => true,
                'message' => 'A previous registration attempt exists and can be resumed.',
            ];
        }

        return [
            'status' => 'unavailable',
            'available' => false,
            'resumable' => false,
            'message' => ucfirst($field).' is not available.',
        ];
    }

    private function pendingLockMinutes(): int
    {
        return max((int) config('platform.registration.pending_lock_minutes', 30), 1);
    }

    private function reclaimWindowHours(): int
    {
        return max((int) config('platform.registration.resume_reclaim_window_hours', 24), 1);
    }

    private function isSubdomainFormatValid(string $subdomain): bool
    {
        return (bool) preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $subdomain);
    }

    private function isReservedSubdomain(string $subdomain): bool
    {
        $reserved = [
            'admin', 'api', 'app', 'www', 'mail', 'smtp', 'ftp', 'cdn', 'static', 'assets', 'help', 'support', 'billing', 'status',
        ];

        return in_array($subdomain, $reserved, true);
    }
}
