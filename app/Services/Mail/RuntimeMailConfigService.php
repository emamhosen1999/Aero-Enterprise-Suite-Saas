<?php

namespace App\Services\Mail;

use App\Models\PlatformSetting;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

/**
 * RuntimeMailConfigService
 *
 * Dynamically configures Laravel's mail system using settings stored in the database.
 * Supports both:
 * - Platform Admin: Uses PlatformSetting (landlord context)
 * - Tenants: Uses SystemSetting (tenant context)
 * 
 * This allows admins to configure SMTP settings via UI without modifying .env files.
 */
class RuntimeMailConfigService
{
    /**
     * Apply email settings to Laravel's mail configuration.
     * Automatically detects context (platform or tenant) and loads appropriate settings.
     *
     * @return bool True if settings were applied, false if using defaults
     */
    public function applyMailSettings(): bool
    {
        try {
            // Determine context: are we in a tenant or platform admin?
            $isTenant = app()->bound('currentTenant') && tenancy()->initialized;
            
            if ($isTenant) {
                return $this->applyTenantMailSettings();
            } else {
                return $this->applyPlatformMailSettings();
            }
        } catch (\Throwable $e) {
            Log::error('Failed to apply mail settings', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }

    /**
     * Apply platform email settings (for landlord/platform admin context).
     *
     * @return bool True if settings were applied, false if using defaults
     */
    public function applyPlatformMailSettings(): bool
    {
        try {
            $settings = PlatformSetting::current();
            $emailSettings = $settings->email_settings ?? [];

            // If no email settings configured, use .env defaults
            if (empty($emailSettings) || empty($emailSettings['driver'])) {
                Log::debug('No platform email settings found, using .env configuration');
                return false;
            }

            // Get decrypted password
            $password = $settings->getEmailPassword();

            $this->applyConfiguration($emailSettings, $password, 'platform');

            Log::info('Platform mail settings applied', [
                'driver' => $emailSettings['driver'] ?? 'N/A',
                'host' => $emailSettings['host'] ?? 'N/A',
                'from' => $emailSettings['from_address'] ?? 'N/A',
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error('Failed to apply platform mail settings', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }

    /**
     * Apply tenant email settings (for tenant context).
     *
     * @return bool True if settings were applied, false if using defaults
     */
    public function applyTenantMailSettings(): bool
    {
        try {
            $settings = SystemSetting::firstWhere('slug', SystemSetting::DEFAULT_SLUG);
            
            if (!$settings) {
                Log::debug('No tenant system settings found, using .env configuration');
                return false;
            }

            $emailSettings = $settings->email_settings ?? [];

            // If no email settings configured, use .env defaults
            if (empty($emailSettings) || empty($emailSettings['driver'])) {
                Log::debug('No tenant email settings found, using .env configuration');
                return false;
            }

            // Get decrypted password
            $password = $settings->getEmailPassword();

            $this->applyConfiguration($emailSettings, $password, 'tenant');

            Log::info('Tenant mail settings applied', [
                'tenant_id' => tenant('id'),
                'driver' => $emailSettings['driver'] ?? 'N/A',
                'host' => $emailSettings['host'] ?? 'N/A',
                'from' => $emailSettings['from_address'] ?? 'N/A',
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error('Failed to apply tenant mail settings', [
                'tenant_id' => tenant('id'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }

    /**
     * Apply mail configuration to Laravel config.
     *
     * @param array $emailSettings Email settings array
     * @param string|null $password Decrypted password
     * @param string $context 'platform' or 'tenant'
     */
    protected function applyConfiguration(array $emailSettings, ?string $password, string $context): void
    {
        $driver = $emailSettings['driver'] ?? 'smtp';

        // Configure the mailer
        Config::set('mail.default', $driver);
        
        if ($driver === 'smtp') {
            Config::set('mail.mailers.smtp', [
                'transport' => 'smtp',
                'host' => $emailSettings['host'] ?? '127.0.0.1',
                'port' => (int) ($emailSettings['port'] ?? 587),
                'encryption' => $emailSettings['encryption'] ?? 'tls',
                'username' => $emailSettings['username'] ?? null,
                'password' => $password,
                'timeout' => null,
                'local_domain' => parse_url(config('app.url', 'http://localhost'), PHP_URL_HOST),
            ]);
        } elseif ($driver === 'log') {
            // Log driver configuration
            Config::set('mail.mailers.log', [
                'transport' => 'log',
                'channel' => env('MAIL_LOG_CHANNEL'),
            ]);
        }

        // Configure from address
        if (!empty($emailSettings['from_address'])) {
            Config::set('mail.from.address', $emailSettings['from_address']);
        }

        if (!empty($emailSettings['from_name'])) {
            Config::set('mail.from.name', $emailSettings['from_name']);
        }

        // Configure reply-to if set
        if (!empty($emailSettings['reply_to'])) {
            Config::set('mail.reply_to.address', $emailSettings['reply_to']);
            Config::set('mail.reply_to.name', $emailSettings['from_name'] ?? '');
        }
    }

    /**
     * Test the current mail configuration by sending a test email.
     *
     * @param string $to Recipient email address
     * @param string|null $subject Optional custom subject
     * @return array Result with success status and message
     */
    public function sendTestEmail(string $to, ?string $subject = null): array
    {
        try {
            // Apply appropriate settings based on context
            $applied = $this->applyMailSettings();

            $subject = $subject ?? 'Test Email from ' . config('app.name');
            
            // Get from address and name from current config
            $fromAddress = config('mail.from.address');
            $fromName = config('mail.from.name');

            \Illuminate\Support\Facades\Mail::raw(
                "This is a test email sent from your application.\n\n" .
                "If you received this, your email configuration is working correctly.\n\n" .
                "Configuration used: " . ($applied ? 'Database Settings' : '.env File Settings') . "\n" .
                "Driver: " . config('mail.default') . "\n" .
                "Host: " . config('mail.mailers.smtp.host', 'N/A') . "\n" .
                "From: " . $fromAddress,
                function ($message) use ($to, $subject, $fromAddress, $fromName) {
                    $message->to($to)
                        ->subject($subject)
                        ->from($fromAddress, $fromName);
                }
            );

            return [
                'success' => true,
                'message' => 'Test email sent successfully to ' . $to,
                'using_database_settings' => $applied,
            ];
        } catch (\Throwable $e) {
            Log::error('Test email failed', [
                'error' => $e->getMessage(),
                'to' => $to,
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to send test email: ' . $e->getMessage(),
                'using_database_settings' => false,
            ];
        }
    }
}
