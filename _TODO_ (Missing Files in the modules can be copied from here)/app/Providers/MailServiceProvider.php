<?php

namespace App\Providers;

use App\Services\Shared\MailService;
use Illuminate\Support\ServiceProvider;

/**
 * MailServiceProvider
 *
 * Registers mail configuration services and applies email settings from database
 * before notifications are sent. Supports both:
 * - Platform Admin: Uses PlatformSetting
 * - Tenants: Uses SystemSetting
 */
class MailServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register the MailService as a singleton
        $this->app->singleton(MailService::class, function ($app) {
            return new MailService;
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Note: MailService now handles context detection automatically
        // No need to apply settings before sending - it's handled in sendMail()
    }
}
