<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create Modules Table
 * 
 * Top-level module hierarchy for organizing application features.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            
            // Core identifiers
            $table->string('code')->unique()->comment('Unique module identifier (e.g., user_management, hrm)');
            $table->string('scope')->default('tenant')->comment('platform or tenant');
            $table->string('name');
            $table->text('description')->nullable();
            
            // UI
            $table->string('icon')->nullable();
            $table->string('route_prefix')->nullable();
            $table->string('category')->default('core_system');
            $table->integer('priority')->default(100);
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->boolean('is_core')->default(false)->comment('Core modules cannot be disabled');
            
            // Configuration
            $table->json('settings')->nullable();
            $table->string('version')->nullable();
            $table->string('min_plan')->nullable();
            $table->string('license_type')->nullable();
            $table->json('dependencies')->nullable()->comment('Array of module codes this depends on');
            $table->date('release_date')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('code');
            $table->index('scope');
            $table->index('category');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modules');
    }
};
