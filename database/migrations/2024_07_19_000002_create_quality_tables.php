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
        // Create quality inspections table
        Schema::create('quality_inspections', function (Blueprint $table) {
            $table->id();
            $table->string('inspection_number')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['incoming', 'in_process', 'final', 'customer_return', 'supplier_evaluation']);
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled']);
            $table->date('scheduled_date');
            $table->date('actual_date')->nullable();
            $table->foreignId('inspector_id')->constrained('users');
            $table->foreignId('department_id')->nullable()->constrained('departments');
            $table->string('product_batch')->nullable();
            $table->integer('sample_size')->nullable();
            $table->text('inspection_criteria')->nullable();
            $table->text('results')->nullable();
            $table->enum('result_status', ['passed', 'failed', 'conditionally_passed'])->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Create quality inspection checkpoints
        Schema::create('quality_checkpoints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained('quality_inspections')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('specification')->nullable();
            $table->string('unit_of_measure')->nullable();
            $table->decimal('min_value', 10, 4)->nullable();
            $table->decimal('max_value', 10, 4)->nullable();
            $table->string('target_value')->nullable();
            $table->enum('result', ['pass', 'fail', 'not_applicable', 'conditionally_passed'])->nullable();
            $table->text('comments')->nullable();
            $table->timestamps();
        });

        // Create Non-Conformance Reports (NCRs)
        Schema::create('quality_ncrs', function (Blueprint $table) {
            $table->id();
            $table->string('ncr_number')->unique();
            $table->string('title');
            $table->text('description');
            $table->enum('severity', ['minor', 'major', 'critical']);
            $table->enum('status', ['open', 'under_review', 'action_assigned', 'action_in_progress', 'closed', 'verified']);
            $table->foreignId('reported_by')->constrained('users');
            $table->foreignId('department_id')->nullable()->constrained('departments');
            $table->foreignId('assigned_to')->nullable()->constrained('users');
            $table->date('detected_date');
            $table->text('root_cause_analysis')->nullable();
            $table->text('immediate_action')->nullable();
            $table->text('corrective_action')->nullable();
            $table->text('preventive_action')->nullable();
            $table->foreignId('closed_by')->nullable()->constrained('users');
            $table->date('closure_date')->nullable();
            $table->text('lessons_learned')->nullable();
            $table->boolean('requires_verification')->default(false);
            $table->date('verification_date')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        // Create Calibration Records table
        Schema::create('quality_calibrations', function (Blueprint $table) {
            $table->id();
            $table->string('equipment_id');
            $table->string('equipment_name');
            $table->string('equipment_serial_number')->nullable();
            $table->string('location')->nullable();
            $table->date('calibration_date');
            $table->date('next_calibration_date');
            $table->foreignId('performed_by')->constrained('users');
            $table->string('calibration_certificate_number')->nullable();
            $table->string('calibration_method')->nullable();
            $table->text('calibration_notes')->nullable();
            $table->enum('status', ['calibrated', 'out_of_calibration', 'pending', 'removed_from_service']);
            $table->string('file_path')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quality_calibrations');
        Schema::dropIfExists('quality_ncrs');
        Schema::dropIfExists('quality_checkpoints');
        Schema::dropIfExists('quality_inspections');
    }
};
