<?php

namespace Tests\Unit;

use App\Models\SystemSetting;
use App\Services\Settings\SystemSettingService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SystemSettingServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
            'foreign_key_constraints' => true,
        ]);

        app('db')->setDefaultConnection('sqlite');

        Schema::dropAllTables();

        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('company_name');
            $table->string('legal_name')->nullable();
            $table->string('tagline')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('support_email');
            $table->string('support_phone')->nullable();
            $table->string('website_url')->nullable();
            $table->string('timezone')->nullable();
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->nullable();
            $table->json('branding')->nullable();
            $table->json('metadata')->nullable();
            $table->json('email_settings')->nullable();
            $table->json('sms_settings')->nullable();
            $table->json('notification_channels')->nullable();
            $table->json('integrations')->nullable();
            $table->json('advanced')->nullable();
            $table->json('organization')->nullable();
            $table->timestamps();
        });
    }

    public function test_it_updates_core_fields_and_encrypts_password(): void
    {
        $service = app(SystemSettingService::class);

        $setting = SystemSetting::create([
            'slug' => SystemSetting::DEFAULT_SLUG,
            'company_name' => 'Initial Corp',
            'support_email' => 'hello@example.com',
        ]);

        $updated = $service->update($setting, [
            'company_name' => 'Aero Labs',
            'support_email' => 'ops@example.com',
            'branding' => ['primary_color' => '#111111'],
            'metadata' => ['default_locale' => 'en'],
            'email_settings' => [
                'driver' => 'smtp',
                'password' => 'super-secret',
                'from_address' => 'ops@example.com',
            ],
            'notification_channels' => ['email' => true],
        ]);

        $this->assertSame('Aero Labs', $updated->company_name);
        $this->assertSame('#111111', $updated->branding['primary_color']);
        $this->assertTrue($updated->getSanitizedEmailSettings()['password_set']);
        $this->assertSame('super-secret', $updated->getEmailPassword());
    }

    public function test_it_keeps_existing_password_when_payload_is_empty(): void
    {
        $service = app(SystemSettingService::class);

        $setting = SystemSetting::create([
            'slug' => SystemSetting::DEFAULT_SLUG,
            'company_name' => 'Initial Corp',
            'support_email' => 'hello@example.com',
            'email_settings' => [
                'driver' => 'smtp',
                'password' => Crypt::encryptString('existing-secret'),
            ],
        ]);

        $updated = $service->update($setting, [
            'company_name' => 'Initial Corp',
            'support_email' => 'hello@example.com',
            'email_settings' => [
                'driver' => 'smtp',
                'password' => '',
            ],
        ]);

        $this->assertSame('existing-secret', $updated->getEmailPassword());
    }
}
