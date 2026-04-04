<?php

declare(strict_types=1);

namespace Aero\Cms\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CmsTemplate extends Model
{
    protected $connection = 'central';

    protected $table = 'cms_templates';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'layout',
        'preview_image',
    ];

    protected $casts = [
        'layout' => 'array',
    ];

    /**
     * Get pages using this template.
     */
    public function pages(): HasMany
    {
        return $this->hasMany(CmsPage::class, 'template_id');
    }
}
