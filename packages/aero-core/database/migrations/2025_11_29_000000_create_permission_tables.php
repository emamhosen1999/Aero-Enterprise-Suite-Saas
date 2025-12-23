<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create roles tables for Role-Module Access system
 * 
 * This creates ONLY the roles and model_has_roles tables.
 * We use role_module_access (created in separate migration) instead of permissions.
 * 
 * The system works as follows:
 * - roles: Define user roles (Admin, Manager, Employee, etc.)
 * - model_has_roles: Assign roles to users
 * - role_module_access: Grant module/submodule/component/action access to roles
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create roles table
        if (!Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('description')->nullable();
                $table->string('guard_name')->default('web');
                $table->boolean('is_protected')->default(false)->comment('Protected roles cannot be deleted');
                $table->timestamps();

                $table->unique(['name', 'guard_name']);
            });
        }

        // Create model_has_roles pivot table (users <-> roles)
        if (!Schema::hasTable('model_has_roles')) {
            Schema::create('model_has_roles', function (Blueprint $table) {
                $table->unsignedBigInteger('role_id');
                $table->string('model_type');
                $table->unsignedBigInteger('model_id');
                
                $table->foreign('role_id')
                    ->references('id')
                    ->on('roles')
                    ->onDelete('cascade');

                $table->index(['model_id', 'model_type'], 'model_has_roles_model_id_model_type_index');

                $table->primary(['role_id', 'model_id', 'model_type'], 'model_has_roles_role_model_type_primary');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('model_has_roles');
        Schema::dropIfExists('roles');
    }
};
