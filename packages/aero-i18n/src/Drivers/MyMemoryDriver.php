<?php

namespace Aero\I18n\Drivers;

use Aero\I18n\Contracts\TranslationDriverInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * MyMemory Translation API Driver
 *
 * Free tier: 5000 words/day (anonymous), 30000 with key.
 * Very reliable public API that has been running since 2009.
 * Combines machine translation with human translation memory.
 *
 * @see https://mymemory.translated.net/doc/spec.php
 */
class MyMemoryDriver implements TranslationDriverInterface
{
    protected int $timeout;

    protected ?string $email;

    /**
     * Locale mapping: our codes → MyMemory language pairs.
     *
     * @var array<string, string>
     */
    protected array $localeMap = [
        'en' => 'en',
        'bn' => 'bn',
        'ar' => 'ar',
        'es' => 'es',
        'fr' => 'fr',
        'de' => 'de',
        'hi' => 'hi',
        'zh-CN' => 'zh-CN',
        'zh-TW' => 'zh-TW',
        'pt' => 'pt',
        'ru' => 'ru',
        'ja' => 'ja',
        'ko' => 'ko',
        'it' => 'it',
        'nl' => 'nl',
        'tr' => 'tr',
        'pl' => 'pl',
        'vi' => 'vi',
        'th' => 'th',
        'id' => 'id',
    ];

    public function __construct()
    {
        $this->timeout = config('locale.translation_api.timeout', 30);
        $this->email = config('locale.translation_api.mymemory.email');
    }

    public function name(): string
    {
        return 'mymemory';
    }

    public function supportsLocale(string $locale): bool
    {
        return isset($this->localeMap[$locale]);
    }

    public function translate(string $text, string $from, string $to): ?string
    {
        $result = $this->translateBatch([$text], $from, $to);

        return $result[$text] ?? null;
    }

    public function translateBatch(array $texts, string $from, string $to): array
    {
        $fromCode = $this->localeMap[$from] ?? $from;
        $toCode = $this->localeMap[$to] ?? $to;
        $langpair = "{$fromCode}|{$toCode}";

        $results = [];

        foreach ($texts as $text) {
            try {
                $params = [
                    'q' => $text,
                    'langpair' => $langpair,
                ];

                if ($this->email) {
                    $params['de'] = $this->email;
                }

                $response = Http::timeout($this->timeout)
                    ->get('https://api.mymemory.translated.net/get', $params);

                if ($response->successful()) {
                    $data = $response->json();
                    $translated = $data['responseData']['translatedText'] ?? null;

                    // MyMemory returns the original text in CAPS when it fails
                    if ($translated && $translated !== mb_strtoupper($text)) {
                        $results[$text] = $translated;
                    } else {
                        $results[$text] = null;
                    }
                } else {
                    Log::debug("MyMemory API error for '{$text}': " . $response->status());
                    $results[$text] = null;
                }
            } catch (\Throwable $e) {
                Log::debug("MyMemory exception for '{$text}': " . $e->getMessage());
                $results[$text] = null;
            }
        }

        return $results;
    }
}
