<?php

namespace Aero\Platform\Console\Commands;

use Aero\Platform\Models\PlatformSetting;
use Aero\Platform\Services\MailService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Mail;

/**
 * TestMailConfiguration
 *
 * Tests and configures mail settings for the platform.
 * Can test both .env and database-configured mail settings.
 */
class TestMailConfiguration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test
                            {--to= : Email address to send test email to}
                            {--configure : Populate platform settings with .env mail configuration}
                            {--show : Show current mail configuration}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test and configure platform mail settings for tenant provisioning';

    public function __construct(
        protected MailService $mailConfigService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if ($this->option('show')) {
            return $this->showConfiguration();
        }

        if ($this->option('configure')) {
            return $this->configureFromEnv();
        }

        return $this->testMail();
    }

    /**
     * Show current mail configuration.
     */
    protected function showConfiguration(): int
    {
        $this->info('=== Current Mail Configuration ===');
        $this->newLine();

        // Show .env settings
        $this->info('.env Configuration:');
        $this->table(
            ['Setting', 'Value'],
            [
                ['MAIL_MAILER', config('mail.default')],
                ['MAIL_HOST', config('mail.mailers.smtp.host')],
                ['MAIL_PORT', config('mail.mailers.smtp.port')],
                ['MAIL_USERNAME', config('mail.mailers.smtp.username')],
                ['MAIL_PASSWORD', config('mail.mailers.smtp.password') ? '***SET***' : 'NOT SET'],
                ['MAIL_ENCRYPTION', config('mail.mailers.smtp.encryption')],
                ['MAIL_FROM_ADDRESS', config('mail.from.address')],
                ['MAIL_FROM_NAME', config('mail.from.name')],
            ]
        );

        $this->newLine();

        // Show platform settings
        $this->info('Platform Settings (Database):');
        $platformSettings = PlatformSetting::current();
        $emailSettings = $platformSettings->email_settings ?? [];

        if (empty($emailSettings) || empty($emailSettings['driver'])) {
            $this->warn('No email settings configured in platform settings.');
            $this->line('Run "php artisan mail:test --configure" to populate from .env');
        } else {
            $this->table(
                ['Setting', 'Value'],
                [
                    ['driver', $emailSettings['driver'] ?? 'N/A'],
                    ['host', $emailSettings['host'] ?? 'N/A'],
                    ['port', $emailSettings['port'] ?? 'N/A'],
                    ['username', $emailSettings['username'] ?? 'N/A'],
                    ['password', ! empty($emailSettings['password']) ? '***ENCRYPTED***' : 'NOT SET'],
                    ['encryption', $emailSettings['encryption'] ?? 'N/A'],
                    ['from_address', $emailSettings['from_address'] ?? 'N/A'],
                    ['from_name', $emailSettings['from_name'] ?? 'N/A'],
                ]
            );
        }

        return Command::SUCCESS;
    }

    /**
     * Configure platform settings from .env mail configuration.
     */
    protected function configureFromEnv(): int
    {
        $this->info('Configuring platform mail settings from .env...');

        $platformSettings = PlatformSetting::current();

        // Get current .env mail configuration
        $password = config('mail.mailers.smtp.password');
        $encryptedPassword = $password ? Crypt::encryptString($password) : null;

        $emailSettings = [
            'driver' => config('mail.default') === 'log' ? 'smtp' : config('mail.default'),
            'host' => config('mail.mailers.smtp.host'),
            'port' => config('mail.mailers.smtp.port'),
            'username' => config('mail.mailers.smtp.username'),
            'password' => $encryptedPassword,
            'encryption' => config('mail.mailers.smtp.encryption'),
            'from_address' => config('mail.from.address'),
            'from_name' => config('mail.from.name'),
        ];

        $platformSettings->update([
            'email_settings' => $emailSettings,
        ]);

        $this->info('Platform mail settings configured successfully!');
        $this->newLine();

        // Show the configured settings
        return $this->showConfiguration();
    }

    /**
     * Test sending an email.
     */
    protected function testMail(): int
    {
        $to = $this->option('to') ?? config('mail.from.address');

        if (empty($to)) {
            $to = $this->ask('Enter email address to send test to');
        }

        if (empty($to)) {
            $this->error('No email address provided.');

            return Command::FAILURE;
        }

        $this->info('Testing mail configuration...');
        $this->newLine();

        // Show current configuration first
        $this->showConfiguration();
        $this->newLine();

        // Apply platform mail settings
        $this->info('Applying platform mail settings...');
        $applied = $this->mailConfigService->applyPlatformMailSettings();
        $this->line($applied ? '  → Using database settings' : '  → Using .env settings');
        $this->line('  → Driver: '.config('mail.default'));
        $this->newLine();

        // Send test email
        $this->info("Sending test email to: {$to}");

        $result = $this->mailConfigService->sendTestEmail($to, 'AEOS365 Mail Test - '.now()->format('Y-m-d H:i:s'));

        if ($result['success']) {
            $this->info('✅ '.$result['message']);
            $this->line('  → Using: '.($result['using_database_settings'] ? 'Database Settings' : '.env Settings'));

            return Command::SUCCESS;
        } else {
            $this->error('❌ '.$result['message']);
            $this->newLine();
            $this->warn('Troubleshooting tips:');
            $this->line('  1. Verify SMTP credentials are correct');
            $this->line('  2. Check if your email provider requires app passwords');
            $this->line('  3. Ensure SMTP port is not blocked by firewall');
            $this->line('  4. For Office365/Outlook, you may need to enable SMTP AUTH');
            $this->newLine();
            $this->line('To configure from .env: php artisan mail:test --configure');
            $this->line('To view config: php artisan mail:test --show');

            return Command::FAILURE;
        }
    }
}
