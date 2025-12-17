<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers;

use Aero\Platform\Http\Requests\RegistrationAccountTypeRequest;
use Aero\Platform\Http\Requests\RegistrationDetailsRequest;
use Aero\Platform\Http\Requests\RegistrationPlanRequest;
use Aero\Platform\Http\Requests\RegistrationTrialRequest;
use Aero\Platform\Jobs\ProvisionTenant;
use Aero\Platform\Models\PlatformSetting;
use Aero\Platform\Models\Tenant;
use Aero\Platform\Services\Monitoring\PlatformVerificationService;
use Aero\Platform\Services\Monitoring\Tenant\TenantProvisioner;
use Aero\Platform\Services\Monitoring\Tenant\TenantRegistrationSession;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RegistrationController extends Controller
{
    public function __construct(
        private TenantRegistrationSession $registrationSession,
        private TenantProvisioner $tenantProvisioner,
        private PlatformVerificationService $verificationService,
    ) {}

    public function storeAccountType(RegistrationAccountTypeRequest $request): RedirectResponse
    {
        $this->registrationSession->clear();
        $this->registrationSession->putStep('account', $request->validated());

        return to_route('platform.register.details');
    }

    /**
     * Store company details and handle resume of incomplete registrations.
     *
     * If a pending/failed tenant with the same email or subdomain exists,
     * we "take over" that record and continue from where they left off.
     */
    public function storeDetails(RegistrationDetailsRequest $request): RedirectResponse
    {
        if (! $this->registrationSession->hasStep('account')) {
            return to_route('platform.register.index');
        }

        $validated = $request->validated();
        $email = $validated['email'];
        $subdomain = $validated['subdomain'];

        // Check for existing incomplete registration that can be resumed
        $existingTenant = Tenant::where(function ($query) use ($email, $subdomain) {
            $query->where('email', $email)
                ->orWhere('subdomain', $subdomain);
        })
            ->whereIn('status', [Tenant::STATUS_PENDING, Tenant::STATUS_FAILED])
            ->first();

        if ($existingTenant) {
            // Resume: update the existing tenant with new details
            $existingTenant->update([
                'name' => $validated['name'],
                'email' => $email,
                'phone' => $validated['phone'] ?? null,
                'subdomain' => $subdomain,
                'type' => $this->registrationSession->getStep('account')['type'] ?? 'company',
                'status' => Tenant::STATUS_PENDING, // Reset to pending if was failed
                'registration_step' => Tenant::REG_STEP_DETAILS,
            ]);

            // Store tenant ID in session for continuity
            $this->registrationSession->putStep('verification', ['tenant_id' => $existingTenant->id]);

            Log::info('Resuming incomplete tenant registration', [
                'tenant_id' => $existingTenant->id,
                'email' => $email,
                'subdomain' => $subdomain,
            ]);
        }

        $this->registrationSession->putStep('details', $validated);

        // Check if maintenance mode is enabled with skip verification OR debug mode is enabled
        $platformSettings = PlatformSetting::current();
        $skipVerification = ($platformSettings->maintenance_mode && $platformSettings->maintenance_skip_verification)
            || config('app.debug', false);

        if ($skipVerification) {
            // Skip verification steps during maintenance mode or debug mode
            Log::info('Skipping verification due to maintenance/debug mode', [
                'email' => $email,
                'subdomain' => $subdomain,
                'maintenance_mode' => $platformSettings->maintenance_mode,
                'debug_mode' => config('app.debug', false),
            ]);

            // Mark verification as complete
            $tenant = $this->getOrCreatePendingTenant($this->registrationSession->get());
            $tenant->update([
                'registration_step' => Tenant::REG_STEP_VERIFY_PHONE, // Mark as if verifications passed
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
            ]);

            $this->registrationSession->putStep('verification', [
                'tenant_id' => $tenant->id,
                'email_verified' => true,
                'phone_verified' => true,
                'skipped_due_to_maintenance' => true,
            ]);

            // Go directly to plan selection
            return to_route('platform.register.plan');
        }

        // Go directly to email verification (admin setup moved to after provisioning)
        return to_route('platform.register.verify-email');
    }

    /**
     * Send COMPANY email verification code.
     *
     * This verifies the company's contact email (from details step), NOT the admin email.
     * Admin credentials are NOT verified - they're passed directly to the provisioning job.
     */
    public function sendEmailVerification(Request $request): JsonResponse
    {
        // Only require account and details (admin setup moved to after provisioning)
        if (! $this->registrationSession->ensureSteps(['account', 'details'])) {
            return response()->json(['message' => 'Invalid session'], 400);
        }

        $payload = $this->registrationSession->get();
        // Use COMPANY email for verification (from details)
        $companyEmail = $payload['details']['email'];

        // Get or create tenant record for verification
        $tenant = $this->getOrCreatePendingTenant($payload);

        // Update registration step
        $tenant->update(['registration_step' => Tenant::REG_STEP_VERIFY_EMAIL]);

        // Check rate limiting
        if (! $this->verificationService->canResendCompanyEmailCode($tenant)) {
            return response()->json([
                'message' => 'Please wait 1 minute before requesting a new code',
            ], 429);
        }

        // Send verification code to COMPANY email
        $result = $this->verificationService->sendCompanyEmailVerificationCode($tenant, $companyEmail);

        if (! $result['success']) {
            return response()->json([
                'message' => $result['message'] ?: 'Failed to send verification code. Please try again.',
            ], 500);
        }

        // Store tenant ID in session
        $this->registrationSession->putStep('verification', ['tenant_id' => $tenant->id]);

        return response()->json([
            'message' => 'Verification code sent to your company email',
        ]);
    }

    /**
     * Cancel registration and clean up pending tenant.
     *
     * This allows users to explicitly cancel their registration,
     * freeing up the subdomain/email for a fresh registration.
     */
    public function cancelRegistration(Request $request): JsonResponse
    {
        $verification = $this->registrationSession->getStep('verification');

        if ($verification && ! empty($verification['tenant_id'])) {
            $tenant = Tenant::find($verification['tenant_id']);

            // Only delete if still in pending status and has no domains (not provisioned)
            if ($tenant
                && $tenant->status === Tenant::STATUS_PENDING
                && $tenant->domains()->count() === 0
            ) {
                try {
                    $tenant->delete();

                    Log::info('User cancelled registration and tenant was cleaned up', [
                        'tenant_id' => $tenant->id,
                        'subdomain' => $tenant->subdomain,
                        'email' => $tenant->email,
                    ]);
                } catch (\Throwable $e) {
                    Log::warning('Failed to cleanup tenant on cancel', [
                        'tenant_id' => $tenant->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        // Clear session
        $this->registrationSession->clear();

        return response()->json([
            'message' => 'Registration cancelled successfully',
        ]);
    }

    /**
     * Verify COMPANY email verification code.
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        // Only require account, details, and verification (admin setup moved to after provisioning)
        if (! $this->registrationSession->ensureSteps(['account', 'details', 'verification'])) {
            return response()->json(['message' => 'Invalid session'], 400);
        }

        $verification = $this->registrationSession->getStep('verification');
        $tenant = Tenant::find($verification['tenant_id']);

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        // Verify COMPANY email code
        $verified = $this->verificationService->verifyCompanyEmailCode($tenant, $request->code);

        if (! $verified) {
            return response()->json([
                'message' => 'Invalid or expired verification code',
            ], 422);
        }

        return response()->json([
            'message' => 'Company email verified successfully',
            'verified' => true,
        ]);
    }

    /**
     * Send COMPANY phone verification code.
     */
    public function sendPhoneVerification(Request $request): JsonResponse
    {
        // Only require account, details, and verification (admin setup moved to after provisioning)
        if (! $this->registrationSession->ensureSteps(['account', 'details', 'verification'])) {
            return response()->json(['message' => 'Invalid session'], 400);
        }

        $payload = $this->registrationSession->get();
        // Use COMPANY phone for verification (from details)
        $companyPhone = $payload['details']['phone'] ?? null;

        if (empty($companyPhone)) {
            return response()->json([
                'message' => 'No company phone number provided',
            ], 422);
        }

        $verification = $this->registrationSession->getStep('verification');
        $tenant = Tenant::find($verification['tenant_id']);

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        // Update registration step
        $tenant->update(['registration_step' => Tenant::REG_STEP_VERIFY_PHONE]);

        // Check rate limiting
        if (! $this->verificationService->canResendCompanyPhoneCode($tenant)) {
            return response()->json([
                'message' => 'Please wait 1 minute before requesting a new code',
            ], 429);
        }

        // Send verification code to COMPANY phone
        $sent = $this->verificationService->sendCompanyPhoneVerificationCode($tenant, $companyPhone);

        if (! $sent) {
            return response()->json([
                'message' => 'Failed to send verification code. Please check your SMS configuration.',
            ], 500);
        }

        return response()->json([
            'message' => 'Verification code sent to your company phone',
        ]);
    }

    /**
     * Verify COMPANY phone verification code.
     */
    public function verifyPhone(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        // Only require account, details, and verification (admin setup moved to after provisioning)
        if (! $this->registrationSession->ensureSteps(['account', 'details', 'verification'])) {
            return response()->json(['message' => 'Invalid session'], 400);
        }

        $verification = $this->registrationSession->getStep('verification');
        $tenant = Tenant::find($verification['tenant_id']);

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        // Verify COMPANY phone code
        $verified = $this->verificationService->verifyCompanyPhoneCode($tenant, $request->code);

        if (! $verified) {
            return response()->json([
                'message' => 'Invalid or expired verification code',
            ], 422);
        }

        return response()->json([
            'message' => 'Company phone verified successfully',
            'verified' => true,
        ]);
    }

    public function storePlan(RegistrationPlanRequest $request): RedirectResponse
    {
        // Only require account and details (admin setup moved to after provisioning)
        if (! $this->registrationSession->ensureSteps(['account', 'details'])) {
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

        // Update registration step
        $this->updateTenantRegistrationStep(Tenant::REG_STEP_PLAN);

        // Payment is deferred; go straight to review page for now.
        return to_route('platform.register.payment');
    }

    /**
     * Activate trial and dispatch async provisioning.
     *
     * This method:
     * 1. Uses existing pending tenant if available (from verification step)
     * 2. Updates it with final registration data
     * 3. Dispatches the ProvisionTenant job to the queue
     * 4. Redirects to the provisioning status page
     *
     * IMPORTANT: Company email/phone are already verified and stored.
     * Admin credentials are passed to the job but NOT stored in central database.
     */
    public function activateTrial(RegistrationTrialRequest $request): RedirectResponse
    {
        // Only require account, details, and plan (admin setup moved to after provisioning)
        if (! $this->registrationSession->ensureSteps(['account', 'details', 'plan'])) {
            return to_route('platform.register.index');
        }

        $payload = $this->registrationSession->get();
        $trialData = $request->validated();
        $payload['trial'] = $trialData;

        $subdomain = $payload['details']['subdomain'] ?? null;
        $email = $payload['details']['email'] ?? null;

        // Get current session's tenant ID (if created during verification)
        $verification = $this->registrationSession->getStep('verification');
        $sessionTenantId = $verification['tenant_id'] ?? null;

        // Check if subdomain is taken by a DIFFERENT, ACTIVE tenant
        $existingBySubdomain = Tenant::where('subdomain', $subdomain)
            ->when($sessionTenantId, fn ($q) => $q->where('id', '!=', $sessionTenantId))
            ->whereNotIn('status', [Tenant::STATUS_PENDING, Tenant::STATUS_FAILED])
            ->first();

        if ($existingBySubdomain) {
            return back()->withErrors([
                'subdomain' => 'This subdomain is already taken by an active workspace. Please choose a different one.',
            ])->withInput();
        }

        // Check if email is taken by a DIFFERENT, ACTIVE tenant
        $existingByEmail = Tenant::where('email', $email)
            ->when($sessionTenantId, fn ($q) => $q->where('id', '!=', $sessionTenantId))
            ->whereNotIn('status', [Tenant::STATUS_PENDING, Tenant::STATUS_FAILED])
            ->first();

        if ($existingByEmail) {
            return back()->withErrors([
                'email' => 'This email is already registered with an active workspace. Please use a different email.',
            ])->withInput();
        }

        // Admin data is NO LONGER collected here - it will be collected after provisioning
        // on the tenant domain via the admin-setup page

        try {
            // Get existing pending tenant or create new one
            $tenant = DB::transaction(function () use ($payload, $sessionTenantId) {
                if ($sessionTenantId) {
                    // Update existing pending tenant
                    $tenant = Tenant::find($sessionTenantId);

                    if ($tenant && in_array($tenant->status, [Tenant::STATUS_PENDING, Tenant::STATUS_FAILED])) {
                        // Update tenant with final registration data via provisioner
                        $tenant = $this->tenantProvisioner->updateFromRegistration($tenant, $payload);
                    } else {
                        // Create new tenant (shouldn't happen, but fallback)
                        $tenant = $this->tenantProvisioner->createFromRegistration($payload);
                    }
                } else {
                    // Create new tenant
                    $tenant = $this->tenantProvisioner->createFromRegistration($payload);
                }

                return $tenant;
            });

            // Dispatch async provisioning job AFTER transaction commits
            // Admin will be created after provisioning on tenant domain
            ProvisionTenant::dispatch($tenant);
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error('Tenant creation/update failed', [
                'error' => $e->getMessage(),
                'subdomain' => $subdomain,
                'email' => $email,
            ]);

            return back()->withErrors([
                'error' => 'Failed to create workspace. Please try again.',
            ])->withInput();
        } catch (\Throwable $e) {
            Log::error('Unexpected error during tenant provisioning', [
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
     */
    public function retryProvisioning(Tenant $tenant): RedirectResponse
    {
        // Only allow retry for failed tenants
        if ($tenant->status !== Tenant::STATUS_FAILED) {
            return back()->with('error', 'Only failed provisioning can be retried.');
        }

        try {
            // Clean up orphaned database if it exists
            $this->cleanupOrphanedDatabase($tenant);

            // Reset tenant to pending state
            $tenant->update([
                'status' => Tenant::STATUS_PENDING,
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
            Log::error('Failed to retry tenant provisioning', [
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Failed to retry provisioning: '.$e->getMessage());
        }
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Get or create a pending tenant for the verification step.
     *
     * If a tenant already exists with the same email/subdomain (in pending/failed state),
     * we reuse it. Otherwise, we create a new one.
     */
    private function getOrCreatePendingTenant(array $payload): Tenant
    {
        $email = $payload['details']['email'];
        $subdomain = $payload['details']['subdomain'];

        // Check for existing tenant in session
        $verification = $this->registrationSession->getStep('verification');
        if (! empty($verification['tenant_id'])) {
            $existingTenant = Tenant::find($verification['tenant_id']);
            if ($existingTenant) {
                // Update with latest data
                $existingTenant->update([
                    'name' => $payload['details']['name'],
                    'email' => $email,
                    'subdomain' => $subdomain,
                    'phone' => $payload['details']['phone'] ?? null,
                    'type' => $payload['account']['type'] ?? 'company',
                ]);
                $existingTenant->touch();

                return $existingTenant;
            }
        }

        // Check for existing incomplete tenant with same email or subdomain
        $existingTenant = Tenant::where(function ($query) use ($email, $subdomain) {
            $query->where('email', $email)
                ->orWhere('subdomain', $subdomain);
        })
            ->whereIn('status', [Tenant::STATUS_PENDING, Tenant::STATUS_FAILED])
            ->first();

        if ($existingTenant) {
            // Update and reuse existing pending tenant
            $existingTenant->update([
                'name' => $payload['details']['name'],
                'email' => $email,
                'subdomain' => $subdomain,
                'phone' => $payload['details']['phone'] ?? null,
                'type' => $payload['account']['type'] ?? 'company',
                'status' => Tenant::STATUS_PENDING,
            ]);
            $existingTenant->touch();

            Log::info('Reusing existing pending tenant for registration', [
                'tenant_id' => $existingTenant->id,
                'email' => $email,
            ]);

            return $existingTenant;
        }

        // Create new pending tenant
        return Tenant::create([
            'id' => Str::uuid(),
            'name' => $payload['details']['name'],
            'email' => $email,
            'subdomain' => $subdomain,
            'phone' => $payload['details']['phone'] ?? null,
            'type' => $payload['account']['type'] ?? 'company',
            'status' => Tenant::STATUS_PENDING,
            'registration_step' => Tenant::REG_STEP_VERIFY_EMAIL,
        ]);
    }

    /**
     * Update the registration step for the current tenant in session.
     */
    private function updateTenantRegistrationStep(string $step): void
    {
        $verification = $this->registrationSession->getStep('verification');

        if (! empty($verification['tenant_id'])) {
            Tenant::where('id', $verification['tenant_id'])
                ->update(['registration_step' => $step]);
        }
    }

    /**
     * Clean up orphaned database from failed provisioning attempt.
     */
    private function cleanupOrphanedDatabase(Tenant $tenant): void
    {
        try {
            $databaseName = $tenant->tenancy_db_name;

            if (empty($databaseName)) {
                return;
            }

            // Check if database exists
            $exists = DB::select('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?', [$databaseName]);

            if (! empty($exists)) {
                // Drop the orphaned database
                DB::statement("DROP DATABASE `{$databaseName}`");

                Log::info('Cleaned up orphaned database before retry', [
                    'tenant_id' => $tenant->id,
                    'database' => $databaseName,
                ]);
            }
        } catch (\Throwable $e) {
            // Log but don't fail - provisioning job will handle it
            Log::warning('Could not cleanup orphaned database', [
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
