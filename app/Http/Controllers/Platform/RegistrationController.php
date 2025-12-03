<?php

declare(strict_types=1);

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\RegistrationAccountTypeRequest;
use App\Http\Requests\Platform\RegistrationDetailsRequest;
use App\Http\Requests\Platform\RegistrationPlanRequest;
use App\Http\Requests\Platform\RegistrationTrialRequest;
use App\Jobs\ProvisionTenant;
use App\Services\Platform\PlatformVerificationService;
use App\Services\TenantProvisioner;
use App\Services\TenantRegistrationSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

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

        return to_route('platform.register.verify-email');
    }

    /**
     * Send email verification code.
     */
    public function sendEmailVerification(Request $request): JsonResponse
    {
        if (! $this->registrationSession->ensureSteps(['account', 'details', 'admin'])) {
            return response()->json(['message' => 'Invalid session'], 400);
        }

        $payload = $this->registrationSession->get();
        $email = $payload['admin']['email'];

        // Create temporary tenant record to store verification code
        $tenant = \App\Models\Tenant::firstOrCreate(
            ['email' => $payload['details']['email']],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'subdomain' => $payload['details']['subdomain'],
                'name' => $payload['details']['name'],
                'type' => $payload['account']['type'],
                'phone' => $payload['details']['phone'] ?? null,
                'status' => \App\Models\Tenant::STATUS_PENDING,
            ]
        );

        // Check rate limiting
        if (! $this->verificationService->canResendEmailCode($tenant)) {
            return response()->json([
                'message' => 'Please wait 1 minute before requesting a new code',
            ], 429);
        }

        // Send verification code
        $sent = $this->verificationService->sendEmailVerificationCode($tenant, $email);

        if (! $sent) {
            return response()->json([
                'message' => 'Failed to send verification code. Please try again.',
            ], 500);
        }

        // Store tenant ID in session
        $this->registrationSession->putStep('verification', ['tenant_id' => $tenant->id]);

        return response()->json([
            'message' => 'Verification code sent to your email',
        ]);
    }

    /**
     * Verify email verification code.
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        if (! $this->registrationSession->ensureSteps(['account', 'details', 'admin', 'verification'])) {
            return response()->json(['message' => 'Invalid session'], 400);
        }

        $verification = $this->registrationSession->getStep('verification');
        $tenant = \App\Models\Tenant::find($verification['tenant_id']);

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $verified = $this->verificationService->verifyEmailCode($tenant, $request->code);

        if (! $verified) {
            return response()->json([
                'message' => 'Invalid or expired verification code',
            ], 422);
        }

        return response()->json([
            'message' => 'Email verified successfully',
            'verified' => true,
        ]);
    }

    /**
     * Send phone verification code.
     */
    public function sendPhoneVerification(Request $request): JsonResponse
    {
        if (! $this->registrationSession->ensureSteps(['account', 'details', 'admin', 'verification'])) {
            return response()->json(['message' => 'Invalid session'], 400);
        }

        $payload = $this->registrationSession->get();
        $phone = $payload['details']['phone'] ?? null;

        if (empty($phone)) {
            return response()->json([
                'message' => 'No phone number provided',
            ], 422);
        }

        $verification = $this->registrationSession->getStep('verification');
        $tenant = \App\Models\Tenant::find($verification['tenant_id']);

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        // Check rate limiting
        if (! $this->verificationService->canResendPhoneCode($tenant)) {
            return response()->json([
                'message' => 'Please wait 1 minute before requesting a new code',
            ], 429);
        }

        // Send verification code
        $sent = $this->verificationService->sendPhoneVerificationCode($tenant, $phone);

        if (! $sent) {
            return response()->json([
                'message' => 'Failed to send verification code. Please check your SMS configuration.',
            ], 500);
        }

        return response()->json([
            'message' => 'Verification code sent to your phone',
        ]);
    }

    /**
     * Verify phone verification code.
     */
    public function verifyPhone(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        if (! $this->registrationSession->ensureSteps(['account', 'details', 'admin', 'verification'])) {
            return response()->json(['message' => 'Invalid session'], 400);
        }

        $verification = $this->registrationSession->getStep('verification');
        $tenant = \App\Models\Tenant::find($verification['tenant_id']);

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $verified = $this->verificationService->verifyPhoneCode($tenant, $request->code);

        if (! $verified) {
            return response()->json([
                'message' => 'Invalid or expired verification code',
            ], 422);
        }

        return response()->json([
            'message' => 'Phone verified successfully',
            'verified' => true,
        ]);
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
        $adminEmail = $payload['admin']['email'] ?? null;

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

        // Check if admin email is already used by another tenant admin
        if ($adminEmail) {
            $existingTenant = \App\Models\Tenant::where('data->admin_email', $adminEmail)->first();
            if ($existingTenant) {
                return back()->withErrors([
                    'admin_email' => 'This email is already registered as a tenant administrator. Please use a different email.',
                ])->withInput();
            }
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
