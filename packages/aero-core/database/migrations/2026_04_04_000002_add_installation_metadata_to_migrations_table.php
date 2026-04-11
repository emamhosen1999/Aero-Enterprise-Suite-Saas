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
        // Add installation_tag column to migrations table if it doesn't exist
        if (Schema::hasTable('migrations')) {
            Schema::table('migrations', function (Blueprint $table) {
                if (!Schema::hasColumn('migrations', 'installation_tag')) {
                    $table->string('installation_tag')
                        ->nullable()
                        ->after('batch')
                        ->index()
                        ->comment('Tag format: package:category (e.g., core:foundation, platform:tenancy, hrm:base, hrm:payroll)');
                }

                if (!Schema::hasColumn('migrations', 'installation_step')) {
                    $table->integer('installation_step')
                        ->nullable()
                        ->after('installation_tag')
                        ->comment('Step sequence (1-9) when migration runs during installation');
                }

                if (!Schema::hasColumn('migrations', 'is_platform_critical')) {
                    $table->boolean('is_platform_critical')
                        ->default(false)
                        ->after('installation_step')
                        ->comment('If true, installation fails if this migration fails');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('migrations')) {
            Schema::table('migrations', function (Blueprint $table) {
                if (Schema::hasColumn('migrations', 'installation_tag')) {
                    $table->dropColumn('installation_tag');
                }
                if (Schema::hasColumn('migrations', 'installation_step')) {
                    $table->dropColumn('installation_step');
                }
                if (Schema::hasColumn('migrations', 'is_platform_critical')) {
                    $table->dropColumn('is_platform_critical');
                }
            });
        }
    }
};
