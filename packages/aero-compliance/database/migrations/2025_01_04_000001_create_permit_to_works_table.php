<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Permit to Work System - PATENTABLE CORE IP
     * 
     * Digital permit authorization system for high-risk activities.
     * Used by PermitValidationService and RequiresPermit trait.
     * 
     * NOVELTY: Automatic permit enforcement with emergency revocation
     * preventing unauthorized dangerous work.
     */
    public function up(): void
    {
        Schema::create('permit_to_works', function (Blueprint $table) {
            $table->id();
            $table->string('permit_number', 50)->unique()->comment('PTW-YYYY-NNNN');
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            
            // Permit Type
            $table->enum('permit_type', [
                'hot_work',           // Welding, grinding, cutting
                'confined_space',     // Tanks, manholes, tunnels
                'work_at_height',     // Scaffolding, platforms
                'excavation',         // Digging, trenching
                'electrical',         // High voltage work
                'lifting_operations', // Crane, heavy machinery
            ])->comment('Category of high-risk work');
            
            // Work Details
            $table->text('work_description')->comment('Detailed description of work to be performed');
            $table->json('activity_types')->nullable()->comment('Specific activities covered');
            $table->date('valid_from')->comment('Permit start date');
            $table->date('valid_until')->comment('Permit expiry date');
            $table->time('time_from')->nullable()->comment('Daily start time');
            $table->time('time_until')->nullable()->comment('Daily end time');
            
            // Location Coverage
            $table->decimal('start_chainage', 10, 3)->nullable()->comment('Start of permitted area (km)');
            $table->decimal('end_chainage', 10, 3)->nullable()->comment('End of permitted area (km)');
            $table->json('location_details')->nullable()->comment('Additional location info');
            
            // Authorization
            $table->foreignId('requested_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->json('authorized_workers')->comment('Array of user_ids allowed to work');
            $table->json('authorized_equipment')->nullable()->comment('Equipment/tools permitted');
            
            // Conditions & Safety
            $table->json('permit_conditions')->nullable()->comment('Safety conditions that must be met');
            $table->boolean('equipment_check_required')->default(true);
            $table->timestamp('equipment_last_checked')->nullable();
            $table->boolean('personnel_requirement_met')->default(false);
            $table->boolean('environmental_check_done')->default(false);
            
            // Risk Assessment
            $table->enum('risk_level', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->json('identified_hazards')->nullable()->comment('List of identified risks');
            $table->json('control_measures')->nullable()->comment('Mitigation measures in place');
            
            // Status & Workflow
            $table->enum('status', [
                'draft',
                'pending_approval',
                'approved',
                'active',
                'suspended',
                'revoked',
                'expired',
                'completed',
            ])->default('draft');
            $table->text('status_notes')->nullable();
            
            // Revocation (Emergency Stop-Work)
            $table->foreignId('revoked_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('revoked_at')->nullable();
            $table->text('revocation_reason')->nullable()->comment('Reason for emergency revocation');
            $table->integer('affected_rfis_locked')->default(0)->comment('Count of RFIs auto-locked');
            
            // Completion
            $table->foreignId('closed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('closed_at')->nullable();
            $table->text('completion_notes')->nullable();
            
            // Audit Trail
            $table->json('audit_log')->nullable()->comment('History of status changes');
            $table->timestamps();
            $table->softDeletes();

            // Indexes for performance
            $table->index(['project_id', 'status', 'valid_from', 'valid_until'], 'idx_permit_validity');
            $table->index(['permit_type', 'status'], 'idx_permit_type_status');
            $table->index(['start_chainage', 'end_chainage'], 'idx_permit_chainage');
            $table->index('valid_until');
            $table->index('status');
        });

        // Add comment to table
        DB::statement("COMMENT ON TABLE permit_to_works IS 'Digital PTW system with automatic enforcement and emergency revocation (CORE IP)'");
    }

    public function down(): void
    {
        Schema::dropIfExists('permit_to_works');
    }
};
