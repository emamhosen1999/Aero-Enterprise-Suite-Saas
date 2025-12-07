<?php

namespace App\Http\Controllers\Platform\Billing;

use App\Http\Controllers\Controller;
use App\Models\Platform\PlatformSetting;
use App\Models\Platform\Tenant;
use App\Models\Platform\TenantImpersonationToken;
use App\Models\Shared\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Landlord Impersonation Controller
 *
 * Handles impersonation of tenant users by platform administrators.
 * Security features:
 * - Platform-level enable/disable toggle
 * - Permission check (platform.tenants.impersonate)
 * - Short-lived tokens (5 minutes)
 * - Single-use tokens (consumed on use)
 * - Full audit logging
 */
class ImpersonationController extends Controller
{
    /**
     * Generate an impersonation token and redirect to tenant domain.
     */
    public function impersonate(Request $request, Tenant $tenant): RedirectResponse
    {
        // Check if impersonation is enabled platform-wide
        if (! $this->isImpersonationEnabled()) {
            return back()->with('error', 'Impersonation is disabled for this platform.');
        }

        // Check permission (landlord user must have impersonate permission)
        $landlordUser = $request->user('landlord');
        if (! $landlordUser || ! $this->canImpersonate($landlordUser)) {
            Log::warning('Unauthorized impersonation attempt', [
                'landlord_user_id' => $landlordUser?->id,
                'tenant_id' => $tenant->id,
                'ip' => $request->ip(),
            ]);

            return back()->with('error', 'You do not have permission to impersonate tenants.');
        }

        // Check tenant is active
        if ($tenant->status !== Tenant::STATUS_ACTIVE) {
            return back()->with('error', 'Cannot impersonate inactive or suspended tenants.');
        }

        // Find the primary domain for the tenant
        $domain = $tenant->domains()->first();
        if (! $domain) {
            return back()->with('error', 'Tenant has no configured domain.');
        }

        // Run in tenant context to create token and find user
        $token = $tenant->run(function () use ($tenant, $landlordUser) {
            // Find the tenant owner/admin user (first user or owner)
            $targetUser = $this->findTenantAdminUser();

            if (! $targetUser) {
                return null;
            }

            // Create impersonation token
            $impersonationToken = TenantImpersonationToken::createForUser(
                tenantId: $tenant->id,
                userId: $targetUser->id,
                redirectUrl: '/dashboard',
                authGuard: 'web'
            );

            // Log the impersonation initiation
            Log::info('Tenant impersonation initiated', [
                'landlord_user_id' => $landlordUser->id,
                'landlord_user_email' => $landlordUser->email,
                'tenant_id' => $tenant->id,
                'tenant_name' => $tenant->name,
                'target_user_id' => $targetUser->id,
                'target_user_email' => $targetUser->email,
                'token_expires_at' => now()->addMinutes(TenantImpersonationToken::EXPIRATION_MINUTES),
            ]);

            return $impersonationToken->token;
        });

        if (! $token) {
            return back()->with('error', 'No admin user found in tenant. Cannot impersonate.');
        }

        // Build the impersonation URL on the tenant domain
        $scheme = $request->secure() ? 'https' : 'http';
        $impersonationUrl = "{$scheme}://{$domain->domain}/impersonate/{$token}";

        return redirect()->away($impersonationUrl);
    }

    /**
     * Check if impersonation is enabled in platform settings.
     */
    protected function isImpersonationEnabled(): bool
    {
        $settings = PlatformSetting::first();
        if (! $settings) {
            return false;
        }

        $adminPreferences = $settings->admin_preferences ?? [];

        return ! empty($adminPreferences['enable_impersonation']);
    }

    /**
     * Check if the landlord user can impersonate tenants.
     */
    protected function canImpersonate($landlordUser): bool
    {
        // Super admins can always impersonate
        if ($landlordUser->isSuperAdmin()) {
            return true;
        }

        // Support role can impersonate (based on seeder permission)
        if ($landlordUser->isSupport()) {
            return true;
        }

        // Check for specific permission
        if ($landlordUser->hasPermissionTo('platform.tenants.impersonate')) {
            return true;
        }

        return false;
    }

    /**
     * Find the primary admin user in the tenant.
     * Priority: first super admin > first admin > first user
     */
    protected function findTenantAdminUser(): ?User
    {
        // Try to find a super admin first
        $superAdmin = User::whereHas('roles', function ($query) {
            $query->where('name', 'Super Admin');
        })->where('active', true)->first();

        if ($superAdmin) {
            return $superAdmin;
        }

        // Try to find an admin
        $admin = User::whereHas('roles', function ($query) {
            $query->where('name', 'Admin');
        })->where('active', true)->first();

        if ($admin) {
            return $admin;
        }

        // Fall back to first active user
        return User::where('active', true)->first();
    }
}
