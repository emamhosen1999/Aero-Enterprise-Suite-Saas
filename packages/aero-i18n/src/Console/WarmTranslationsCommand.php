<?php

namespace Aero\I18n\Console;

use Aero\I18n\TranslationEngine;
use Illuminate\Console\Command;

/**
 * Pre-translate all supported locales via API and cache results.
 *
 * Usage:
 *   php artisan i18n:warm              # Translate missing strings only
 *   php artisan i18n:warm --force      # Re-translate everything
 *   php artisan i18n:warm --locale=bn  # Translate a specific locale
 *   php artisan i18n:warm --status     # Show cache status
 */
class WarmTranslationsCommand extends Command
{
    protected $signature = 'i18n:warm
                            {--locale= : Translate a specific locale only}
                            {--force : Re-translate all strings, ignoring cache}
                            {--status : Show cache status without translating}
                            {--clear : Clear all cached translations}';

    protected $description = 'Pre-translate UI strings for all supported locales via translation API';

    public function handle(TranslationEngine $engine): int
    {
        if ($this->option('clear')) {
            $locale = $this->option('locale');
            $engine->clearCache($locale);
            $this->info($locale
                ? "Cleared cache for [{$locale}]."
                : 'Cleared all translation caches.'
            );

            return self::SUCCESS;
        }

        if ($this->option('status')) {
            return $this->showStatus($engine);
        }

        $force = (bool) $this->option('force');
        $targetLocale = $this->option('locale');

        if ($targetLocale) {
            return $this->translateOne($engine, $targetLocale, $force);
        }

        return $this->translateAll($engine, $force);
    }

    protected function showStatus(TranslationEngine $engine): int
    {
        $status = $engine->getCacheStatus();

        $rows = [];
        foreach ($status as $locale => $info) {
            $rows[] = [
                $locale,
                $info['cached'] ? '✅ Yes' : '❌ No',
                $info['count'],
                $info['source_count'],
                $info['source_count'] > 0
                    ? round(($info['count'] / $info['source_count']) * 100) . '%'
                    : '0%',
            ];
        }

        $this->table(
            ['Locale', 'Cached', 'Translated', 'Total Keys', 'Coverage'],
            $rows
        );

        return self::SUCCESS;
    }

    protected function translateOne(TranslationEngine $engine, string $locale, bool $force): int
    {
        $supported = config('locale.supported', ['en']);
        if (! in_array($locale, $supported, true)) {
            $this->error("Locale [{$locale}] is not in the supported locales list.");

            return self::FAILURE;
        }

        if ($locale === 'en') {
            $this->info('English is the source language — no translation needed.');

            return self::SUCCESS;
        }

        $this->info("Translating to [{$locale}]" . ($force ? ' (force mode)' : '') . '...');

        $stats = $engine->translateLocale($locale, $force);

        $this->table(
            ['Metric', 'Count'],
            [
                ['Total keys', $stats['total']],
                ['Already cached', $stats['cached']],
                ['Newly translated', $stats['translated']],
                ['Failed', $stats['failed']],
            ]
        );

        if ($stats['failed'] > 0) {
            $this->warn("{$stats['failed']} strings could not be translated. Run again to retry.");
        }

        $this->info("Done! Translations cached to storage/app/i18n/{$locale}.json");

        return self::SUCCESS;
    }

    protected function translateAll(TranslationEngine $engine, bool $force): int
    {
        $this->info('Warming translation cache for all supported locales...');
        $this->newLine();

        $results = $engine->warmAll($force);

        $rows = [];
        $totalTranslated = 0;
        $totalFailed = 0;

        foreach ($results as $locale => $stats) {
            $totalTranslated += $stats['translated'];
            $totalFailed += $stats['failed'];
            $rows[] = [
                $locale,
                $stats['total'],
                $stats['cached'],
                $stats['translated'],
                $stats['failed'],
            ];
        }

        $this->table(
            ['Locale', 'Total Keys', 'Cached', 'Translated', 'Failed'],
            $rows
        );

        $this->newLine();
        $this->info("Total: {$totalTranslated} strings translated, {$totalFailed} failed.");

        if ($totalFailed > 0) {
            $this->warn('Run again to retry failed translations.');
        }

        return self::SUCCESS;
    }
}
