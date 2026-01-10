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
        Schema::create('asset_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->date('allocated_date');
            $table->date('expected_return_date')->nullable();
            $table->date('returned_date')->nullable();
            $table->text('allocation_notes')->nullable();
            $table->text('return_notes')->nullable();
            $table->enum('condition_on_allocation', ['new', 'good', 'fair', 'poor'])->default('good');
            $table->enum('condition_on_return', ['new', 'good', 'fair', 'poor', 'damaged'])->nullable();
            $table->foreignId('allocated_by')->constrained('users')->onDelete('restrict');
            $table->foreignId('returned_to')->nullable()->constrained('users')->onDelete('restrict');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('allocated_date');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asset_allocations');
    }
};
