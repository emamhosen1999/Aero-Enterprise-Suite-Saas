<?php

namespace App\Services\Mail;

use App\Models\PlatformSetting;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mailer\Transport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

/**
 * RuntimeMailConfigService
 *
 * Unified mail service that handles email sending for both platform and tenant contexts.
 * Uses Symfony Mailer directly to properly handle SSL certificates on shared hosting.
 *
 * Features:
 * - Platform Admin: Uses PlatformSetting (landlord context)
 * - Tenants: Uses SystemSetting (tenant context)
 * - Supports verify_peer=false for shared hosting with mismatched SSL certificates
 * - HTML and plain text email support
 */
class RuntimeMailConfigService
{
    /**
     * Send an email using the appropriate context settings (platform or tenant).
     *
     * @param  string|array  $to  Recipient email(s)
     * @param  string  $subject  Email subject
     * @param  string  $htmlBody  HTML content
     * @param  string|null  $textBody  Plain text content (optional)
     * @param  array  $options  Additional options (cc, bcc, replyTo, attachments)
     * @return array{success: bool, message: string}
     */
    public function send(string|array $to, string $subject, string $htmlBody, ?string $textBody = null, array $options = []): array
    {
        try {
            // Get settings based on context
            $isTenant = $this->isTenantContext();
            $config = $isTenant ? $this->getTenantMailConfig() : $this->getPlatformMailConfig();

            if (! $config['configured']) {
                // Fall back to .env settings
                $config = $this->getEnvMailConfig();
            }

            // Use Symfony Mailer for SMTP
            if ($config['driver'] === 'smtp') {
                return $this->sendWithSymfonyMailer($to, $subject, $htmlBody, $textBody, $config, $options);
            }

            // For log driver, use Laravel's Mail facade
            if ($config['driver'] === 'log') {
                return $this->sendWithLogDriver($to, $subject, $htmlBody, $config);
            }

            return [
                'success' => false,
                'message' => 'Unsupported mail driver: '.$config['driver'],
            ];
        } catch (\Throwable $e) {
            Log::error('Failed to send email', [
                'to' => $to,
                'subject' => $subject,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to send email: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Send email using Symfony Mailer (handles SSL/TLS properly).
     */
    protected function sendWithSymfonyMailer(
        string|array $to,
        string $subject,
        string $htmlBody,
        ?string $textBody,
        array $config,
        array $options = []
    ): array {
        $host = $config['host'];
        $port = $config['port'];
        $username = $config['username'];
        $password = $config['password'];
        $encryption = $config['encryption'];
        $verifyPeer = $config['verify_peer'];
        $fromAddress = $config['from_address'];
        $fromName = $config['from_name'];

        // Build DSN based on encryption type
        $scheme = $encryption === 'ssl' ? 'smtps' : 'smtp';
        $dsnParams = $verifyPeer ? '' : '?verify_peer=0';

        $dsn = sprintf(
            '%s://%s:%s@%s:%d%s',
            $scheme,
            urlencode($username),
            urlencode($password),
            $host,
            $port,
            $dsnParams
        );

        $transport = Transport::fromDsn($dsn);
        $mailer = new Mailer($transport);

        // Build the email
        $email = (new Email)
            ->from(new Address($fromAddress, $fromName))
            ->subject($subject);

        // Add recipients
        $recipients = is_array($to) ? $to : [$to];
        foreach ($recipients as $recipient) {
            $email->addTo($recipient);
        }

        // Add content
        $email->html($htmlBody);
        if ($textBody) {
            $email->text($textBody);
        }

        // Add optional CC
        if (! empty($options['cc'])) {
            $ccList = is_array($options['cc']) ? $options['cc'] : [$options['cc']];
            foreach ($ccList as $cc) {
                $email->addCc($cc);
            }
        }

        // Add optional BCC
        if (! empty($options['bcc'])) {
            $bccList = is_array($options['bcc']) ? $options['bcc'] : [$options['bcc']];
            foreach ($bccList as $bcc) {
                $email->addBcc($bcc);
            }
        }

        // Add optional Reply-To
        if (! empty($options['replyTo'])) {
            $email->replyTo($options['replyTo']);
        }

        // Send the email
        $mailer->send($email);

        Log::info('Email sent successfully', [
            'to' => $to,
            'subject' => $subject,
            'host' => $host,
            'port' => $port,
            'encryption' => $encryption,
            'context' => $this->isTenantContext() ? 'tenant' : 'platform',
        ]);

        return [
            'success' => true,
            'message' => 'Email sent successfully',
        ];
    }

    /**
     * Send email using log driver (for development/testing).
     */
    protected function sendWithLogDriver(string|array $to, string $subject, string $htmlBody, array $config): array
    {
        $this->applyConfiguration([
            'driver' => 'log',
            'from_address' => $config['from_address'],
            'from_name' => $config['from_name'],
        ], null, 'log');

        $recipients = is_array($to) ? implode(', ', $to) : $to;

        \Illuminate\Support\Facades\Mail::html($htmlBody, function ($message) use ($to, $subject, $config) {
            $message->to($to)
                ->subject($subject)
                ->from($config['from_address'], $config['from_name']);
        });

        Log::debug('Email logged (log driver)', [
            'to' => $recipients,
            'subject' => $subject,
        ]);

        return [
            'success' => true,
            'message' => 'Email logged successfully (log driver)',
        ];
    }

    /**
     * Get platform mail configuration.
     *
     * @return array{configured: bool, driver: string, host: string, port: int, username: string, password: string, encryption: string, verify_peer: bool, from_address: string, from_name: string}
     */
    public function getPlatformMailConfig(): array
    {
        try {
            $settings = PlatformSetting::current();
            $emailSettings = $settings->email_settings ?? [];

            if (empty($emailSettings) || empty($emailSettings['driver'])) {
                return ['configured' => false] + $this->getEnvMailConfig();
            }

            return [
                'configured' => true,
                'driver' => $emailSettings['driver'] ?? 'smtp',
                'host' => $emailSettings['host'] ?? '127.0.0.1',
                'port' => (int) ($emailSettings['port'] ?? 587),
                'username' => $emailSettings['username'] ?? '',
                'password' => $settings->getEmailPassword() ?? '',
                'encryption' => $emailSettings['encryption'] ?? 'tls',
                'verify_peer' => $emailSettings['verify_peer'] ?? true,
                'from_address' => $emailSettings['from_address'] ?? config('mail.from.address'),
                'from_name' => $emailSettings['from_name'] ?? config('mail.from.name', config('app.name')),
            ];
        } catch (\Throwable $e) {
            Log::error('Failed to get platform mail config', ['error' => $e->getMessage()]);

            return ['configured' => false] + $this->getEnvMailConfig();
        }
    }

    /**
     * Get tenant mail configuration.
     *
     * @return array{configured: bool, driver: string, host: string, port: int, username: string, password: string, encryption: string, verify_peer: bool, from_address: string, from_name: string}
     */
    public function getTenantMailConfig(): array
    {
        try {
            $settings = SystemSetting::firstWhere('slug', SystemSetting::DEFAULT_SLUG);

            if (! $settings) {
                return ['configured' => false] + $this->getPlatformMailConfig();
            }

            $emailSettings = $settings->email_settings ?? [];

            if (empty($emailSettings) || empty($emailSettings['driver'])) {
                // Fall back to platform settings for tenants without custom mail config
                return ['configured' => false] + $this->getPlatformMailConfig();
            }

            return [
                'configured' => true,
                'driver' => $emailSettings['driver'] ?? 'smtp',
                'host' => $emailSettings['host'] ?? '127.0.0.1',
                'port' => (int) ($emailSettings['port'] ?? 587),
                'username' => $emailSettings['username'] ?? '',
                'password' => $settings->getEmailPassword() ?? '',
                'encryption' => $emailSettings['encryption'] ?? 'tls',
                'verify_peer' => $emailSettings['verify_peer'] ?? true,
                'from_address' => $emailSettings['from_address'] ?? config('mail.from.address'),
                'from_name' => $emailSettings['from_name'] ?? config('mail.from.name', config('app.name')),
            ];
        } catch (\Throwable $e) {
            Log::error('Failed to get tenant mail config', ['error' => $e->getMessage()]);

            return ['configured' => false] + $this->getPlatformMailConfig();
        }
    }

    /**
     * Get mail configuration from .env file.
     */
    protected function getEnvMailConfig(): array
    {
        return [
            'configured' => false,
            'driver' => config('mail.default', 'smtp'),
            'host' => config('mail.mailers.smtp.host', '127.0.0.1'),
            'port' => (int) config('mail.mailers.smtp.port', 587),
            'username' => config('mail.mailers.smtp.username', ''),
            'password' => config('mail.mailers.smtp.password', ''),
            'encryption' => config('mail.mailers.smtp.encryption', 'tls'),
            'verify_peer' => true,
            'from_address' => config('mail.from.address'),
            'from_name' => config('mail.from.name', config('app.name')),
        ];
    }

    /**
     * Check if we're in a tenant context.
     */
    protected function isTenantContext(): bool
    {
        return app()->bound('currentTenant') && tenancy()->initialized;
    }

    // =========================================================================
    // BACKWARD COMPATIBILITY METHODS
    // These methods maintain compatibility with existing code
    // =========================================================================

    /**
     * Apply email settings to Laravel's mail configuration.
     * Automatically detects context (platform or tenant) and loads appropriate settings.
     *
     * @deprecated Use send() method instead for reliable email delivery
     *
     * @return bool True if settings were applied, false if using defaults
     */
    public function applyMailSettings(): bool
    {
        try {
            if ($this->isTenantContext()) {
                return $this->applyTenantMailSettings();
            }

            return $this->applyPlatformMailSettings();
        } catch (\Throwable $e) {
            Log::error('Failed to apply mail settings', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * Apply platform email settings to Laravel config.
     *
     * @deprecated Use send() method instead
     */
    public function applyPlatformMailSettings(): bool
    {
        $config = $this->getPlatformMailConfig();
        if (! $config['configured']) {
            return false;
        }

        $this->applyConfiguration($config, $config['password'], 'platform');
        Log::info('Platform mail settings applied', [
            'driver' => $config['driver'],
            'host' => $config['host'],
            'from' => $config['from_address'],
        ]);

        return true;
    }

    /**
     * Apply tenant email settings to Laravel config.
     *
     * @deprecated Use send() method instead
     */
    public function applyTenantMailSettings(): bool
    {
        $config = $this->getTenantMailConfig();
        if (! $config['configured']) {
            return false;
        }

        $this->applyConfiguration($config, $config['password'], 'tenant');
        Log::info('Tenant mail settings applied', [
            'tenant_id' => tenant('id'),
            'driver' => $config['driver'],
            'host' => $config['host'],
            'from' => $config['from_address'],
        ]);

        return true;
    }

    /**
     * Apply mail configuration to Laravel config.
     */
    protected function applyConfiguration(array $emailSettings, ?string $password, string $context): void
    {
        $driver = $emailSettings['driver'] ?? 'smtp';
        Config::set('mail.default', $driver);

        if ($driver === 'smtp') {
            $smtpConfig = [
                'transport' => 'smtp',
                'host' => $emailSettings['host'] ?? '127.0.0.1',
                'port' => (int) ($emailSettings['port'] ?? 587),
                'encryption' => $emailSettings['encryption'] ?? 'tls',
                'username' => $emailSettings['username'] ?? null,
                'password' => $password,
                'timeout' => null,
                'local_domain' => parse_url(config('app.url', 'http://localhost'), PHP_URL_HOST),
            ];

            if (isset($emailSettings['verify_peer']) && $emailSettings['verify_peer'] === false) {
                $smtpConfig['stream'] = [
                    'ssl' => [
                        'allow_self_signed' => true,
                        'verify_peer' => false,
                        'verify_peer_name' => false,
                    ],
                ];
            }

            Config::set('mail.mailers.smtp', $smtpConfig);
        } elseif ($driver === 'log') {
            Config::set('mail.mailers.log', [
                'transport' => 'log',
                'channel' => env('MAIL_LOG_CHANNEL'),
            ]);
        }

        if (! empty($emailSettings['from_address'])) {
            Config::set('mail.from.address', $emailSettings['from_address']);
        }
        if (! empty($emailSettings['from_name'])) {
            Config::set('mail.from.name', $emailSettings['from_name']);
        }
    }

    /**
     * Test the current mail configuration by sending a test email.
     *
     * @param  string  $to  Recipient email address
     * @param  string|null  $subject  Optional custom subject
     * @return array Result with success status and message
     */
    public function sendTestEmail(string $to, ?string $subject = null): array
    {
        $subject = $subject ?? 'Test Email from '.config('app.name');
        $config = $this->isTenantContext() ? $this->getTenantMailConfig() : $this->getPlatformMailConfig();

        $htmlBody = '
            <h2>Test Email</h2>
            <p>This is a test email sent from your application.</p>
            <p>If you received this, your email configuration is working correctly.</p>
            <hr>
            <p><strong>Configuration:</strong></p>
            <ul>
                <li>Host: '.$config['host'].':'.$config['port'].'</li>
                <li>Encryption: '.$config['encryption'].'</li>
                <li>From: '.$config['from_address'].'</li>
                <li>Context: '.($this->isTenantContext() ? 'Tenant' : 'Platform').'</li>
            </ul>
        ';

        $result = $this->send($to, $subject, $htmlBody);
        $result['using_database_settings'] = $config['configured'];

        return $result;
    }
}
