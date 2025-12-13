<?php

namespace Aero\Core\Services\Notification;

use Aero\Core\Models\SystemSetting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * RuntimeSmsConfigService - SMS Configuration Service
 *
 * Applies SMS settings from database configuration at runtime.
 * Works in both SaaS mode (with aero-platform) and standalone mode.
 *
 * In standalone mode, only SystemSetting (tenant-level) configuration is used.
 */
class RuntimeSmsConfigService
{
    /**
     * Apply SMS settings from database configuration.
     * Auto-detects platform vs tenant context.
     */
    public function applySmsSettings(): void
    {
        // Check if Tenancy is available and initialized
        if (class_exists('Stancl\Tenancy\Facades\Tenancy')) {
            $tenancy = app('Stancl\Tenancy\Facades\Tenancy');
            if ($tenancy::initialized()) {
                $this->applyTenantSmsSettings();
                return;
            }
        }

        // Platform or standalone context
        $this->applyPlatformSmsSettings();
    }

    /**
     * Apply platform SMS settings.
     *
     * In standalone mode (without aero-platform), this method does nothing.
     */
    protected function applyPlatformSmsSettings(): void
    {
        // In standalone mode (no Platform), skip platform settings
        if (! class_exists('Aero\Platform\Models\PlatformSetting')) {
            Log::debug('RuntimeSmsConfigService: Platform not installed, skipping platform SMS settings');
            return;
        }

        try {
            $platformSettingClass = 'Aero\Platform\Models\PlatformSetting';
            $settings = $platformSettingClass::current();
            $smsSettings = $settings->sms_settings ?? [];

            if (empty($smsSettings)) {
                return;
            }

            $this->applyConfiguration($smsSettings);

            Log::info('Applied platform SMS settings', [
                'provider' => $smsSettings['provider'] ?? 'not_set',
            ]);
        } catch (Throwable $e) {
            Log::error('Failed to apply platform SMS settings', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Apply tenant SMS settings.
     */
    protected function applyTenantSmsSettings(): void
    {
        try {
            $settings = SystemSetting::current();
            $smsSettings = $settings->sms_settings ?? [];

            if (empty($smsSettings)) {
                return;
            }

            $this->applyConfiguration($smsSettings);

            Log::info('Applied tenant SMS settings', [
                'tenant' => function_exists('tenant') ? tenant('id') : 'standalone',
                'provider' => $smsSettings['provider'] ?? 'not_set',
            ]);
        } catch (Throwable $e) {
            Log::error('Failed to apply tenant SMS settings', [
                'tenant' => function_exists('tenant') ? (tenant('id') ?? 'unknown') : 'standalone',
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Apply SMS configuration to runtime config.
     */
    protected function applyConfiguration(array $settings): void
    {
        $provider = $settings['provider'] ?? 'log';

        // Set default provider
        Config::set('services.sms.default', $provider);

        // Apply provider-specific settings
        match ($provider) {
            'twilio' => $this->configureTwilio($settings),
            'bulksmsbd' => $this->configureBulkSmsBd($settings),
            'elitbuzz' => $this->configureElitBuzz($settings),
            'ssl_wireless' => $this->configureSslWireless($settings),
            default => null,
        };
    }

    /**
     * Configure Twilio settings.
     */
    protected function configureTwilio(array $settings): void
    {
        if (isset($settings['twilio_sid'])) {
            Config::set('services.twilio.sid', $settings['twilio_sid']);
        }

        if (isset($settings['twilio_token'])) {
            $token = $this->decryptIfNeeded($settings['twilio_token']);
            Config::set('services.twilio.token', $token);
        }

        if (isset($settings['twilio_from'])) {
            Config::set('services.twilio.from', $settings['twilio_from']);
        }
    }

    /**
     * Configure BulkSMS BD settings.
     */
    protected function configureBulkSmsBd(array $settings): void
    {
        if (isset($settings['bulksmsbd_api_key'])) {
            $apiKey = $this->decryptIfNeeded($settings['bulksmsbd_api_key']);
            Config::set('services.bulksmsbd.api_key', $apiKey);
        }

        if (isset($settings['bulksmsbd_sender_id'])) {
            Config::set('services.bulksmsbd.sender_id', $settings['bulksmsbd_sender_id']);
        }
    }

    /**
     * Configure ElitBuzz settings.
     */
    protected function configureElitBuzz(array $settings): void
    {
        if (isset($settings['elitbuzz_username'])) {
            Config::set('services.elitbuzz.username', $settings['elitbuzz_username']);
        }

        if (isset($settings['elitbuzz_password'])) {
            $password = $this->decryptIfNeeded($settings['elitbuzz_password']);
            Config::set('services.elitbuzz.password', $password);
        }

        if (isset($settings['elitbuzz_sender_id'])) {
            Config::set('services.elitbuzz.sender_id', $settings['elitbuzz_sender_id']);
        }
    }

    /**
     * Configure SSL Wireless settings.
     */
    protected function configureSslWireless(array $settings): void
    {
        if (isset($settings['sslwireless_api_token'])) {
            $token = $this->decryptIfNeeded($settings['sslwireless_api_token']);
            Config::set('services.sslwireless.api_token', $token);
        }

        if (isset($settings['sslwireless_sid'])) {
            Config::set('services.sslwireless.sid', $settings['sslwireless_sid']);
        }

        if (isset($settings['sslwireless_sender_id'])) {
            Config::set('services.sslwireless.sender_id', $settings['sslwireless_sender_id']);
        }
    }

    /**
     * Decrypt value if it's encrypted.
     */
    protected function decryptIfNeeded(string $value): string
    {
        try {
            // Try to decrypt - if it fails, assume it's not encrypted
            return Crypt::decryptString($value);
        } catch (Throwable) {
            return $value;
        }
    }

    /**
     * Send test SMS.
     */
    public function sendTestSms(string $to, ?string $provider = null): array
    {
        try {
            $smsService = app(SmsGatewayService::class);
            $message = 'Test SMS from '.config('app.name').' - '.now()->format('Y-m-d H:i:s');

            $result = $smsService->send($to, $message, $provider);

            return [
                'success' => true,
                'message' => 'Test SMS sent successfully',
                'result' => $result,
            ];
        } catch (Throwable $e) {
            Log::error('Test SMS failed', [
                'to' => $to,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to send test SMS: '.$e->getMessage(),
            ];
        }
    }
}
