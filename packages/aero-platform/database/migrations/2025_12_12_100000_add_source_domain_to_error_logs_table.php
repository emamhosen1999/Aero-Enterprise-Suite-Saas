<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds source_domain and license_key columns to error_logs table
     * to support remote error reporting from standalone installations.
     */
    public function up(): void
    {
        Schema::table('error_logs', function (Blueprint $table) {
            // Source domain where the error originated (e.g., acme.aeroerp.com)
            $table->string('source_domain')->nullable()->after('trace_id')->index();

            // License key of the installation for validation
            $table->string('license_key')->nullable()->after('source_domain')->index();

            // Add combined index for domain + date queries
            $table->index(['source_domain', 'created_at']);
            $table->index(['license_key', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('error_logs', function (Blueprint $table) {
            $table->dropIndex(['source_domain', 'created_at']);
            $table->dropIndex(['license_key', 'created_at']);
            $table->dropColumn(['source_domain', 'license_key']);
        });
    }
};
