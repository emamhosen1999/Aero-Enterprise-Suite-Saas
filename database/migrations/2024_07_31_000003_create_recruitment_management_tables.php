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
        // Jobs Table
        Schema::create('jobs_recruitment', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->text('requirements')->nullable();
            $table->text('responsibilities')->nullable();
            $table->text('qualifications')->nullable();
            $table->text('benefits')->nullable();
            $table->foreignId('department_id')->nullable()->constrained('departments')->onDelete('set null');
            $table->string('location')->nullable();
            $table->enum('type', ['full_time', 'part_time', 'contract', 'temporary', 'internship', 'remote'])->default('full_time');
            $table->enum('status', ['draft', 'open', 'closed', 'on_hold', 'cancelled'])->default('draft');
            $table->integer('positions')->default(1);
            $table->decimal('salary_min', 10, 2)->nullable();
            $table->decimal('salary_max', 10, 2)->nullable();
            $table->string('salary_currency', 3)->default('USD');
            $table->boolean('salary_visible')->default(false);
            $table->date('posting_date')->nullable();
            $table->date('closing_date')->nullable();
            $table->foreignId('hiring_manager_id')->nullable()->constrained('users')->onDelete('set null');
            $table->json('skills_required')->nullable();
            $table->json('custom_fields')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_remote_allowed')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        // Job Hiring Stages
        Schema::create('job_hiring_stages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained('jobs_recruitment')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('sequence')->default(0);
            $table->boolean('is_active')->default(true);
            $table->json('required_actions')->nullable();
            $table->boolean('requires_approval')->default(false);
            $table->boolean('is_final')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        // Job Applications
        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained('jobs_recruitment')->onDelete('cascade');
            $table->string('applicant_name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->text('cover_letter')->nullable();
            $table->string('resume_path')->nullable();
            $table->foreignId('current_stage_id')->nullable()->constrained('job_hiring_stages')->onDelete('set null');
            $table->enum('status', ['new', 'in_review', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn'])->default('new');
            $table->date('application_date');
            $table->string('source')->nullable();
            $table->json('skills')->nullable();
            $table->decimal('expected_salary', 10, 2)->nullable();
            $table->string('salary_currency', 3)->default('USD');
            $table->text('notes')->nullable();
            $table->json('custom_fields')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Job Application Stage History
        Schema::create('job_application_stage_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('job_applications')->onDelete('cascade');
            $table->foreignId('stage_id')->constrained('job_hiring_stages')->onDelete('cascade');
            $table->foreignId('moved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->dateTime('moved_at');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Job Interviews
        Schema::create('job_interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('job_applications')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('scheduled_at');
            $table->integer('duration_minutes')->default(60);
            $table->string('location')->nullable();
            $table->string('meeting_link')->nullable();
            $table->enum('type', ['phone', 'video', 'in_person', 'technical', 'panel'])->default('video');
            $table->enum('status', ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'])->default('scheduled');
            $table->json('interviewers')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Job Interview Feedback
        Schema::create('job_interview_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_id')->constrained('job_interviews')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('technical_rating')->nullable();
            $table->integer('communication_rating')->nullable();
            $table->integer('cultural_fit_rating')->nullable();
            $table->integer('overall_rating')->nullable();
            $table->text('strengths')->nullable();
            $table->text('weaknesses')->nullable();
            $table->text('comments')->nullable();
            $table->enum('recommendation', ['strong_hire', 'hire', 'neutral', 'do_not_hire', 'strong_do_not_hire'])->nullable();
            $table->timestamps();
            $table->unique(['interview_id', 'user_id']);
        });

        // Job Applicant Education
        Schema::create('job_applicant_education', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('job_applications')->onDelete('cascade');
            $table->string('institution');
            $table->string('degree');
            $table->string('field_of_study')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('is_current')->default(false);
            $table->decimal('grade', 5, 2)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Job Applicant Experience
        Schema::create('job_applicant_experience', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('job_applications')->onDelete('cascade');
            $table->string('company');
            $table->string('position');
            $table->string('location')->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->boolean('is_current')->default(false);
            $table->text('description')->nullable();
            $table->text('achievements')->nullable();
            $table->string('reference_name')->nullable();
            $table->string('reference_contact')->nullable();
            $table->timestamps();
        });

        // Job Offers
        Schema::create('job_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('job_applications')->onDelete('cascade');
            $table->decimal('salary_offered', 10, 2);
            $table->string('salary_currency', 3)->default('USD');
            $table->text('benefits')->nullable();
            $table->date('start_date');
            $table->date('offer_date');
            $table->date('response_deadline')->nullable();
            $table->enum('status', ['draft', 'sent', 'accepted', 'negotiating', 'declined', 'expired'])->default('draft');
            $table->date('response_date')->nullable();
            $table->text('negotiation_notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_offers');
        Schema::dropIfExists('job_applicant_experience');
        Schema::dropIfExists('job_applicant_education');
        Schema::dropIfExists('job_interview_feedback');
        Schema::dropIfExists('job_interviews');
        Schema::dropIfExists('job_application_stage_history');
        Schema::dropIfExists('job_applications');
        Schema::dropIfExists('job_hiring_stages');
        Schema::dropIfExists('jobs_recruitment');
    }
};
