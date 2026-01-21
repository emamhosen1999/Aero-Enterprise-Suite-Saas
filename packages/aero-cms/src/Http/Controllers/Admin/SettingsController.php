<?php

declare(strict_types=1);

namespace Aero\Cms\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller for managing CMS settings.
 *
 * Handles general CMS configuration, SEO defaults, and cache management.
 */
class SettingsController extends Controller
{
    /**
     * Get CMS settings configuration key prefix.
     */
    private function getConfigPrefix(): string
    {
        return 'cms.settings.';
    }

    /**
     * Display CMS settings page.
     */
    public function index(): Response
    {
        $settings = $this->getAllSettings();

        return Inertia::render('CMS/Settings/Index', [
            'title' => 'CMS Settings',
            'settings' => $settings,
        ]);
    }

    /**
     * Update general CMS settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'site_name' => 'nullable|string|max:255',
            'default_layout' => 'nullable|string|max:100',
            'posts_per_page' => 'nullable|integer|min:1|max:100',
            'enable_comments' => 'nullable|boolean',
            'enable_page_caching' => 'nullable|boolean',
            'cache_duration' => 'nullable|integer|min:0|max:86400',
            'default_meta_image' => 'nullable|string|max:500',
            'footer_content' => 'nullable|string|max:5000',
            'custom_css' => 'nullable|string|max:50000',
            'custom_js' => 'nullable|string|max:50000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $this->saveSettings('general', $request->only([
            'site_name',
            'default_layout',
            'posts_per_page',
            'enable_comments',
            'enable_page_caching',
            'cache_duration',
            'default_meta_image',
            'footer_content',
            'custom_css',
            'custom_js',
        ]));

        return response()->json([
            'message' => 'Settings updated successfully',
            'settings' => $this->getSettings('general'),
        ]);
    }

    /**
     * Get SEO settings.
     */
    public function seo(): JsonResponse
    {
        return response()->json([
            'settings' => $this->getSettings('seo'),
        ]);
    }

    /**
     * Update SEO settings.
     */
    public function updateSeo(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'default_meta_title' => 'nullable|string|max:70',
            'default_meta_description' => 'nullable|string|max:160',
            'default_meta_keywords' => 'nullable|string|max:500',
            'google_analytics_id' => 'nullable|string|max:50',
            'google_tag_manager_id' => 'nullable|string|max:50',
            'facebook_pixel_id' => 'nullable|string|max:50',
            'robots_txt' => 'nullable|string|max:5000',
            'sitemap_enabled' => 'nullable|boolean',
            'canonical_url_enabled' => 'nullable|boolean',
            'og_default_image' => 'nullable|string|max:500',
            'twitter_card_type' => 'nullable|string|in:summary,summary_large_image',
            'twitter_site' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $this->saveSettings('seo', $request->only([
            'default_meta_title',
            'default_meta_description',
            'default_meta_keywords',
            'google_analytics_id',
            'google_tag_manager_id',
            'facebook_pixel_id',
            'robots_txt',
            'sitemap_enabled',
            'canonical_url_enabled',
            'og_default_image',
            'twitter_card_type',
            'twitter_site',
        ]));

        return response()->json([
            'message' => 'SEO settings updated successfully',
            'settings' => $this->getSettings('seo'),
        ]);
    }

    /**
     * Clear CMS cache.
     */
    public function clearCache(): JsonResponse
    {
        // Clear page cache
        Cache::tags(['cms', 'cms-pages'])->flush();

        // Clear block cache
        Cache::tags(['cms-blocks'])->flush();

        // Clear media cache
        Cache::tags(['cms-media'])->flush();

        return response()->json([
            'message' => 'CMS cache cleared successfully',
        ]);
    }

    /**
     * Get all settings grouped by category.
     *
     * @return array<string, mixed>
     */
    private function getAllSettings(): array
    {
        return [
            'general' => $this->getSettings('general'),
            'seo' => $this->getSettings('seo'),
        ];
    }

    /**
     * Get settings for a specific category.
     *
     * @return array<string, mixed>
     */
    private function getSettings(string $category): array
    {
        $key = $this->getConfigPrefix() . $category;

        return Cache::remember($key, 3600, function () use ($category) {
            // In a real implementation, this would load from database
            // For now, return defaults
            return $this->getDefaultSettings($category);
        });
    }

    /**
     * Save settings for a specific category.
     *
     * @param array<string, mixed> $data
     */
    private function saveSettings(string $category, array $data): void
    {
        $key = $this->getConfigPrefix() . $category;

        // Merge with existing settings
        $existing = $this->getSettings($category);
        $merged = array_merge($existing, array_filter($data, fn ($value) => $value !== null));

        // In a real implementation, save to database
        // For now, just update cache
        Cache::put($key, $merged, 3600);
    }

    /**
     * Get default settings for a category.
     *
     * @return array<string, mixed>
     */
    private function getDefaultSettings(string $category): array
    {
        $defaults = [
            'general' => [
                'site_name' => config('app.name'),
                'default_layout' => 'default',
                'posts_per_page' => 10,
                'enable_comments' => false,
                'enable_page_caching' => true,
                'cache_duration' => 3600,
                'default_meta_image' => null,
                'footer_content' => '',
                'custom_css' => '',
                'custom_js' => '',
            ],
            'seo' => [
                'default_meta_title' => config('app.name'),
                'default_meta_description' => '',
                'default_meta_keywords' => '',
                'google_analytics_id' => '',
                'google_tag_manager_id' => '',
                'facebook_pixel_id' => '',
                'robots_txt' => "User-agent: *\nAllow: /",
                'sitemap_enabled' => true,
                'canonical_url_enabled' => true,
                'og_default_image' => null,
                'twitter_card_type' => 'summary_large_image',
                'twitter_site' => '',
            ],
        ];

        return $defaults[$category] ?? [];
    }
}
