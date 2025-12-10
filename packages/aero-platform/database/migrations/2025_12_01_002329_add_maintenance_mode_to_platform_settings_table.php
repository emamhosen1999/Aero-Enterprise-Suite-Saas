<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds maintenance mode controls to the platform_settings table:
     * - maintenance_mode: Global platform-wide maintenance toggle
     * - maintenance_message: Custom message shown during maintenance
     * - maintenance_bypass_ips: JSON array of IPs that can bypass maintenance
     * - maintenance_bypass_secret: Secret header value for bypassing maintenance
     * - maintenance_allowed_paths: JSON array of paths accessible during maintenance
     * - scheduled_maintenance_at: Optional scheduled maintenance start time
     * - maintenance_ends_at: Estimated maintenance end time for user display
     */
    public function up(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->boolean('maintenance_mode')->default(false)->after('admin_preferences');
            $table->string('maintenance_message')->nullable()->after('maintenance_mode');
            $table->json('maintenance_bypass_ips')->nullable()->after('maintenance_message');
            $table->string('maintenance_bypass_secret')->nullable()->after('maintenance_bypass_ips');
            $table->json('maintenance_allowed_paths')->nullable()->after('maintenance_bypass_secret');
            $table->timestamp('scheduled_maintenance_at')->nullable()->after('maintenance_allowed_paths');
            $table->timestamp('maintenance_ends_at')->nullable()->after('scheduled_maintenance_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->dropColumn([
                'maintenance_mode',
                'maintenance_message',
                'maintenance_bypass_ips',
                'maintenance_bypass_secret',
                'maintenance_allowed_paths',
                'scheduled_maintenance_at',
                'maintenance_ends_at',
            ]);
        });
    }
};
