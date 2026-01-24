<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration for Benefits Management module.
 * Creates benefit_plans and benefit_enrollments tables.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Benefit Plans
        if (! Schema::hasTable('benefit_plans')) {
            Schema::create('benefit_plans', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->enum('type', ['health', 'dental', 'vision', 'life', 'retirement', 'disability', 'wellness', 'other'])->default('health');
                $table->decimal('employer_contribution', 12, 2)->default(0);
                $table->decimal('employee_contribution', 12, 2)->default(0);
                $table->enum('contribution_frequency', ['monthly', 'quarterly', 'annually'])->default('monthly');
                $table->date('effective_date')->nullable();
                $table->date('expiration_date')->nullable();
                $table->json('eligibility_criteria')->nullable();
                $table->json('coverage_details')->nullable();
                $table->string('provider_name')->nullable();
                $table->string('policy_number')->nullable();
                $table->integer('waiting_period_days')->default(0);
                $table->enum('status', ['active', 'inactive', 'pending', 'expired'])->default('active');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['status', 'type']);
                $table->index('effective_date');
            });
        }

        // Benefit Enrollments
        if (! Schema::hasTable('benefit_enrollments')) {
            Schema::create('benefit_enrollments', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->foreignId('benefit_plan_id')->constrained('benefit_plans')->cascadeOnDelete();
                $table->date('enrollment_date');
                $table->date('effective_date')->nullable();
                $table->date('termination_date')->nullable();
                $table->enum('coverage_level', ['employee_only', 'employee_spouse', 'employee_children', 'family'])->default('employee_only');
                $table->decimal('employee_contribution', 12, 2)->default(0);
                $table->decimal('employer_contribution', 12, 2)->default(0);
                $table->enum('status', ['active', 'pending', 'terminated', 'waived'])->default('pending');
                $table->json('dependents')->nullable();
                $table->json('beneficiaries')->nullable();
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['employee_id', 'status']);
                $table->index('benefit_plan_id');
                $table->index('enrollment_date');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('benefit_enrollments');
        Schema::dropIfExists('benefit_plans');
    }
};
