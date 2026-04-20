<?php

namespace Aero\I18n\Http\Controllers;

use Aero\I18n\Http\Middleware\SetLocale;
use Aero\I18n\TranslationEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Session;

class LocaleController extends Controller
{
    /**
     * Get current locale and available locales.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'locale' => App::getLocale(),
            'supported_locales' => SetLocale::getSupportedLocales(),
            'locale_meta' => SetLocale::getLocaleMeta(),
            'fallback_locale' => config('app.fallback_locale'),
        ]);
    }

    /**
     * Switch the application locale.
     *
     * Persists preference in session + cookie only (no DB column needed).
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', 'in:' . implode(',', SetLocale::getSupportedLocales())],
        ]);

        $locale = $validated['locale'];

        Session::put('locale', $locale);
        App::setLocale($locale);

        $cookie = Cookie::make('locale', $locale, 60 * 24 * 30);

        return response()
            ->json([
                'success' => true,
                'locale' => $locale,
                'message' => __('Language updated successfully'),
            ])
            ->withCookie($cookie);
    }

    /**
     * Get translations for a specific namespace or all.
     */
    public function translations(Request $request, ?string $namespace = null): JsonResponse
    {
        $locale = App::getLocale();

        if ($namespace) {
            $translations = trans($namespace);
        } else {
            $translations = app(TranslationEngine::class)->getTranslations($locale);
        }

        return response()->json([
            'locale' => $locale,
            'translations' => $translations,
        ]);
    }
}
