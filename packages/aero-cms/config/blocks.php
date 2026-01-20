<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Block Categories
    |--------------------------------------------------------------------------
    */
    'categories' => [
        ['id' => 'hero', 'label' => 'Hero Sections'],
        ['id' => 'content', 'label' => 'Content'],
        ['id' => 'features', 'label' => 'Features & Pricing'],
        ['id' => 'social_proof', 'label' => 'Social Proof'],
        ['id' => 'team', 'label' => 'Team & About'],
        ['id' => 'media', 'label' => 'Media'],
        ['id' => 'forms', 'label' => 'Forms & CTA'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Block Types
    |--------------------------------------------------------------------------
    */
    'blocks' => [
        // Hero Blocks
        [
            'type' => 'hero_standard',
            'label' => 'Hero Standard',
            'description' => 'Full-width hero section with title, subtitle, and call-to-action',
            'category' => 'hero',
            'icon' => 'photo',
            'schema' => [
                'properties' => [
                    'title' => ['type' => 'string', 'title' => 'Title', 'maxLength' => 100],
                    'subtitle' => ['type' => 'string', 'title' => 'Subtitle', 'maxLength' => 200],
                    'description' => ['type' => 'string', 'title' => 'Description', 'format' => 'textarea'],
                    'image' => ['type' => 'string', 'title' => 'Background Image', 'format' => 'url'],
                    'button_text' => ['type' => 'string', 'title' => 'Button Text'],
                    'button_url' => ['type' => 'string', 'title' => 'Button URL', 'format' => 'url'],
                    'button_style' => [
                        'type' => 'string',
                        'title' => 'Button Style',
                        'enum' => ['primary', 'secondary', 'outline'],
                    ],
                    'layout' => [
                        'type' => 'string',
                        'title' => 'Layout',
                        'enum' => ['text-image', 'image-text', 'full-width'],
                    ],
                ],
            ],
            'defaults' => [
                'title' => 'Welcome to Our Platform',
                'subtitle' => 'Build amazing things with our powerful tools',
                'button_text' => 'Get Started',
                'button_url' => '#',
                'button_style' => 'primary',
                'layout' => 'text-image',
            ],
        ],

        // Content Blocks
        [
            'type' => 'text_block',
            'label' => 'Text Block',
            'description' => 'Rich text content block',
            'category' => 'content',
            'icon' => 'document-text',
            'schema' => [
                'properties' => [
                    'text' => ['type' => 'string', 'title' => 'Content', 'format' => 'textarea'],
                    'richText' => ['type' => 'boolean', 'title' => 'Enable Rich Text'],
                ],
            ],
            'defaults' => [
                'text' => 'Enter your content here...',
                'richText' => false,
            ],
        ],

        [
            'type' => 'accordion',
            'label' => 'FAQ Accordion',
            'description' => 'Expandable question and answer sections',
            'category' => 'content',
            'icon' => 'queue-list',
            'schema' => [
                'properties' => [
                    'title' => ['type' => 'string', 'title' => 'Section Title'],
                    'subtitle' => ['type' => 'string', 'title' => 'Subtitle'],
                    'selectionMode' => [
                        'type' => 'string',
                        'title' => 'Selection Mode',
                        'enum' => ['single', 'multiple'],
                    ],
                    'items' => [
                        'type' => 'array',
                        'title' => 'FAQ Items',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'title' => ['type' => 'string', 'title' => 'Question'],
                                'content' => ['type' => 'string', 'title' => 'Answer', 'format' => 'textarea'],
                            ],
                        ],
                    ],
                ],
            ],
            'defaults' => [
                'title' => 'Frequently Asked Questions',
                'selectionMode' => 'single',
                'items' => [],
            ],
        ],

        // Feature Blocks
        [
            'type' => 'feature_grid',
            'label' => 'Feature Grid',
            'description' => 'Grid of feature cards with icons',
            'category' => 'features',
            'icon' => 'squares-2x2',
            'schema' => [
                'properties' => [
                    'title' => ['type' => 'string', 'title' => 'Section Title'],
                    'subtitle' => ['type' => 'string', 'title' => 'Subtitle'],
                    'columns' => ['type' => 'number', 'title' => 'Columns', 'minimum' => 1, 'maximum' => 4],
                    'items' => [
                        'type' => 'array',
                        'title' => 'Features',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'icon' => ['type' => 'string', 'title' => 'Icon (emoji or text)'],
                                'title' => ['type' => 'string', 'title' => 'Title'],
                                'description' => ['type' => 'string', 'title' => 'Description'],
                                'link_text' => ['type' => 'string', 'title' => 'Link Text'],
                                'link_url' => ['type' => 'string', 'title' => 'Link URL', 'format' => 'url'],
                            ],
                        ],
                    ],
                ],
            ],
            'defaults' => [
                'title' => 'Features',
                'subtitle' => 'Everything you need',
                'columns' => 3,
                'items' => [],
            ],
        ],

        [
            'type' => 'pricing_cards',
            'label' => 'Pricing Cards',
            'description' => 'Pricing plans with features comparison',
            'category' => 'features',
            'icon' => 'currency-dollar',
            'schema' => [
                'properties' => [
                    'title' => ['type' => 'string', 'title' => 'Section Title'],
                    'subtitle' => ['type' => 'string', 'title' => 'Subtitle'],
                    'currency' => ['type' => 'string', 'title' => 'Currency Symbol'],
                    'billingPeriod' => ['type' => 'string', 'title' => 'Billing Period (e.g., /month)'],
                    'highlightPlan' => ['type' => 'number', 'title' => 'Highlighted Plan Index'],
                    'plans' => [
                        'type' => 'array',
                        'title' => 'Plans',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'name' => ['type' => 'string', 'title' => 'Plan Name'],
                                'description' => ['type' => 'string', 'title' => 'Description'],
                                'price' => ['type' => 'string', 'title' => 'Price'],
                                'price_suffix' => ['type' => 'string', 'title' => 'Price Suffix'],
                                'button_text' => ['type' => 'string', 'title' => 'Button Text'],
                                'button_url' => ['type' => 'string', 'title' => 'Button URL', 'format' => 'url'],
                                'features' => [
                                    'type' => 'array',
                                    'title' => 'Features',
                                    'items' => ['type' => 'string'],
                                ],
                                'footer_text' => ['type' => 'string', 'title' => 'Footer Text'],
                            ],
                        ],
                    ],
                ],
            ],
            'defaults' => [
                'title' => 'Simple, Transparent Pricing',
                'subtitle' => 'Choose the plan that works for you',
                'currency' => '$',
                'billingPeriod' => '/month',
                'highlightPlan' => 1,
                'plans' => [],
            ],
        ],

        [
            'type' => 'stats_section',
            'label' => 'Statistics',
            'description' => 'Display key metrics and statistics',
            'category' => 'features',
            'icon' => 'chart-bar',
            'schema' => [
                'properties' => [
                    'title' => ['type' => 'string', 'title' => 'Section Title'],
                    'subtitle' => ['type' => 'string', 'title' => 'Subtitle'],
                    'stats' => [
                        'type' => 'array',
                        'title' => 'Statistics',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'icon' => ['type' => 'string', 'title' => 'Icon (emoji)'],
                                'value' => ['type' => 'string', 'title' => 'Value'],
                                'prefix' => ['type' => 'string', 'title' => 'Prefix'],
                                'suffix' => ['type' => 'string', 'title' => 'Suffix'],
                                'label' => ['type' => 'string', 'title' => 'Label'],
                                'description' => ['type' => 'string', 'title' => 'Description'],
                            ],
                        ],
                    ],
                ],
            ],
            'defaults' => [
                'title' => '',
                'stats' => [],
            ],
        ],

        // Social Proof
        [
            'type' => 'testimonials',
            'label' => 'Testimonials',
            'description' => 'Customer testimonials carousel or grid',
            'category' => 'social_proof',
            'icon' => 'chat-bubble-bottom-center-text',
            'schema' => [
                'properties' => [
                    'title' => ['type' => 'string', 'title' => 'Section Title'],
                    'subtitle' => ['type' => 'string', 'title' => 'Subtitle'],
                    'layout' => [
                        'type' => 'string',
                        'title' => 'Layout',
                        'enum' => ['carousel', 'grid'],
                    ],
                    'showRating' => ['type' => 'boolean', 'title' => 'Show Star Rating'],
                    'testimonials' => [
                        'type' => 'array',
                        'title' => 'Testimonials',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'quote' => ['type' => 'string', 'title' => 'Quote', 'format' => 'textarea'],
                                'name' => ['type' => 'string', 'title' => 'Name'],
                                'title' => ['type' => 'string', 'title' => 'Job Title'],
                                'company' => ['type' => 'string', 'title' => 'Company'],
                                'avatar' => ['type' => 'string', 'title' => 'Avatar URL', 'format' => 'url'],
                                'rating' => ['type' => 'number', 'title' => 'Rating (1-5)', 'minimum' => 1, 'maximum' => 5],
                            ],
                        ],
                    ],
                ],
            ],
            'defaults' => [
                'title' => 'What Our Customers Say',
                'layout' => 'carousel',
                'showRating' => true,
                'testimonials' => [],
            ],
        ],

        // Team
        [
            'type' => 'team_grid',
            'label' => 'Team Grid',
            'description' => 'Display team members with photos and roles',
            'category' => 'team',
            'icon' => 'users',
            'schema' => [
                'properties' => [
                    'title' => ['type' => 'string', 'title' => 'Section Title'],
                    'subtitle' => ['type' => 'string', 'title' => 'Subtitle'],
                    'columns' => ['type' => 'number', 'title' => 'Columns', 'minimum' => 2, 'maximum' => 4],
                    'showSocial' => ['type' => 'boolean', 'title' => 'Show Social Links'],
                    'members' => [
                        'type' => 'array',
                        'title' => 'Team Members',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'name' => ['type' => 'string', 'title' => 'Name'],
                                'role' => ['type' => 'string', 'title' => 'Role/Position'],
                                'bio' => ['type' => 'string', 'title' => 'Short Bio', 'format' => 'textarea'],
                                'image' => ['type' => 'string', 'title' => 'Photo URL', 'format' => 'url'],
                                'social' => [
                                    'type' => 'object',
                                    'title' => 'Social Links',
                                    'properties' => [
                                        'linkedin' => ['type' => 'string', 'title' => 'LinkedIn URL', 'format' => 'url'],
                                        'twitter' => ['type' => 'string', 'title' => 'Twitter/X URL', 'format' => 'url'],
                                        'github' => ['type' => 'string', 'title' => 'GitHub URL', 'format' => 'url'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            'defaults' => [
                'title' => 'Meet Our Team',
                'columns' => 4,
                'showSocial' => true,
                'members' => [],
            ],
        ],

        // Media
        [
            'type' => 'image_gallery',
            'label' => 'Image Gallery',
            'description' => 'Photo gallery with lightbox',
            'category' => 'media',
            'icon' => 'photo',
            'schema' => [
                'properties' => [
                    'title' => ['type' => 'string', 'title' => 'Section Title'],
                    'subtitle' => ['type' => 'string', 'title' => 'Subtitle'],
                    'columns' => ['type' => 'number', 'title' => 'Columns', 'minimum' => 2, 'maximum' => 4],
                    'enableLightbox' => ['type' => 'boolean', 'title' => 'Enable Lightbox'],
                    'images' => [
                        'type' => 'array',
                        'title' => 'Images',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'url' => ['type' => 'string', 'title' => 'Image URL', 'format' => 'url'],
                                'alt' => ['type' => 'string', 'title' => 'Alt Text'],
                                'caption' => ['type' => 'string', 'title' => 'Caption'],
                            ],
                        ],
                    ],
                ],
            ],
            'defaults' => [
                'title' => '',
                'columns' => 3,
                'enableLightbox' => true,
                'images' => [],
            ],
        ],

        // Forms & CTA
        [
            'type' => 'cta_section',
            'label' => 'Call to Action',
            'description' => 'Prominent call-to-action section',
            'category' => 'forms',
            'icon' => 'megaphone',
            'schema' => [
                'properties' => [
                    'title' => ['type' => 'string', 'title' => 'Title'],
                    'description' => ['type' => 'string', 'title' => 'Description', 'format' => 'textarea'],
                    'button_text' => ['type' => 'string', 'title' => 'Primary Button Text'],
                    'button_url' => ['type' => 'string', 'title' => 'Primary Button URL', 'format' => 'url'],
                    'button_style' => [
                        'type' => 'string',
                        'title' => 'Button Style',
                        'enum' => ['primary', 'secondary', 'outline'],
                    ],
                    'secondary_button_text' => ['type' => 'string', 'title' => 'Secondary Button Text'],
                    'secondary_button_url' => ['type' => 'string', 'title' => 'Secondary Button URL', 'format' => 'url'],
                    'layout' => [
                        'type' => 'string',
                        'title' => 'Layout',
                        'enum' => ['text', 'image'],
                    ],
                    'image' => ['type' => 'string', 'title' => 'Background Image', 'format' => 'url'],
                ],
            ],
            'defaults' => [
                'title' => 'Ready to get started?',
                'description' => 'Join thousands of users using our platform',
                'button_text' => 'Get Started',
                'button_url' => '#',
                'button_style' => 'primary',
                'layout' => 'text',
            ],
        ],

        [
            'type' => 'newsletter',
            'label' => 'Newsletter Signup',
            'description' => 'Email subscription form',
            'category' => 'forms',
            'icon' => 'envelope',
            'schema' => [
                'properties' => [
                    'title' => ['type' => 'string', 'title' => 'Title'],
                    'subtitle' => ['type' => 'string', 'title' => 'Subtitle'],
                    'placeholder' => ['type' => 'string', 'title' => 'Email Placeholder'],
                    'buttonText' => ['type' => 'string', 'title' => 'Button Text'],
                    'successMessage' => ['type' => 'string', 'title' => 'Success Message'],
                    'actionUrl' => ['type' => 'string', 'title' => 'Form Action URL', 'format' => 'url'],
                    'layout' => [
                        'type' => 'string',
                        'title' => 'Layout',
                        'enum' => ['inline', 'stacked'],
                    ],
                    'showNameField' => ['type' => 'boolean', 'title' => 'Show Name Field'],
                    'namePlaceholder' => ['type' => 'string', 'title' => 'Name Placeholder'],
                ],
            ],
            'defaults' => [
                'title' => 'Stay Updated',
                'subtitle' => 'Subscribe to our newsletter for the latest updates.',
                'placeholder' => 'Enter your email',
                'buttonText' => 'Subscribe',
                'successMessage' => 'Thanks for subscribing!',
                'layout' => 'inline',
                'showNameField' => false,
            ],
        ],

        // Video Embed Block
        [
            'type' => 'video_embed',
            'label' => 'Video Embed',
            'description' => 'Embed YouTube, Vimeo, or custom videos',
            'category' => 'media',
            'icon' => 'video-camera',
            'schema' => [
                'properties' => [
                    'url' => ['type' => 'string', 'title' => 'Video URL', 'format' => 'url', 'required' => true],
                    'title' => ['type' => 'string', 'title' => 'Title'],
                    'description' => ['type' => 'string', 'title' => 'Description'],
                    'poster' => ['type' => 'string', 'title' => 'Poster Image', 'format' => 'url'],
                    'aspectRatio' => [
                        'type' => 'string',
                        'title' => 'Aspect Ratio',
                        'enum' => ['16:9', '4:3', '1:1', '21:9'],
                    ],
                    'autoplay' => ['type' => 'boolean', 'title' => 'Autoplay'],
                    'muted' => ['type' => 'boolean', 'title' => 'Muted'],
                    'loop' => ['type' => 'boolean', 'title' => 'Loop'],
                    'controls' => ['type' => 'boolean', 'title' => 'Show Controls'],
                    'showOverlay' => ['type' => 'boolean', 'title' => 'Show Poster Overlay'],
                    'maxWidth' => [
                        'type' => 'string',
                        'title' => 'Max Width',
                        'enum' => ['sm', 'md', 'lg', 'xl', '2xl', 'full'],
                    ],
                ],
            ],
            'defaults' => [
                'url' => '',
                'aspectRatio' => '16:9',
                'autoplay' => false,
                'muted' => false,
                'loop' => false,
                'controls' => true,
                'showOverlay' => true,
                'maxWidth' => 'full',
            ],
        ],

        // Timeline Block
        [
            'type' => 'timeline',
            'label' => 'Timeline',
            'description' => 'Display events or milestones chronologically',
            'category' => 'content',
            'icon' => 'clock',
            'schema' => [
                'properties' => [
                    'title' => ['type' => 'string', 'title' => 'Section Title'],
                    'subtitle' => ['type' => 'string', 'title' => 'Subtitle'],
                    'layout' => [
                        'type' => 'string',
                        'title' => 'Layout',
                        'enum' => ['vertical', 'horizontal', 'alternating'],
                    ],
                    'lineColor' => ['type' => 'string', 'title' => 'Line Color', 'format' => 'color'],
                    'dotColor' => ['type' => 'string', 'title' => 'Dot Color', 'format' => 'color'],
                    'showDates' => ['type' => 'boolean', 'title' => 'Show Dates'],
                    'animate' => ['type' => 'boolean', 'title' => 'Animate'],
                    'items' => [
                        'type' => 'array',
                        'title' => 'Timeline Items',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'title' => ['type' => 'string', 'title' => 'Title'],
                                'description' => ['type' => 'string', 'title' => 'Description'],
                                'date' => ['type' => 'string', 'title' => 'Date'],
                                'status' => [
                                    'type' => 'string',
                                    'title' => 'Status',
                                    'enum' => ['completed', 'in-progress', 'upcoming', 'delayed'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            'defaults' => [
                'title' => 'Our Journey',
                'layout' => 'vertical',
                'lineColor' => '#E4E4E7',
                'dotColor' => '#006FEE',
                'showDates' => true,
                'animate' => true,
                'items' => [],
            ],
        ],

        // Divider Block
        [
            'type' => 'divider',
            'label' => 'Divider',
            'description' => 'Visual section separator with multiple styles',
            'category' => 'content',
            'icon' => 'minus',
            'schema' => [
                'properties' => [
                    'style' => [
                        'type' => 'string',
                        'title' => 'Style',
                        'enum' => ['line', 'dashed', 'dotted', 'gradient', 'icon', 'text', 'wave', 'zigzag', 'dots', 'stars'],
                    ],
                    'color' => ['type' => 'string', 'title' => 'Color', 'format' => 'color'],
                    'thickness' => ['type' => 'number', 'title' => 'Thickness', 'minimum' => 1, 'maximum' => 10],
                    'spacing' => [
                        'type' => 'string',
                        'title' => 'Spacing',
                        'enum' => ['sm', 'md', 'lg', 'xl'],
                    ],
                    'width' => [
                        'type' => 'string',
                        'title' => 'Width',
                        'enum' => ['1/4', '1/3', '1/2', '2/3', '3/4', 'full'],
                    ],
                    'alignment' => [
                        'type' => 'string',
                        'title' => 'Alignment',
                        'enum' => ['left', 'center', 'right'],
                    ],
                    'text' => ['type' => 'string', 'title' => 'Text (for text style)'],
                    'icon' => ['type' => 'string', 'title' => 'Icon (for icon style)'],
                    'animate' => ['type' => 'boolean', 'title' => 'Animate'],
                ],
            ],
            'defaults' => [
                'style' => 'line',
                'color' => '#E4E4E7',
                'thickness' => 1,
                'spacing' => 'md',
                'width' => 'full',
                'alignment' => 'center',
                'animate' => true,
            ],
        ],

        // Code Block
        [
            'type' => 'code_block',
            'label' => 'Code Block',
            'description' => 'Display formatted code snippets',
            'category' => 'content',
            'icon' => 'code-bracket',
            'schema' => [
                'properties' => [
                    'code' => ['type' => 'string', 'title' => 'Code', 'format' => 'textarea', 'required' => true],
                    'language' => [
                        'type' => 'string',
                        'title' => 'Language',
                        'enum' => ['javascript', 'typescript', 'jsx', 'tsx', 'python', 'php', 'ruby', 'java', 'csharp', 'go', 'rust', 'html', 'css', 'json', 'yaml', 'sql', 'bash', 'markdown'],
                    ],
                    'title' => ['type' => 'string', 'title' => 'Title'],
                    'showLineNumbers' => ['type' => 'boolean', 'title' => 'Show Line Numbers'],
                    'showCopyButton' => ['type' => 'boolean', 'title' => 'Show Copy Button'],
                    'highlightLines' => ['type' => 'string', 'title' => 'Highlight Lines (comma-separated)'],
                    'theme' => [
                        'type' => 'string',
                        'title' => 'Theme',
                        'enum' => ['dark', 'light'],
                    ],
                    'maxHeight' => ['type' => 'number', 'title' => 'Max Height (px)', 'minimum' => 100, 'maximum' => 800],
                ],
            ],
            'defaults' => [
                'code' => '// Your code here',
                'language' => 'javascript',
                'showLineNumbers' => true,
                'showCopyButton' => true,
                'theme' => 'dark',
                'maxHeight' => 400,
            ],
        ],

        // Logo Cloud
        [
            'type' => 'logo_cloud',
            'label' => 'Logo Cloud',
            'description' => 'Display partner, client, or sponsor logos',
            'category' => 'social_proof',
            'icon' => 'building-office',
            'schema' => [
                'properties' => [
                    'title' => ['type' => 'string', 'title' => 'Title'],
                    'subtitle' => ['type' => 'string', 'title' => 'Subtitle'],
                    'logos' => [
                        'type' => 'array',
                        'title' => 'Logos',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'image' => ['type' => 'string', 'title' => 'Logo Image', 'format' => 'url'],
                                'name' => ['type' => 'string', 'title' => 'Company Name'],
                                'url' => ['type' => 'string', 'title' => 'Website URL', 'format' => 'url'],
                            ],
                        ],
                    ],
                    'layout' => [
                        'type' => 'string',
                        'title' => 'Layout',
                        'enum' => ['grid', 'row', 'marquee'],
                    ],
                    'columns' => [
                        'type' => 'number',
                        'title' => 'Columns (Grid)',
                        'minimum' => 3,
                        'maximum' => 6,
                    ],
                    'logoStyle' => [
                        'type' => 'string',
                        'title' => 'Logo Style',
                        'enum' => ['default', 'grayscale', 'color-on-hover'],
                    ],
                    'size' => [
                        'type' => 'string',
                        'title' => 'Logo Size',
                        'enum' => ['sm', 'md', 'lg'],
                    ],
                    'background' => [
                        'type' => 'string',
                        'title' => 'Background',
                        'enum' => ['transparent', 'light', 'dark'],
                    ],
                ],
            ],
            'defaults' => [
                'title' => 'Trusted by industry leaders',
                'layout' => 'row',
                'columns' => 6,
                'logoStyle' => 'grayscale',
                'size' => 'md',
                'background' => 'transparent',
            ],
        ],

        // Tabs Block
        [
            'type' => 'tabs_block',
            'label' => 'Tabs',
            'description' => 'Tabbed content sections',
            'category' => 'content',
            'icon' => 'folder-open',
            'schema' => [
                'properties' => [
                    'title' => ['type' => 'string', 'title' => 'Section Title'],
                    'subtitle' => ['type' => 'string', 'title' => 'Subtitle'],
                    'tabs' => [
                        'type' => 'array',
                        'title' => 'Tabs',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'title' => ['type' => 'string', 'title' => 'Tab Title'],
                                'icon' => ['type' => 'string', 'title' => 'Icon Name'],
                                'content' => ['type' => 'string', 'title' => 'Content', 'format' => 'textarea'],
                                'image' => ['type' => 'string', 'title' => 'Image URL', 'format' => 'url'],
                            ],
                        ],
                    ],
                    'variant' => [
                        'type' => 'string',
                        'title' => 'Tab Style',
                        'enum' => ['underlined', 'bordered', 'solid', 'light'],
                    ],
                    'color' => [
                        'type' => 'string',
                        'title' => 'Color',
                        'enum' => ['primary', 'secondary', 'success', 'warning', 'danger'],
                    ],
                    'orientation' => [
                        'type' => 'string',
                        'title' => 'Orientation',
                        'enum' => ['horizontal', 'vertical'],
                    ],
                    'showIcons' => ['type' => 'boolean', 'title' => 'Show Tab Icons'],
                    'animated' => ['type' => 'boolean', 'title' => 'Animate Transitions'],
                ],
            ],
            'defaults' => [
                'variant' => 'underlined',
                'color' => 'primary',
                'orientation' => 'horizontal',
                'showIcons' => true,
                'animated' => true,
            ],
        ],

        // Contact Form
        [
            'type' => 'contact_form',
            'label' => 'Contact Form',
            'description' => 'Contact form with configurable fields',
            'category' => 'forms',
            'icon' => 'envelope',
            'schema' => [
                'properties' => [
                    'title' => ['type' => 'string', 'title' => 'Form Title'],
                    'subtitle' => ['type' => 'string', 'title' => 'Subtitle'],
                    'layout' => [
                        'type' => 'string',
                        'title' => 'Layout',
                        'enum' => ['simple', 'split', 'card'],
                    ],
                    'submitText' => ['type' => 'string', 'title' => 'Submit Button Text'],
                    'submitEndpoint' => ['type' => 'string', 'title' => 'Form Endpoint URL'],
                    'successMessage' => ['type' => 'string', 'title' => 'Success Message'],
                    'showContactInfo' => ['type' => 'boolean', 'title' => 'Show Contact Info'],
                    'email' => ['type' => 'string', 'title' => 'Contact Email'],
                    'phone' => ['type' => 'string', 'title' => 'Contact Phone'],
                    'address' => ['type' => 'string', 'title' => 'Address', 'format' => 'textarea'],
                ],
            ],
            'defaults' => [
                'title' => 'Get in Touch',
                'subtitle' => "We'd love to hear from you.",
                'layout' => 'simple',
                'submitText' => 'Send Message',
                'submitEndpoint' => '/api/contact',
                'successMessage' => 'Thank you! We\'ll be in touch soon.',
                'showContactInfo' => true,
            ],
        ],
    ],
];
