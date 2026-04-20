<?php

namespace Aero\I18n\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->determineLocale($request);

        App::setLocale($locale);

        Session::put('locale', $locale);

        return $next($request);
    }

    /**
     * Determine the locale from various sources in priority order.
     */
    protected function determineLocale(Request $request): string
    {
        // 1. Query parameter (immediate switching)
        if ($request->has('locale') && $this->isSupported($request->query('locale'))) {
            return $request->query('locale');
        }

        // 2. Session
        if (Session::has('locale') && $this->isSupported(Session::get('locale'))) {
            return Session::get('locale');
        }

        // 3. Cookie
        if ($request->hasCookie('locale') && $this->isSupported($request->cookie('locale'))) {
            return $request->cookie('locale');
        }

        // 4. Authenticated user preference
        if ($request->user() && $request->user()->locale && $this->isSupported($request->user()->locale)) {
            return $request->user()->locale;
        }

        // 5. Browser Accept-Language header
        $browserLocale = $this->getPreferredLocaleFromHeader($request);
        if ($browserLocale && $this->isSupported($browserLocale)) {
            return $browserLocale;
        }

        // 6. Default
        return config('locale.default') ?? config('app.locale', 'en');
    }

    /**
     * Check if a locale is in the supported list.
     */
    protected function isSupported(?string $locale): bool
    {
        return $locale && in_array($locale, static::getSupportedLocales(), true);
    }

    /**
     * Parse the Accept-Language header and return the first supported locale.
     */
    protected function getPreferredLocaleFromHeader(Request $request): ?string
    {
        $acceptLanguage = $request->header('Accept-Language');

        if (! $acceptLanguage) {
            return null;
        }

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

            $baseLang = strtolower(substr($lang, 0, 2));
            $languages[$baseLang] = $priority;
        }

        arsort($languages);

        foreach (array_keys($languages) as $lang) {
            if ($this->isSupported($lang)) {
                return $lang;
            }
        }

        return null;
    }

    /**
     * Get the list of supported locales from config.
     */
    public static function getSupportedLocales(): array
    {
        return config('locale.supported', ['en']);
    }

    /**
     * Get locale metadata from config.
     */
    public static function getLocaleMeta(): array
    {
        return config('locale.meta', []);
    }
}
