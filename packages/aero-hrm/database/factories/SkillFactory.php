<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Skill;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Skill>
 */
class SkillFactory extends Factory
{
    protected $model = Skill::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement(['JavaScript', 'Python', 'Project Management', 'Leadership', 'Communication', 'SQL', 'DevOps', 'Data Analysis']),
            'description' => $this->faker->optional()->sentence(),
            'category' => $this->faker->randomElement(['technical', 'soft_skill', 'domain', 'language']),
            'status' => 'active',
        ];
    }
}
