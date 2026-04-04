<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers\Public;

use Aero\Platform\Twill\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Serves Twill-managed CMS pages on the public platform domain.
 *
 * Route matching:
 *   GET /           → homepage (is_homepage = true)
 *   GET /{slug}     → any other published page by slug
 *
 * Falls through to a 404 if no published page is found.
 */
class CmsLandingController extends Controller
{
    /**
     * Show the homepage.
     */
    public function home(): Response
    {
        $page = Page::on('central')
            ->where('is_homepage', true)
            ->where('published', true)
            ->with(['blocks', 'medias'])
            ->first();

        // Fall back to the static Landing component if no CMS homepage exists yet
        if (! $page) {
            return Inertia::render('Platform/Public/Landing', [
                'title' => config('app.name'),
            ]);
        }

        return $this->renderPage($page);
    }

    /**
     * Show any other published page by slug.
     */
    public function show(string $slug): Response
    {
        $page = Page::on('central')
            ->whereHas('slugs', fn ($q) => $q->where('slug', $slug)->where('active', true))
            ->where('published', true)
            ->with(['blocks', 'medias'])
            ->first();

        abort_if(! $page, 404);

        return $this->renderPage($page);
    }

    /**
     * Render a CMS page via Inertia, passing blocks as structured props.
     */
    private function renderPage(Page $page): Response
    {
        return Inertia::render('Platform/Public/CmsPage', [
            'page' => [
                'id'               => $page->id,
                'title'            => $page->title,
                'description'      => $page->description,
                'meta_title'       => $page->meta_title ?? $page->title,
                'meta_description' => $page->meta_description ?? $page->description,
                'is_homepage'      => $page->is_homepage,
                'blocks'           => $this->transformBlocks($page),
                'cover'            => $page->imageAsArray('cover'),
            ],
        ]);
    }

    /**
     * Transform Twill blocks into a clean JSON structure for the React frontend.
     */
    private function transformBlocks(Page $page): array
    {
        return $page->blocks->map(fn ($block) => [
            'type'    => $block->type,
            'content' => $block->content,
            'medias'  => $block->medias->map(fn ($m) => [
                'uuid' => $m->uuid,
                'url'  => $m->url ?? null,
                'alt'  => $m->alt_text,
            ])->values()->toArray(),
        ])->values()->toArray();
    }
}
