<?php

namespace Aero\Cms\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SetLocale
{
    /**
     * Supported locales
     */
    protected array $locales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh'];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): mixed
    {
        // Get locale from URL parameter or query string, default to config
        $locale = $request->route('locale') ?? $request->query('lang', config('app.locale', 'en'));

        // Validate locale
        if (!in_array($locale, $this->locales)) {
            $locale = config('app.locale', 'en');
        }

        // Set app locale
        app()->setLocale($locale);

        // Store in request for use in responses
        $request->attributes->set('locale', $locale);

        return $next($request);
    }
}
