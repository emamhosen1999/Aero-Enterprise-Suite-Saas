<?php

namespace App\Providers;

use App\Services\Mail\RuntimeMailConfigService;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Notifications\Events\NotificationSending;

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
        // Register the RuntimeMailConfigService as a singleton
        $this->app->singleton(RuntimeMailConfigService::class, function ($app) {
            return new RuntimeMailConfigService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Apply appropriate mail settings (platform or tenant) before any notification is sent
        Event::listen(NotificationSending::class, function (NotificationSending $event) {
            // Only apply for mail channel
            if ($event->channel === 'mail') {
                $mailService = app(RuntimeMailConfigService::class);
                $mailService->applyMailSettings(); // Unified method that auto-detects context
            }
        });
    }
}
