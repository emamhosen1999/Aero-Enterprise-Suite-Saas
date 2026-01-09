<?php

namespace Packages\AeroHrm\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Packages\AeroHrm\Models\AssetCategory;

class AssetCategoryFactory extends Factory
{
    protected $model = AssetCategory::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement([
                'Laptops',
                'Monitors',
                'Keyboards',
                'Mice',
                'Desks',
                'Chairs',
                'Phones',
                'Tablets',
                'Printers',
                'Projectors',
                'Servers',
                'Network Equipment',
                'Vehicles',
                'Furniture',
                'Tools'
            ]),
            'description' => $this->faker->sentence(),
            'icon' => $this->faker->randomElement(['laptop', 'monitor', 'keyboard', 'mouse', 'desk', 'chair', 'phone', 'tablet', 'printer']),
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the category is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
