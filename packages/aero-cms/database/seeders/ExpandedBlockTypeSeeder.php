<?php

declare(strict_types=1);

namespace Aero\Cms\Database\Seeders;

use Aero\Cms\Models\CmsBlockType;
use Illuminate\Database\Seeder;

class ExpandedBlockTypeSeeder extends Seeder
{
    public function run(): void
    {
        $blockTypes = [
            // Existing types (already seeded, update if needed)
            [
                'name' => 'Hero',
                'label' => 'Hero Section',
                'description' => 'Large hero banner with title, subtitle, CTA button and background image',
                'icon' => 'SparklesIcon',
                'frontend_component' => 'HeroBlock',
                'schema' => json_encode([
                    'fields' => [
                        ['name' => 'title', 'label' => 'Title', 'type' => 'text', 'required' => true],
                        ['name' => 'subtitle', 'label' => 'Subtitle', 'type' => 'textarea', 'required' => false],
                        ['name' => 'backgroundImage', 'label' => 'Background Image URL', 'type' => 'text', 'required' => false],
                        ['name' => 'backgroundOverlay', 'label' => 'Overlay Color', 'type' => 'color', 'required' => false, 'section' => 'settings'],
                        ['name' => 'ctaText', 'label' => 'Button Text', 'type' => 'text', 'required' => false],
                        ['name' => 'ctaUrl', 'label' => 'Button URL', 'type' => 'text', 'required' => false],
                        ['name' => 'alignment', 'label' => 'Text Alignment', 'type' => 'select', 'options' => ['left', 'center', 'right'], 'required' => false, 'section' => 'settings'],
                    ],
                ]),
                'preview_data' => json_encode(['title' => 'Welcome to Our Site', 'subtitle' => 'Your journey starts here']),
                'is_active' => true,
            ],
            [
                'name' => 'RichText',
                'label' => 'Rich Text & HTML',
                'description' => 'Full HTML content block with WYSIWYG editing',
                'icon' => 'DocumentTextIcon',
                'frontend_component' => 'RichTextBlock',
                'schema' => json_encode([
                    'fields' => [
                        ['name' => 'content', 'label' => 'Content (HTML)', 'type' => 'textarea', 'required' => true],
                        ['name' => 'textColor', 'label' => 'Text Color', 'type' => 'color', 'required' => false, 'section' => 'settings'],
                        ['name' => 'fontSize', 'label' => 'Font Size', 'type' => 'select', 'options' => ['small', 'normal', 'large', 'xlarge'], 'required' => false, 'section' => 'settings'],
                    ],
                ]),
                'preview_data' => json_encode(['content' => '<p>Your content here</p>']),
                'is_active' => true,
            ],
            [
                'name' => 'CTA',
                'label' => 'Call to Action',
                'description' => 'Prominent CTA block with button and supporting text',
                'icon' => 'ArrowUpRightIcon',
                'frontend_component' => 'CTABlock',
                'schema' => json_encode([
                    'fields' => [
                        ['name' => 'title', 'label' => 'Title', 'type' => 'text', 'required' => true],
                        ['name' => 'description', 'label' => 'Description', 'type' => 'textarea', 'required' => false],
                        ['name' => 'buttonText', 'label' => 'Button Text', 'type' => 'text', 'required' => true],
                        ['name' => 'buttonUrl', 'label' => 'Button URL', 'type' => 'text', 'required' => true],
                        ['name' => 'backgroundColor', 'label' => 'Background Color', 'type' => 'color', 'required' => false, 'section' => 'settings'],
                        ['name' => 'buttonColor', 'label' => 'Button Color', 'type' => 'select', 'options' => ['primary', 'success', 'warning', 'danger'], 'required' => false, 'section' => 'settings'],
                    ],
                ]),
                'preview_data' => json_encode(['title' => 'Ready to Get Started?', 'buttonText' => 'Learn More']),
                'is_active' => true,
            ],
            [
                'name' => 'ImageGallery',
                'label' => 'Image Gallery',
                'description' => 'Grid of images with lightbox',
                'icon' => 'PhotoIcon',
                'frontend_component' => 'ImageGalleryBlock',
                'schema' => json_encode([
                    'fields' => [
                        ['name' => 'title', 'label' => 'Gallery Title', 'type' => 'text', 'required' => false],
                        ['name' => 'columns', 'label' => 'Columns', 'type' => 'select', 'options' => [1, 2, 3, 4, 6], 'required' => false, 'section' => 'settings'],
                        ['name' => 'images', 'label' => 'Images (JSON)', 'type' => 'textarea', 'required' => false],
                    ],
                ]),
                'preview_data' => json_encode(['title' => 'Our Gallery', 'columns' => 3]),
                'is_active' => true,
            ],
            [
                'name' => 'Testimonials',
                'label' => 'Testimonials',
                'description' => 'Customer testimonials and reviews',
                'icon' => 'StarIcon',
                'frontend_component' => 'TestimonialsBlock',
                'schema' => json_encode([
                    'fields' => [
                        ['name' => 'title', 'label' => 'Section Title', 'type' => 'text', 'required' => false],
                        ['name' => 'count', 'label' => 'Number to Display', 'type' => 'number', 'required' => false],
                        ['name' => 'style', 'label' => 'Display Style', 'type' => 'select', 'options' => ['grid', 'carousel', 'list'], 'required' => false, 'section' => 'settings'],
                    ],
                ]),
                'preview_data' => json_encode(['title' => 'What Our Clients Say']),
                'is_active' => true,
            ],
            [
                'name' => 'FAQ',
                'label' => 'FAQ Accordion',
                'description' => 'Frequently asked questions with accordion',
                'icon' => 'QuestionMarkCircleIcon',
                'frontend_component' => 'FAQBlock',
                'schema' => json_encode([
                    'fields' => [
                        ['name' => 'title', 'label' => 'FAQ Title', 'type' => 'text', 'required' => false],
                        ['name' => 'faqs', 'label' => 'FAQ Items (JSON)', 'type' => 'textarea', 'required' => false],
                    ],
                ]),
                'preview_data' => json_encode(['title' => 'Frequently Asked Questions']),
                'is_active' => true,
            ],

            // NEW: Extended Block Types (9 more)
            [
                'name' => 'Video',
                'label' => 'Video Embed',
                'description' => 'YouTube or Vimeo video with responsive sizing',
                'icon' => 'PlayCircleIcon',
                'frontend_component' => 'VideoBlock',
                'schema' => json_encode([
                    'fields' => [
                        ['name' => 'title', 'label' => 'Video Title', 'type' => 'text', 'required' => false],
                        ['name' => 'videoUrl', 'label' => 'Video URL (YouTube/Vimeo)', 'type' => 'text', 'required' => true],
                        ['name' => 'caption', 'label' => 'Caption', 'type' => 'textarea', 'required' => false],
                        ['name' => 'autoplay', 'label' => 'Autoplay', 'type' => 'boolean', 'required' => false, 'section' => 'settings'],
                        ['name' => 'aspectRatio', 'label' => 'Aspect Ratio', 'type' => 'select', 'options' => ['16:9', '4:3', '1:1'], 'required' => false, 'section' => 'settings'],
                    ],
                ]),
                'preview_data' => json_encode(['title' => 'Watch our video', 'videoUrl' => 'https://youtube.com/watch?v=dQw4w9WgXcQ']),
                'is_active' => true,
            ],
            [
                'name' => 'Features',
                'label' => 'Features Grid',
                'description' => 'Display features/benefits in a grid layout',
                'icon' => 'CheckCircleIcon',
                'frontend_component' => 'FeaturesBlock',
                'schema' => json_encode([
                    'fields' => [
                        ['name' => 'title', 'label' => 'Section Title', 'type' => 'text', 'required' => false],
                        ['name' => 'description', 'label' => 'Section Description', 'type' => 'textarea', 'required' => false],
                        ['name' => 'columns', 'label' => 'Columns', 'type' => 'select', 'options' => [2, 3, 4], 'required' => false, 'section' => 'settings'],
                        ['name' => 'features', 'label' => 'Features (JSON)', 'type' => 'textarea', 'required' => false],
                    ],
                ]),
                'preview_data' => json_encode(['title' => 'Our Features', 'columns' => 3]),
                'is_active' => true,
            ],
            [
                'name' => 'Pricing',
                'label' => 'Pricing Table',
                'description' => 'Pricing plans comparison table',
                'icon' => 'CurrencyDollarIcon',
                'frontend_component' => 'PricingBlock',
                'schema' => json_encode([
                    'fields' => [
                        ['name' => 'title', 'label' => 'Section Title', 'type' => 'text', 'required' => false],
                        ['name' => 'description', 'label' => 'Description', 'type' => 'textarea', 'required' => false],
                        ['name' => 'currency', 'label' => 'Currency', 'type' => 'select', 'options' => ['USD', 'EUR', 'GBP', 'CAD'], 'required' => false, 'section' => 'settings'],
                        ['name' => 'plans', 'label' => 'Pricing Plans (JSON)', 'type' => 'textarea', 'required' => false],
                    ],
                ]),
                'preview_data' => json_encode(['title' => 'Simple, Transparent Pricing', 'currency' => 'USD']),
                'is_active' => true,
            ],
            [
                'name' => 'Stats',
                'label' => 'Statistics Counter',
                'description' => 'Animated number counters for statistics',
                'icon' => 'SparklesIcon',
                'frontend_component' => 'StatsBlock',
                'schema' => json_encode([
                    'fields' => [
                        ['name' => 'title', 'label' => 'Section Title', 'type' => 'text', 'required' => false],
                        ['name' => 'columns', 'label' => 'Columns', 'type' => 'select', 'options' => [2, 3, 4], 'required' => false, 'section' => 'settings'],
                        ['name' => 'stats', 'label' => 'Statistics (JSON)', 'type' => 'textarea', 'required' => false],
                    ],
                ]),
                'preview_data' => json_encode(['title' => 'By The Numbers', 'columns' => 4]),
                'is_active' => true,
            ],
            [
                'name' => 'ContactForm',
                'label' => 'Contact Form',
                'description' => 'Email contact form with validation',
                'icon' => 'EnvelopeIcon',
                'frontend_component' => 'ContactFormBlock',
                'schema' => json_encode([
                    'fields' => [
                        ['name' => 'title', 'label' => 'Form Title', 'type' => 'text', 'required' => false],
                        ['name' => 'description', 'label' => 'Form Description', 'type' => 'textarea', 'required' => false],
                        ['name' => 'recipientEmail', 'label' => 'Email Recipient', 'type' => 'email', 'required' => true, 'section' => 'settings'],
                        ['name' => 'submitButtonText', 'label' => 'Submit Button Text', 'type' => 'text', 'required' => false, 'section' => 'settings'],
                        ['name' => 'successMessage', 'label' => 'Success Message', 'type' => 'textarea', 'required' => false, 'section' => 'settings'],
                    ],
                ]),
                'preview_data' => json_encode(['title' => 'Get in Touch']),
                'is_active' => true,
            ],
            [
                'name' => 'Accordion',
                'label' => 'Accordion Tabs',
                'description' => 'Collapsible accordion content sections',
                'icon' => 'ChevronDownIcon',
                'frontend_component' => 'AccordionBlock',
                'schema' => json_encode([
                    'fields' => [
                        ['name' => 'title', 'label' => 'Section Title', 'type' => 'text', 'required' => false],
                        ['name' => 'defaultOpen', 'label' => 'Open First Item by Default', 'type' => 'boolean', 'required' => false, 'section' => 'settings'],
                        ['name' => 'items', 'label' => 'Accordion Items (JSON)', 'type' => 'textarea', 'required' => false],
                    ],
                ]),
                'preview_data' => json_encode(['title' => 'Accordion Content']),
                'is_active' => true,
            ],
            [
                'name' => 'Tabs',
                'label' => 'Tabbed Content',
                'description' => 'Multiple tabs with switchable content',
                'icon' => 'DocumentDuplicateIcon',
                'frontend_component' => 'TabsBlock',
                'schema' => json_encode([
                    'fields' => [
                        ['name' => 'title', 'label' => 'Section Title', 'type' => 'text', 'required' => false],
                        ['name' => 'defaultTab', 'label' => 'Default Tab Index', 'type' => 'number', 'required' => false, 'section' => 'settings'],
                        ['name' => 'tabs', 'label' => 'Tabs (JSON)', 'type' => 'textarea', 'required' => false],
                    ],
                ]),
                'preview_data' => json_encode(['title' => 'Tabbed Content']),
                'is_active' => true,
            ],
            [
                'name' => 'Newsletter',
                'label' => 'Newsletter Signup',
                'description' => 'Email subscription form',
                'icon' => 'EnvelopeIcon',
                'frontend_component' => 'NewsletterBlock',
                'schema' => json_encode([
                    'fields' => [
                        ['name' => 'title', 'label' => 'Section Title', 'type' => 'text', 'required' => false],
                        ['name' => 'description', 'label' => 'Description', 'type' => 'textarea', 'required' => false],
                        ['name' => 'placeholderText', 'label' => 'Email Placeholder', 'type' => 'text', 'required' => false, 'section' => 'settings'],
                        ['name' => 'buttonText', 'label' => 'Button Text', 'type' => 'text', 'required' => false, 'section' => 'settings'],
                        ['name' => 'backgroundColor', 'label' => 'Background Color', 'type' => 'color', 'required' => false, 'section' => 'settings'],
                    ],
                ]),
                'preview_data' => json_encode(['title' => 'Subscribe to Our Newsletter']),
                'is_active' => true,
            ],
            [
                'name' => 'Banner',
                'label' => 'Alert Banner',
                'description' => 'Dismissible alert or notice banner',
                'icon' => 'InformationCircleIcon',
                'frontend_component' => 'BannerBlock',
                'schema' => json_encode([
                    'fields' => [
                        ['name' => 'title', 'label' => 'Banner Title', 'type' => 'text', 'required' => true],
                        ['name' => 'message', 'label' => 'Banner Message', 'type' => 'textarea', 'required' => false],
                        ['name' => 'type', 'label' => 'Banner Type', 'type' => 'select', 'options' => ['info', 'success', 'warning', 'danger'], 'required' => false, 'section' => 'settings'],
                        ['name' => 'dismissible', 'label' => 'Can Be Dismissed', 'type' => 'boolean', 'required' => false, 'section' => 'settings'],
                        ['name' => 'icon', 'label' => 'Show Icon', 'type' => 'boolean', 'required' => false, 'section' => 'settings'],
                    ],
                ]),
                'preview_data' => json_encode(['title' => 'Important Notice', 'type' => 'info']),
                'is_active' => true,
            ],
            [
                'name' => 'CodeBlock',
                'label' => 'Code Block',
                'description' => 'Syntax-highlighted code snippet',
                'icon' => 'CodeBracketIcon',
                'frontend_component' => 'CodeBlockComponent',
                'schema' => json_encode([
                    'fields' => [
                        ['name' => 'title', 'label' => 'Code Title', 'type' => 'text', 'required' => false],
                        ['name' => 'code', 'label' => 'Code', 'type' => 'textarea', 'required' => true],
                        ['name' => 'language', 'label' => 'Language', 'type' => 'select', 'options' => ['javascript', 'python', 'php', 'html', 'css', 'json', 'sql', 'bash'], 'required' => false, 'section' => 'settings'],
                        ['name' => 'showLineNumbers', 'label' => 'Show Line Numbers', 'type' => 'boolean', 'required' => false, 'section' => 'settings'],
                        ['name' => 'copyable', 'label' => 'Allow Copy', 'type' => 'boolean', 'required' => false, 'section' => 'settings'],
                    ],
                ]),
                'preview_data' => json_encode(['title' => 'Code Example', 'language' => 'javascript']),
                'is_active' => true,
            ],
        ];

        foreach ($blockTypes as $blockType) {
            CmsBlockType::updateOrCreate(
                ['name' => $blockType['name']],
                $blockType
            );
        }
    }
}
