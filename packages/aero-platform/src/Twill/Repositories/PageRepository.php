<?php

declare(strict_types=1);

namespace Aero\Platform\Twill\Repositories;

use A17\Twill\Repositories\Behaviors\HandleBlocks;
use A17\Twill\Repositories\Behaviors\HandleMedias;
use A17\Twill\Repositories\Behaviors\HandleRevisions;
use A17\Twill\Repositories\Behaviors\HandleSlugs;
use A17\Twill\Repositories\Behaviors\HandleTranslations;
use A17\Twill\Repositories\ModuleRepository;
use Aero\Platform\Twill\Models\Page;

class PageRepository extends ModuleRepository
{
    use HandleBlocks;
    use HandleMedias;
    use HandleRevisions;
    use HandleSlugs;
    use HandleTranslations;

    public function __construct(Page $model)
    {
        $this->model = $model;
    }

    /**
     * Find the homepage page (is_homepage = true, published).
     */
    public function findHomepage(): ?Page
    {
        return $this->model->newQuery()
            ->where('is_homepage', true)
            ->where('published', true)
            ->first();
    }

    /**
     * Find a published page by its slug.
     */
    public function findBySlug(string $slug): ?Page
    {
        return $this->model->newQuery()
            ->whereHas('slugs', fn ($q) => $q->where('slug', $slug)->where('active', true))
            ->where('published', true)
            ->first();
    }
}
