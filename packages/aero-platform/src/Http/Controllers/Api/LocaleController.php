<?php

namespace Aero\Platform\Http\Controllers\Api;

use Aero\Platform\Http\Controllers\Controller;
use App\Http\Middleware\SetLocale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
            'fallback_locale' => config('app.fallback_locale'),
        ]);
    }

    /**
     * Switch the application locale.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', 'in:'.implode(',', SetLocale::getSupportedLocales())],
        ]);

        $locale = $validated['locale'];

        // Update session
        Session::put('locale', $locale);

        // Update user preference if authenticated
        if ($user = $request->user()) {
            // Only update if user model has locale column
            if (in_array('locale', $user->getFillable(), true)) {
                $user->update(['locale' => $locale]);
            }
        }

        // Set application locale
        App::setLocale($locale);

        // Create cookie for persistence (30 days)
        $cookie = Cookie::make('locale', $locale, 60 * 24 * 30);

        return response()
            ->json([
                'success' => true,
                'locale' => $locale,
                'message' => __('common.messages.update_success'),
            ])
            ->withCookie($cookie);
    }

    /**
     * Get translations for a specific namespace.
     */
    public function translations(Request $request, ?string $namespace = null): JsonResponse
    {
        $locale = App::getLocale();

        if ($namespace) {
            // Return specific namespace translations
            $translations = trans($namespace);
        } else {
            // Return all translations
            $translations = $this->getAllTranslations($locale);
        }

        return response()->json([
            'locale' => $locale,
            'translations' => $translations,
        ]);
    }

    /**
     * Get all translations for a locale.
     */
    protected function getAllTranslations(string $locale): array
    {
        $translations = [];

        // Get PHP translation files
        $langPath = lang_path($locale);
        if (is_dir($langPath)) {
            foreach (glob("{$langPath}/*.php") as $file) {
                $namespace = basename($file, '.php');
                $translations[$namespace] = require $file;
            }
        }

        // Get JSON translations
        $jsonPath = lang_path("{$locale}.json");
        if (file_exists($jsonPath)) {
            $jsonTranslations = json_decode(file_get_contents($jsonPath), true);
            if ($jsonTranslations) {
                $translations = array_merge($translations, $jsonTranslations);
            }
        }

        return $translations;
    }
}
