<?php

namespace Aero\Cms\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AdvancedBlockTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $blockTypes = [
            [
                'name' => 'Testimonial',
                'slug' => 'testimonial',
                'description' => 'Display customer testimonials with avatar, name, title, and quote',
                'category' => 'advanced',
                'icon' => 'StarIcon',
                'schema' => [
                    'quote' => ['type' => 'text', 'label' => 'Testimonial Quote', 'required' => true],
                    'author' => ['type' => 'text', 'label' => 'Author Name', 'required' => true],
                    'title' => ['type' => 'text', 'label' => 'Author Title/Role', 'required' => false],
                    'avatar' => ['type' => 'image', 'label' => 'Author Avatar', 'required' => false],
                    'rating' => ['type' => 'number', 'label' => 'Star Rating (1-5)', 'min' => 1, 'max' => 5],
                    'company' => ['type' => 'text', 'label' => 'Company Name', 'required' => false],
                ],
            ],
            [
                'name' => 'Pricing Table',
                'slug' => 'pricing-table',
                'description' => 'Display pricing plans with features and CTA buttons',
                'category' => 'advanced',
                'icon' => 'CreditCardIcon',
                'schema' => [
                    'plans' => [
                        'type' => 'array',
                        'label' => 'Pricing Plans',
                        'fields' => [
                            'name' => ['type' => 'text', 'label' => 'Plan Name'],
                            'price' => ['type' => 'number', 'label' => 'Price'],
                            'currency' => ['type' => 'text', 'label' => 'Currency', 'default' => 'USD'],
                            'billing_period' => ['type' => 'text', 'label' => 'Billing Period (e.g., /month)'],
                            'description' => ['type' => 'textarea', 'label' => 'Plan Description'],
                            'features' => ['type' => 'array', 'label' => 'Features List'],
                            'cta_text' => ['type' => 'text', 'label' => 'CTA Button Text'],
                            'cta_link' => ['type' => 'text', 'label' => 'CTA Button Link'],
                            'highlighted' => ['type' => 'boolean', 'label' => 'Highlight This Plan'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Feature List',
                'slug' => 'feature-list',
                'description' => 'Display features with icons, titles, and descriptions in grid layout',
                'category' => 'advanced',
                'icon' => 'CheckCircleIcon',
                'schema' => [
                    'columns' => ['type' => 'number', 'label' => 'Grid Columns', 'default' => 3, 'min' => 1, 'max' => 4],
                    'features' => [
                        'type' => 'array',
                        'label' => 'Features',
                        'fields' => [
                            'icon' => ['type' => 'text', 'label' => 'Icon Class'],
                            'title' => ['type' => 'text', 'label' => 'Feature Title'],
                            'description' => ['type' => 'textarea', 'label' => 'Feature Description'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Contact Form',
                'slug' => 'contact-form',
                'description' => 'Embeddable contact form with fields, validation, and email notification',
                'category' => 'advanced',
                'icon' => 'EnvelopeIcon',
                'schema' => [
                    'title' => ['type' => 'text', 'label' => 'Form Title'],
                    'description' => ['type' => 'textarea', 'label' => 'Form Description'],
                    'fields' => [
                        'type' => 'array',
                        'label' => 'Form Fields',
                        'fields' => [
                            'name' => ['type' => 'text', 'label' => 'Field Name'],
                            'type' => ['type' => 'select', 'label' => 'Field Type', 'options' => ['text', 'email', 'textarea', 'select', 'checkbox']],
                            'label' => ['type' => 'text', 'label' => 'Field Label'],
                            'required' => ['type' => 'boolean', 'label' => 'Required'],
                            'placeholder' => ['type' => 'text', 'label' => 'Placeholder Text'],
                        ],
                    ],
                    'submit_text' => ['type' => 'text', 'label' => 'Submit Button Text', 'default' => 'Send Message'],
                    'recipient_email' => ['type' => 'email', 'label' => 'Recipient Email'],
                ],
            ],
            [
                'name' => 'FAQ Section',
                'slug' => 'faq-section',
                'description' => 'Collapsible FAQ items with questions and answers',
                'category' => 'advanced',
                'icon' => 'QuestionMarkCircleIcon',
                'schema' => [
                    'title' => ['type' => 'text', 'label' => 'Section Title'],
                    'items' => [
                        'type' => 'array',
                        'label' => 'FAQ Items',
                        'fields' => [
                            'question' => ['type' => 'text', 'label' => 'Question'],
                            'answer' => ['type' => 'textarea', 'label' => 'Answer'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Stats Counter',
                'slug' => 'stats-counter',
                'description' => 'Display impressive statistics with icons and animated counters',
                'category' => 'advanced',
                'icon' => 'ChartBarIcon',
                'schema' => [
                    'title' => ['type' => 'text', 'label' => 'Section Title'],
                    'description' => ['type' => 'textarea', 'label' => 'Section Description'],
                    'stats' => [
                        'type' => 'array',
                        'label' => 'Statistics',
                        'fields' => [
                            'number' => ['type' => 'number', 'label' => 'Stat Number'],
                            'suffix' => ['type' => 'text', 'label' => 'Suffix (e.g., %, +, K)'],
                            'label' => ['type' => 'text', 'label' => 'Stat Label'],
                            'icon' => ['type' => 'text', 'label' => 'Icon Class'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Team Members',
                'slug' => 'team-members',
                'description' => 'Display team member cards with photos, roles, and social links',
                'category' => 'advanced',
                'icon' => 'UserGroupIcon',
                'schema' => [
                    'title' => ['type' => 'text', 'label' => 'Section Title'],
                    'columns' => ['type' => 'number', 'label' => 'Grid Columns', 'default' => 4, 'min' => 1, 'max' => 4],
                    'members' => [
                        'type' => 'array',
                        'label' => 'Team Members',
                        'fields' => [
                            'name' => ['type' => 'text', 'label' => 'Member Name'],
                            'role' => ['type' => 'text', 'label' => 'Role/Title'],
                            'bio' => ['type' => 'textarea', 'label' => 'Bio'],
                            'image' => ['type' => 'image', 'label' => 'Photo'],
                            'social_links' => [
                                'type' => 'object',
                                'label' => 'Social Links',
                                'fields' => [
                                    'twitter' => ['type' => 'text', 'label' => 'Twitter URL'],
                                    'linkedin' => ['type' => 'text', 'label' => 'LinkedIn URL'],
                                    'github' => ['type' => 'text', 'label' => 'GitHub URL'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Call to Action',
                'slug' => 'call-to-action',
                'description' => 'Full-width CTA banner with headline, description, and button',
                'category' => 'advanced',
                'icon' => 'BullhornIcon',
                'schema' => [
                    'headline' => ['type' => 'text', 'label' => 'Headline', 'required' => true],
                    'description' => ['type' => 'textarea', 'label' => 'Description'],
                    'button_text' => ['type' => 'text', 'label' => 'Button Text'],
                    'button_link' => ['type' => 'text', 'label' => 'Button Link'],
                    'button_style' => ['type' => 'select', 'label' => 'Button Style', 'options' => ['primary', 'secondary', 'outline']],
                    'background_image' => ['type' => 'image', 'label' => 'Background Image'],
                    'background_color' => ['type' => 'color', 'label' => 'Background Color'],
                ],
            ],
        ];

        foreach ($blockTypes as $blockType) {
            DB::table('cms_block_types')->updateOrInsert(
                ['slug' => $blockType['slug']],
                array_merge($blockType, [
                    'schema' => json_encode($blockType['schema']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }

        $this->command->info('Advanced block types seeded successfully!');
    }
}
