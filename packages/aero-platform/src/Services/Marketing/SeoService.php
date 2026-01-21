<?php

declare(strict_types=1);

namespace Aero\Platform\Services\Marketing;

use Aero\Platform\Models\PlatformPage;
use Aero\Platform\Models\PlatformSetting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * SEO Service
 *
 * Manages SEO settings, meta tags, sitemap generation, and schema markup.
 */
class SeoService
{
    protected const CACHE_KEY_SITEMAP = 'platform:sitemap';

    protected const CACHE_TTL_SITEMAP = 3600; // 1 hour

    /**
     * Get SEO meta tags for a specific page.
     */
    public function getPageSeoMeta(string $slug): array
    {
        $settings = PlatformSetting::current();
        $page = PlatformPage::findBySlug($slug);

        if ($page) {
            return $page->getSeoMeta($settings);
        }

        return $settings->getDefaultSeoMeta();
    }

    /**
     * Update SEO settings.
     */
    public function updateSeoSettings(array $data): PlatformSetting
    {
        $settings = PlatformSetting::current();

        $seoSettings = array_merge($settings->seo_settings ?? [], $data);
        $settings->update(['seo_settings' => $seoSettings]);

        // Clear sitemap cache if relevant settings changed
        if (isset($data['sitemap_enabled']) || isset($data['canonical_domain'])) {
            $this->clearSitemapCache();
        }

        return $settings->refresh();
    }

    /**
     * Update analytics integrations.
     */
    public function updateAnalyticsIntegrations(array $data): PlatformSetting
    {
        $settings = PlatformSetting::current();

        $analytics = array_merge($settings->analytics_integrations ?? [], $data);
        $settings->update(['analytics_integrations' => $analytics]);

        return $settings->refresh();
    }

    /**
     * Generate XML sitemap.
     */
    public function generateSitemap(): string
    {
        return Cache::remember(self::CACHE_KEY_SITEMAP, self::CACHE_TTL_SITEMAP, function () {
            $settings = PlatformSetting::current();
            $seo = $settings->getSeoSettings();

            if (! ($seo['sitemap_enabled'] ?? true)) {
                return '';
            }

            $baseUrl = $seo['canonical_domain'] ?? config('app.url');
            $pages = PlatformPage::active()->orderBy('priority')->get();

            $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
            $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

            // Add homepage
            $xml .= $this->buildSitemapUrl($baseUrl, 1.0, 'daily');

            // Add platform pages
            foreach ($pages as $page) {
                $priority = $this->getPagePriority($page->page_type);
                $frequency = $this->getPageFrequency($page->page_type);
                $url = $page->slug === '/' ? $baseUrl : "{$baseUrl}/{$page->slug}";
                $xml .= $this->buildSitemapUrl($url, $priority, $frequency, $page->updated_at);
            }

            // Add static pages
            $staticPages = [
                'pricing' => ['priority' => 0.9, 'frequency' => 'weekly'],
                'features' => ['priority' => 0.8, 'frequency' => 'weekly'],
                'register' => ['priority' => 0.7, 'frequency' => 'monthly'],
                'about' => ['priority' => 0.6, 'frequency' => 'monthly'],
                'contact' => ['priority' => 0.6, 'frequency' => 'monthly'],
            ];

            foreach ($staticPages as $slug => $config) {
                if (! $pages->where('slug', $slug)->first()) {
                    $xml .= $this->buildSitemapUrl(
                        "{$baseUrl}/{$slug}",
                        $config['priority'],
                        $config['frequency']
                    );
                }
            }

            $xml .= '</urlset>';

            return $xml;
        });
    }

    /**
     * Build a sitemap URL entry.
     */
    protected function buildSitemapUrl(
        string $url,
        float $priority = 0.5,
        string $changefreq = 'weekly',
        ?\DateTimeInterface $lastmod = null
    ): string {
        $xml = "  <url>\n";
        $xml .= "    <loc>{$url}</loc>\n";

        if ($lastmod) {
            $xml .= '    <lastmod>'.$lastmod->format('Y-m-d')."</lastmod>\n";
        }

        $xml .= "    <changefreq>{$changefreq}</changefreq>\n";
        $xml .= "    <priority>{$priority}</priority>\n";
        $xml .= "  </url>\n";

        return $xml;
    }

