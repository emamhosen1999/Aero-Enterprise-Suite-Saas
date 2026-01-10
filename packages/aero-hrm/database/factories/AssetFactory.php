<?php

namespace Packages\AeroHrm\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Packages\AeroHrm\Models\Asset;
use Packages\AeroHrm\Models\AssetCategory;

class AssetFactory extends Factory
{
    protected $model = Asset::class;

    public function definition(): array
    {
        return [
            'asset_category_id' => AssetCategory::factory(),
            'asset_tag' => 'AST' . now()->format('Y') . str_pad($this->faker->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'name' => $this->faker->words(3, true),
            'description' => $this->faker->optional()->sentence(),
            'serial_number' => strtoupper($this->faker->bothify('??-####-??##')),
            'qr_code' => $this->faker->optional()->uuid(),
            'purchase_date' => $this->faker->dateTimeBetween('-3 years', 'now'),
            'purchase_price' => $this->faker->randomFloat(2, 100, 5000),
            'warranty_expiry' => $this->faker->optional(0.6)->dateTimeBetween('now', '+3 years'),
            'status' => 'available',
        ];
    }

    /**
     * Indicate that the asset is allocated.
     */
    public function allocated(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'allocated',
        ]);
    }

    /**
     * Indicate that the asset is under maintenance.
     */
    public function maintenance(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'maintenance',
        ]);
    }

    /**
     * Indicate that the asset is retired.
     */
    public function retired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'retired',
        ]);
    }

    /**
     * Indicate that the asset is lost.
     */
    public function lost(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'lost',
        ]);
    }

    /**
     * Indicate that the asset has a QR code.
     */
    public function withQrCode(): static
    {
        return $this->state(fn (array $attributes) => [
            'qr_code' => $this->faker->uuid(),
        ]);
    }
}
