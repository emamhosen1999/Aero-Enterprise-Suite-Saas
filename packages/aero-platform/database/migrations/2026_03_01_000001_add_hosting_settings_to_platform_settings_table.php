<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add hosting_settings JSON column to platform_settings.
     *
     * Stores the platform-wide hosting mode (shared/dedicated) and,
     * when in shared (cPanel) mode, the encrypted cPanel credentials.
     *
     * Schema:
     * {
     *   "mode": "dedicated" | "shared",
     *   "cpanel_host":      string|null,   e.g. "server123.web-hosting.com"
     *   "cpanel_port":      int|null,      default 2083
     *   "cpanel_username":  string|null,   cPanel login username
     *   "cpanel_api_token": string|null,   encrypted via Crypt::encryptString()
     *   "cpanel_db_user":   string|null,   DB user (defaults to username if omitted)
     * }
     */
    public function up(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->json('hosting_settings')->nullable()->after('newsletter_settings');
        });
    }

    public function down(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->dropColumn('hosting_settings');
        });
    }
};
