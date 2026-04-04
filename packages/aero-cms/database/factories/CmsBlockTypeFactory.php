<?php

namespace Aero\Cms\Database\Factories;

use Aero\Cms\Models\CmsBlockType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CmsBlockType>
 */
class CmsBlockTypeFactory extends Factory
{
    protected $model = CmsBlockType::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(2),
            'slug' => $this->faker->slug(),
            'description' => $this->faker->paragraph(),
            'schema_data' => [
                'fields' => [
                    ['name' => 'title', 'type' => 'text', 'required' => true],
                    ['name' => 'content', 'type' => 'textarea'],
                ],
            ],
            'category' => $this->faker->randomElement(['basic', 'advanced', 'custom']),
            'icon' => 'SparklesIcon',
            'preview_image' => null,
            'sort_order' => 0,
            'is_active' => true,
        ];
    }

    /**
     * Indicate the block type is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate the block type is of advanced category.
     */
    public function advanced(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'advanced',
        ]);
    }

    /**
     * Indicate the block type is of basic category.
     */
    public function basic(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'basic',
        ]);
    }
}
