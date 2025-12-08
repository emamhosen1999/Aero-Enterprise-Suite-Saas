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
        Schema::table('system_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('system_settings', 'sms_settings')) {
                $table->json('sms_settings')->nullable()->after('email_settings');
            }
            if (! Schema::hasColumn('system_settings', 'organization')) {
                $table->json('organization')->nullable()->after('advanced');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            if (Schema::hasColumn('system_settings', 'sms_settings')) {
                $table->dropColumn('sms_settings');
            }
            if (Schema::hasColumn('system_settings', 'organization')) {
                $table->dropColumn('organization');
            }
        });
    }
};
