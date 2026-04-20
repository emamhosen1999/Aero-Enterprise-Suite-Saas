<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\JobOffer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobOffer>
 */
class JobOfferFactory extends Factory
{
    protected $model = JobOffer::class;

    public function definition(): array
    {
        return [
            'application_id' => null,
            'offered_salary' => $this->faker->numberBetween(30000, 150000),
            'joining_date' => $this->faker->dateTimeBetween('+2 weeks', '+2 months'),
            'offer_expiry' => $this->faker->dateTimeBetween('+1 week', '+1 month'),
            'position' => $this->faker->jobTitle(),
            'status' => $this->faker->randomElement(['pending', 'accepted', 'rejected', 'expired']),
            'benefits' => $this->faker->optional()->paragraph(),
        ];
    }

    public function accepted(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'accepted']);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'rejected']);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'expired']);
    }
}
