<?php

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Supported locales for the application.
     *
     * @var array<string>
     */
    protected array $supportedLocales = ['en', 'bn', 'ar', 'es', 'fr', 'de', 'hi', 'zh-CN', 'zh-TW'];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->determineLocale($request);

        App::setLocale($locale);

        // Store in session for persistence
        Session::put('locale', $locale);

        return $next($request);
    }

    /**
     * Determine the locale from various sources in priority order.
     */
    protected function determineLocale(Request $request): string
    {
        // 1. Check query parameter (for immediate switching)
        if ($request->has('locale') && $this->isSupported($request->query('locale'))) {
            return $request->query('locale');
        }

        // 2. Check session
        if (Session::has('locale') && $this->isSupported(Session::get('locale'))) {
            return Session::get('locale');
        }

        // 3. Check cookie
        if ($request->hasCookie('locale') && $this->isSupported($request->cookie('locale'))) {
            return $request->cookie('locale');
        }

        // 4. Check authenticated user preference
        if ($request->user() && $request->user()->locale && $this->isSupported($request->user()->locale)) {
            return $request->user()->locale;
        }

        // 5. Check browser Accept-Language header
        $browserLocale = $this->getPreferredLocaleFromHeader($request);
        if ($browserLocale && $this->isSupported($browserLocale)) {
            return $browserLocale;
        }

        // 6. Fall back to default locale
        return config('app.locale', 'en');
    }

    /**
     * Check if a locale is supported.
     */
    protected function isSupported(?string $locale): bool
    {
        return $locale && in_array($locale, $this->supportedLocales, true);
    }

    /**
     * Get the preferred locale from the Accept-Language header.
     */
    protected function getPreferredLocaleFromHeader(Request $request): ?string
    {
        $acceptLanguage = $request->header('Accept-Language');

        if (! $acceptLanguage) {
            return null;
        }

        // Parse Accept-Language header (e.g., "en-US,en;q=0.9,bn;q=0.8")
        $languages = [];
        foreach (explode(',', $acceptLanguage) as $part) {
            $part = trim($part);
            $priority = 1.0;

            if (strpos($part, ';q=') !== false) {
                [$lang, $q] = explode(';q=', $part);
                $priority = (float) $q;
            } else {
                $lang = $part;
            }

            // Extract base language (e.g., "en" from "en-US")
            $baseLang = strtolower(substr($lang, 0, 2));
            $languages[$baseLang] = $priority;
        }

        // Sort by priority
        arsort($languages);

        // Return the first supported language
        foreach (array_keys($languages) as $lang) {
            if ($this->isSupported($lang)) {
                return $lang;
            }
        }

        return null;
    }

    /**
     * Get the list of supported locales.
     */
    public static function getSupportedLocales(): array
    {
        return (new static)->supportedLocales;
    }
}
