<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            // SEO Settings
            $table->json('seo_settings')->nullable()->after('admin_preferences');

            // Marketing Analytics Integrations
            $table->json('analytics_integrations')->nullable()->after('seo_settings');

            // Social Login Configuration
            $table->json('social_auth_settings')->nullable()->after('analytics_integrations');

            // Affiliate/Referral Program Settings
            $table->json('affiliate_settings')->nullable()->after('social_auth_settings');

            // Newsletter Settings
            $table->json('newsletter_settings')->nullable()->after('affiliate_settings');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->dropColumn([
                'seo_settings',
                'analytics_integrations',
                'social_auth_settings',
                'affiliate_settings',
                'newsletter_settings',
            ]);
        });
    }
};
