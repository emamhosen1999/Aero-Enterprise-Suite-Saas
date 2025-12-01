<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add asynchronous provisioning columns to tenants table.
 *
 * This migration supports the async tenant provisioning workflow:
 * - status: Extended to include 'provisioning' and 'failed' states
 * - provisioning_step: Tracks current provisioning step (creating_db, migrating, seeding)
 * - admin_data: Temporarily stores admin credentials until database is ready
 *
 * @author EOS365 Architecture Team
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // Provisioning step tracker (e.g., 'creating_db', 'migrating', 'seeding')
            if (! Schema::hasColumn('tenants', 'provisioning_step')) {
                $table->string('provisioning_step')->nullable()->after('status')
                    ->comment('Current provisioning step: creating_db, migrating, seeding, creating_admin');
            }

            // Temporary admin data storage (name, email, hashed password)
            // This is cleared after the admin user is created in the tenant database
            if (! Schema::hasColumn('tenants', 'admin_data')) {
                $table->json('admin_data')->nullable()->after('provisioning_step')
                    ->comment('Temporary storage for admin credentials during provisioning');
            }

            // Index for filtering tenants by provisioning status
            $table->index('provisioning_step', 'tenants_provisioning_step_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropIndex('tenants_provisioning_step_index');

            if (Schema::hasColumn('tenants', 'admin_data')) {
                $table->dropColumn('admin_data');
            }

            if (Schema::hasColumn('tenants', 'provisioning_step')) {
                $table->dropColumn('provisioning_step');
            }
        });
    }
};
