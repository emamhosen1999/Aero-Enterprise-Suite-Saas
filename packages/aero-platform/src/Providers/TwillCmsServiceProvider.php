<?php

declare(strict_types=1);

namespace Aero\Platform\Providers;

use A17\Twill\Facades\TwillCapsules;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\ServiceProvider;

/**
 * TwillCmsServiceProvider
 *
 * Wires Twill CMS into the aero-platform package.
 * Handles configuration, capsule registration, migrations, and public routes.
 *
 * - Twill admin accessible at: admin.{domain}/cms
 * - Twill auth uses the landlord_users table (no separate Twill user table)
 * - Migrations are loaded from aero-platform/database/migrations/twill/
 * - Public CMS pages served by CmsLandingController on the platform domain
 */
class TwillCmsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->configureTwill();
    }

    public function boot(): void
    {
        // Register the custom user provider that maps Twill's 'published' credential to our 'active' column.
        // Must be registered before auth resolves the twill_users guard.
        $this->app['auth']->provider('landlord_eloquent', function ($app, array $config) {
            return new \Aero\Platform\Auth\LandlordUserProvider(
                $app['hash'],
                $config['model']
            );
        });

        // Twill's own TwillServiceProvider::boot() unconditionally overwrites auth.providers.twill_users
        // with its default A17\Twill\Models\User. We re-apply our overrides after all SPs have booted
        // so our LandlordUser provider wins.
        $this->app->booted(function () {
            config([
                'auth.providers.twill_users' => [
                    'driver' => 'landlord_eloquent',
                    'model'  => \Aero\Platform\Models\LandlordUser::class,
                ],
                'auth.passwords.twill_users' => [
                    'provider' => 'twill_users',
                    'table'    => 'landlord_password_reset_tokens',
                    'expire'   => 60,
                    'throttle' => 60,
                ],
            ]);
        });

        // Load Twill migrations from this package (not the host app)
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations/twill');

        // Register the Pages capsule so Twill discovers our Page module
        TwillCapsules::registerPackageCapsule(
            name: 'Pages',
            namespace: 'Aero\\Platform\\Twill',
            path: __DIR__.'/../Twill',
            automaticNavigation: true,
        );
    }

    /**
     * Configure Twill before its service provider runs.
     *
     * Key decisions:
     * - admin_app_path 'cms'  → Twill admin lives at /cms (on the admin domain)
     * - users_table 'landlord_users' → Reuse existing landlord users, no separate twill_users table
     * - Disable unused Twill features to keep the admin panel focused
     */
    protected function configureTwill(): void
    {
        $adminDomain = env('ADMIN_DOMAIN', 'admin.'.env('PLATFORM_DOMAIN', 'localhost'));

        // ── Twill auth guard ──────────────────────────────────────────────
        // Point Twill's twill_users guard at our landlord_users table.
        // This re-uses the existing auth guard infra without a separate user table.
        Config::set([
            'auth.guards.twill_users' => [
                'driver'   => 'session',
                'provider' => 'twill_users',
            ],
            'auth.providers.twill_users' => [
                'driver' => 'landlord_eloquent',
                'model'  => \Aero\Platform\Models\LandlordUser::class,
            ],
            'auth.passwords.twill_users' => [
                'provider' => 'twill_users',
                'table'    => 'landlord_password_reset_tokens',
                'expire'   => 60,
                'throttle' => 60,
            ],
        ]);

        Config::set([
            // Mount Twill at /cms so it lives at admin.aeos365.test/cms
            'twill.admin_app_path'              => 'cms',
            'twill.admin_app_url'               => $adminDomain,
            // Override redirect path: Twill builds it as "{url}/{path}" treating admin_app_url as a
            // path prefix. We set this explicitly so login redirects to /cms, not /admin.aeos365.test/cms.
            'twill.auth_login_redirect_path'    => '/cms',

            // Use the landlord_users table for Twill auth — no separate twill_users migration
            'twill.users_table'              => 'landlord_users',
            'twill.password_resets_table'    => 'landlord_password_reset_tokens',

            // Namespace for Twill module auto-discovery
            'twill.namespace' => 'Aero\\Platform\\Twill',

            // Keep the block editor enabled; disable features we don't need
            // users-management MUST be true — it controls whether login/logout routes are registered
            'twill.enabled' => [
                'users-management'     => true,
                'media-library'        => true,
                'file-library'         => false,
                'block-editor'         => true,
                'buckets'              => false,
                'settings'             => false,
                'dashboard'            => true,
                'search'               => false,
                'activitylog'          => false,
                'users-2fa'            => false,
                'permissions-management' => false,
            ],

            // Block views path — package-level blocks
            'twill.block_editor.block_single_layout' => 'aero-platform::twill.layouts.block',
            'twill.block_editor.blocks_directories'  => [
                __DIR__.'/../Twill/Blocks',
            ],
            'twill.block_editor.repeaters_directories' => [],

            // Use local disk for media
            'twill.media_library.disk'          => 'public',
            'twill.media_library.endpoint_type' => 'local',
            'twill.media_library.image_service' => 'A17\Twill\Services\MediaLibrary\Local',

            // Capsules path
            'twill.capsules.list' => [],
        ]);
    }
}
