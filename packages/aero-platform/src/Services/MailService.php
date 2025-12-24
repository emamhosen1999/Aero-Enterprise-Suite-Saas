<?php

namespace Aero\Platform\Services;

use Aero\Platform\Models\PlatformSetting;
use Aero\Core\Models\SystemSetting;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mailer\Transport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

/**
 * MailService - Unified Email Service
 *
 * A single, unified mail service that handles all email sending for the application.
 * Uses Symfony Mailer directly for reliable SSL/TLS handling on shared hosting.
 * Merges functionality from both MailService and RuntimeMailConfigService.
 *
 * Features:
 * - Automatic context detection (platform vs tenant)
 * - SSL certificate verification bypass for shared hosting
 * - HTML and plain text email support
 * - CC, BCC, Reply-To, and attachments support
 * - Fallback to platform settings when tenant has no custom config
 * - Backward compatibility with RuntimeMailConfigService methods
 *
 * Usage:
 *   // Fluent API (new style):
 *   MailService::make()->to('user@example.com')->subject('Hello')->html('<p>Body</p>')->send();
 *
 *   // Direct sending (simple):
 *   app(MailService::class)->sendMail('user@example.com', 'Subject', '<h1>HTML Body</h1>');
 *
 *   // Test email:
 *   app(MailService::class)->sendTestEmail('user@example.com');
 */
class MailService
{
    protected array $to = [];

    protected array $cc = [];

    protected array $bcc = [];

    protected ?string $replyTo = null;

    protected string $subject = '';

    protected string $htmlBody = '';

    protected ?string $textBody = null;

    protected array $attachments = [];

    protected bool $forcePlatformContext = false;

    protected bool $shouldQueue = false;

    protected ?string $queue = null;

    protected ?int $delay = null;

    protected int $maxRetries = 3;

    protected array $templateVariables = [];

    protected ?string $templateName = null;

    /**
     * Create a new MailService instance (fluent builder pattern).
     */
    public static function make(): static
    {
        return new static;
    }

    /**
     * Queue the email for background sending.
     */
    public function queue(?string $queueName = null, ?int $delaySeconds = null): static
    {
        $this->shouldQueue = true;
        $this->queue = $queueName;
        $this->delay = $delaySeconds;

        return $this;
    }

    /**
     * Set maximum retry attempts for failed sends.
     */
    public function retry(int $maxRetries): static
    {
        $this->maxRetries = $maxRetries;

        return $this;
    }

    /**
     * Use a pre-defined email template with variables.
     *
     * @param  string  $templateName  Template identifier
     * @param  array  $variables  Template variables for replacement
     */
    public function template(string $templateName, array $variables = []): static
    {
        $this->templateName = $templateName;
        $this->templateVariables = $variables;

        return $this;
    }

    /**
     * Set template variables for rendering.
     */
    public function with(array $variables): static
    {
        $this->templateVariables = array_merge($this->templateVariables, $variables);

        return $this;
    }

    /**
     * Force using platform mail settings (useful during tenant provisioning).
     */
    public function usePlatformSettings(): static
    {
        $this->forcePlatformContext = true;

        return $this;
    }

    /**
     * Set recipient(s).
     */
    public function to(string|array $to): static
    {
        $this->to = is_array($to) ? $to : [$to];

        return $this;
    }

    /**
     * Set CC recipient(s).
     */
    public function cc(string|array $cc): static
    {
        $this->cc = is_array($cc) ? $cc : [$cc];

        return $this;
    }

    /**
     * Set BCC recipient(s).
     */
    public function bcc(string|array $bcc): static
    {
        $this->bcc = is_array($bcc) ? $bcc : [$bcc];

        return $this;
    }

    /**
     * Set Reply-To address.
     */
    public function replyTo(string $replyTo): static
    {
        $this->replyTo = $replyTo;

        return $this;
    }

    /**
     * Set email subject.
     */
    public function subject(string $subject): static
    {
        $this->subject = $subject;

        return $this;
    }

    /**
     * Set HTML body.
     */
    public function html(string $html): static
    {
        $this->htmlBody = $html;

        return $this;
    }

    /**
     * Set plain text body.
     */
    public function text(string $text): static
    {
        $this->textBody = $text;

        return $this;
    }

    /**
     * Add attachment.
     *
     * @param  string  $path  File path
     * @param  string|null  $name  Display name
     * @param  string|null  $mimeType  MIME type
     */
    public function attach(string $path, ?string $name = null, ?string $mimeType = null): static
    {
        $this->attachments[] = [
            'path' => $path,
            'name' => $name,
            'mimeType' => $mimeType,
        ];

        return $this;
    }

