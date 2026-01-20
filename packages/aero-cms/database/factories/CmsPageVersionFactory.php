<?php

namespace Aero\Cms\Database\Factories;

use Aero\Cms\Models\CmsPage;
use Aero\Cms\Models\CmsPageVersion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\Aero\Cms\Models\CmsPageVersion>
 */
class CmsPageVersionFactory extends Factory
{
    protected $model = CmsPageVersion::class;

    public function definition(): array
    {
        return [
            'page_id' => CmsPage::factory(),
            'version_number' => $this->faker->numberBetween(1, 100),
            'title' => $this->faker->sentence(4),
            'content' => [
                'blocks' => [
                    [
                        'type' => 'hero_standard',
                        'content' => [
                            'title' => $this->faker->catchPhrase(),
                            'subtitle' => $this->faker->sentence(10),
                        ],
                    ],
                ],
                'settings' => [
                    'layout' => 'default',
                ],
            ],
            'created_by' => null,
            'notes' => $this->faker->optional()->sentence(),
        ];
    }

    /**
     * Mark as a specific version number.
     */
    public function version(int $versionNumber): static
    {
        return $this->state(fn (array $attributes) => [
            'version_number' => $versionNumber,
        ]);
    }

    /**
     * Add version notes.
     */
    public function withNotes(string $notes): static
    {
        return $this->state(fn (array $attributes) => [
            'notes' => $notes,
        ]);
    }
}
