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
        Schema::create('warnings', function (Blueprint $table) {
            $table->id();
            $table->string('warning_number')->unique();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('disciplinary_case_id')->nullable()->constrained('disciplinary_cases')->onDelete('set null');
            $table->enum('type', ['verbal', 'written', 'final'])->default('verbal');
            $table->text('reason');
            $table->date('issued_date');
            $table->date('expiry_date')->nullable();
            $table->foreignId('issued_by')->constrained('users')->onDelete('restrict');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('warning_number');
            $table->index('is_active');
            $table->index('issued_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warnings');
    }
};
