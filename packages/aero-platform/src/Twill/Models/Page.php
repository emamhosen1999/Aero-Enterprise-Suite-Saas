<?php

declare(strict_types=1);

namespace Aero\Platform\Twill\Models;

use A17\Twill\Models\Behaviors\HasBlocks;
use A17\Twill\Models\Behaviors\HasMedias;
use A17\Twill\Models\Behaviors\HasRevisions;
use A17\Twill\Models\Behaviors\HasSlug;
use A17\Twill\Models\Behaviors\HasTranslation;
use A17\Twill\Models\Model;

/**
 * Platform CMS Page
 *
 * Represents a publicly-accessible page on the platform domain (aeos365.test).
 * Each page has a slug (e.g. 'pricing', 'about') and a block-based body.
 *
 * Special slug '/' maps to the homepage (aeos365.test/).
 */
class Page extends Model
{
    use HasBlocks;
    use HasMedias;
    use HasRevisions;
    use HasSlug;
    use HasTranslation;

    /**
     * Force central DB — CMS pages belong to the landlord, not tenants.
     */
    protected $connection = 'central';

    protected $table = 'twill_pages';

    protected $fillable = [
        'title',
        'description',
        'meta_title',
        'meta_description',
        'og_image',
        'is_homepage',
        'published',
        'position',
    ];

    protected $casts = [
        'is_homepage' => 'boolean',
        'published'   => 'boolean',
    ];

    /**
     * Translatable fields (title, description shown in the Twill form).
     */
    public $translatedAttributes = [
        'title',
        'description',
        'active',
    ];

    /**
     * Sluggable fields — Twill will generate unique slugs from title.
     */
    public $slugAttributes = ['title'];

    /**
     * Media roles — 'cover' used for OG image etc.
     */
    public $mediasParams = [
        'cover' => [
            'default' => [['name' => 'default', 'ratio' => 16 / 9]],
        ],
    ];
}
