<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * DUPLICATE MIGRATION - Also exists in database/migrations/
 * 
 * This migration creates the grades lookup table.
 * It exists in BOTH root and tenant migrations because:
 * - Root (Central DB): Platform-level grade definitions (shared/standardized)
 * - Tenant (Tenant DB): Tenant-specific grade usage (isolated data)
 * 
 * This allows tenants to have their own grade data while maintaining
 * platform-level definitions if needed.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->integer('level')->default(1);
            $table->decimal('min_salary', 10, 2)->nullable();
            $table->decimal('max_salary', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};
