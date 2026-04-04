<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('cms_block_types')) {
            return; // Table already exists
        }

        Schema::create('cms_block_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->json('schema')->nullable();
            $table->string('category')->default('advanced'); // advanced, basic, custom
            $table->string('icon')->nullable();
            $table->string('preview_image')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed default block types
        $blockTypes = [
            [
                'name' => 'Testimonial',
                'slug' => 'testimonial',
                'description' => 'Display customer testimonials with avatar, name, title, and quote',
                'category' => 'advanced',
                'icon' => 'StarIcon',
                'schema' => json_encode([
                    'quote' => ['type' => 'text', 'label' => 'Testimonial Quote', 'required' => true],
                    'author' => ['type' => 'text', 'label' => 'Author Name', 'required' => true],
                    'title' => ['type' => 'text', 'label' => 'Author Title/Role', 'required' => false],
                    'avatar' => ['type' => 'image', 'label' => 'Author Avatar', 'required' => false],
                    'rating' => ['type' => 'number', 'label' => 'Star Rating (1-5)', 'min' => 1, 'max' => 5],
                    'company' => ['type' => 'text', 'label' => 'Company Name', 'required' => false],
                ]),
            ],
            [
                'name' => 'Pricing Table',
                'slug' => 'pricing-table',
                'description' => 'Display pricing plans with features and CTA buttons',
                'category' => 'advanced',
                'icon' => 'CreditCardIcon',
                'schema' => json_encode([
                    'plans' => [
                        'type' => 'array',
                        'label' => 'Pricing Plans',
                        'fields' => [
                            'name' => ['type' => 'text', 'label' => 'Plan Name'],
                            'price' => ['type' => 'number', 'label' => 'Price'],
                            'currency' => ['type' => 'text', 'label' => 'Currency', 'default' => 'USD'],
                            'billing_period' => ['type' => 'text', 'label' => 'Billing Period'],
                            'description' => ['type' => 'textarea', 'label' => 'Description'],
                            'features' => ['type' => 'array', 'label' => 'Features'],
                            'cta_text' => ['type' => 'text', 'label' => 'Button Text'],
                            'cta_link' => ['type' => 'text', 'label' => 'Button Link'],
                            'highlighted' => ['type' => 'boolean', 'label' => 'Highlight'],
                        ],
                    ],
                ]),
            ],
            [
                'name' => 'Feature List',
                'slug' => 'feature-list',
                'description' => 'Display features with icons, titles, and descriptions',
                'category' => 'advanced',
                'icon' => 'CheckCircleIcon',
                'schema' => json_encode([
                    'columns' => ['type' => 'number', 'label' => 'Grid Columns', 'default' => 3],
                    'features' => [
                        'type' => 'array',
                        'label' => 'Features',
                        'fields' => [
                            'icon' => ['type' => 'text', 'label' => 'Icon'],
                            'title' => ['type' => 'text', 'label' => 'Title'],
                            'description' => ['type' => 'textarea', 'label' => 'Description'],
                        ],
                    ],
                ]),
            ],
            [
                'name' => 'Contact Form',
                'slug' => 'contact-form',
                'description' => 'Embeddable contact form with validation',
                'category' => 'advanced',
                'icon' => 'EnvelopeIcon',
                'schema' => json_encode([
                    'title' => ['type' => 'text', 'label' => 'Form Title'],
                    'description' => ['type' => 'textarea', 'label' => 'Form Description'],
                    'fields' => [
                        'type' => 'array',
                        'label' => 'Form Fields',
                        'fields' => [
                            'name' => ['type' => 'text', 'label' => 'Field Name'],
                            'type' => ['type' => 'select', 'label' => 'Type'],
                            'label' => ['type' => 'text', 'label' => 'Label'],
                            'required' => ['type' => 'boolean', 'label' => 'Required'],
                        ],
                    ],
                    'submit_text' => ['type' => 'text', 'label' => 'Submit Button'],
                    'recipient_email' => ['type' => 'email', 'label' => 'Email'],
                ]),
            ],
            [
                'name' => 'FAQ Section',
                'slug' => 'faq-section',
                'description' => 'Collapsible FAQ items',
                'category' => 'advanced',
                'icon' => 'QuestionMarkCircleIcon',
                'schema' => json_encode([
                    'title' => ['type' => 'text', 'label' => 'Section Title'],
                    'items' => [
                        'type' => 'array',
                        'label' => 'FAQ Items',
                        'fields' => [
                            'question' => ['type' => 'text', 'label' => 'Question'],
                            'answer' => ['type' => 'textarea', 'label' => 'Answer'],
                        ],
                    ],
                ]),
            ],
            [
                'name' => 'Stats Counter',
                'slug' => 'stats-counter',
                'description' => 'Display statistics with animated counters',
                'category' => 'advanced',
                'icon' => 'ChartBarIcon',
                'schema' => json_encode([
                    'title' => ['type' => 'text', 'label' => 'Section Title'],
                    'stats' => [
                        'type' => 'array',
                        'label' => 'Statistics',
                        'fields' => [
                            'number' => ['type' => 'number', 'label' => 'Number'],
                            'suffix' => ['type' => 'text', 'label' => 'Suffix'],
                            'label' => ['type' => 'text', 'label' => 'Label'],
                            'icon' => ['type' => 'text', 'label' => 'Icon'],
                        ],
                    ],
                ]),
            ],
            [
                'name' => 'Team Members',
                'slug' => 'team-members',
                'description' => 'Display team member cards with photos and social links',
                'category' => 'advanced',
                'icon' => 'UserGroupIcon',
                'schema' => json_encode([
                    'title' => ['type' => 'text', 'label' => 'Section Title'],
                    'columns' => ['type' => 'number', 'label' => 'Grid Columns', 'default' => 4],
                    'members' => [
                        'type' => 'array',
                        'label' => 'Team Members',
                        'fields' => [
                            'name' => ['type' => 'text', 'label' => 'Name'],
                            'role' => ['type' => 'text', 'label' => 'Role'],
                            'bio' => ['type' => 'textarea', 'label' => 'Bio'],
                            'image' => ['type' => 'image', 'label' => 'Photo'],
                        ],
                    ],
                ]),
            ],
            [
                'name' => 'Call to Action',
                'slug' => 'call-to-action',
                'description' => 'Full-width CTA banner with headline and button',
                'category' => 'advanced',
                'icon' => 'BullhornIcon',
                'schema' => json_encode([
                    'headline' => ['type' => 'text', 'label' => 'Headline', 'required' => true],
                    'description' => ['type' => 'textarea', 'label' => 'Description'],
                    'button_text' => ['type' => 'text', 'label' => 'Button Text'],
                    'button_link' => ['type' => 'text', 'label' => 'Button Link'],
                    'button_style' => ['type' => 'select', 'label' => 'Button Style'],
                    'background_image' => ['type' => 'image', 'label' => 'Background'],
                ]),
            ],
        ];

        foreach ($blockTypes as $index => $blockType) {
            DB::table('cms_block_types')->insert([
                'name' => $blockType['name'],
                'slug' => $blockType['slug'],
                'description' => $blockType['description'],
                'category' => $blockType['category'],
                'icon' => $blockType['icon'],
                'schema' => $blockType['schema'],
                'sort_order' => $index,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_block_types');
    }
};
