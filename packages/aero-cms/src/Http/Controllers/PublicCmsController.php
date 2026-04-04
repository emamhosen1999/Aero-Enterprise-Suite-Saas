<?php

namespace Aero\Cms\Http\Controllers;

use Aero\Cms\Models\CmsPage;
use Aero\Cms\Models\CmsCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicCmsController
{
    /**
     * Display a published CMS page by slug
     */
    public function show(Request $request, string $slug): \Inertia\Response
    {
        $page = CmsPage::query()
            ->where('slug', $slug)
            ->language()  // Filter by current locale
            ->where('status', 'published')
            ->where(function ($query) {
                $query->whereNull('scheduled_at')
                    ->orWhere('scheduled_at', '<=', now());
            })
            ->with(['blocks' => function ($query) {
                $query->where('is_visible', true)
                    ->orderBy('order')
                    ->get();
            }, 'category', 'template'])
            ->firstOrFail();

        // Log page view analytics
        activity()
            ->useLog('cms_page_views')
            ->performedOn($page)
            ->log('viewed');

        return Inertia::render('CMS/PublicPages/Show', [
            'page' => $page,
            'seoMeta' => $this->generateSeoMeta($page),
            'breadcrumbs' => $this->generateBreadcrumbs($page),
        ]);
    }

    /**
     * Display CMS page by ID (from home page or direct link)
     */
    public function showById(Request $request, int $id): \Inertia\Response
    {
        $page = CmsPage::query()
            ->where('id', $id)
            ->where('status', 'published')
            ->where(function ($query) {
                $query->whereNull('scheduled_at')
                    ->orWhere('scheduled_at', '<=', now());
            })
            ->with(['blocks' => function ($query) {
                $query->where('is_visible', true)
                    ->orderBy('order')
                    ->get();
            }, 'category', 'template'])
            ->firstOrFail();

        return Inertia::render('CMS/PublicPages/Show', [
            'page' => $page,
            'seoMeta' => $this->generateSeoMeta($page),
            'breadcrumbs' => $this->generateBreadcrumbs($page),
        ]);
    }

    /**
     * Generate SEO meta tags from page data
     */
    private function generateSeoMeta(CmsPage $page): array
    {
        return [
            'title' => $page->meta_title ?: $page->title,
            'description' => $page->meta_description ?: str($page->content)->words(20)->toString(),
            'keywords' => $page->meta_keywords ?: '',
            'canonical' => $page->meta_canonical_url ?: route('cms.page.show', ['slug' => $page->slug]),
            'ogTitle' => $page->meta_title ?: $page->title,
            'ogDescription' => $page->meta_description,
            'ogImage' => $this->extractOgImage($page),
            'ogUrl' => route('cms.page.show', ['slug' => $page->slug]),
            'robots' => $page->allow_indexing ? 'index, follow' : 'noindex, nofollow',
        ];
    }

    /**
     * Extract OG image from page blocks
     */
    private function extractOgImage(CmsPage $page): ?string
    {
        // Try to find first image block or image from hero
        $block = $page->blocks()
            ->where('is_visible', true)
            ->whereIn('type', ['Hero', 'ImageGallery'])
            ->orderBy('order')
            ->first();

        if ($block && $block->data) {
            $data = is_string($block->data) ? json_decode($block->data, true) : $block->data;

            if (isset($data['backgroundImage'])) {
                return $data['backgroundImage'];
            }
            if (isset($data['images']) && is_array($data['images'])) {
                return $data['images'][0]['url'] ?? null;
            }
        }

        return null;
    }

    /**
     * Generate breadcrumb navigation
     */
    private function generateBreadcrumbs(CmsPage $page): array
    {
        $locale = app()->getLocale();
        $isLocalized = $locale !== config('app.locale');
        
        $breadcrumbs = [
            ['title' => 'Home', 'url' => route('home')],
        ];

        if ($page->category) {
            $routeName = $isLocalized ? 'cms.category.localized' : 'cms.category';
            $params = $isLocalized 
                ? ['locale' => $locale, 'slug' => $page->category->slug]
                : ['slug' => $page->category->slug];
            
            $breadcrumbs[] = [
                'title' => $page->category->name,
                'url' => route($routeName, $params),
            ];
        }

        $breadcrumbs[] = [
            'title' => $page->title,
            'url' => null, // Current page
            'active' => true,
        ];

        return $breadcrumbs;
    }

    /**
     * Display all pages in a category
     */
    public function category(Request $request, string $slug): \Inertia\Response
    {
        $category = CmsCategory::where('slug', $slug)->firstOrFail();

        $pages = $category->pages()
            ->language()  // Filter by current locale
            ->where('status', 'published')
            ->where(function ($query) {
                $query->whereNull('scheduled_at')
                    ->orWhere('scheduled_at', '<=', now());
            })
            ->paginate(12);

        return Inertia::render('CMS/PublicPages/Category', [
            'category' => $category,
            'pages' => $pages,
            'breadcrumbs' => [
                ['title' => 'Home', 'url' => route('home')],
                ['title' => $category->name, 'url' => null, 'active' => true],
            ],
        ]);
    }

    /**
     * Search CMS pages
     */
    public function search(Request $request): \Inertia\Response
    {
        $query = $request->input('q');

        $results = CmsPage::query()
            ->language()  // Filter by current locale
            ->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('scheduled_at')
                    ->orWhere('scheduled_at', '<=', now());
            })
            ->where(function ($q) use ($query) {
                $q->where('title', 'like', "%{$query}%")
                    ->orWhere('content', 'like', "%{$query}%")
                    ->orWhere('meta_description', 'like', "%{$query}%");
            })
            ->paginate(20);

        return Inertia::render('CMS/PublicPages/Search', [
            'query' => $query,
            'results' => $results,
        ]);
    }

    /**
     * Generate sitemap for SEO
     */
    public function sitemap()
    {
        $pages = CmsPage::query()
            ->language()  // Filter by current locale
            ->where('status', 'published')
            ->where('allow_indexing', true)
            ->where(function ($query) {
                $query->whereNull('scheduled_at')
                    ->orWhere('scheduled_at', '<=', now());
            })
            ->orderByDesc('updated_at')
            ->get();

        return response()->view('cms.sitemap', ['pages' => $pages], 200)
            ->header('Content-Type', 'application/xml');
    }

    /**
     * Generate robots.txt
     */
    public function robots()
    {
        return response()->view('cms.robots.txt', [], 200)
            ->header('Content-Type', 'text/plain');
    }

    /**
     * Get homepage CMS page if configured
     */
    public function homepage()
    {
        $page = CmsPage::query()
            ->language()  // Filter by current locale
            ->where('is_homepage', true)
            ->where('status', 'published')
            ->where(function ($query) {
                $query->whereNull('scheduled_at')
                    ->orWhere('scheduled_at', '<=', now());
            })
            ->with(['blocks' => function ($query) {
                $query->where('is_visible', true)
                    ->orderBy('order')
                    ->get();
            }, 'category'])
            ->first();

        if (!$page) {
            return null;
        }

        return [
            'page' => $page,
            'seoMeta' => $this->generateSeoMeta($page),
        ];
    }
}
