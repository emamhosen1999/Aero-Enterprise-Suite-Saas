<?php

namespace Tests\Feature\Platform;

use App\Jobs\ProvisionTenant;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
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
        Queue::fake();
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

        // Should redirect to provisioning page now (async flow)
        $tenant = Tenant::query()->where('subdomain', 'acme')->first();
        $this->assertNotNull($tenant);

        $response->assertRedirect(route('platform.register.provisioning', ['tenant' => $tenant->id]));

        // Verify tenant was created with pending status
        $this->assertDatabaseHas('tenants', [
            'email' => 'ops@acme.test',
            'subdomain' => 'acme',
            'subscription_plan' => 'monthly',
            'status' => Tenant::STATUS_PENDING,
        ]);

        // Verify domain was created
        $this->assertDatabaseHas('domains', [
            'domain' => 'acme.platform.test',
        ]);

        // Verify admin_data was stored (hashed password)
        $this->assertNotNull($tenant->admin_data);
        $this->assertEquals('ops@acme.test', $tenant->admin_data['email']);

        // Verify trial ends at is set
        $this->assertNotNull($tenant->trial_ends_at);

        // Verify provisioning job was dispatched
        Queue::assertPushed(ProvisionTenant::class, function ($job) use ($tenant) {
            return $job->tenant->id === $tenant->id;
        });
    }

    public function test_provisioning_status_page_returns_tenant_info(): void
    {
        $tenant = Tenant::factory()->pending()->create([
            'subdomain' => 'test-company',
            'provisioning_step' => Tenant::STEP_MIGRATING,
        ]);

        $response = $this->get(route('platform.register.provisioning', ['tenant' => $tenant->id]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Public/Register/Provisioning', false) // false = don't check if file exists
            ->has('tenant')
            ->where('tenant.id', $tenant->id)
            ->where('tenant.status', Tenant::STATUS_PENDING)
            ->where('tenant.provisioning_step', Tenant::STEP_MIGRATING)
        );
    }

    public function test_provisioning_status_api_returns_json(): void
    {
        config(['platform.central_domain' => 'platform.test']);

        $tenant = Tenant::factory()->pending()->create([
            'subdomain' => 'test-company',
            'provisioning_step' => Tenant::STEP_SEEDING,
        ]);

        $response = $this->getJson(route('platform.register.provisioning.status', ['tenant' => $tenant->id]));

        $response->assertOk();
        $response->assertJson([
            'id' => $tenant->id,
            'status' => Tenant::STATUS_PENDING,
            'step' => Tenant::STEP_SEEDING,
            'provisioning_step' => Tenant::STEP_SEEDING,
            'domain' => 'test-company.platform.test',
            'is_ready' => false,
            'has_failed' => false,
        ]);
    }

    public function test_provisioning_status_api_returns_ready_when_active(): void
    {
        config(['platform.central_domain' => 'platform.test']);

        $tenant = Tenant::factory()->create([
            'subdomain' => 'ready-company',
            'status' => Tenant::STATUS_ACTIVE,
        ]);

        $response = $this->getJson(route('platform.register.provisioning.status', ['tenant' => $tenant->id]));

        $response->assertOk();
        $response->assertJson([
            'id' => $tenant->id,
            'status' => Tenant::STATUS_ACTIVE,
            'domain' => 'ready-company.platform.test',
            'is_ready' => true,
            'has_failed' => false,
            'login_url' => 'https://ready-company.platform.test/login',
        ]);
    }

    public function test_api_tenants_status_endpoint_works(): void
    {
        config(['platform.central_domain' => 'platform.test']);

        $tenant = Tenant::factory()->provisioning()->create([
            'subdomain' => 'api-test',
        ]);

        $response = $this->getJson(route('api.tenants.status', ['tenant' => $tenant->id]));

        $response->assertOk();
        $response->assertJson([
            'id' => $tenant->id,
            'status' => Tenant::STATUS_PROVISIONING,
            'domain' => 'api-test.platform.test',
        ]);
    }
}
