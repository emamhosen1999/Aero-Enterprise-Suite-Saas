<?php

declare(strict_types=1);

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\RegistrationAccountTypeRequest;
use App\Http\Requests\Platform\RegistrationDetailsRequest;
use App\Http\Requests\Platform\RegistrationPlanRequest;
use App\Http\Requests\Platform\RegistrationTrialRequest;
use App\Jobs\ProvisionTenant;
use App\Services\TenantProvisioner;
use App\Services\TenantRegistrationSession;
use Illuminate\Http\RedirectResponse;

class RegistrationController extends Controller
{
    public function __construct(
        private TenantRegistrationSession $registrationSession,
        private TenantProvisioner $tenantProvisioner,
    ) {}

    public function storeAccountType(RegistrationAccountTypeRequest $request): RedirectResponse
    {
        $this->registrationSession->clear();
        $this->registrationSession->putStep('account', $request->validated());

        return to_route('platform.register.details');
    }

    public function storeDetails(RegistrationDetailsRequest $request): RedirectResponse
    {
        if (! $this->registrationSession->hasStep('account')) {
            return to_route('platform.register.index');
        }

        $this->registrationSession->putStep('details', $request->validated());

        return to_route('platform.register.admin');
    }

    public function storeAdmin(\Illuminate\Http\Request $request): RedirectResponse
    {
        if (! $this->registrationSession->ensureSteps(['account', 'details'])) {
            return to_route('platform.register.index');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9_]+$/'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $this->registrationSession->putStep('admin', $validated);

        return to_route('platform.register.plan');
    }

    public function storePlan(RegistrationPlanRequest $request): RedirectResponse
    {
        if (! $this->registrationSession->ensureSteps(['account', 'details', 'admin'])) {
            return to_route('platform.register.index');
        }

        $payload = $request->validated();
        if (! $this->registrationSession->ensureSteps(['account', 'details', 'admin'])) {
            return to_route('platform.register.index');
        }

        $payload = $request->validated();

        // Validate that at least one selection is made (plan OR modules)
        if (empty($payload['plan_id']) && empty($payload['modules'])) {
            return back()->withErrors([
                'selection' => 'Please select a plan or at least one module to continue.',
            ])->withInput();
        }

        $this->registrationSession->putStep('plan', $payload);

        // Payment is deferred; go straight to review page for now.
        return to_route('platform.register.payment');
    }

    /**
     * Activate trial and dispatch async provisioning.
     *
     * This method:
     * 1. Creates the Tenant and Domain records immediately (in a transaction)
     * 2. Dispatches the ProvisionTenant job to the queue
     * 3. Redirects to the provisioning status page
     *
     * IMPORTANT: Tenant creation and job dispatch are wrapped in a transaction.
     * If the job fails to dispatch, the tenant record is rolled back.
     */
    public function activateTrial(RegistrationTrialRequest $request): RedirectResponse
    {
        if (! $this->registrationSession->ensureSteps(['account', 'details', 'admin', 'plan'])) {
            return to_route('platform.register.index');
        }

        $payload = $this->registrationSession->get();
        $trialData = $request->validated();
        $payload['trial'] = $trialData;

        // Re-validate subdomain and email uniqueness before attempting tenant creation
        // This prevents duplicate errors if user goes back and re-submits
        $subdomain = $payload['details']['subdomain'] ?? null;
        $email = $payload['details']['email'] ?? null;

        if ($subdomain && \App\Models\Tenant::where('subdomain', $subdomain)->exists()) {
            return back()->withErrors([
                'subdomain' => 'This subdomain is already taken. Please choose a different one.',
            ])->withInput();
        }

        if ($email && \App\Models\Tenant::where('email', $email)->exists()) {
            return back()->withErrors([
                'email' => 'This email is already registered. Please use a different email.',
            ])->withInput();
        }

        // Build admin data to pass directly to job (never stored in database)
        $adminData = [
            'name' => $payload['admin']['name'],
            'user_name' => $payload['admin']['username'],
            'email' => $payload['admin']['email'],
            'password' => $payload['admin']['password'], // Plain text - job will hash it
        ];

        try {
            // Wrap tenant creation and job dispatch in a transaction
            // If job dispatch fails, tenant record is rolled back
            $tenant = \Illuminate\Support\Facades\DB::transaction(function () use ($payload, $adminData) {
                // Create tenant with pending status (no admin_data stored)
                $tenant = $this->tenantProvisioner->createFromRegistration($payload);

                // Dispatch async provisioning job with admin credentials
                // Using dispatchSync would defeat the purpose, so we dispatch normally
                // but the transaction ensures the tenant is only committed if dispatch succeeds
                ProvisionTenant::dispatch($tenant, $adminData);

                return $tenant;
            });
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle duplicate entry or other database errors gracefully
            \Illuminate\Support\Facades\Log::error('Tenant creation failed', [
                'error' => $e->getMessage(),
                'subdomain' => $subdomain,
                'email' => $email,
            ]);

            return back()->withErrors([
                'error' => 'Failed to create workspace. The subdomain or email may already be in use. Please try again.',
            ])->withInput();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Unexpected error during tenant creation', [
                'error' => $e->getMessage(),
                'subdomain' => $subdomain,
            ]);

