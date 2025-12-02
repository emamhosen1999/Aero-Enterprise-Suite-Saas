<?php

declare(strict_types=1);

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\TenantRegistrationSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationPageController extends Controller
{
    private array $steps = [
        ['key' => 'account', 'label' => 'Account Type', 'route' => 'platform.register.index'],
        ['key' => 'details', 'label' => 'Company Details', 'route' => 'platform.register.details'],
        ['key' => 'admin', 'label' => 'Admin Details', 'route' => 'platform.register.admin'],
        ['key' => 'plan', 'label' => 'Modules & Plan', 'route' => 'platform.register.plan'],
        ['key' => 'payment', 'label' => 'Review', 'route' => 'platform.register.payment'],
        ['key' => 'provisioning', 'label' => 'Setting Up', 'route' => 'platform.register.provisioning'],
    ];

    public function __construct(private TenantRegistrationSession $registrationSession) {}

    public function accountType(): Response
    {
        return $this->render('Public/Register/AccountType', 'account', [
            'trialDays' => (int) config('platform.trial_days', 14),
        ]);
    }

    public function details(): Response|RedirectResponse
    {
        if (! $this->registrationSession->hasStep('account')) {
            return to_route('platform.register.index');
        }

        $account = $this->registrationSession->get()['account'] ?? [];

        return $this->render('Public/Register/Details', 'details', [
            'accountType' => $account['type'] ?? null,
            'baseDomain' => config('platform.central_domain'),
        ]);
    }

    public function admin(): Response|RedirectResponse
    {
        if (! $this->registrationSession->ensureSteps(['account', 'details'])) {
            return to_route('platform.register.index');
        }

        $details = $this->registrationSession->get()['details'] ?? [];

        return $this->render('Public/Register/AdminDetails', 'admin', [
            'companyName' => $details['name'] ?? '',
            'subdomain' => $details['subdomain'] ?? '',
            'baseDomain' => config('platform.central_domain'),
        ]);
    }

    public function plan(): Response|RedirectResponse
    {
        if (! $this->registrationSession->ensureSteps(['account', 'details', 'admin'])) {
            return to_route('platform.register.index');
        }

        // Fetch plans with their modules
        $plans = \App\Models\Plan::with(['modules' => function ($query) {
            $query->select('modules.id', 'modules.code', 'modules.name', 'modules.is_core')
                ->where('is_active', true);
        }])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(function ($plan) {
                $limits = $plan->limits ? json_decode($plan->limits, true) : [];

                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'monthly_price' => $plan->monthly_price,
                    'yearly_price' => $plan->yearly_price,
                    'is_featured' => $plan->is_featured,
                    'features' => $plan->features ? json_decode($plan->features, true) : [],
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
        $modules = \App\Models\Module::where('is_active', true)
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

        return $this->render('Public/Register/SelectPlan', 'plan', [
            'plans' => $plans,
            'modules' => $modules,
            'modulePricing' => config('platform.registration.module_pricing', ['monthly' => 20, 'yearly' => 200]),
        ]);
    }

    public function payment(): Response|RedirectResponse
    {
        if (! $this->registrationSession->ensureSteps(['account', 'details', 'admin', 'plan'])) {
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
        $plans = \App\Models\Plan::with(['modules' => function ($query) {
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
        $modules = \App\Models\Module::where('is_active', true)
            ->where('is_core', false)
            ->select('id', 'code', 'name')
            ->get();

        return $this->render('Public/Register/Payment', 'payment', [
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
        return Inertia::render('Public/Register/Provisioning', [
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
     */
    public function provisioningStatus(Tenant $tenant): JsonResponse
    {
        $baseDomain = config('platform.central_domain');
        $domain = sprintf('%s.%s', $tenant->subdomain, $baseDomain);

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
            'login_url' => $tenant->status === Tenant::STATUS_ACTIVE
                ? sprintf('https://%s/login', $domain)
                : null,
        ]);
    }

    public function success(): Response|RedirectResponse
    {
        $result = $this->registrationSession->pullSuccess();

        if ($result === null) {
            return to_route('platform.register.index');
        }

        return $this->render('Public/Register/Success', 'success', [
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
