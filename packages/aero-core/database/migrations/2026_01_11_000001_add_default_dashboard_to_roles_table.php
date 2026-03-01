<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add default_dashboard and priority columns to roles table.
 *
 * This migration enables role-based dashboard routing where each role
 * can have a specific dashboard assigned as the default landing page.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            // Skip if column already exists
            if (Schema::hasColumn('roles', 'default_dashboard')) {
                return;
            }
        });

        // Add columns if they don't exist
        if (! Schema::hasColumn('roles', 'default_dashboard')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->string('default_dashboard')->nullable()->after('description')
                    ->comment('Route name for the default dashboard (e.g., hrm.dashboard, core.dashboard)');
            });
        }

        if (! Schema::hasColumn('roles', 'priority')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->integer('priority')->default(0)->after('default_dashboard')
                    ->comment('Priority for determining which role dashboard takes precedence (higher = more important)');
            });
        }

        // Seed default dashboard assignments for common roles
        $this->seedDefaultDashboards();
    }

    /**
     * Seed default dashboard assignments for common roles.
     */
    protected function seedDefaultDashboards(): void
    {
        $roleDefaults = [
            'Super Administrator' => ['dashboard' => 'core.dashboard', 'priority' => 100],
            'Administrator' => ['dashboard' => 'core.dashboard', 'priority' => 90],
            'HR Manager' => ['dashboard' => 'hrm.dashboard', 'priority' => 80],
            'HR Staff' => ['dashboard' => 'hrm.dashboard', 'priority' => 70],
            'Finance Manager' => ['dashboard' => 'finance.dashboard', 'priority' => 80],
            'Project Manager' => ['dashboard' => 'projects.dashboard', 'priority' => 80],
            'CRM Manager' => ['dashboard' => 'crm.dashboard', 'priority' => 80],
            'Employee' => ['dashboard' => 'hrm.employee.dashboard', 'priority' => 10],
        ];

        foreach ($roleDefaults as $roleName => $settings) {
            \Illuminate\Support\Facades\DB::table('roles')
                ->where('name', $roleName)
                ->update([
                    'default_dashboard' => $settings['dashboard'],
                    'priority' => $settings['priority'],
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            if (Schema::hasColumn('roles', 'default_dashboard')) {
                $table->dropColumn('default_dashboard');
            }
            if (Schema::hasColumn('roles', 'priority')) {
                $table->dropColumn('priority');
            }
        });
    }
};
