<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Employee Salary Structures Migration
 *
 * Links employees to their salary components with custom values.
 * Allows per-employee salary templates and overrides.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('employee_salary_structures')) {
            Schema::create('employee_salary_structures', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('salary_component_id')->constrained()->cascadeOnDelete();

                // Override values (optional - uses component defaults if null)
                $table->decimal('amount', 15, 2)->nullable();
                $table->decimal('percentage_value', 10, 4)->nullable();
                $table->enum('calculation_type', ['fixed', 'percentage', 'formula', 'attendance', 'slab'])->nullable();

                // Effective period
                $table->date('effective_from');
                $table->date('effective_to')->nullable();

                // Status
                $table->boolean('is_active')->default(true);
                $table->text('notes')->nullable();

                $table->timestamps();
                $table->softDeletes();

                // Indexes
                $table->index(['user_id', 'is_active']);
                $table->index(['salary_component_id', 'user_id']);
                $table->index(['effective_from', 'effective_to']);

                // Ensure unique active component per employee
                $table->unique(['user_id', 'salary_component_id', 'effective_from'], 'unique_active_component');
            });
        }

        // Salary Templates (optional - for bulk assignment)
        if (! Schema::hasTable('salary_templates')) {
            Schema::create('salary_templates', function (Blueprint $table) {
                $table->id();
                $table->string('name'); // E.g., "Junior Developer", "Senior Manager"
                $table->string('code', 50)->unique();
                $table->text('description')->nullable();

                // CTC range
                $table->decimal('min_ctc', 15, 2)->nullable();
                $table->decimal('max_ctc', 15, 2)->nullable();

                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Salary Template Components (which components are in each template)
        if (! Schema::hasTable('salary_template_components')) {
            Schema::create('salary_template_components', function (Blueprint $table) {
                $table->id();
                $table->foreignId('salary_template_id')->constrained()->cascadeOnDelete();
                $table->foreignId('salary_component_id')->constrained()->cascadeOnDelete();

                // Template-specific values
                $table->decimal('amount', 15, 2)->nullable();
                $table->decimal('percentage_value', 10, 4)->nullable();
                $table->enum('calculation_type', ['fixed', 'percentage', 'formula', 'attendance', 'slab'])->nullable();

                $table->integer('display_order')->default(0);
                $table->boolean('is_optional')->default(false);

                $table->timestamps();

                $table->unique(['salary_template_id', 'salary_component_id'], 'unique_template_component');
            });
        }

        // Salary Revision History
        if (! Schema::hasTable('salary_revisions')) {
            Schema::create('salary_revisions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();

                // Previous and new CTC
                $table->decimal('previous_ctc', 15, 2);
                $table->decimal('new_ctc', 15, 2);
                $table->decimal('increment_amount', 15, 2);
                $table->decimal('increment_percentage', 5, 2);

                // Revision details
                $table->enum('revision_type', ['annual', 'promotion', 'special', 'adjustment'])->default('annual');
                $table->date('effective_from');
                $table->text('reason')->nullable();

                // Approval workflow
                $table->enum('status', ['draft', 'pending', 'approved', 'rejected'])->default('draft');
                $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->date('approved_at')->nullable();
                $table->text('approval_notes')->nullable();

                $table->timestamps();
                $table->softDeletes();

                $table->index(['user_id', 'effective_from']);
                $table->index('status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_revisions');
        Schema::dropIfExists('salary_template_components');
        Schema::dropIfExists('salary_templates');
        Schema::dropIfExists('employee_salary_structures');
    }
};
