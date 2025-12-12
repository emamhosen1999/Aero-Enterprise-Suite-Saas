<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds enhanced metadata fields to modules table:
     * - version: Semantic versioning
     * - min_plan: Minimum subscription plan required
     * - license_type: Module classification (core, standard, addon)
     * - dependencies: Required module codes (JSON array)
     * - release_date: Initial release date
     */
    public function up(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->string('version')->nullable()->after('settings')->comment('Semantic version: 1.0.0');
            $table->string('min_plan')->nullable()->after('version')->comment('Minimum plan required: basic, business, professional, null=all');
            $table->string('license_type')->nullable()->after('min_plan')->comment('License classification: core, standard, addon');
            $table->json('dependencies')->nullable()->after('license_type')->comment('Array of required module codes');
            $table->date('release_date')->nullable()->after('dependencies')->comment('Initial release date');

            // Add indexes for common queries
            $table->index('min_plan');
            $table->index('license_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->dropIndex(['min_plan']);
            $table->dropIndex(['license_type']);
            $table->dropColumn(['version', 'min_plan', 'license_type', 'dependencies', 'release_date']);
        });
    }
};
