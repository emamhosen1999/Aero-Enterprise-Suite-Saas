<?php

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Stancl\Tenancy\Tenancy;
use Symfony\Component\HttpFoundation\Response;

/**
 * SetTenant Middleware
 *
 * Ensures tenant context is properly set for the request.
 * This middleware works alongside Stancl's InitializeTenancy middleware
 * to provide additional tenant-aware functionality.
 *
 * Responsibilities:
 * - Validates tenant status (active, not suspended/archived)
 * - Sets tenant-specific config overrides
 * - Logs tenant access for audit
 * - Handles maintenance mode per tenant
 */
class SetTenant
{
    public function __construct(
        protected Tenancy $tenancy
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip if no tenant context
        if (! tenant()) {
            return $next($request);
        }

        $tenant = tenant();

        // Check if tenant is in maintenance mode
        if ($tenant->maintenance_mode ?? false) {
            if (! $this->isMaintenanceBypassAllowed($request)) {
                return response()->view('maintenance', [
                    'tenant' => $tenant,
                    'message' => 'This site is currently undergoing scheduled maintenance.',
                ], 503);
            }
        }

        // Check tenant status
        $status = $tenant->status ?? 'active';

        if ($status === 'suspended') {
            return response()->view('errors.tenant-suspended', [
                'tenant' => $tenant,
                'message' => 'Your account has been suspended. Please contact support.',
            ], 403);
        }

        if ($status === 'archived') {
            return response()->view('errors.tenant-archived', [
                'tenant' => $tenant,
                'message' => 'This account is no longer active.',
            ], 410);
        }

        if ($status === 'pending' || $status === 'provisioning') {
            // Allow access to provisioning status page
            if (! $request->is('provisioning-status', 'provisioning-status/*')) {
                return redirect()->route('provisioning.status', ['tenant' => $tenant->id]);
            }
        }

        // Apply tenant-specific configuration overrides
        $this->applyTenantConfig($tenant);

        // Set tenant context in request for use in controllers/services
        $request->attributes->set('tenant', $tenant);
        $request->attributes->set('tenant_id', $tenant->id);

        // Log tenant access (optional, for audit)
        if (config('tenancy.log_access', false)) {
            Log::channel('tenant')->info('Tenant access', [
                'tenant_id' => $tenant->id,
                'path' => $request->path(),
                'user_id' => Auth::id(),
                'ip' => $request->ip(),
            ]);
        }

        return $next($request);
    }

    /**
     * Check if maintenance bypass is allowed for this request.
     */
    protected function isMaintenanceBypassAllowed(Request $request): bool
    {
        // Allow admins to bypass maintenance mode
        $user = Auth::user();
        if ($user && $user->hasRole('admin')) {
            return true;
        }

        // Check for bypass token in session or query
        $bypassToken = tenant('maintenance_bypass_token');
        if ($bypassToken && $request->query('bypass') === $bypassToken) {
            return true;
        }

        return false;
    }

    /**
     * Apply tenant-specific configuration overrides.
     */
    protected function applyTenantConfig($tenant): void
    {
        // Get tenant data (JSON config storage)
        $data = $tenant->data ?? [];

        // Override mail settings if tenant has custom SMTP
        if (! empty($data['mail_host'])) {
            config([
                'mail.mailers.smtp.host' => $data['mail_host'],
                'mail.mailers.smtp.port' => $data['mail_port'] ?? 587,
                'mail.mailers.smtp.username' => $data['mail_username'] ?? null,
                'mail.mailers.smtp.password' => $data['mail_password'] ?? null,
                'mail.mailers.smtp.encryption' => $data['mail_encryption'] ?? 'tls',
                'mail.from.address' => $data['mail_from_address'] ?? config('mail.from.address'),
                'mail.from.name' => $data['mail_from_name'] ?? $tenant->name,
            ]);
        }

        // Override app name with tenant name
        config(['app.name' => $tenant->name ?? config('app.name')]);

        // Set timezone if tenant has custom timezone
        if (! empty($data['timezone'])) {
            config(['app.timezone' => $data['timezone']]);
            date_default_timezone_set($data['timezone']);
        }

        // Set locale if tenant has custom locale
        if (! empty($data['locale'])) {
            app()->setLocale($data['locale']);
        }
    }
}
