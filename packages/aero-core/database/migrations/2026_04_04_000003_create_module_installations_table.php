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
        Schema::create('module_installations', function (Blueprint $table) {
            $table->id();
            $table->string('module_code')->unique()->index()->comment('Module code: e.g., aero:hrm, aero:crm, aero:project');
            $table->string('module_name')->comment('Human-readable module name');
            $table->string('version')->comment('Module version');
            $table->enum('status', ['active', 'inactive', 'failed', 'pending', 'disabled'])->default('pending');
            $table->text('failed_reason')->nullable()->comment('Why installation failed (if status=failed)');
            $table->boolean('migrations_verified')->default(false)->comment('All migrations for this module have run');
            $table->boolean('provider_loaded')->default(false)->comment('Service provider was loaded by Laravel');
            $table->boolean('routes_registered')->default(false)->comment('Routes were registered');
            $table->boolean('tables_exist')->default(false)->comment('All expected tables exist in DB');
            $table->boolean('permissions_synced')->default(false)->comment('Permissions/roles were synced');
            $table->integer('migration_count')->default(0)->comment('Number of migrations for this module');
            $table->integer('migrations_run')->default(0)->comment('Number of migrations actually executed');
            $table->json('features')->nullable()->comment('Feature flags and module-specific config');
            $table->json('dependencies')->nullable()->comment('Array of required modules');
            $table->timestamp('installed_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'module_code']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('module_installations');
    }
};
