<?php

namespace Aero\I18n;

use Aero\I18n\Contracts\TranslationDriverInterface;
use Aero\I18n\Drivers\LibreTranslateDriver;
use Aero\I18n\Drivers\MyMemoryDriver;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

/**
 * Translation Engine
 *
 * Central manager that coordinates API drivers and file-based caching.
 * Translates UI strings on-demand, caches results to JSON files,
 * and serves cached translations for subsequent requests.
 *
 * Flow:
 *   1. Check file cache (storage/app/i18n/{locale}.json)
 *   2. If cached → return instantly (zero API calls)
 *   3. If not cached → translate via API → cache → return
 *   4. On API failure → fall back to English
 */
class TranslationEngine
{
    /** @var TranslationDriverInterface[] */
    protected array $drivers = [];

    protected string $cachePath;

    protected string $sourcePath;

    public function __construct()
    {
        $this->cachePath = storage_path('app/i18n');
        $this->sourcePath = __DIR__ . '/../resources/lang';
        $this->initDrivers();
    }

    /**
     * Initialize translation drivers in priority order.
     */
    protected function initDrivers(): void
    {
        $primary = config('locale.translation_api.primary', 'libretranslate');

        if ($primary === 'mymemory') {
            $this->drivers = [
                new MyMemoryDriver(),
                new LibreTranslateDriver(),
            ];
        } else {
            $this->drivers = [
                new LibreTranslateDriver(),
                new MyMemoryDriver(),
            ];
        }
    }

    /**
     * Get all translations for a locale.
     *
     * Returns cached translations instantly. If no cache exists,
     * auto-translates via the free API, caches the result, and returns it.
     * Pre-seeded JSON files serve as immediate fallback while API runs.
     *
     * @return array<string, string>
     */
    public function getTranslations(?string $locale = null): array
    {
        $locale = $locale ?? App::getLocale();

        if ($locale === 'en') {
            return $this->getSourceStrings();
        }

        // 1. Check file cache (instant — zero API calls)
        $cached = $this->loadCache($locale);
        if (! empty($cached)) {
            return $cached;
        }

        // 2. No cache — auto-translate via free API on first request
        //    This happens once per locale, then serves from cache forever.
        try {
            $stats = $this->translateLocale($locale);

            if ($stats['translated'] > 0) {
                return $this->loadCache($locale);
            }
        } catch (\Throwable $e) {
            Log::warning("Auto-translation failed for [{$locale}]: " . $e->getMessage());
        }

        // 3. API failed — fall back to pre-seeded translations
        $preSeeded = $this->loadPreSeeded($locale);
        if (! empty($preSeeded)) {
            $this->saveCache($locale, $preSeeded);

            return $preSeeded;
        }

        // 4. Nothing available — return English
        return $this->getSourceStrings();
    }

    /**
     * Translate all source strings to a target locale via API.
     *
     * This is the heavy operation — call it from artisan command or queue.
     *
     * @return array{translated: int, failed: int, cached: int, total: int}
     */
    public function translateLocale(string $locale, bool $force = false): array
    {
        $source = $this->getSourceStrings();
        $existing = $force ? [] : $this->loadCache($locale);
        $stats = ['translated' => 0, 'failed' => 0, 'cached' => count($existing), 'total' => count($source)];

        $toTranslate = [];
        foreach ($source as $key => $value) {
            if (! $force && isset($existing[$key]) && $existing[$key] !== '') {
                continue;
            }
            $toTranslate[$key] = $value;
        }

        if (empty($toTranslate)) {
            return $stats;
        }

        $translations = $this->batchTranslateWithFallback(
            array_values($toTranslate),
            'en',
            $locale
        );

        foreach ($toTranslate as $key => $originalText) {
            $translated = $translations[$originalText] ?? null;
            if ($translated && $translated !== $originalText) {
                $existing[$key] = $translated;
                $stats['translated']++;
            } else {
                $stats['failed']++;
            }
        }

        $this->saveCache($locale, $existing);

        return $stats;
    }

    /**
     * Warm the cache for all supported locales.
     *
     * @return array<string, array{translated: int, failed: int, cached: int, total: int}>
     */
    public function warmAll(bool $force = false): array
    {
        $locales = config('locale.supported', ['en']);
        $results = [];

        foreach ($locales as $locale) {
            if ($locale === 'en') {
                continue;
            }
            $results[$locale] = $this->translateLocale($locale, $force);
        }

        return $results;
    }