            return back()->withErrors([
                'error' => 'An unexpected error occurred. Please try again or contact support.',
            ])->withInput();
        }

        // Store provisioning info for the waiting room
        $this->registrationSession->rememberSuccess([
            'tenant_id' => $tenant->id,
            'name' => $tenant->name,
            'subdomain' => $tenant->subdomain,
            'status' => $tenant->status,
            'trial_ends_at' => optional($tenant->trial_ends_at)?->toAtomString(),
        ]);

        $this->registrationSession->clear();

        // Redirect to provisioning status page
        return to_route('platform.register.provisioning', ['tenant' => $tenant->id]);
    }

    /**
     * Retry failed tenant provisioning.
     *
     * This method:
     * 1. Validates the tenant is in failed state
     * 2. Cleans up any orphaned database from previous attempt
     * 3. Resets tenant status to pending
     * 4. Dispatches a new ProvisionTenant job
     * 5. Redirects back to provisioning status page
     */
    public function retryProvisioning(\App\Models\Tenant $tenant): RedirectResponse
    {
        // Only allow retry for failed tenants
        if ($tenant->status !== \App\Models\Tenant::STATUS_FAILED) {
            return back()->with('error', 'Only failed provisioning can be retried.');
        }

        try {
            // Clean up orphaned database if it exists
            $this->cleanupOrphanedDatabase($tenant);

            // Reset tenant to pending state
            $tenant->update([
                'status' => \App\Models\Tenant::STATUS_PENDING,
                'provisioning_step' => null,
                'data' => null, // Clear error messages
            ]);

            // Dispatch new provisioning job
            // Note: We don't have admin credentials here, so provisioning will skip admin creation
            // This is acceptable for retry - admin can be created manually later if needed
            ProvisionTenant::dispatch($tenant, []);

            return to_route('platform.register.provisioning', ['tenant' => $tenant->id])
                ->with('success', 'Provisioning restarted. Please wait...');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to retry tenant provisioning', [
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Failed to retry provisioning: '.$e->getMessage());
        }
    }

    /**
     * Clean up orphaned database from failed provisioning attempt.
     */
    private function cleanupOrphanedDatabase(\App\Models\Tenant $tenant): void
    {
        try {
            $databaseName = $tenant->tenancy_db_name;

            if (empty($databaseName)) {
                return;
            }

            // Check if database exists
            $exists = \DB::select('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?', [$databaseName]);

            if (! empty($exists)) {
                // Drop the orphaned database
                \DB::statement("DROP DATABASE `{$databaseName}`");

                \Illuminate\Support\Facades\Log::info('Cleaned up orphaned database before retry', [
                    'tenant_id' => $tenant->id,
                    'database' => $databaseName,
                ]);
            }
        } catch (\Throwable $e) {
            // Log but don't fail - provisioning job will handle it
            \Illuminate\Support\Facades\Log::warning('Could not cleanup orphaned database', [
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
