<?php

declare(strict_types=1);

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
        if (Schema::hasTable('role_module_access')) {
            return;
        }

        Schema::create('role_module_access', function (Blueprint $table) {
            $table->id();

            // Role identification
            $table->unsignedBigInteger('role_id');

            // Module access hierarchy - nullable for granular control
            $table->foreignId('module_id')->nullable()->constrained('modules')->cascadeOnDelete();
            $table->foreignId('sub_module_id')->nullable()->constrained('sub_modules')->cascadeOnDelete();
            $table->foreignId('component_id')->nullable()->constrained('module_components')->cascadeOnDelete();
            $table->foreignId('action_id')->nullable()->constrained('module_component_actions')->cascadeOnDelete();

            // Access scope - 'all', 'own', 'team', 'department'
            $table->string('access_scope')->default('all');

            $table->timestamps();

            // Unique constraint to prevent duplicate access entries
            $table->unique(
                ['role_id', 'module_id', 'sub_module_id', 'component_id', 'action_id'],
                'role_module_access_unique'
            );

            // Performance indexes
            $table->index(['role_id', 'module_id']);
            $table->index(['role_id', 'sub_module_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_module_access');
    }
};
