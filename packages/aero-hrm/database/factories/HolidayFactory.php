<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\Aero\HRM\Models\Holiday>
 */
class HolidayFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Holiday::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $date = Carbon::now()->addDays($this->faker->numberBetween(1, 365));
        
        return [
            'title' => $this->faker->randomElement([
                'New Year\'s Day',
                'Independence Day',
                'Christmas Day',
                'Thanksgiving',
                'Labor Day',
                'Memorial Day',
                'Diwali',
                'Eid al-Fitr',
                'Company Anniversary',
            ]),
            'description' => $this->faker->sentence(),
            'date' => $date,
            'end_date' => null,
            'type' => $this->faker->randomElement(['public', 'religious', 'national', 'company', 'optional']),
            'is_recurring' => $this->faker->boolean(30),
            'applicable_to' => null,
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the holiday is recurring.
     */
    public function recurring(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_recurring' => true,
        ]);
    }

    /**
     * Indicate that the holiday is multi-day.
     */
    public function multiDay(): static
    {
        return $this->state(function (array $attributes) {
            $startDate = Carbon::parse($attributes['date']);
            return [
                'end_date' => $startDate->copy()->addDays($this->faker->numberBetween(1, 3)),
            ];
        });
    }

    /**
     * Indicate that the holiday is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the holiday is optional.
     */
    public function optional(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'optional',
        ]);
    }
}
