<?php

declare(strict_types=1);

namespace Aero\Platform\Twill\Models\Revisions;

use A17\Twill\Models\Model;

class PageRevision extends Model
{
    protected $connection = 'central';

    protected $table = 'twill_page_revisions';

    public $timestamps = true;

    protected $casts = [
        'payload' => 'array',
    ];

    protected $fillable = [
        'payload',
        'user_id',
    ];
}
