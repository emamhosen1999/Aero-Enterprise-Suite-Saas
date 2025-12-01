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

        return to_route('platform.register.plan');
    }

    public function storePlan(RegistrationPlanRequest $request): RedirectResponse
    {
        if (! $this->registrationSession->ensureSteps(['account', 'details'])) {
            return to_route('platform.register.index');
        }

        $payload = $request->validated();
        $this->registrationSession->putStep('plan', $payload);

        // Payment is deferred; go straight to review page for now.
        return to_route('platform.register.payment');
    }

    /**
     * Activate trial and dispatch async provisioning.
     *
     * This method:
     * 1. Creates the Tenant and Domain records immediately
     * 2. Stores hashed admin credentials in admin_data column
     * 3. Dispatches the ProvisionTenant job to the queue
     * 4. Redirects to the provisioning status page
     */
    public function activateTrial(RegistrationTrialRequest $request): RedirectResponse
    {
        if (! $this->registrationSession->ensureSteps(['account', 'details', 'plan'])) {
            return to_route('platform.register.index');
        }

        $payload = $this->registrationSession->get();
        $payload['trial'] = $request->validated();

        // Create tenant with pending status and admin_data
        $tenant = $this->tenantProvisioner->createFromRegistration($payload);

        // Dispatch async provisioning job
        ProvisionTenant::dispatch($tenant);

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
}
