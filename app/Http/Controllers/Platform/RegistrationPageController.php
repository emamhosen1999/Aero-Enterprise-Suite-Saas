<?php

declare(strict_types=1);

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Services\TenantRegistrationSession;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationPageController extends Controller
{
    private array $steps = [
        ['key' => 'account', 'label' => 'Account Type', 'route' => 'platform.register.index'],
        ['key' => 'details', 'label' => 'Company Details', 'route' => 'platform.register.details'],
        ['key' => 'plan', 'label' => 'Modules & Plan', 'route' => 'platform.register.plan'],
        ['key' => 'payment', 'label' => 'Review', 'route' => 'platform.register.payment'],
        ['key' => 'success', 'label' => 'Workspace Ready', 'route' => 'platform.register.success'],
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

    public function plan(): Response|RedirectResponse
    {
        if (! $this->registrationSession->ensureSteps(['account', 'details'])) {
            return to_route('platform.register.index');
        }

        return $this->render('Public/Register/SelectPlan', 'plan', [
            'modules' => config('platform.registration.modules', []),
            'modulePricing' => config('platform.registration.module_pricing', []),
            'defaultModules' => config('platform.registration.default_modules', []),
        ]);
    }

    public function payment(): Response|RedirectResponse
    {
        if (! $this->registrationSession->ensureSteps(['account', 'details', 'plan'])) {
            return to_route('platform.register.index');
        }

        return $this->render('Public/Register/Payment', 'payment', [
            'trialDays' => (int) config('platform.trial_days', 14),
            'baseDomain' => config('platform.central_domain'),
            'modulesCatalog' => config('platform.registration.modules', []),
            'modulePricing' => config('platform.registration.module_pricing', []),
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
