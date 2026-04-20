<?php

namespace Aero\I18n;

use Aero\I18n\Console\WarmTranslationsCommand;
use Aero\I18n\Services\TranslationService;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AeroI18nServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/locale.php', 'locale');

        $this->app->singleton(TranslationEngine::class);

        $this->app->singleton(TranslationService::class, function ($app) {
            return new TranslationService($app->make(TranslationEngine::class));
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->loadJsonTranslationsFrom(__DIR__ . '/../resources/lang');

        Route::middleware(['web'])
            ->group(__DIR__ . '/../routes/web.php');

        if ($this->app->runningInConsole()) {
            $this->commands([
                WarmTranslationsCommand::class,
            ]);

            $this->publishes([
                __DIR__ . '/../config/locale.php' => config_path('locale.php'),
            ], 'aero-i18n-config');

            $this->publishes([
                __DIR__ . '/../resources/lang' => lang_path(),
            ], 'aero-i18n-lang');
        }
    }
}
