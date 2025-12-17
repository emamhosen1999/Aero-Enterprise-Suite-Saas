<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers;

use Aero\Platform\Models\Tenant;
use Aero\Platform\Services\Monitoring\Tenant\TenantRegistrationSession;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationPageController extends Controller
{
    /**
     * Registration flow steps (admin setup moved to after provisioning on tenant domain).
     */
    private array $steps = [
        ['key' => 'account', 'label' => 'Account Type', 'route' => 'platform.register.index'],
        ['key' => 'details', 'label' => 'Company Details', 'route' => 'platform.register.details'],
        ['key' => 'verify-email', 'label' => 'Verify Email', 'route' => 'platform.register.verify-email'],
        ['key' => 'verify-phone', 'label' => 'Verify Phone', 'route' => 'platform.register.verify-phone'],
        ['key' => 'plan', 'label' => 'Modules & Plan', 'route' => 'platform.register.plan'],
        ['key' => 'payment', 'label' => 'Review', 'route' => 'platform.register.payment'],
        ['key' => 'provisioning', 'label' => 'Setting Up', 'route' => 'platform.register.provisioning'],
        // Admin setup happens on tenant domain after provisioning completes
    ];

    public function __construct(private TenantRegistrationSession $registrationSession) {}

    public function accountType(): Response
    {
        return $this->render('Platform/Public/Register/AccountType', 'account', [
            'trialDays' => (int) config('platform.trial_days', 14),
        ]);
    }

    public function details(): Response|RedirectResponse
    {
        if (! $this->registrationSession->hasStep('account')) {
            return to_route('platform.register.index');
        }

        $account = $this->registrationSession->get()['account'] ?? [];

        return $this->render('Platform/Public/Register/Details', 'details', [
            'accountType' => $account['type'] ?? null,
            'baseDomain' => config('platform.central_domain'),
        ]);
    }

    /**
     * Email verification page (verify company email from details step).
     */
    public function verifyEmail(): Response|RedirectResponse
    {
        // Only require account and details (admin setup moved to after provisioning)
        if (! $this->registrationSession->ensureSteps(['account', 'details'])) {
            return to_route('platform.register.index');
        }

        $details = $this->registrationSession->get()['details'] ?? [];

        return $this->render('Platform/Public/Register/VerifyEmail', 'verify-email', [
            'email' => $details['email'] ?? '',
            'companyName' => $details['name'] ?? '',
        ]);
    }

    /**
     * Phone verification page (verify company phone from details step).
     */
    public function verifyPhone(): Response|RedirectResponse
    {
        // Require verification step to have been started
        if (! $this->registrationSession->ensureSteps(['account', 'details', 'verification'])) {
            return to_route('platform.register.index');
        }

        $details = $this->registrationSession->get()['details'] ?? [];

        return $this->render('Platform/Public/Register/VerifyPhone', 'verify-phone', [
            'phone' => $details['phone'] ?? '',
            'companyName' => $details['name'] ?? '',
        ]);
    }

    public function plan(): Response|RedirectResponse
    {
        // Only require account and details (admin setup moved to after provisioning)
        if (! $this->registrationSession->ensureSteps(['account', 'details'])) {
            return to_route('platform.register.index');
        }

        // Fetch plans with their modules
        $plans = \Aero\Platform\Models\Plan::with(['modules' => function ($query) {
            $query->select('modules.id', 'modules.code', 'modules.name', 'modules.is_core')
                ->where('is_active', true);
        }])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(function ($plan) {
                $limits = $plan->limits ?? [];

                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'monthly_price' => $plan->monthly_price,
                    'yearly_price' => $plan->yearly_price,
                    'is_featured' => $plan->is_featured,
                    'features' => $plan->features ?? [],
                    'limits' => $limits,
                    'badge' => $limits['badge'] ?? null,
                    'modules' => $plan->modules->map(fn ($m) => [
                        'id' => $m->id,
                        'code' => $m->code,
                        'name' => $m->name,
                        'is_core' => $m->is_core,
                    ]),
                ];
            });

        // Fetch all modules (excluding core) for individual selection
        $modules = \Aero\Core\Models\Module::where('is_active', true)
            ->where('is_core', false) // Core is always included
            ->select('id', 'code', 'name', 'description', 'category')
            ->orderBy('priority')
            ->get()
            ->map(function ($module) {
                return [
                    'id' => $module->id,
                    'code' => $module->code,
                    'name' => $module->name,
                    'description' => $module->description,
                    'category' => $module->category ?? 'General',
                ];
            });

        return $this->render('Platform/Public/Register/SelectPlan', 'plan', [
            'plans' => $plans,
            'modules' => $modules,
            'modulePricing' => config('platform.registration.module_pricing', ['monthly' => 20, 'yearly' => 200]),
        ]);
    }

    public function payment(): Response|RedirectResponse
    {
        // Only require account, details, and plan (admin setup moved to after provisioning)
        if (! $this->registrationSession->ensureSteps(['account', 'details', 'plan'])) {
            return to_route('platform.register.index');
        }

        // Get plan data and validate that user has selected something
        $planData = $this->registrationSession->get()['plan'] ?? [];
        $hasSelection = ! empty($planData['plan_id']) || ! empty($planData['modules']);

        if (! $hasSelection) {
            return to_route('platform.register.plan')
                ->with('error', 'Please select a plan or modules before continuing.');
        }

        // Fetch plans to display selected plan details
        $plans = \Aero\Platform\Models\Plan::with(['modules' => function ($query) {
            $query->select('modules.id', 'modules.code', 'modules.name')
                ->where('is_active', true);
        }])
            ->where('is_active', true)
            ->get()
            ->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'monthly_price' => $plan->monthly_price,
                    'yearly_price' => $plan->yearly_price,
                    'modules' => $plan->modules->map(fn ($m) => [
                        'id' => $m->id,
                        'code' => $m->code,
                        'name' => $m->name,
                    ]),
                ];
            });

        // Fetch modules for display
        $modules = \Aero\Core\Models\Module::where('is_active', true)
            ->where('is_core', false)
            ->select('id', 'code', 'name')
            ->get();

        return $this->render('Platform/Public/Register/Payment', 'payment', [
            'trialDays' => (int) config('platform.trial_days', 14),
            'baseDomain' => config('platform.central_domain'),
            'plans' => $plans,
            'modules' => $modules,
            'modulePricing' => config('platform.registration.module_pricing', ['monthly' => 20, 'yearly' => 200]),
        ]);
    }

    /**
     * Provisioning status "waiting room" page.
     *
     * Shows the user real-time status of their workspace provisioning.
     */
    public function provisioning(Tenant $tenant): Response
    {
        return Inertia::render('Platform/Public/Register/Provisioning', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
                'status' => $tenant->status,
                'provisioning_step' => $tenant->provisioning_step,
            ],
            'baseDomain' => config('platform.central_domain'),
            'steps' => $this->steps,
            'currentStep' => 'provisioning',
        ]);
    }

    /**
     * API endpoint to check provisioning status.
     *
     * Called by the frontend to poll for status updates.
     * Redirects to admin-setup page instead of login when ready.
     */
    public function provisioningStatus(Tenant $tenant): JsonResponse
    {
        $baseDomain = config('platform.central_domain');
        $domain = sprintf('%s.%s', $tenant->subdomain, $baseDomain);

        // Check if tenant has already completed admin setup
        $adminSetupCompleted = $tenant->isAdminSetupComplete();

        // Determine redirect URL based on admin setup status
        $redirectUrl = null;
        if ($tenant->status === Tenant::STATUS_ACTIVE) {
            // If admin setup is not complete, redirect to admin-setup page
            // Otherwise redirect to login
            $redirectUrl = $adminSetupCompleted
                ? sprintf('https://%s/login', $domain)
                : sprintf('https://%s/admin-setup', $domain);
        }

        return response()->json([
            'id' => $tenant->id,
            'status' => $tenant->status,
            'step' => $tenant->provisioning_step,
            'provisioning_step' => $tenant->provisioning_step, // Alias for backward compatibility
            'domain' => $domain,
            'is_ready' => $tenant->status === Tenant::STATUS_ACTIVE,
            'has_failed' => $tenant->status === Tenant::STATUS_FAILED,
            'error' => $tenant->status === Tenant::STATUS_FAILED
                ? ($tenant->data['provisioning_error'] ?? 'Provisioning failed')
                : null,
            'login_url' => $redirectUrl,
            'needs_admin_setup' => ! $adminSetupCompleted,
        ]);
    }

    public function success(): Response|RedirectResponse
    {
        $result = $this->registrationSession->pullSuccess();

        if ($result === null) {
            return to_route('platform.register.index');
        }

        return $this->render('Platform/Public/Register/Success', 'success', [
            'result' => $result,
            'baseDomain' => config('platform.central_domain'),
        ]);
    }

    private function render(string $component, string $currentStep, array $props = []): Response
    {
        return Inertia::render($component, [
            ...$props,
            'steps' => $this->steps,
            'currentStep' => $currentStep,
            'savedData' => $this->registrationSession->get(),
        ]);
    }
}
