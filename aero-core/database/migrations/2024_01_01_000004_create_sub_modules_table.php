<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create Sub Modules Table
 * 
 * Second level of module hierarchy.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sub_modules', function (Blueprint $table) {
            $table->id();
            
            // Parent module
            $table->foreignId('module_id')
                ->constrained('modules')
                ->cascadeOnDelete();
            
            // Core identifiers
            $table->string('code')->comment('Unique within module (e.g., users, roles)');
            $table->string('name');
            $table->text('description')->nullable();
            
            // UI
            $table->string('icon')->nullable();
            $table->string('route')->nullable();
            $table->integer('priority')->default(100);
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Indexes
            $table->unique(['module_id', 'code']);
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sub_modules');
    }
};
