<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\HrDocument;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HrDocument>
 */
class HrDocumentFactory extends Factory
{
    protected $model = HrDocument::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(3),
            'category' => $this->faker->randomElement(['policy', 'handbook', 'form', 'template', 'sop']),
            'file_path' => $this->faker->filePath(),
            'description' => $this->faker->optional()->paragraph(),
            'uploaded_by' => null,
            'status' => $this->faker->randomElement(['draft', 'published', 'archived']),
        ];
    }
}
