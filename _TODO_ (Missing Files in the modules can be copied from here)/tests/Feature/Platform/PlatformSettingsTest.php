<?php

namespace Tests\Feature\Platform;

use Aero\Platform\Models\LandlordUser;
use App\Models\PlatformSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PlatformSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected LandlordUser $admin;

    protected PlatformSetting $setting;

    protected function setUp(): void
    {
        parent::setUp();

        // Create super-admin role for landlord guard
        Role::findOrCreate('super-admin', 'landlord');

        // Create admin user with super-admin role
        $this->admin = LandlordUser::factory()->create();
        $this->admin->assignRole('super-admin');

        // Get or create platform settings
        $this->setting = PlatformSetting::current();
    }

    public function test_admin_can_view_platform_settings_page(): void
    {
        $response = $this->actingAs($this->admin)
            ->get(route('admin.settings.platform.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Settings/Platform')
            ->has('platformSettings')
            ->has('platformSettings.site')
            ->has('platformSettings.branding')
        );
    }

    public function test_admin_can_update_basic_platform_settings(): void
    {
        $response = $this->actingAs($this->admin)
            ->put(route('admin.settings.platform.update'), [
                'site_name' => 'Test Platform',
                'legal_name' => 'Test Platform LLC',
                'tagline' => 'Test Tagline',
                'support_email' => 'support@test.com',
                'support_phone' => '+1234567890',
                'marketing_url' => 'https://test.com',
                'status_page_url' => 'https://status.test.com',
                'branding' => [
                    'primary_color' => '#FF0000',
                    'accent_color' => '#00FF00',
                ],
                'metadata' => [
                    'hero_title' => 'Test Hero Title',
                    'hero_subtitle' => 'Test Hero Subtitle',
                    'meta_title' => 'Test Meta Title',
                    'meta_description' => 'Test Meta Description',
                    'meta_keywords' => ['test', 'platform', 'saas'],
                ],
                'email_settings' => [
                    'driver' => 'smtp',
                    'host' => 'smtp.test.com',
                    'port' => '587',
                    'encryption' => 'tls',
                    'username' => 'user@test.com',
                    'password' => 'testpassword',
                    'from_address' => 'noreply@test.com',
                    'from_name' => 'Test Platform',
                    'reply_to' => 'support@test.com',
                ],
                'legal' => [
                    'terms_url' => 'https://test.com/terms',
                    'privacy_url' => 'https://test.com/privacy',
                    'cookies_url' => 'https://test.com/cookies',
                ],
                'integrations' => [
                    'intercom_app_id' => 'test_intercom_id',
                    'segment_key' => 'test_segment_key',
                    'statuspage_id' => 'test_statuspage_id',
                ],
                'admin_preferences' => [
                    'show_beta_features' => true,
                    'enable_impersonation' => true,
                ],
            ]);

        $response->assertOk();

        $this->setting->refresh();

        $this->assertEquals('Test Platform', $this->setting->site_name);
        $this->assertEquals('Test Platform LLC', $this->setting->legal_name);
        $this->assertEquals('Test Tagline', $this->setting->tagline);
        $this->assertEquals('support@test.com', $this->setting->support_email);
        $this->assertEquals('+1234567890', $this->setting->support_phone);
        $this->assertEquals('https://test.com', $this->setting->marketing_url);
        $this->assertEquals('https://status.test.com', $this->setting->status_page_url);

        $this->assertEquals('#FF0000', $this->setting->branding['primary_color']);
        $this->assertEquals('#00FF00', $this->setting->branding['accent_color']);

        $this->assertEquals('Test Hero Title', $this->setting->metadata['hero_title']);
        $this->assertEquals(['test', 'platform', 'saas'], $this->setting->metadata['meta_keywords']);

        $this->assertEquals('smtp', $this->setting->email_settings['driver']);
        $this->assertEquals('smtp.test.com', $this->setting->email_settings['host']);

        $this->assertEquals('https://test.com/terms', $this->setting->legal['terms_url']);

        $this->assertEquals('test_intercom_id', $this->setting->integrations['intercom_app_id']);

        $this->assertTrue($this->setting->admin_preferences['show_beta_features']);
        $this->assertTrue($this->setting->admin_preferences['enable_impersonation']);
    }

    public function test_admin_can_upload_logo(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('logo.png', 200, 50);

        $response = $this->actingAs($this->admin)
            ->put(route('admin.settings.platform.update'), [
                'site_name' => 'Test Platform',
                'support_email' => 'support@test.com',
                'logo' => $file,
                'branding' => [
                    'primary_color' => '#FF0000',
                    'accent_color' => '#00FF00',
                ],
            ]);

        $response->assertOk();

        $this->setting->refresh();

        $this->assertNotNull($this->setting->getFirstMedia(PlatformSetting::MEDIA_LOGO));
    }

    public function test_admin_can_upload_square_logo(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('square-logo.png', 100, 100);

        $response = $this->actingAs($this->admin)
            ->put(route('admin.settings.platform.update'), [
                'site_name' => 'Test Platform',
                'support_email' => 'support@test.com',
                'square_logo' => $file,
                'branding' => [
                    'primary_color' => '#FF0000',
                    'accent_color' => '#00FF00',
                ],
            ]);

        $response->assertOk();

        $this->setting->refresh();

        $this->assertNotNull($this->setting->getFirstMedia(PlatformSetting::MEDIA_SQUARE_LOGO));
    }

    public function test_admin_can_upload_favicon(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('favicon.png', 32, 32);

        $response = $this->actingAs($this->admin)
            ->put(route('admin.settings.platform.update'), [
                'site_name' => 'Test Platform',
                'support_email' => 'support@test.com',
                'favicon' => $file,
                'branding' => [
                    'primary_color' => '#FF0000',
                    'accent_color' => '#00FF00',
                ],
            ]);

        $response->assertOk();

        $this->setting->refresh();

        $this->assertNotNull($this->setting->getFirstMedia(PlatformSetting::MEDIA_FAVICON));
    }

    public function test_admin_can_upload_social_image(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('social.png', 1200, 630);

        $response = $this->actingAs($this->admin)
            ->put(route('admin.settings.platform.update'), [
                'site_name' => 'Test Platform',
                'support_email' => 'support@test.com',
                'social' => $file,
                'branding' => [
                    'primary_color' => '#FF0000',
                    'accent_color' => '#00FF00',
                ],
            ]);

        $response->assertOk();

        $this->setting->refresh();

        $this->assertNotNull($this->setting->getFirstMedia(PlatformSetting::MEDIA_SOCIAL));
    }

    public function test_validation_requires_site_name(): void
    {
        $response = $this->actingAs($this->admin)
            ->put(route('admin.settings.platform.update'), [
                'site_name' => '',
                'support_email' => 'support@test.com',
            ]);

        $response->assertSessionHasErrors('site_name');
    }

    public function test_validation_requires_support_email(): void
    {
        $response = $this->actingAs($this->admin)
            ->put(route('admin.settings.platform.update'), [
                'site_name' => 'Test Platform',
                'support_email' => '',
            ]);

        $response->assertSessionHasErrors('support_email');
    }

    public function test_validation_requires_valid_email_format(): void
    {
        $response = $this->actingAs($this->admin)
            ->put(route('admin.settings.platform.update'), [
                'site_name' => 'Test Platform',
                'support_email' => 'invalid-email',
            ]);

        $response->assertSessionHasErrors('support_email');
    }

    public function test_validation_requires_valid_color_format(): void
    {
        $response = $this->actingAs($this->admin)
            ->put(route('admin.settings.platform.update'), [
                'site_name' => 'Test Platform',
                'support_email' => 'support@test.com',
                'branding' => [
                    'primary_color' => 'not-a-color',
                    'accent_color' => '#00FF00',
                ],
            ]);

        $response->assertSessionHasErrors('branding.primary_color');
    }

    public function test_platform_settings_available_in_public_pages(): void
    {
        $this->setting->update([
            'site_name' => 'Test Platform Name',
            'tagline' => 'Test Tagline',
            'metadata' => [
                'hero_title' => 'Welcome to Test Platform',
                'hero_subtitle' => 'The best platform ever',
                'meta_title' => 'Test Platform - Home',
                'meta_description' => 'Test platform description',
            ],
            'branding' => [
                'primary_color' => '#FF0000',
                'accent_color' => '#00FF00',
            ],
        ]);

        $response = $this->get(route('landing'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('platformSettings')
            ->where('platformSettings.site.name', 'Test Platform Name')
            ->where('platformSettings.metadata.hero_title', 'Welcome to Test Platform')
            ->where('platformSettings.branding.primary_color', '#FF0000')
        );
    }

    public function test_non_admin_cannot_access_platform_settings(): void
    {
        $user = LandlordUser::factory()->create();

        $response = $this->actingAs($user)
            ->get(route('admin.settings.platform.index'));

        $response->assertForbidden();
    }

    public function test_non_admin_cannot_update_platform_settings(): void
    {
        $user = LandlordUser::factory()->create();

        $response = $this->actingAs($user)
            ->put(route('admin.settings.platform.update'), [
                'site_name' => 'Hacked Platform',
                'support_email' => 'hacker@test.com',
            ]);

        $response->assertForbidden();
    }

    public function test_guest_cannot_access_platform_settings(): void
    {
        $response = $this->get(route('admin.settings.platform.index'));

        $response->assertRedirect(route('admin.login'));
    }

    public function test_email_password_is_encrypted(): void
    {
        $response = $this->actingAs($this->admin)
            ->put(route('admin.settings.platform.update'), [
                'site_name' => 'Test Platform',
                'support_email' => 'support@test.com',
                'email_settings' => [
                    'driver' => 'smtp',
                    'host' => 'smtp.test.com',
                    'port' => '587',
                    'password' => 'secret-password',
                ],
            ]);

        $response->assertOk();

        $this->setting->refresh();

        // Password should be encrypted in database
        $this->assertNotEquals('secret-password', $this->setting->email_settings['password']);

        // But should be decryptable
        $this->assertEquals('secret-password', $this->setting->getEmailPassword());
    }

    public function test_branding_payload_includes_all_assets(): void
    {
        Storage::fake('public');

        $logo = UploadedFile::fake()->image('logo.png');
        $squareLogo = UploadedFile::fake()->image('square-logo.png');
        $favicon = UploadedFile::fake()->image('favicon.png');
        $social = UploadedFile::fake()->image('social.png');

        $this->actingAs($this->admin)
            ->put(route('admin.settings.platform.update'), [
                'site_name' => 'Test Platform',
                'support_email' => 'support@test.com',
                'logo' => $logo,
                'square_logo' => $squareLogo,
                'favicon' => $favicon,
                'social' => $social,
                'branding' => [
                    'primary_color' => '#FF0000',
                    'accent_color' => '#00FF00',
                ],
            ]);

        $this->setting->refresh();

        $branding = $this->setting->getBrandingPayload();

        $this->assertNotEmpty($branding['logo']);
        $this->assertNotEmpty($branding['square_logo']);
        $this->assertNotEmpty($branding['favicon']);
        $this->assertNotEmpty($branding['social']);
        $this->assertEquals('#FF0000', $branding['primary_color']);
        $this->assertEquals('#00FF00', $branding['accent_color']);
    }
}
