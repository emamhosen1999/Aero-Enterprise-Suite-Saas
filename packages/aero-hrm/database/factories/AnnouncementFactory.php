<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Announcement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Announcement>
 */
class AnnouncementFactory extends Factory
{
    protected $model = Announcement::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(4),
            'content' => $this->faker->paragraphs(2, true),
            'priority' => $this->faker->randomElement(['low', 'medium', 'high', 'urgent']),
            'published_at' => $this->faker->optional()->dateTime(),
            'expires_at' => $this->faker->optional()->dateTimeBetween('+1 week', '+1 month'),
            'status' => $this->faker->randomElement(['draft', 'published', 'expired']),
            'created_by' => null,
        ];
    }
}
