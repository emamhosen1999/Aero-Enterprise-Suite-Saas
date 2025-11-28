<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates a comprehensive module permission registry system:
     * - Modules: Top-level application modules (HRM, CRM, DMS, etc.)
     * - Sub-modules: Functional areas within modules (Employees, Departments, etc.)
     * - Components: UI components or features that require specific access
     */
    public function up(): void
    {
        // Main modules table - defines top-level application modules
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique()->comment('Unique module identifier (hrm, crm, dms)');
            $table->string('name', 100)->comment('Display name of the module');
            $table->text('description')->nullable();
            $table->string('icon', 100)->nullable()->comment('Icon class or component name');
            $table->string('route_prefix', 100)->nullable()->comment('URL route prefix');
            $table->string('category', 50)->default('operations')->comment('Module category for grouping');
            $table->unsignedSmallInteger('priority')->default(100)->comment('Display order priority');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_core')->default(false)->comment('Core system module that cannot be disabled');
            $table->json('settings')->nullable()->comment('Module-specific configuration');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['category', 'priority']);
            $table->index('is_active');
        });

        // Sub-modules table - defines functional areas within modules
        Schema::create('sub_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
            $table->string('code', 50)->comment('Unique identifier within parent module');
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->string('icon', 100)->nullable();
            $table->string('route', 200)->nullable()->comment('Named route for this sub-module');
            $table->unsignedSmallInteger('priority')->default(100);
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['module_id', 'code']);
            $table->index(['module_id', 'priority']);
        });

        // Components table - defines UI components/features that need permission control
        Schema::create('module_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sub_module_id')->nullable()->constrained('sub_modules')->cascadeOnDelete();
            $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
            $table->string('code', 50)->comment('Component identifier');
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->enum('type', ['page', 'section', 'widget', 'action', 'api'])->default('page');
            $table->string('route', 200)->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique(['module_id', 'sub_module_id', 'code']);
            $table->index('type');
        });

        // Module permission requirements - links modules/sub-modules/components to required permissions
        Schema::create('module_permission_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->nullable()->constrained('modules')->cascadeOnDelete();
            $table->foreignId('sub_module_id')->nullable()->constrained('sub_modules')->cascadeOnDelete();
            $table->foreignId('component_id')->nullable()->constrained('module_components')->cascadeOnDelete();
            $table->unsignedBigInteger('permission_id')->comment('References Spatie permissions table');
            $table->enum('requirement_type', ['required', 'any', 'all'])->default('required')
                ->comment('required=must have, any=need one of group, all=need all in group');
            $table->string('requirement_group', 50)->nullable()->comment('Group name for any/all logic');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('permission_id')->references('id')->on('permissions')->cascadeOnDelete();
            $table->index(['module_id', 'permission_id']);
            $table->index(['sub_module_id', 'permission_id']);
            $table->index(['component_id', 'permission_id']);
        });

        // Drop the auto-generated table if it exists
        Schema::dropIfExists('module_permissions');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('module_permission_requirements');
        Schema::dropIfExists('module_components');
        Schema::dropIfExists('sub_modules');
        Schema::dropIfExists('modules');
    }
};
