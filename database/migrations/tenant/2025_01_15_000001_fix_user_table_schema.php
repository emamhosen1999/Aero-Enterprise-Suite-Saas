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
        Schema::table('users', function (Blueprint $table) {
            // Add missing active field
            if (! Schema::hasColumn('users', 'active')) {
                $table->boolean('active')->default(true)->after('email_verified_at');
            }

            // Check if we need to rename columns to match database schema
            if (Schema::hasColumn('users', 'department_id') && ! Schema::hasColumn('users', 'department')) {
                $table->renameColumn('department_id', 'department');
            }

            if (Schema::hasColumn('users', 'designation_id') && ! Schema::hasColumn('users', 'designation')) {
                $table->renameColumn('designation_id', 'designation');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'active')) {
                $table->dropColumn('active');
            }

            if (Schema::hasColumn('users', 'department') && ! Schema::hasColumn('users', 'department_id')) {
                $table->renameColumn('department', 'department_id');
            }

            if (Schema::hasColumn('users', 'designation') && ! Schema::hasColumn('users', 'designation_id')) {
                $table->renameColumn('designation', 'designation_id');
            }
        });
    }
};