    /**
     * Get page priority based on type.
     */
    protected function getPagePriority(string $type): float
    {
        return match ($type) {
            PlatformPage::TYPE_LANDING => 1.0,
            PlatformPage::TYPE_PRICING => 0.9,
            PlatformPage::TYPE_FEATURES => 0.8,
            PlatformPage::TYPE_ABOUT => 0.6,
            PlatformPage::TYPE_CONTACT => 0.6,
            default => 0.5,
        };
    }

    /**
     * Get page update frequency based on type.
     */
    protected function getPageFrequency(string $type): string
    {
        return match ($type) {
            PlatformPage::TYPE_LANDING => 'daily',
            PlatformPage::TYPE_PRICING => 'weekly',
            PlatformPage::TYPE_FEATURES => 'weekly',
            default => 'monthly',
        };
    }

    /**
     * Generate robots.txt content.
     */
    public function generateRobotsTxt(): string
    {
        $settings = PlatformSetting::current();
        $seo = $settings->getSeoSettings();

        if (! empty($seo['robots_txt'])) {
            return $seo['robots_txt'];
        }

        $baseUrl = $seo['canonical_domain'] ?? config('app.url');

        $content = "User-agent: *\n";
        $content .= "Allow: /\n";
        $content .= "\n";
        $content .= "# Disallow admin areas\n";
        $content .= "Disallow: /admin\n";
        $content .= "Disallow: /api\n";
        $content .= "\n";
        $content .= "Sitemap: {$baseUrl}/sitemap.xml\n";

        return $content;
    }

    /**
     * Clear sitemap cache.
     */
    public function clearSitemapCache(): void
    {
        Cache::forget(self::CACHE_KEY_SITEMAP);
    }

    /**
     * Validate meta tags.
     */
    public function validateMetaTags(array $meta): array
    {
        $issues = [];

        // Title validation
        if (empty($meta['title'])) {
            $issues[] = ['field' => 'title', 'severity' => 'error', 'message' => 'Meta title is missing'];
        } elseif (strlen($meta['title']) > 60) {
            $issues[] = ['field' => 'title', 'severity' => 'warning', 'message' => 'Meta title is too long (> 60 chars)'];
        } elseif (strlen($meta['title']) < 30) {
            $issues[] = ['field' => 'title', 'severity' => 'info', 'message' => 'Meta title could be longer (< 30 chars)'];
        }

        // Description validation
        if (empty($meta['description'])) {
            $issues[] = ['field' => 'description', 'severity' => 'error', 'message' => 'Meta description is missing'];
        } elseif (strlen($meta['description']) > 160) {
            $issues[] = ['field' => 'description', 'severity' => 'warning', 'message' => 'Meta description is too long (> 160 chars)'];
        } elseif (strlen($meta['description']) < 70) {
            $issues[] = ['field' => 'description', 'severity' => 'info', 'message' => 'Meta description could be longer (< 70 chars)'];
        }

        // OG Image validation
        if (empty($meta['og']['image'] ?? null)) {
            $issues[] = ['field' => 'og_image', 'severity' => 'warning', 'message' => 'Open Graph image is missing'];
        }

        return $issues;
    }

    /**
     * Get all platform pages with SEO status.
     */
    public function getPagesWithSeoStatus(): Collection
    {
        $pages = PlatformPage::active()->orderBy('priority')->get();

        return $pages->map(function ($page) {
            $settings = PlatformSetting::current();
            $meta = $page->getSeoMeta($settings);
            $issues = $this->validateMetaTags($meta);

            return [
                'id' => $page->id,
                'slug' => $page->slug,
                'title' => $page->title,
                'page_type' => $page->page_type,
                'meta_title' => $page->meta_title,
                'meta_description' => $page->meta_description,
                'seo_score' => $this->calculateSeoScore($issues),
                'issues' => $issues,
            ];
        });
    }

    /**
     * Calculate SEO score based on issues.
     */
    protected function calculateSeoScore(array $issues): int
    {
        $score = 100;

        foreach ($issues as $issue) {
            $score -= match ($issue['severity']) {
                'error' => 25,
                'warning' => 10,
                'info' => 5,
                default => 0,
            };
        }

        return max(0, $score);
    }
}
