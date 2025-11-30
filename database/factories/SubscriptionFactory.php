<?php

namespace Database\Factories;

use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Subscription>
 */
class SubscriptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $billingCycle = fake()->randomElement(['monthly', 'yearly']);
        $startsAt = fake()->dateTimeBetween('-1 year', 'now');

        return [
            'tenant_id' => Tenant::factory(),
            'plan_id' => Plan::factory(),
            'billing_cycle' => $billingCycle,
            'amount' => fake()->randomFloat(2, 29, 299),
            'discount_amount' => 0,
            'currency' => 'USD',
            'status' => 'active',
            'starts_at' => $startsAt,
            'ends_at' => $billingCycle === 'monthly'
                ? (clone $startsAt)->modify('+1 month')
                : (clone $startsAt)->modify('+1 year'),
            'payment_method' => fake()->randomElement(['stripe', 'paypal']),
            'metadata' => null,
        ];
    }

    public function trialing(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'trialing',
            'trial_starts_at' => now(),
            'trial_ends_at' => now()->addDays(14),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => fake()->sentence(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'expired',
            'ends_at' => now()->subDays(1),
        ]);
    }
}
