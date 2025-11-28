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
        // Benefits
        Schema::create('benefits', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('type'); // health, dental, vision, retirement, insurance, perks, etc.
            $table->string('provider')->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->text('eligibility_criteria')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('status')->default('active'); // active, inactive
            $table->timestamps();
        });

        // Pivot table for employees and benefits
        Schema::create('employee_benefits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('benefit_id')->constrained()->onDelete('cascade');
            $table->date('enrollment_date');
            $table->date('end_date')->nullable();
            $table->string('coverage_level')->nullable(); // individual, family, etc.
            $table->decimal('cost_to_employee', 10, 2)->nullable();
            $table->string('status')->default('active'); // active, inactive, pending
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_benefits');
        Schema::dropIfExists('benefits');
    }
};
