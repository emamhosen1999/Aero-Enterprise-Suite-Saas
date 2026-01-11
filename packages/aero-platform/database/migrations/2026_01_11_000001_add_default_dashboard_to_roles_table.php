<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Add default_dashboard column to roles table
 *
 * This enables role-based dashboard routing where each role can have
 * a different default landing page (dashboard) after login.
 *
 * Examples:
 * - Super Administrator → 'dashboard' (Core Dashboard)
 * - HR Manager → 'hrm.dashboard' (HRM Dashboard)
 * - Employee → 'employee.dashboard' (Employee Portal)
 * - Finance Manager → 'finance.dashboard' (Finance Dashboard)
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->string('default_dashboard', 100)
                ->nullable()
                ->after('description')
                ->comment('Route name for the default dashboard (e.g., hrm.dashboard)');

            $table->unsignedSmallInteger('priority')
                ->default(0)
                ->after('default_dashboard')
                ->comment('Role priority for determining primary role (higher = more important)');
        });

        // Set default dashboards for common roles
        $this->seedDefaultDashboards();
    }

    /**
     * Seed default dashboard assignments for standard roles.
     */
    protected function seedDefaultDashboards(): void
    {
        $defaults = [
            'Super Administrator' => ['dashboard' => 'dashboard', 'priority' => 100],
            'Administrator' => ['dashboard' => 'dashboard', 'priority' => 90],
            'HR Manager' => ['dashboard' => 'hrm.dashboard', 'priority' => 70],
            'HR Staff' => ['dashboard' => 'hrm.dashboard', 'priority' => 60],
            'Finance Manager' => ['dashboard' => 'finance.dashboard', 'priority' => 70],
            'Finance Staff' => ['dashboard' => 'finance.dashboard', 'priority' => 60],
            'Project Manager' => ['dashboard' => 'projects.dashboard', 'priority' => 70],
            'CRM Manager' => ['dashboard' => 'crm.dashboard', 'priority' => 70],
            'Inventory Manager' => ['dashboard' => 'inventory.dashboard', 'priority' => 70],
            'Employee' => ['dashboard' => 'hrm.employee.dashboard', 'priority' => 10],
            'User' => ['dashboard' => 'hrm.employee.dashboard', 'priority' => 5],
        ];

        foreach ($defaults as $roleName => $config) {
            \Illuminate\Support\Facades\DB::table('roles')
                ->where('name', $roleName)
                ->update([
                    'default_dashboard' => $config['dashboard'],
                    'priority' => $config['priority'],
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn(['default_dashboard', 'priority']);
        });
    }
};
