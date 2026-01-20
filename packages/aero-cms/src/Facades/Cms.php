<?php

declare(strict_types=1);

namespace Aero\Cms\Facades;

use Illuminate\Support\Facades\Facade;
use Aero\Cms\Services\CmsService;

/**
 * @method static array getAvailableBlocks()
 * @method static array getBlockSchema(string $blockType)
 * @method static \Aero\Cms\Models\CmsPage|null getPageBySlug(string $slug)
 * @method static array renderPage(string $slug)
 *
 * @see \Aero\Cms\Services\CmsService
 */
class Cms extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return CmsService::class;
    }
}
