<?php

namespace Aero\Core\Database\Factories;

use Aero\Core\Models\Announcement;
use Aero\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Announcement>
 */
class AnnouncementFactory extends Factory
{
    protected $model = Announcement::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'author_id' => User::factory(),
            'title' => fake()->sentence(4),
            'body' => fake()->paragraph(),
            'type' => fake()->randomElement(['info', 'warning', 'success', 'danger']),
            'priority' => fake()->randomElement(['low', 'normal', 'high', 'urgent']),
            'starts_at' => now()->subHour(),
            'expires_at' => now()->addDays(7),
            'is_pinned' => false,
            'is_dismissible' => true,
            'target_roles' => null,
            'target_departments' => null,
            'dismissed_by' => null,
        ];
    }

    public function pinned(): static
    {
        return $this->state(fn () => ['is_pinned' => true]);
    }

    public function expired(): static
    {
        return $this->state(fn () => ['expires_at' => now()->subDay()]);
    }

    public function urgent(): static
    {
        return $this->state(fn () => ['priority' => 'urgent', 'type' => 'danger']);
    }
}
