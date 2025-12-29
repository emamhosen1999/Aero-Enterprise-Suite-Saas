<?php

declare(strict_types=1);

namespace Aero\Platform\Database\Factories;

use Aero\Platform\Models\Plan;
use Aero\Platform\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Tenant>
 */
class TenantFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<Tenant>
     */
    protected $model = Tenant::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $companyName = fake()->company();
        $subdomain = Str::slug($companyName) . '-' . fake()->unique()->numberBetween(1, 9999);

        return [
            'id' => (string) Str::uuid(),
            'name' => $companyName,
            'subdomain' => $subdomain,
            'email' => fake()->unique()->companyEmail(),
            'phone' => fake()->optional()->phoneNumber(),
            'type' => fake()->randomElement(['business', 'enterprise', 'startup']),
            'status' => Tenant::STATUS_ACTIVE,
            'plan_id' => null,
            'trial_ends_at' => null,
            'subscription_ends_at' => null,
            'maintenance_mode' => false,
            'provisioning_step' => null,
            'data' => [
                'address' => fake()->address(),
                'city' => fake()->city(),
                'country' => fake()->country(),
            ],
        ];
    }

    /**
     * Indicate that the tenant is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Tenant::STATUS_PENDING,
        ]);
    }

    /**
     * Indicate that the tenant is in provisioning.
     */
    public function provisioning(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Tenant::STATUS_PROVISIONING,
            'provisioning_step' => Tenant::STEP_CREATING_DB,
        ]);
    }

    /**
     * Indicate that the tenant is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Tenant::STATUS_ACTIVE,
        ]);
    }

    /**
     * Indicate that the tenant is suspended.
     */
    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Tenant::STATUS_SUSPENDED,
            'data' => array_merge($attributes['data'] ?? [], [
                'suspended_at' => now()->toIso8601String(),
                'suspended_reason' => 'Test suspension',
            ]),
        ]);
    }

    /**
     * Indicate that the tenant is archived (soft-deleted).
     */
    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Tenant::STATUS_ARCHIVED,
            'deleted_at' => now(),
        ]);
    }

    /**
     * Indicate that the tenant failed provisioning.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Tenant::STATUS_FAILED,
            'data' => array_merge($attributes['data'] ?? [], [
                'provisioning_error' => 'Database creation failed',
            ]),
        ]);
    }

    /**
     * Indicate that the tenant is on trial.
     */
    public function onTrial(int $days = 14): static
    {
        return $this->state(fn (array $attributes) => [
            'trial_ends_at' => now()->addDays($days),
        ]);
    }

    /**
     * Indicate that the tenant's trial has expired.
     */
    public function trialExpired(): static
    {
        return $this->state(fn (array $attributes) => [
            'trial_ends_at' => now()->subDay(),
        ]);
    }

    /**
     * Indicate that the tenant has an active subscription.
     */
    public function subscribed(): static
    {
        return $this->state(fn (array $attributes) => [
            'subscription_ends_at' => now()->addYear(),
        ]);
    }

    /**
     * Associate a plan with the tenant.
     */
    public function withPlan(?Plan $plan = null): static
    {
        return $this->state(fn (array $attributes) => [
            'plan_id' => $plan?->id ?? Plan::factory()->create()->id,
        ]);
    }

    /**
     * Set up admin data for provisioning.
     */
    public function withAdminData(string $name = null, string $email = null): static
    {
        return $this->state(fn (array $attributes) => [
            'admin_data' => [
                'name' => $name ?? fake()->name(),
                'email' => $email ?? fake()->email(),
                'password' => 'password123',
            ],
        ]);
    }

    /**
     * Set the tenant as in maintenance mode.
     */
    public function inMaintenance(): static
    {
        return $this->state(fn (array $attributes) => [
            'maintenance_mode' => true,
        ]);
    }
}