    /**
     * Send the email using fluent builder.
     *
     * @return array{success: bool, message: string}
     */
    public function send(): array
    {
        // Render template if specified
        if ($this->templateName) {
            $rendered = $this->renderTemplate($this->templateName, $this->templateVariables);
            $this->htmlBody = $rendered['html'];
            $this->textBody = $rendered['text'] ?? $this->textBody;
            $this->subject = $this->subject ?: ($rendered['subject'] ?? '');
        }

        // Queue if requested
        if ($this->shouldQueue) {
            return $this->queueMail();
        }

        return $this->sendMail($this->to, $this->subject, $this->htmlBody, $this->textBody, [
            'cc' => $this->cc,
            'bcc' => $this->bcc,
            'replyTo' => $this->replyTo,
            'attachments' => $this->attachments,
            'forcePlatformContext' => $this->forcePlatformContext,
            'maxRetries' => $this->maxRetries,
        ]);
    }

    /**
     * Queue the email for background processing.
     */
    protected function queueMail(): array
    {
        try {
            $job = new \Aero\Platform\Jobs\SendEmailJob([
                'to' => $this->to,
                'cc' => $this->cc,
                'bcc' => $this->bcc,
                'replyTo' => $this->replyTo,
                'subject' => $this->subject,
                'htmlBody' => $this->htmlBody,
                'textBody' => $this->textBody,
                'attachments' => $this->attachments,
                'forcePlatformContext' => $this->forcePlatformContext,
                'maxRetries' => $this->maxRetries,
            ]);

            if ($this->delay) {
                $job->delay($this->delay);
            }

            if ($this->queue) {
                dispatch($job)->onQueue($this->queue);
            } else {
                dispatch($job);
            }

            return [
                'success' => true,
                'message' => 'Email queued for sending',
            ];
        } catch (\Throwable $e) {
            Log::error('MailService: Failed to queue email', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to queue email: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Render an email template with variables.
     *
     * @return array{html: string, text: ?string, subject: ?string}
     */
    protected function renderTemplate(string $templateName, array $variables): array
    {
        // Get tenant branding if available
        $branding = $this->getTenantBranding();
        $variables = array_merge($branding, $variables);

        // Load template
        $templatePath = resource_path("views/emails/{$templateName}.blade.php");
        
        if (!file_exists($templatePath)) {
            Log::warning("MailService: Template not found: {$templateName}");
            return [
                'html' => $variables['message'] ?? '',
                'text' => null,
                'subject' => null,
            ];
        }

        try {
            $html = view("emails.{$templateName}", $variables)->render();
            
            // Extract plain text version if exists
            $textPath = resource_path("views/emails/{$templateName}-text.blade.php");
            $text = file_exists($textPath) ? view("emails.{$templateName}-text", $variables)->render() : null;

            // Extract subject if template defines it
            $subject = $variables['subject'] ?? null;

            return [
                'html' => $html,
                'text' => $text,
                'subject' => $subject,
            ];
        } catch (\Throwable $e) {
            Log::error("MailService: Failed to render template {$templateName}", [
                'error' => $e->getMessage(),
            ]);

            return [
                'html' => $variables['message'] ?? '',
                'text' => null,
                'subject' => null,
            ];
        }
    }

    /**
     * Get tenant branding for email templates.
     */
    protected function getTenantBranding(): array
    {
        $branding = [
            'app_name' => config('app.name'),
            'app_url' => config('app.url'),
            'logo_url' => null,
            'primary_color' => '#4F46E5',
            'company_name' => config('app.name'),
        ];

        if ($this->isTenantContext()) {
            try {
                $tenant = tenant();
                $branding['company_name'] = $tenant->name ?? $branding['company_name'];
                $branding['logo_url'] = $tenant->logo_url ?? null;
                $branding['primary_color'] = $tenant->primary_color ?? $branding['primary_color'];
            } catch (\Throwable $e) {
                Log::warning('MailService: Failed to get tenant branding', ['error' => $e->getMessage()]);
            }
        }

        return $branding;
    }

    /**
     * Send an email (static method for quick sending).
     *
     * @param  string|array  $to  Recipient email(s)
     * @param  string  $subject  Email subject
     * @param  string  $htmlBody  HTML content
     * @param  string|null  $textBody  Plain text content (optional)
     * @param  array  $options  Additional options (cc, bcc, replyTo, attachments, forcePlatformContext)
     * @return array{success: bool, message: string}
     */
    public function sendMail(string|array $to, string $subject, string $htmlBody, ?string $textBody = null, array $options = []): array
    {
        try {
            // Check both options array and instance property for platform context
            $forcePlatform = ($options['forcePlatformContext'] ?? false) || $this->forcePlatformContext;
            $config = $forcePlatform ? $this->getPlatformConfig() : $this->getConfig();

            if ($config['driver'] === 'smtp') {
                return $this->sendWithSmtp($to, $subject, $htmlBody, $textBody, $config, $options);
            }

            if ($config['driver'] === 'log') {
                return $this->sendWithLog($to, $subject, $htmlBody, $config);
            }

            return [
                'success' => false,
                'message' => 'Unsupported mail driver: '.$config['driver'],
            ];
        } catch (\Throwable $e) {
            Log::error('MailService: Failed to send email', [
                'to' => $to,
                'subject' => $subject,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send email via SMTP using Symfony Mailer.
     */
    protected function sendWithSmtp(
        string|array $to,
        string $subject,
        string $htmlBody,
        ?string $textBody,
        array $config,
        array $options = []
    ): array {
        // Build Symfony Mailer DSN
        $scheme = $config['encryption'] === 'ssl' ? 'smtps' : 'smtp';
        $dsnParams = $config['verify_peer'] ? '' : '?verify_peer=0';

        $dsn = sprintf(
            '%s://%s:%s@%s:%d%s',
            $scheme,
            urlencode($config['username']),
            urlencode($config['password']),
            $config['host'],
            $config['port'],
            $dsnParams
        );

        $transport = Transport::fromDsn($dsn);
        $mailer = new Mailer($transport);

        // Build email
        $email = (new Email)
            ->from(new Address($config['from_address'], $config['from_name']))
            ->subject($subject)
            ->html($htmlBody);

        // Add recipients
        $recipients = is_array($to) ? $to : [$to];
        foreach ($recipients as $recipient) {
            $email->addTo($recipient);
        }

        // Add plain text body
        if ($textBody) {
            $email->text($textBody);
        }

        // Add CC
        if (! empty($options['cc'])) {
            foreach ((array) $options['cc'] as $cc) {
                $email->addCc($cc);
            }
        }

        // Add BCC
        if (! empty($options['bcc'])) {
            foreach ((array) $options['bcc'] as $bcc) {
                $email->addBcc($bcc);
            }
        }

        // Add Reply-To
        if (! empty($options['replyTo'])) {
            $email->replyTo($options['replyTo']);
        }

        // Add attachments
        if (! empty($options['attachments'])) {
            foreach ($options['attachments'] as $attachment) {
                $email->attachFromPath(
                    $attachment['path'],
                    $attachment['name'] ?? null,
                    $attachment['mimeType'] ?? null
                );
            }
        }

        // Send
        $mailer->send($email);

        Log::info('MailService: Email sent successfully', [
            'to' => $to,
            'subject' => $subject,
            'host' => $config['host'],
            'context' => $this->isTenantContext() ? 'tenant' : 'platform',
        ]);

        return [
            'success' => true,
            'message' => 'Email sent successfully',
        ];
    }

    /**
     * Send email via log driver (for development/testing).
     */
    protected function sendWithLog(string|array $to, string $subject, string $htmlBody, array $config): array
    {
        $recipients = is_array($to) ? implode(', ', $to) : $to;

        Log::debug("MailService [LOG DRIVER]: Email to {$recipients}", [
            'subject' => $subject,
            'from' => $config['from_address'],
            'body_preview' => substr(strip_tags($htmlBody), 0, 200).'...',
        ]);

        return [
            'success' => true,
            'message' => 'Email logged (log driver)',
        ];
    }

    /**
     * Get mail configuration based on current context.
     */
    public function getConfig(): array
    {
        if ($this->isTenantContext()) {
            $config = $this->getTenantConfig();
            if ($config['configured']) {
                return $config;
            }
        }

        return $this->getPlatformConfig();
    }

    /**
     * Get platform mail configuration.
     *
     * Note: When in tenant context, we need to explicitly query the central database
     * since PlatformSetting is stored in the central/landlord database.
     */
    public function getPlatformConfig(): array
    {
        try {
            // Query central database for platform settings (works in both contexts)
            $settings = PlatformSetting::on('mysql')->where('slug', 'platform')->first();
            $emailSettings = $settings ? ($settings->email_settings ?? []) : [];

            if (empty($emailSettings) || empty($emailSettings['driver'])) {
                return $this->getEnvConfig();
            }

            return [
                'configured' => true,
                'driver' => $emailSettings['driver'] ?? 'smtp',
                'host' => $emailSettings['host'] ?? '127.0.0.1',
                'port' => (int) ($emailSettings['port'] ?? 587),
                'username' => $emailSettings['username'] ?? '',
                'password' => $settings->getEmailPassword() ?? '',
                'encryption' => $emailSettings['encryption'] ?? 'tls',
                'verify_peer' => $emailSettings['verify_peer'] ?? false,
                'from_address' => $emailSettings['from_address'] ?? config('mail.from.address'),
                'from_name' => $emailSettings['from_name'] ?? config('mail.from.name', config('app.name')),
            ];
        } catch (\Throwable $e) {
            Log::warning('MailService: Failed to get platform config, using .env', ['error' => $e->getMessage()]);

            return $this->getEnvConfig();
        }
    }

    /**
     * Get tenant mail configuration.
     */
    public function getTenantConfig(): array
    {
        try {
            $settings = SystemSetting::firstWhere('slug', SystemSetting::DEFAULT_SLUG);

            if (! $settings) {
                return ['configured' => false] + $this->getPlatformConfig();
            }

            $emailSettings = $settings->email_settings ?? [];

            if (empty($emailSettings) || empty($emailSettings['driver'])) {
                return ['configured' => false] + $this->getPlatformConfig();
            }

            return [
                'configured' => true,
                'driver' => $emailSettings['driver'] ?? 'smtp',
                'host' => $emailSettings['host'] ?? '127.0.0.1',
                'port' => (int) ($emailSettings['port'] ?? 587),
                'username' => $emailSettings['username'] ?? '',
                'password' => $settings->getEmailPassword() ?? '',
                'encryption' => $emailSettings['encryption'] ?? 'tls',
                'verify_peer' => $emailSettings['verify_peer'] ?? false,
                'from_address' => $emailSettings['from_address'] ?? config('mail.from.address'),
                'from_name' => $emailSettings['from_name'] ?? config('mail.from.name', config('app.name')),
            ];
        } catch (\Throwable $e) {
            Log::warning('MailService: Failed to get tenant config', ['error' => $e->getMessage()]);

            return ['configured' => false] + $this->getPlatformConfig();
        }
    }

    /**
     * Get mail configuration from .env file.
     */
    protected function getEnvConfig(): array
    {
        return [
            'configured' => false,
            'driver' => config('mail.default', 'smtp'),
            'host' => config('mail.mailers.smtp.host', '127.0.0.1'),
            'port' => (int) config('mail.mailers.smtp.port', 587),
            'username' => config('mail.mailers.smtp.username', ''),
            'password' => config('mail.mailers.smtp.password', ''),
            'encryption' => config('mail.mailers.smtp.encryption', 'tls'),
            'verify_peer' => false, // Disable SSL verification for .env config (shared hosting compatibility)
            'from_address' => config('mail.from.address'),
            'from_name' => config('mail.from.name', config('app.name')),
        ];
    }

    /**
     * Check if currently in tenant context.
     */
    protected function isTenantContext(): bool
    {
        return app()->bound('currentTenant') && tenancy()->initialized;
    }

    /**
     * Send a test email.
     *
     * @param  string  $to  Recipient email address
     * @param  string|null  $subject  Optional custom subject
     * @return array{success: bool, message: string, using_database_settings: bool}
     */
    public function sendTestEmail(string $to, ?string $subject = null): array
    {
        $subject = $subject ?? 'Test Email - '.config('app.name');
        $config = $this->getConfig();

        $html = '
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">✅ Test Email Successful</h2>
                <p>This is a test email from <strong>'.config('app.name').'</strong>.</p>
                <p>If you received this, your email configuration is working correctly.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p><strong>Configuration:</strong></p>
                <ul>
                    <li>Host: '.$config['host'].':'.$config['port'].'</li>
                    <li>Encryption: '.$config['encryption'].'</li>
                    <li>From: '.$config['from_address'].'</li>
                    <li>Context: '.($this->isTenantContext() ? 'Tenant' : 'Platform').'</li>
                    <li>Time: '.now()->toDateTimeString().'</li>
                </ul>
            </div>
        ';

        $result = $this->sendMail($to, $subject, $html);
        $result['using_database_settings'] = $config['configured'];

        return $result;
    }
}
