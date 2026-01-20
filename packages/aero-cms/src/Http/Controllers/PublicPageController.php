<?php

declare(strict_types=1);

namespace Aero\Cms\Http\Controllers;

use Aero\Cms\Models\CmsPage;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PublicPageController extends Controller
{
    /**
     * Render a CMS page by slug.
     */
    public function show(Request $request, string $slug = null): Response
    {
        // Handle homepage
        if (empty($slug) || $slug === '/') {
            $page = CmsPage::where('is_homepage', true)
                ->where('status', 'published')
                ->first();
        } else {
            $page = CmsPage::where('slug', $slug)
                ->where('status', 'published')
                ->first();
        }

        if (!$page) {
            throw new NotFoundHttpException('Page not found');
        }

        // Load blocks
        $page->load(['blocks' => function ($query) {
            $query->orderBy('order_index');
        }]);

        return Inertia::render('Platform/Public/CmsPage', [
            'title' => $page->meta_title ?: $page->title,
            'page' => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'meta_title' => $page->meta_title,
                'meta_description' => $page->meta_description,
                'meta_keywords' => $page->meta_keywords,
                'og_image' => $page->og_image,
                'layout' => $page->layout,
                'settings' => $page->settings,
            ],
            'blocks' => $page->blocks->map(fn ($block) => [
                'id' => $block->id,
                'block_type' => $block->block_type,
                'content' => $block->content,
                'settings' => $block->settings,
            ])->toArray(),
            'isPreview' => false,
        ]);
    }

    /**
     * Render sitemap for CMS pages.
     */
    public function sitemap(): \Illuminate\Http\Response
    {
        $pages = CmsPage::where('status', 'published')
            ->orderBy('updated_at', 'desc')
            ->get(['slug', 'updated_at']);

        $content = view('aero-cms::sitemap', ['pages' => $pages])->render();

        return response($content, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }
}
