<?php

namespace Aero\I18n\Contracts;

interface TranslationDriverInterface
{
    /**
     * Translate a single string.
     *
     * @return string|null Translated text, or null on failure
     */
    public function translate(string $text, string $from, string $to): ?string;

    /**
     * Translate a batch of strings.
     *
     * @param  array<string>  $texts
     * @return array<string, string|null> Map of original => translated
     */
    public function translateBatch(array $texts, string $from, string $to): array;

    /**
     * Get the driver name for logging/debugging.
     */
    public function name(): string;

    /**
     * Check if the driver supports a given locale.
     */
    public function supportsLocale(string $locale): bool;
}
