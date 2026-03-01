<?php

namespace Aero\Cms\Database\Factories;

use Aero\Cms\Models\CmsPage;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\Aero\Cms\Models\CmsPage>
 */
class CmsPageFactory extends Factory
{
    protected $model = CmsPage::class;

    public function definition(): array
    {
        $title = $this->faker->sentence(3);

        return [
            'title' => $title,
            'slug' => Str::slug($title).'-'.$this->faker->unique()->numberBetween(1, 99999),
            'description' => $this->faker->paragraph(),
            'status' => $this->faker->randomElement(['draft', 'published']),
            'meta_title' => $this->faker->sentence(4),
            'meta_description' => $this->faker->sentence(10),
            'meta_tags' => [
                'og:title' => $this->faker->sentence(3),
                'og:description' => $this->faker->sentence(8),
            ],
            'settings' => [
                'layout' => $this->faker->randomElement(['default', 'wide', 'narrow']),
                'show_header' => $this->faker->boolean(80),
                'show_footer' => $this->faker->boolean(80),
            ],
            'is_homepage' => false,
            'view_count' => $this->faker->numberBetween(0, 1000),
            'published_at' => $this->faker->optional(0.7)->dateTimeBetween('-1 year', 'now'),
            'created_by' => null,
            'updated_by' => null,
        ];
    }

    /**
     * Indicate that the page is published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    /**
     * Indicate that the page is a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
            'published_at' => null,
        ]);
    }

    /**
     * Indicate that the page is scheduled.
     */
    public function scheduled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'scheduled',
            'published_at' => $this->faker->dateTimeBetween('now', '+1 month'),
        ]);
    }

    /**
     * Indicate that this is the homepage.
     */
    public function homepage(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_homepage' => true,
            'slug' => 'home',
        ]);
    }

    /**
     * Set a specific slug.
     */
    public function withSlug(string $slug): static
    {
        return $this->state(fn (array $attributes) => [
            'slug' => $slug,
        ]);
    }

    /**
     * Include SEO metadata.
     */
    public function withSeo(): static
    {
        return $this->state(fn (array $attributes) => [
            'meta_title' => $this->faker->sentence(5),
            'meta_description' => $this->faker->sentence(15),
            'meta_tags' => [
                'og:title' => $this->faker->sentence(4),
                'og:description' => $this->faker->sentence(12),
                'og:image' => $this->faker->imageUrl(1200, 630),
                'twitter:card' => 'summary_large_image',
            ],
        ]);
    }
}
