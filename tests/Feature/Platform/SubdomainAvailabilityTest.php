<?php

namespace Tests\Feature\Platform;

use App\Models\Platform\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubdomainAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_subdomain_availability_check_returns_available_for_new_subdomain(): void
    {
        $response = $this->postJson('/api/check-subdomain', [
            'subdomain' => 'newcompany',
        ]);

        $response->assertOk()
            ->assertJson([
                'available' => true,
                'message' => 'Subdomain is available',
            ]);
    }

    public function test_subdomain_availability_check_returns_taken_for_active_tenant(): void
    {
        // Create an active tenant
        Tenant::create([
            'id' => 'test-tenant-id',
            'name' => 'Existing Company',
            'email' => 'existing@company.test',
            'subdomain' => 'existing',
            'type' => 'company',
            'status' => Tenant::STATUS_ACTIVE,
        ]);

        $response = $this->postJson('/api/check-subdomain', [
            'subdomain' => 'existing',
        ]);

        $response->assertOk()
            ->assertJson([
                'available' => false,
                'message' => 'This subdomain is already taken',
            ]);
    }

    public function test_subdomain_availability_check_returns_available_for_pending_tenant(): void
    {
        // Create a pending tenant (can be resumed/taken over)
        Tenant::create([
            'id' => 'pending-tenant-id',
            'name' => 'Pending Company',
            'email' => 'pending@company.test',
            'subdomain' => 'pending',
            'type' => 'company',
            'status' => Tenant::STATUS_PENDING,
        ]);

        $response = $this->postJson('/api/check-subdomain', [
            'subdomain' => 'pending',
        ]);

        // Pending tenants are considered available for resume
        $response->assertOk()
            ->assertJson([
                'available' => true,
                'message' => 'Subdomain is available',
            ]);
    }

    public function test_subdomain_availability_check_returns_available_for_failed_tenant(): void
    {
        // Create a failed tenant (can be cleaned up and reused)
        Tenant::create([
            'id' => 'failed-tenant-id',
            'name' => 'Failed Company',
            'email' => 'failed@company.test',
            'subdomain' => 'failed',
            'type' => 'company',
            'status' => Tenant::STATUS_FAILED,
        ]);

        $response = $this->postJson('/api/check-subdomain', [
            'subdomain' => 'failed',
        ]);

        // Failed tenants are considered available for retry
        $response->assertOk()
            ->assertJson([
                'available' => true,
                'message' => 'Subdomain is available',
            ]);
    }

    public function test_subdomain_availability_check_validates_format(): void
    {
        $response = $this->postJson('/api/check-subdomain', [
            'subdomain' => 'Invalid@Subdomain!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['subdomain']);
    }

    public function test_subdomain_availability_check_requires_subdomain_parameter(): void
    {
        $response = $this->postJson('/api/check-subdomain', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['subdomain']);
    }

    public function test_subdomain_availability_check_accepts_hyphens(): void
    {
        $response = $this->postJson('/api/check-subdomain', [
            'subdomain' => 'my-company',
        ]);

        $response->assertOk()
            ->assertJson([
                'available' => true,
            ]);
    }

    public function test_subdomain_availability_check_case_insensitive(): void
    {
        // Create an active tenant with lowercase subdomain
        Tenant::create([
            'id' => 'test-tenant-id',
            'name' => 'Test Company',
            'email' => 'test@company.test',
            'subdomain' => 'testcompany',
            'type' => 'company',
            'status' => Tenant::STATUS_ACTIVE,
        ]);

        // Check with uppercase should still detect it as taken
        $response = $this->postJson('/api/check-subdomain', [
            'subdomain' => 'testcompany', // Will be lowercased by validation
        ]);

        $response->assertOk()
            ->assertJson([
                'available' => false,
            ]);
    }
}