    /**
     * Translate a single string on-demand.
     */
    public function translate(string $text, string $from = 'en', ?string $to = null): string
    {
        $to = $to ?? App::getLocale();

        if ($from === $to) {
            return $text;
        }

        // Check cache first
        $cached = $this->loadCache($to);
        if (isset($cached[$text])) {
            return $cached[$text];
        }

        // Translate via API
        $result = $this->translateWithFallback($text, $from, $to);

        if ($result) {
            // Append to cache
            $cached[$text] = $result;
            $this->saveCache($to, $cached);

            return $result;
        }

        return $text;
    }

    /**
     * Get English source strings (the master key set).
     *
     * @return array<string, string>
     */
    public function getSourceStrings(): array
    {
        $path = "{$this->sourcePath}/en.json";
        if (! file_exists($path)) {
            return [];
        }

        $content = json_decode(file_get_contents($path), true);

        return is_array($content) ? $content : [];
    }

    /**
     * Translate a single text using drivers with fallback.
     */
    protected function translateWithFallback(string $text, string $from, string $to): ?string
    {
        foreach ($this->drivers as $driver) {
            if (! $driver->supportsLocale($to)) {
                continue;
            }

            $result = $driver->translate($text, $from, $to);

            if ($result !== null) {
                return $result;
            }

            Log::debug("Translation driver [{$driver->name()}] failed for '{$text}', trying next driver.");
        }

        return null;
    }

    /**
     * Batch translate using drivers with fallback.
     *
     * @param  array<string>  $texts
     * @return array<string, string|null>
     */
    protected function batchTranslateWithFallback(array $texts, string $from, string $to): array
    {
        $results = array_fill_keys($texts, null);
        $remaining = $texts;

        foreach ($this->drivers as $driver) {
            if (empty($remaining) || ! $driver->supportsLocale($to)) {
                continue;
            }

            $batchResult = $driver->translateBatch($remaining, $from, $to);

            $stillMissing = [];
            foreach ($remaining as $text) {
                if (isset($batchResult[$text]) && $batchResult[$text] !== null) {
                    $results[$text] = $batchResult[$text];
                } else {
                    $stillMissing[] = $text;
                }
            }

            $remaining = $stillMissing;

            if (empty($remaining)) {
                break;
            }

            Log::debug("Driver [{$driver->name()}] left " . count($remaining) . " strings untranslated, trying next.");
        }

        return $results;
    }

    /**
     * Load cached translations for a locale.
     *
     * @return array<string, string>
     */
    protected function loadCache(string $locale): array
    {
        $path = "{$this->cachePath}/{$locale}.json";
        if (! file_exists($path)) {
            return [];
        }

        $content = json_decode(file_get_contents($path), true);

        return is_array($content) ? $content : [];
    }

    /**
     * Load pre-seeded translations from the package's lang directory.
     *
     * @return array<string, string>
     */
    protected function loadPreSeeded(string $locale): array
    {
        $path = "{$this->sourcePath}/{$locale}.json";
        if (! file_exists($path)) {
            return [];
        }

        $content = json_decode(file_get_contents($path), true);

        return is_array($content) ? $content : [];
    }

    /**
     * Save translations to the file cache.
     */
    protected function saveCache(string $locale, array $translations): void
    {
        if (! File::isDirectory($this->cachePath)) {
            File::makeDirectory($this->cachePath, 0755, true);
        }

        file_put_contents(
            "{$this->cachePath}/{$locale}.json",
            json_encode($translations, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
        );
    }

    /**
     * Clear the cache for a specific locale or all locales.
     */
    public function clearCache(?string $locale = null): void
    {
        if ($locale) {
            $path = "{$this->cachePath}/{$locale}.json";
            if (file_exists($path)) {
                unlink($path);
            }
        } elseif (File::isDirectory($this->cachePath)) {
            File::cleanDirectory($this->cachePath);
        }
    }

    /**
     * Get cache status for all supported locales.
     *
     * @return array<string, array{cached: bool, count: int, source_count: int}>
     */
    public function getCacheStatus(): array
    {
        $sourceCount = count($this->getSourceStrings());
        $locales = config('locale.supported', ['en']);
        $status = [];

        foreach ($locales as $locale) {
            if ($locale === 'en') {
                $status[$locale] = ['cached' => true, 'count' => $sourceCount, 'source_count' => $sourceCount];

                continue;
            }

            $cached = $this->loadCache($locale);
            $status[$locale] = [
                'cached' => ! empty($cached),
                'count' => count($cached),
                'source_count' => $sourceCount,
            ];
        }

        return $status;
    }
}
