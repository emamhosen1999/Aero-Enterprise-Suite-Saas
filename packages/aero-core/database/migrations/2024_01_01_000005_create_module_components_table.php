<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create Module Components Table
 * 
 * Third level of module hierarchy (pages, forms, widgets, etc.)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_components', function (Blueprint $table) {
            $table->id();
            
            // Parent references
            $table->foreignId('module_id')
                ->constrained('modules')
                ->cascadeOnDelete();
            $table->foreignId('sub_module_id')
                ->constrained('sub_modules')
                ->cascadeOnDelete();
            
            // Core identifiers
            $table->string('code')->comment('Unique within sub_module (e.g., user_list, user_profile)');
            $table->string('name');
            $table->text('description')->nullable();
            
            // Component details
            $table->string('type')->default('page')->comment('page, widget, form, modal, etc.');
            $table->string('route')->nullable();
            $table->integer('priority')->default(100);
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Indexes
            $table->unique(['sub_module_id', 'code']);
            $table->index('type');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_components');
    }
};
