<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds maintenance_skip_verification field to allow tenant registration
     * without email/phone verification during maintenance mode.
     */
    public function up(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->boolean('maintenance_skip_verification')->default(false)->after('maintenance_ends_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->dropColumn('maintenance_skip_verification');
        });
    }
};
