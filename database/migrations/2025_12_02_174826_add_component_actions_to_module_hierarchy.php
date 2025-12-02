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
        // Add description field to module_components
        Schema::table('module_components', function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
        });

        // Create module_component_actions table
        Schema::create('module_component_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_component_id')->constrained()->onDelete('cascade');
            $table->string('code')->comment('Action code: view, create, update, delete, etc.');
            $table->string('name')->comment('Display name for the action');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['module_component_id', 'code']);
            $table->index('module_component_id');
        });

        // Add module_component_action_id to module_permissions
        Schema::table('module_permissions', function (Blueprint $table) {
            $table->foreignId('module_component_action_id')
                ->nullable()
                ->after('component_id')
                ->constrained('module_component_actions')
                ->onDelete('cascade');

            $table->boolean('is_required')->default(true)->after('requirement_group');
            $table->dropColumn(['requirement_type', 'requirement_group']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('module_permissions', function (Blueprint $table) {
            $table->dropForeign(['module_component_action_id']);
            $table->dropColumn(['module_component_action_id', 'is_required']);
            $table->string('requirement_type')->default('required');
            $table->string('requirement_group')->default('default');
        });

        Schema::dropIfExists('module_component_actions');

        Schema::table('module_components', function (Blueprint $table) {
            $table->dropColumn('description');
        });
    }
};
