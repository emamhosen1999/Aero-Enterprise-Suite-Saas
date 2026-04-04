<?php

namespace Aero\Cms\Database\Factories;

use Aero\Cms\Models\CmsBlockVersion;
use Illuminate\Database\Eloquent\Factories\Factory;

class CmsBlockVersionFactory extends Factory
{
    protected $model = CmsBlockVersion::class;

    public function definition(): array
    {
        return [
            'cms_page_block_id' => 1, // Set in tests
            'version_number' => $this->faker->numberBetween(1, 5),
            'version_label' => 'v' . $this->faker->numberBetween(1, 5) . ' - ' . $this->faker->words(3, true),
            'block_data' => [
                'heading' => $this->faker->sentence(3),
                'content' => $this->faker->paragraph(2),
                'image_url' => $this->faker->imageUrl(),
                'buttons' => [
                    [
                        'text' => 'Learn More',
                        'url' => $this->faker->url(),
                        'style' => 'primary',
                    ],
                ],
            ],
            'metadata' => [
                'theme' => $this->faker->randomElement(['light', 'dark']),
                'layout' => $this->faker->randomElement(['single-column', 'two-column', 'three-column']),
                'alignment' => $this->faker->randomElement(['left', 'center', 'right']),
            ],
            'change_summary' => $this->faker->randomElement([
                'Updated content',
                'Changed theme',
                'Modified layout',
                'Added new section',
                'Updated images',
            ]),
            'change_description' => $this->faker->sentence(),
            'created_by_user_id' => $this->faker->uuid(),
            'edited_by_user_id' => $this->faker->optional(0.6)->uuid(),
            'created_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
            'updated_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
        ];
    }

    /**
     * State: Initial version (v1)
     */
    public function initial(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'version_number' => 1,
                'version_label' => 'v1 - Initial',
                'change_summary' => 'Initial version',
            ];
        });
    }

    /**
     * State: Multiple versions with incremental changes
     */
    public function withHistory(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'change_summary' => $this->faker->words(3, true),
                'change_description' => $this->faker->paragraph(),
            ];
        });
    }

    /**
     * State: Version with rich metadata
     */
    public function richMetadata(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'metadata' => [
                    'theme' => $this->faker->randomElement(['light', 'dark', 'gradient']),
                    'layout' => $this->faker->randomElement(['single-column', 'two-column', 'three-column']),
                    'alignment' => $this->faker->randomElement(['left', 'center', 'right', 'justify']),
                    'spacing' => $this->faker->randomElement(['compact', 'normal', 'spacious']),
                    'responsive' => true,
                    'animations' => $this->faker->boolean(70),
                ],
            ];
        });
    }

    /**
     * State: Version with complex content
     */
    public function complexContent(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'block_data' => [
                    'heading' => $this->faker->sentence(4),
                    'subheading' => $this->faker->sentence(3),
                    'content' => $this->faker->paragraphs(3, true),
                    'features' => array_map(fn() => [
                        'title' => $this->faker->words(2, true),
                        'description' => $this->faker->sentence(),
                        'icon' => $this->faker->randomElement(['star', 'bolt', 'rocket', 'shield']),
                    ], range(1, 3)),
                    'cta_buttons' => [
                        [
                            'text' => 'Get Started',
                            'url' => $this->faker->url(),
                            'style' => 'primary',
                        ],
                        [
                            'text' => 'Learn More',
                            'url' => $this->faker->url(),
                            'style' => 'secondary',
                        ],
                    ],
                ],
            ];
        });
    }
}
