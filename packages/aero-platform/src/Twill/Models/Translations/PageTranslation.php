<?php

declare(strict_types=1);

namespace Aero\Platform\Twill\Models\Translations;

use A17\Twill\Models\Model;

class PageTranslation extends Model
{
    protected $connection = 'central';

    protected $table = 'twill_page_translations';

    public $timestamps = true;

    protected $fillable = [
        'title',
        'description',
        'active',
        'locale',
    ];
}
