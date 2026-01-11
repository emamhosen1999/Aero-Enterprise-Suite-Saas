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
        // Benefits table
        Schema::create('benefits', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['health', 'retirement', 'insurance', 'leave', 'other']);
            $table->decimal('value', 15, 2)->nullable();
            $table->enum('value_type', ['fixed', 'percentage']);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Competencies table
        Schema::create('competencies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->integer('max_level')->default(5);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Education table
        Schema::create('education', function (Blueprint $table) {
            $table->id();
            $table->string('degree');
            $table->string('field_of_study');
            $table->string('institution');
            $table->year('start_year');
            $table->year('end_year')->nullable();
            $table->decimal('grade', 5, 2)->nullable();
            $table->string('grade_type')->default('percentage'); // percentage, gpa, etc.
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Events table
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type')->default('meeting'); // meeting, training, social, etc.
            $table->datetime('start_time');
            $table->datetime('end_time');
            $table->string('location')->nullable();
            $table->unsignedBigInteger('organizer_id');
            $table->integer('max_attendees')->nullable();
            $table->enum('status', ['draft', 'published', 'cancelled'])->default('draft');
            $table->boolean('is_recurring')->default(false);
            $table->string('recurrence_pattern')->nullable();
            $table->foreign('organizer_id')->references('id')->on('users')->onDelete('cascade');
            $table->timestamps();
        });

        // Event activity logs table
        Schema::create('event_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('event_id');
            $table->unsignedBigInteger('user_id');
            $table->string('action'); // created, updated, cancelled, attended, etc.
            $table->json('details')->nullable();
            $table->timestamp('occurred_at');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->timestamps();
        });

        // Event custom fields table
        Schema::create('event_custom_fields', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('event_id');
            $table->string('field_name');
            $table->string('field_type'); // text, number, date, boolean, select
            $table->text('field_value')->nullable();
            $table->json('field_options')->nullable(); // for select fields
            $table->boolean('is_required')->default(false);
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
            $table->timestamps();
        });

        // Event registrations table
        Schema::create('event_registrations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('event_id');
            $table->unsignedBigInteger('user_id');
            $table->enum('status', ['registered', 'attended', 'cancelled'])->default('registered');
            $table->timestamp('registered_at');
            $table->timestamp('attended_at')->nullable();
            $table->text('notes')->nullable();
            $table->json('custom_responses')->nullable(); // responses to custom fields
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->timestamps();
        });

        // Experiences table
        Schema::create('experiences', function (Blueprint $table) {
            $table->id();
            $table->string('position');
            $table->string('company');
            $table->string('location')->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->boolean('is_current')->default(false);
            $table->text('description')->nullable();
            $table->json('skills')->nullable(); // array of skills gained
            $table->timestamps();
        });

        // HR Documents table
        Schema::create('hr_documents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category'); // policy, procedure, form, handbook, etc.
            $table->string('file_path');
            $table->string('file_name');
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size');
            $table->unsignedBigInteger('uploaded_by');
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->date('effective_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('version')->default('1.0');
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');
            $table->timestamps();
        });

        // KPI Values table (fix table name)
        Schema::create('kpi_values', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('kpi_id');
            $table->unsignedBigInteger('employee_id');
            $table->decimal('value', 15, 2);
            $table->date('period_start');
            $table->date('period_end');
            $table->text('notes')->nullable();
            $table->foreign('kpi_id')->references('id')->on('kpis')->onDelete('cascade');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->timestamps();
        });

        // Opportunities table
        Schema::create('opportunities', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->unsignedBigInteger('department_id');
            $table->enum('type', ['promotion', 'transfer', 'project', 'training']);
            $table->enum('status', ['open', 'closed', 'on_hold'])->default('open');
            $table->date('application_deadline')->nullable();
            $table->json('required_skills')->nullable();
            $table->text('requirements')->nullable();
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            $table->timestamps();
        });

        // Safety Incidents table
        Schema::create('safety_incidents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->unsignedBigInteger('department_id');
            $table->string('location');
            $table->enum('severity', ['low', 'medium', 'high', 'critical']);
            $table->date('incident_date');
            $table->unsignedBigInteger('reported_by');
            $table->enum('status', ['open', 'investigating', 'resolved', 'closed'])->default('open');
            $table->text('resolution')->nullable();
            $table->unsignedBigInteger('resolved_by')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            $table->foreign('reported_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('resolved_by')->references('id')->on('users')->onDelete('cascade');
            $table->timestamps();
        });

        // Safety Incident Participants table
        Schema::create('safety_incident_participants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('incident_id');
            $table->unsignedBigInteger('employee_id');
            $table->enum('role', ['victim', 'witness', 'investigator']);
            $table->text('statement')->nullable();
            $table->foreign('incident_id')->references('id')->on('safety_incidents')->onDelete('cascade');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->timestamps();
        });

        // Safety Inspections table
        Schema::create('safety_inspections', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('department_id');
            $table->string('area');
            $table->date('inspection_date');
            $table->unsignedBigInteger('inspector_id');
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])->default('scheduled');
            $table->text('findings')->nullable();
            $table->json('checklist')->nullable();
            $table->integer('score')->nullable(); // out of 100
            $table->text('recommendations')->nullable();
            $table->date('next_inspection_date')->nullable();
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            $table->foreign('inspector_id')->references('id')->on('users')->onDelete('cascade');
            $table->timestamps();
        });

        // Safety Trainings table
        Schema::create('safety_trainings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('trainer_name');
            $table->date('training_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('location');
            $table->integer('max_participants')->nullable();
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])->default('scheduled');
            $table->json('materials')->nullable(); // training materials/documents
            $table->timestamps();
        });

        // Skills table
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->enum('type', ['technical', 'soft', 'language', 'certification']);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Sub Events table
        Schema::create('sub_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('parent_event_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->datetime('start_time');
            $table->datetime('end_time');
            $table->string('location')->nullable();
            $table->unsignedBigInteger('facilitator_id')->nullable();
            $table->integer('max_attendees')->nullable();
            $table->integer('sort_order')->default(0);
            $table->foreign('parent_event_id')->references('id')->on('events')->onDelete('cascade');
            $table->foreign('facilitator_id')->references('id')->on('users')->onDelete('set null');
            $table->timestamps();
        });

        // Trainings table
        Schema::create('trainings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('category_id');
            $table->string('instructor');
            $table->integer('duration_hours');
            $table->decimal('cost', 10, 2)->nullable();
            $table->enum('delivery_method', ['classroom', 'online', 'hybrid']);
            $table->integer('max_participants')->nullable();
            $table->text('prerequisites')->nullable();
            $table->text('objectives')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->foreign('category_id')->references('id')->on('training_categories')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trainings');
        Schema::dropIfExists('sub_events');
        Schema::dropIfExists('skills');
        Schema::dropIfExists('safety_trainings');
        Schema::dropIfExists('safety_inspections');
        Schema::dropIfExists('safety_incident_participants');
        Schema::dropIfExists('safety_incidents');
        Schema::dropIfExists('opportunities');
        Schema::dropIfExists('kpi_values');
        Schema::dropIfExists('hr_documents');
        Schema::dropIfExists('experiences');
        Schema::dropIfExists('event_registrations');
        Schema::dropIfExists('event_custom_fields');
        Schema::dropIfExists('event_activity_logs');
        Schema::dropIfExists('events');
        Schema::dropIfExists('education');
        Schema::dropIfExists('competencies');
        Schema::dropIfExists('benefits');
    }
};