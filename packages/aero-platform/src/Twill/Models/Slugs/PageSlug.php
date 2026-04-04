<?php

declare(strict_types=1);

namespace Aero\Platform\Twill\Models\Slugs;

use A17\Twill\Models\Model;

class PageSlug extends Model
{
    protected $connection = 'central';

    protected $table = 'twill_page_slugs';

    public $timestamps = true;

    protected $fillable = [
        'slug',
        'locale',
        'active',
    ];
}
