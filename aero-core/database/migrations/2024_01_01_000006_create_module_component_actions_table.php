<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create Module Component Actions Table
 * 
 * Fourth (leaf) level of module hierarchy (view, create, edit, delete, etc.)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_component_actions', function (Blueprint $table) {
            $table->id();
            
            // Parent reference
            $table->foreignId('module_component_id')
                ->constrained('module_components')
                ->cascadeOnDelete();
            
            // Core identifiers
            $table->string('code')->comment('Action code (e.g., view, create, edit, delete)');
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Indexes
            $table->unique(['module_component_id', 'code']);
            $table->index('code');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_component_actions');
    }
};
