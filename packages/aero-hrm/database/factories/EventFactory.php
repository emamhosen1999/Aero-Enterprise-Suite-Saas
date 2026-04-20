<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    protected $model = Event::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraph(),
            'start_date' => $this->faker->dateTimeBetween('now', '+1 month'),
            'end_date' => $this->faker->dateTimeBetween('+1 month', '+2 months'),
            'location' => $this->faker->optional()->city(),
            'type' => $this->faker->randomElement(['meeting', 'workshop', 'conference', 'celebration', 'training']),
            'status' => $this->faker->randomElement(['upcoming', 'ongoing', 'completed', 'cancelled']),
        ];
    }
}
