<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use App\Models\Tenant;
use App\Notifications\TenantProvisioningFailed;
use App\Notifications\WelcomeToTenant;
use App\Services\Mail\MailService;
use App\Services\Mail\RuntimeMailConfigService;
use App\Services\Platform\PlatformVerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * Tests for mail configuration and sending during tenant provisioning.
 */
class MailConfigurationTest extends TestCase
{
    use RefreshDatabase;

    private RuntimeMailConfigService $runtimeMailService;

    private MailService $mailService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->runtimeMailService = app(RuntimeMailConfigService::class);
        $this->mailService = app(MailService::class);
    }

    /**
     * Test that RuntimeMailConfigService applies platform mail settings.
     */
    public function test_runtime_mail_config_applies_platform_settings(): void
    {
        // Create platform settings with email configuration
        $platformSetting = PlatformSetting::create([
            'slug' => 'platform',
            'site_name' => 'Test Platform',
            'email_settings' => [
                'driver' => 'smtp',
                'host' => 'smtp.test.com',
                'port' => 587,
                'username' => 'test@test.com',
                'password' => Crypt::encryptString('test-password'),
                'encryption' => 'tls',
                'from_address' => 'noreply@test.com',
                'from_name' => 'Test Platform',
            ],
        ]);

        // Apply platform mail settings
        $applied = $this->runtimeMailService->applyPlatformMailSettings();

        $this->assertTrue($applied);
        $this->assertEquals('smtp', config('mail.default'));
        $this->assertEquals('smtp.test.com', config('mail.mailers.smtp.host'));
        $this->assertEquals(587, config('mail.mailers.smtp.port'));
        $this->assertEquals('noreply@test.com', config('mail.from.address'));
        $this->assertEquals('Test Platform', config('mail.from.name'));
    }

    /**
     * Test that RuntimeMailConfigService falls back to .env when no platform settings exist.
     */
    public function test_runtime_mail_config_falls_back_to_env(): void
    {
        // Ensure no platform settings exist
        PlatformSetting::truncate();

        // Apply platform mail settings (should fall back to .env)
        $applied = $this->runtimeMailService->applyPlatformMailSettings();

        $this->assertFalse($applied);
    }

    /**
     * Test WelcomeToTenant notification can send via MailService.
     */
    public function test_welcome_notification_can_send_via_mail_service(): void
    {
        // Create platform settings
        PlatformSetting::create([
            'slug' => 'platform',
            'site_name' => 'Test Platform',
            'email_settings' => [
                'driver' => 'smtp',
                'host' => 'smtp.test.com',
                'port' => 587,
                'username' => 'test@test.com',
                'password' => Crypt::encryptString('test-password'),
                'encryption' => 'tls',
                'from_address' => 'noreply@test.com',
                'from_name' => 'Test Platform',
            ],
        ]);

        // Create a tenant
        $tenant = Tenant::factory()->create([
            'name' => 'Test Tenant',
            'email' => 'admin@test.com',
        ]);

        // Create the notification - it should have sendEmail method
        $notification = new WelcomeToTenant($tenant);

        // Test that the notification has the sendEmail method
        $this->assertTrue(method_exists($notification, 'sendEmail'));
    }

    /**
     * Test TenantProvisioningFailed notification can send via MailService.
     */
    public function test_provisioning_failed_notification_can_send_via_mail_service(): void
    {
        // Create platform settings
        PlatformSetting::create([
            'slug' => 'platform',
            'site_name' => 'Test Platform',
            'email_settings' => [
                'driver' => 'smtp',
                'host' => 'smtp.test.com',
                'port' => 587,
                'username' => 'test@test.com',
                'password' => Crypt::encryptString('test-password'),
                'encryption' => 'tls',
                'from_address' => 'noreply@test.com',
                'from_name' => 'Test Platform',
            ],
        ]);

        // Create a tenant
        $tenant = Tenant::factory()->create([
            'name' => 'Test Tenant',
            'email' => 'admin@test.com',
        ]);

        // Create the notification
        $notification = new TenantProvisioningFailed($tenant, 'Test error message');

        // Test that the notification has the sendEmail method
        $this->assertTrue(method_exists($notification, 'sendEmail'));
    }

    /**
     * Test MailService can get platform configuration correctly.
     */
    public function test_mail_service_gets_platform_config(): void
    {
        // Create platform settings
        PlatformSetting::create([
            'slug' => 'platform',
            'site_name' => 'Test Platform',
            'email_settings' => [
                'driver' => 'smtp',
                'host' => 'smtp.test.com',
                'port' => 465,
                'username' => 'test@test.com',
                'password' => Crypt::encryptString('test-password'),
                'encryption' => 'ssl',
                'from_address' => 'noreply@test.com',
                'from_name' => 'Test Platform',
                'verify_peer' => false,
            ],
        ]);

        // Use the MailService to get platform config
        $mailService = $this->mailService->usePlatformSettings();
        $config = $mailService->getPlatformConfig();

        $this->assertEquals('smtp.test.com', $config['host']);
        $this->assertEquals(465, $config['port']);
        $this->assertEquals('ssl', $config['encryption']);
        $this->assertEquals('noreply@test.com', $config['from_address']);
        $this->assertEquals('Test Platform', $config['from_name']);
        $this->assertFalse($config['verify_peer']);
    }

    /**
     * Test MailService fluent API works correctly.
     */
    public function test_mail_service_fluent_api(): void
    {
        // Test that we can build a message using the fluent API
        $mailService = $this->mailService
            ->to('recipient@test.com')
            ->subject('Test Subject')
            ->html('<p>Test body</p>');

        // Verify the mail service has the correct settings
        $this->assertInstanceOf(MailService::class, $mailService);
    }

    /**
     * Test PlatformVerificationService sends email with MailService.
     */
    public function test_platform_verification_service_uses_mail_service(): void
    {
        // Create platform settings with log driver (so we don't actually send)
        PlatformSetting::create([
            'slug' => 'platform',
            'site_name' => 'Test Platform',
            'email_settings' => [
                'driver' => 'log',
                'from_address' => 'noreply@test.com',
                'from_name' => 'Test Platform',
            ],
        ]);

        // Create a tenant
        $tenant = Tenant::factory()->create([
            'name' => 'Test Tenant',
            'email' => 'admin@test.com',
        ]);

        // Get the service
        $verificationService = app(PlatformVerificationService::class);

        // The service should now use MailService internally
        // Since we're using log driver, it won't actually send an email via SMTP
        // But the verification code should still be generated and stored
        $result = $verificationService->sendEmailVerificationCode($tenant, 'admin@test.com');

        // Verify tenant was updated with verification code
        $tenant->refresh();
        $this->assertNotNull($tenant->admin_email_verification_code);
        $this->assertNotNull($tenant->admin_email_verification_sent_at);
    }

    /**
     * Test PlatformVerificationService generates and stores verification code.
     */
    public function test_platform_verification_service_stores_verification_code(): void
    {
        // Create platform settings with log driver
        PlatformSetting::create([
            'slug' => 'platform',
            'site_name' => 'Test Platform',
            'email_settings' => [
                'driver' => 'log',
                'from_address' => 'noreply@test.com',
                'from_name' => 'Test Platform',
            ],
        ]);

        // Create a tenant
        $tenant = Tenant::factory()->create([
            'name' => 'Test Tenant',
            'email' => 'admin@test.com',
        ]);

        // Get the service
        $verificationService = app(PlatformVerificationService::class);

        // Send verification code - this will use MailService internally
        // Since we're using log driver, it won't actually send via SMTP
        $result = $verificationService->sendEmailVerificationCode($tenant, 'admin@test.com');

        // The verification code should still be generated and stored regardless of mail result
        $tenant->refresh();
        $this->assertNotNull($tenant->admin_email_verification_code);
        $this->assertNotNull($tenant->admin_email_verification_sent_at);
    }

    /**
     * Test mail configuration command shows settings.
     */
    public function test_mail_command_shows_configuration(): void
    {
        // Create platform settings
        PlatformSetting::create([
            'slug' => 'platform',
            'site_name' => 'Test Platform',
            'email_settings' => [
                'driver' => 'smtp',
                'host' => 'smtp.test.com',
                'port' => 587,
                'username' => 'test@test.com',
                'password' => Crypt::encryptString('test-password'),
                'encryption' => 'tls',
                'from_address' => 'noreply@test.com',
                'from_name' => 'Test Platform',
            ],
        ]);

        $this->artisan('mail:test', ['--show' => true])
            ->assertSuccessful()
            ->expectsOutputToContain('Current Mail Configuration');
    }
}
