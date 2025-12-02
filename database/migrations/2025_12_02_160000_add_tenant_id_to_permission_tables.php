<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds tenant_id column to roles, model_has_roles, and model_has_permissions tables
     * to enable tenant-scoped RBAC (Role-Based Access Control).
     *
     * Note: We add tenant_id without modifying primary keys to avoid foreign key constraint issues.
     * The application logic will enforce tenant scoping through WHERE clauses.
     */
    public function up(): void
    {
        // Add tenant_id to roles table
        if (Schema::hasTable('roles') && ! Schema::hasColumn('roles', 'tenant_id')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->string('tenant_id')->nullable()->after('id');
                $table->index('tenant_id');
            });
        }

        // Add tenant_id to model_has_roles pivot table
        if (Schema::hasTable('model_has_roles') && ! Schema::hasColumn('model_has_roles', 'tenant_id')) {
            Schema::table('model_has_roles', function (Blueprint $table) {
                $table->string('tenant_id')->nullable()->after('role_id');
                $table->index('tenant_id');
                $table->index(['tenant_id', 'role_id']);
            });
        }

        // Add tenant_id to model_has_permissions pivot table
        if (Schema::hasTable('model_has_permissions') && ! Schema::hasColumn('model_has_permissions', 'tenant_id')) {
            Schema::table('model_has_permissions', function (Blueprint $table) {
                $table->string('tenant_id')->nullable()->after('permission_id');
                $table->index('tenant_id');
                $table->index(['tenant_id', 'permission_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove tenant_id from model_has_permissions
        if (Schema::hasTable('model_has_permissions') && Schema::hasColumn('model_has_permissions', 'tenant_id')) {
            Schema::table('model_has_permissions', function (Blueprint $table) {
                $table->dropIndex(['tenant_id', 'permission_id']);
                $table->dropIndex(['tenant_id']);
                $table->dropColumn('tenant_id');
            });
        }

        // Remove tenant_id from model_has_roles
        if (Schema::hasTable('model_has_roles') && Schema::hasColumn('model_has_roles', 'tenant_id')) {
            Schema::table('model_has_roles', function (Blueprint $table) {
                $table->dropIndex(['tenant_id', 'role_id']);
                $table->dropIndex(['tenant_id']);
                $table->dropColumn('tenant_id');
            });
        }

        // Remove tenant_id from roles
        if (Schema::hasTable('roles') && Schema::hasColumn('roles', 'tenant_id')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->dropIndex(['tenant_id']);
                $table->dropColumn('tenant_id');
            });
        }
    }
};
