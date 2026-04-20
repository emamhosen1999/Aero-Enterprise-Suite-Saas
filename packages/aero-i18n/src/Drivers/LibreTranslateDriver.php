<?php

namespace Aero\I18n\Drivers;

use Aero\I18n\Contracts\TranslationDriverInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * LibreTranslate API Driver
 *
 * Open-source, self-hostable translation API.
 * Public instances available at libretranslate.com or community mirrors.
 * No API key required for most public instances.
 *
 * @see https://github.com/LibreTranslate/LibreTranslate
 */
class LibreTranslateDriver implements TranslationDriverInterface
{
    protected string $baseUrl;

    protected ?string $apiKey;

    protected int $timeout;

    /**
     * Locale mapping: our codes → LibreTranslate codes.
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
        'zh-CN' => 'zh',
        'zh-TW' => 'zt',
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
        $this->baseUrl = rtrim(config('locale.translation_api.libretranslate.url', 'https://libretranslate.com'), '/');
        $this->apiKey = config('locale.translation_api.libretranslate.api_key');
        $this->timeout = config('locale.translation_api.timeout', 30);
    }

    public function name(): string
    {
        return 'libretranslate';
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

        $results = [];

        // LibreTranslate handles one text per request; chunk for efficiency
        $chunks = array_chunk($texts, 25, true);

        foreach ($chunks as $chunk) {
            foreach ($chunk as $text) {
                try {
                    $payload = [
                        'q' => $text,
                        'source' => $fromCode,
                        'target' => $toCode,
                        'format' => 'text',
                    ];

                    if ($this->apiKey) {
                        $payload['api_key'] = $this->apiKey;
                    }

                    $response = Http::timeout($this->timeout)
                        ->post("{$this->baseUrl}/translate", $payload);

                    if ($response->successful()) {
                        $data = $response->json();
                        $results[$text] = $data['translatedText'] ?? null;
                    } else {
                        Log::debug("LibreTranslate API error for '{$text}': " . $response->status());
                        $results[$text] = null;
                    }
                } catch (\Throwable $e) {
                    Log::debug("LibreTranslate exception for '{$text}': " . $e->getMessage());
                    $results[$text] = null;
                }
            }
        }

        return $results;
    }
}
