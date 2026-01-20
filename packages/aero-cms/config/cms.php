<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | CMS Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the Aero CMS page builder system.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Media Settings
    |--------------------------------------------------------------------------
    */
    'media' => [
        'disk' => env('CMS_MEDIA_DISK', 'public'),
        'path' => 'cms',
        'max_file_size' => 10 * 1024, // 10MB in KB
        'allowed_types' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Settings
    |--------------------------------------------------------------------------
    */
    'cache' => [
        'enabled' => env('CMS_CACHE_ENABLED', true),
        'ttl' => env('CMS_CACHE_TTL', 3600), // 1 hour
        'prefix' => 'cms',
    ],

    /*
    |--------------------------------------------------------------------------
    | Page Settings
    |--------------------------------------------------------------------------
    */
    'pages' => [
        'default_layout' => 'public',
        'available_layouts' => [
            'public' => 'Public Layout',
            'full-width' => 'Full Width',
            'landing' => 'Landing Page',
        ],
        'default_status' => 'draft',
    ],

    /*
    |--------------------------------------------------------------------------
    | Block Categories
    |--------------------------------------------------------------------------
    */
    'block_categories' => [
        'hero' => [
            'name' => 'Hero Sections',
            'icon' => 'RocketLaunchIcon',
            'description' => 'Page headers and hero sections',
        ],
        'features' => [
            'name' => 'Features',
            'icon' => 'Squares2X2Icon',
            'description' => 'Feature grids and lists',
        ],
        'pricing' => [
            'name' => 'Pricing',
            'icon' => 'CurrencyDollarIcon',
            'description' => 'Pricing tables and cards',
        ],
        'testimonials' => [
            'name' => 'Testimonials',
            'icon' => 'ChatBubbleLeftRightIcon',
            'description' => 'Customer testimonials and quotes',
        ],
        'content' => [
            'name' => 'Content',
            'icon' => 'DocumentTextIcon',
            'description' => 'Text, images, and media blocks',
        ],
        'stats' => [
            'name' => 'Statistics',
            'icon' => 'ChartBarIcon',
            'description' => 'Counters and metrics',
        ],
        'cta' => [
            'name' => 'Call to Action',
            'icon' => 'CursorArrowRaysIcon',
            'description' => 'CTA banners and buttons',
        ],
        'team' => [
            'name' => 'Team & About',
            'icon' => 'UserGroupIcon',
            'description' => 'Team members and company info',
        ],
        'navigation' => [
            'name' => 'Navigation',
            'icon' => 'Bars3Icon',
            'description' => 'Headers and footers',
        ],
        'forms' => [
            'name' => 'Forms',
            'icon' => 'ClipboardDocumentListIcon',
            'description' => 'Contact and signup forms',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Available Blocks
    |--------------------------------------------------------------------------
    |
    | List of available block types and their configurations.
    | Each block must have a corresponding React component.
    |
    */
    'blocks' => [
        // Hero Sections
        'hero-standard' => [
            'name' => 'Hero Standard',
            'category' => 'hero',
            'description' => 'Classic hero with title, subtitle, CTAs and stats',
            'thumbnail' => '/cms/blocks/hero-standard.png',
        ],
        'hero-split' => [
            'name' => 'Hero Split',
            'category' => 'hero',
            'description' => 'Two-column hero with image',
            'thumbnail' => '/cms/blocks/hero-split.png',
        ],
        'hero-centered' => [
            'name' => 'Hero Centered',
            'category' => 'hero',
            'description' => 'Centered hero with gradient background',
            'thumbnail' => '/cms/blocks/hero-centered.png',
        ],

        // Features
        'feature-grid' => [
            'name' => 'Feature Grid',
            'category' => 'features',
            'description' => '2-4 column feature cards with icons',
            'thumbnail' => '/cms/blocks/feature-grid.png',
        ],
        'feature-list' => [
            'name' => 'Feature List',
            'category' => 'features',
            'description' => 'Alternating left/right feature sections',
            'thumbnail' => '/cms/blocks/feature-list.png',
        ],
        'feature-tabs' => [
            'name' => 'Feature Tabs',
            'category' => 'features',
            'description' => 'Tabbed feature content',
            'thumbnail' => '/cms/blocks/feature-tabs.png',
        ],

        // Pricing
        'pricing-cards' => [
            'name' => 'Pricing Cards',
            'category' => 'pricing',
            'description' => 'Three-column pricing tier cards',
            'thumbnail' => '/cms/blocks/pricing-cards.png',
        ],
        'pricing-table' => [
            'name' => 'Pricing Comparison',
            'category' => 'pricing',
            'description' => 'Detailed feature comparison table',
            'thumbnail' => '/cms/blocks/pricing-table.png',
        ],

        // Testimonials
        'testimonial-carousel' => [
            'name' => 'Testimonial Carousel',
            'category' => 'testimonials',
            'description' => 'Sliding testimonial quotes',
            'thumbnail' => '/cms/blocks/testimonial-carousel.png',
        ],
        'testimonial-grid' => [
            'name' => 'Testimonial Grid',
            'category' => 'testimonials',
            'description' => 'Grid of customer quotes',
            'thumbnail' => '/cms/blocks/testimonial-grid.png',
        ],
        'logo-cloud' => [
            'name' => 'Logo Cloud',
            'category' => 'testimonials',
            'description' => 'Partner/client logos',
            'thumbnail' => '/cms/blocks/logo-cloud.png',
        ],

        // Content
        'text-block' => [
            'name' => 'Text Block',
            'category' => 'content',
            'description' => 'Rich text content block',
            'thumbnail' => '/cms/blocks/text-block.png',
        ],
        'image-text' => [
            'name' => 'Image + Text',
            'category' => 'content',
            'description' => 'Side-by-side image and text',
            'thumbnail' => '/cms/blocks/image-text.png',
        ],
        'accordion-faq' => [
            'name' => 'Accordion FAQ',
            'category' => 'content',
            'description' => 'Expandable Q&A section',
            'thumbnail' => '/cms/blocks/accordion-faq.png',
        ],
        'video-embed' => [
            'name' => 'Video Embed',
            'category' => 'content',
            'description' => 'YouTube/Vimeo video embed',
            'thumbnail' => '/cms/blocks/video-embed.png',
        ],

        // Stats
        'stats-row' => [
            'name' => 'Stats Row',
            'category' => 'stats',
            'description' => 'Horizontal statistics counters',
            'thumbnail' => '/cms/blocks/stats-row.png',
        ],
        'stats-cards' => [
            'name' => 'Stats Cards',
            'category' => 'stats',
            'description' => 'Animated statistic cards',
            'thumbnail' => '/cms/blocks/stats-cards.png',
        ],

        // CTA
        'cta-banner' => [
            'name' => 'CTA Banner',
            'category' => 'cta',
            'description' => 'Full-width call-to-action',
            'thumbnail' => '/cms/blocks/cta-banner.png',
        ],
        'cta-split' => [
            'name' => 'CTA Split',
            'category' => 'cta',
            'description' => 'Two-column CTA with image',
            'thumbnail' => '/cms/blocks/cta-split.png',
        ],
        'newsletter' => [
            'name' => 'Newsletter Signup',
            'category' => 'cta',
            'description' => 'Email subscription form',
            'thumbnail' => '/cms/blocks/newsletter.png',
        ],

        // Team
        'team-grid' => [
            'name' => 'Team Grid',
            'category' => 'team',
            'description' => 'Team member cards',
            'thumbnail' => '/cms/blocks/team-grid.png',
        ],
        'timeline' => [
            'name' => 'Timeline',
            'category' => 'team',
            'description' => 'Milestone/history timeline',
            'thumbnail' => '/cms/blocks/timeline.png',
        ],
        'values-grid' => [
            'name' => 'Values Grid',
            'category' => 'team',
            'description' => 'Company values display',
            'thumbnail' => '/cms/blocks/values-grid.png',
        ],

        // Forms
        'contact-form' => [
            'name' => 'Contact Form',
            'category' => 'forms',
            'description' => 'Contact form with validation',
            'thumbnail' => '/cms/blocks/contact-form.png',
        ],
        'demo-request' => [
            'name' => 'Demo Request',
            'category' => 'forms',
            'description' => 'Demo/consultation request form',
            'thumbnail' => '/cms/blocks/demo-request.png',
        ],
    ],
];
