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
        // Safety Incidents
        Schema::create('safety_incidents', function (Blueprint $table) {
            $table->id();
            $table->date('incident_date');
            $table->datetime('incident_time')->nullable();
            $table->string('location');
            $table->string('incident_type'); // injury, near-miss, property-damage, environmental, other
            $table->string('severity'); // minor, moderate, serious, critical
            $table->foreignId('reported_by')->constrained('users');
            $table->text('description');
            $table->text('immediate_actions')->nullable();
            $table->text('root_cause')->nullable();
            $table->text('corrective_actions')->nullable();
            $table->string('status')->default('reported'); // reported, investigating, resolved, closed
            $table->json('witnesses')->nullable();
            $table->boolean('reported_to_authorities')->default(false);
            $table->date('authority_report_date')->nullable();
            $table->json('related_documents')->nullable();
            $table->timestamps();
        });

        // Safety Incident Participants
        Schema::create('safety_incident_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')->constrained('safety_incidents')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained('users');
            $table->string('involvement_type'); // involved, injured, witness
            $table->text('injury_details')->nullable();
            $table->text('treatment_received')->nullable();
            $table->boolean('medical_attention_required')->default(false);
            $table->boolean('time_off_work_required')->default(false);
            $table->date('time_off_start_date')->nullable();
            $table->date('time_off_end_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Safety Inspections
        Schema::create('safety_inspections', function (Blueprint $table) {
            $table->id();
            $table->date('inspection_date');
            $table->string('location');
            $table->foreignId('inspector_id')->constrained('users');
            $table->string('inspection_type'); // routine, follow-up, pre-occupancy, special
            $table->string('status')->default('scheduled'); // scheduled, in-progress, completed, cancelled
            $table->json('findings')->nullable();
            $table->json('recommendations')->nullable();
            $table->date('next_inspection_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Safety Inspection Items
        Schema::create('safety_inspection_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained('safety_inspections')->onDelete('cascade');
            $table->string('item_name');
            $table->string('category')->nullable();
            $table->string('status'); // pass, fail, n/a
            $table->text('issue_description')->nullable();
            $table->string('risk_level')->nullable(); // low, medium, high
            $table->text('recommended_action')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users');
            $table->date('target_completion_date')->nullable();
            $table->date('actual_completion_date')->nullable();
            $table->string('verification_status')->nullable(); // pending, verified
            $table->timestamps();
        });

        // Safety Training
        Schema::create('safety_trainings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('training_type'); // required, recommended, refresher
            $table->string('frequency')->nullable(); // one-time, annual, bi-annual, etc.
            $table->integer('duration_minutes')->nullable();
            $table->foreignId('trainer_id')->nullable()->constrained('users');
            $table->string('status')->default('active'); // active, inactive
            $table->timestamps();
            $table->softDeletes();
        });

        // Safety Training Participants
        Schema::create('safety_training_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_id')->constrained('safety_trainings')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained('users');
            $table->date('completion_date');
            $table->date('expiration_date')->nullable();
            $table->string('completion_status'); // scheduled, completed, expired, cancelled
            $table->string('score')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('safety_training_participants');
        Schema::dropIfExists('safety_trainings');
        Schema::dropIfExists('safety_inspection_items');
        Schema::dropIfExists('safety_inspections');
        Schema::dropIfExists('safety_incident_participants');
        Schema::dropIfExists('safety_incidents');
    }
};
