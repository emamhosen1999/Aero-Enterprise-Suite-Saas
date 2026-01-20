<?php

namespace Aero\Cms\Database\Factories;

use Aero\Cms\Models\CmsPage;
use Aero\Cms\Models\CmsPageBlock;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\Aero\Cms\Models\CmsPageBlock>
 */
class CmsPageBlockFactory extends Factory
{
    protected $model = CmsPageBlock::class;

    public function definition(): array
    {
        return [
            'page_id' => CmsPage::factory(),
            'block_type' => $this->faker->randomElement([
                'hero_standard',
                'text_block',
                'feature_grid',
                'cta_section',
                'pricing_cards',
                'testimonials',
                'team_grid',
                'accordion',
                'newsletter',
            ]),
            'content' => $this->getDefaultContent(),
            'settings' => [
                'background' => $this->faker->randomElement(['light', 'dark', 'transparent']),
                'padding' => $this->faker->randomElement(['sm', 'md', 'lg']),
            ],
            'order' => $this->faker->numberBetween(0, 10),
            'is_visible' => $this->faker->boolean(90),
        ];
    }

    /**
     * Generate default content based on common block needs.
     */
    protected function getDefaultContent(): array
    {
        return [
            'title' => $this->faker->sentence(4),
            'subtitle' => $this->faker->sentence(8),
            'description' => $this->faker->paragraph(),
            'button_text' => $this->faker->words(2, true),
            'button_url' => $this->faker->url(),
        ];
    }

    /**
     * Create a hero block.
     */
    public function hero(): static
    {
        return $this->state(fn (array $attributes) => [
            'block_type' => 'hero_standard',
            'content' => [
                'title' => $this->faker->catchPhrase(),
                'subtitle' => $this->faker->sentence(10),
                'description' => $this->faker->paragraph(),
                'button_text' => 'Get Started',
                'button_url' => '#signup',
                'button_style' => 'primary',
                'layout' => 'text-image',
                'image' => $this->faker->imageUrl(1200, 800),
            ],
        ]);
    }

    /**
     * Create a text block.
     */
    public function textBlock(): static
    {
        return $this->state(fn (array $attributes) => [
            'block_type' => 'text_block',
            'content' => [
                'text' => '<p>' . implode('</p><p>', $this->faker->paragraphs(3)) . '</p>',
                'richText' => true,
            ],
        ]);
    }

    /**
     * Create a feature grid block.
     */
    public function featureGrid(): static
    {
        return $this->state(fn (array $attributes) => [
            'block_type' => 'feature_grid',
            'content' => [
                'title' => 'Amazing Features',
                'subtitle' => 'Everything you need to succeed',
                'columns' => 3,
                'features' => collect(range(1, 6))->map(fn ($i) => [
                    'icon' => $this->faker->randomElement(['star', 'heart', 'bolt', 'shield']),
                    'title' => $this->faker->words(3, true),
                    'description' => $this->faker->sentence(12),
                ])->toArray(),
            ],
        ]);
    }

    /**
     * Create a CTA block.
     */
    public function cta(): static
    {
        return $this->state(fn (array $attributes) => [
            'block_type' => 'cta_section',
            'content' => [
                'title' => 'Ready to Get Started?',
                'description' => $this->faker->sentence(15),
                'button_text' => 'Start Free Trial',
                'button_url' => '/signup',
                'variant' => 'gradient',
            ],
        ]);
    }

    /**
     * Create a pricing block.
     */
    public function pricing(): static
    {
        return $this->state(fn (array $attributes) => [
            'block_type' => 'pricing_cards',
            'content' => [
                'title' => 'Simple Pricing',
                'subtitle' => 'Choose the plan that works for you',
                'plans' => [
                    [
                        'name' => 'Starter',
                        'price' => 9,
                        'period' => 'month',
                        'features' => ['5 Projects', '10GB Storage', 'Email Support'],
                        'highlighted' => false,
                    ],
                    [
                        'name' => 'Pro',
                        'price' => 29,
                        'period' => 'month',
                        'features' => ['Unlimited Projects', '100GB Storage', 'Priority Support', 'API Access'],
                        'highlighted' => true,
                    ],
                    [
                        'name' => 'Enterprise',
                        'price' => 99,
                        'period' => 'month',
                        'features' => ['Unlimited Everything', '24/7 Support', 'Custom Integrations', 'SLA'],
                        'highlighted' => false,
                    ],
                ],
            ],
        ]);
    }

    /**
     * Create a testimonials block.
     */
    public function testimonials(): static
    {
        return $this->state(fn (array $attributes) => [
            'block_type' => 'testimonials',
            'content' => [
                'title' => 'What Our Customers Say',
                'testimonials' => collect(range(1, 3))->map(fn () => [
                    'quote' => $this->faker->paragraph(),
                    'author' => $this->faker->name(),
                    'role' => $this->faker->jobTitle(),
                    'company' => $this->faker->company(),
                    'avatar' => $this->faker->imageUrl(100, 100, 'people'),
                    'rating' => $this->faker->numberBetween(4, 5),
                ])->toArray(),
            ],
        ]);
    }

    /**
     * Set a specific order.
     */
    public function order(int $order): static
    {
        return $this->state(fn (array $attributes) => [
            'order' => $order,
        ]);
    }

    /**
     * Make block visible.
     */
    public function visible(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_visible' => true,
        ]);
    }

    /**
     * Make block hidden.
     */
    public function hidden(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_visible' => false,
        ]);
    }
}
