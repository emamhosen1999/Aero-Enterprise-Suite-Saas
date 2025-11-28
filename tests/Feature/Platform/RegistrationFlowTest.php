<?php

namespace Tests\Feature\Platform;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_details_step_requires_account_type(): void
    {
        $response = $this->post(route('platform.register.details.store'), [
            'name' => 'Acme',
            'email' => 'ops@acme.test',
            'subdomain' => 'acme',
        ]);

        $response->assertRedirect(route('platform.register.index'));
    }

    public function test_trial_activation_provisions_tenant_and_domain(): void
    {
        config(['platform.central_domain' => 'platform.test']);

        $this->post(route('platform.register.account-type.store'), [
            'type' => 'company',
        ])->assertRedirect(route('platform.register.details'));

        $this->post(route('platform.register.details.store'), [
            'name' => 'Acme Manufacturing',
            'email' => 'ops@acme.test',
            'phone' => '+1 555 0100',
            'subdomain' => 'acme',
            'team_size' => 120,
        ])->assertRedirect(route('platform.register.plan'));

        $this->post(route('platform.register.plan.store'), [
            'billing_cycle' => 'monthly',
            'modules' => ['hr', 'projects'],
            'notes' => 'Need HR + PM to start',
        ])->assertRedirect(route('platform.register.payment'));

        $response = $this->post(route('platform.register.trial.activate'), [
            'accept_terms' => true,
            'notify_updates' => false,
        ]);

        $response->assertRedirect(route('platform.register.success'));

        $this->assertDatabaseHas('tenants', [
            'email' => 'ops@acme.test',
            'subdomain' => 'acme',
            'subscription_plan' => 'monthly',
        ]);

        $this->assertDatabaseHas('domains', [
            'domain' => 'acme.platform.test',
        ]);

        $tenant = Tenant::query()->where('subdomain', 'acme')->first();
        $this->assertNotNull($tenant);
        $this->assertNotNull($tenant->trial_ends_at);

        $this->get(route('platform.register.success'))->assertOk();
    }
}
