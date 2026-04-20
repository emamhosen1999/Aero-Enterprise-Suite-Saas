<?php

namespace Aero\I18n\Services;

use Aero\I18n\TranslationEngine;
use Illuminate\Support\Facades\App;

class TranslationService
{
    public function __construct(
        protected TranslationEngine $engine,
    ) {}

    /**
     * Get translation dictionary for the current locale.
     *
     * On first request for a non-English locale, the engine auto-translates
     * via the free API and caches the result. Subsequent requests are instant.
     *
     * @return array<string, string>
     */
    public function getTranslations(?string $locale = null): array
    {
        return $this->engine->getTranslations($locale);
    }

    /**
     * Translate a single string on-demand.
     */
    public function translate(string $text, string $from = 'en', ?string $to = null): string
    {
        return $this->engine->translate($text, $from, $to);
    }

    /**
     * Get the Inertia shared props for i18n.
     *
     * Call this from HandleInertiaRequests::share() to provide
     * all locale data to the frontend in a single place.
     *
     * @return array<string, mixed>
     */
    public function getSharedProps(): array
    {
        return [
            'locale' => App::getLocale(),
            'supportedLocales' => config('locale.supported', ['en']),
            'localeMeta' => config('locale.meta', []),
            'translations' => fn () => $this->getTranslations(),
        ];
    }
}
