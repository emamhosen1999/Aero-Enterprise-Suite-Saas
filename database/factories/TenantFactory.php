<?php

namespace Database\Factories;

use Aero\Platform\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tenant>
 */
class TenantFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
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
        $subdomain = Str::slug($companyName).'-'.fake()->randomNumber(4);

        return [
            'id' => Str::uuid()->toString(),
            'name' => $companyName,
            'type' => fake()->randomElement(['startup', 'smb', 'enterprise']),
            'subdomain' => $subdomain,
            'email' => fake()->unique()->companyEmail(),
            'phone' => fake()->phoneNumber(),
            'status' => Tenant::STATUS_ACTIVE,
            'maintenance_mode' => false,
            'trial_ends_at' => now()->addDays(14),
            'modules' => [
                'crm' => true,
                'hr' => true,
                'projects' => true,
                'dms' => false,
            ],
            'data' => [
                'owner_name' => fake()->name(),
                'address' => fake()->address(),
                'timezone' => fake()->timezone(),
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
     * Indicate that the tenant is suspended.
     */
    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Tenant::STATUS_SUSPENDED,
        ]);
    }

    /**
     * Indicate that the tenant is archived.
     */
    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Tenant::STATUS_ARCHIVED,
        ]);
    }

    /**
     * Indicate that the tenant is in maintenance mode.
     */
    public function inMaintenance(): static
    {
        return $this->state(fn (array $attributes) => [
            'maintenance_mode' => true,
        ]);
    }

    /**
     * Indicate that the tenant's trial has expired.
     */
    public function trialExpired(): static
    {
        return $this->state(fn (array $attributes) => [
            'trial_ends_at' => now()->subDays(1),
        ]);
    }

    /**
     * Indicate that the tenant is provisioning.
     */
    public function provisioning(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Tenant::STATUS_PROVISIONING,
            'provisioning_step' => Tenant::STEP_CREATING_DB,
        ]);
    }

    /**
     * Indicate that the tenant provisioning has failed.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Tenant::STATUS_FAILED,
        ]);
    }

    /**
     * Include admin data for provisioning.
     */
    public function withAdminData(array $data = []): static
    {
        return $this->state(fn (array $attributes) => [
            'admin_data' => array_merge([
                'name' => fake()->name(),
                'email' => fake()->unique()->safeEmail(),
                'password' => bcrypt('password'),
            ], $data),
        ]);
    }

    /**
     * Indicate that admin setup has been completed.
     */
    public function withAdminSetupComplete(): static
    {
        return $this->state(fn (array $attributes) => [
            'data' => array_merge($attributes['data'] ?? [], [
                'admin_setup_completed' => true,
                'admin_setup_completed_at' => now()->toISOString(),
            ]),
        ]);
    }
}
