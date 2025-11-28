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
        // Training Categories
        Schema::create('training_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Training Sessions
        Schema::create('training_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('category_id')->constrained('training_categories')->onDelete('cascade');
            $table->foreignId('instructor_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('type', ['online', 'in_person', 'hybrid', 'self_paced'])->default('online');
            $table->enum('status', ['draft', 'scheduled', 'in_progress', 'completed', 'cancelled'])->default('draft');
            $table->dateTime('start_date')->nullable();
            $table->dateTime('end_date')->nullable();
            $table->string('location')->nullable();
            $table->string('meeting_link')->nullable();
            $table->integer('capacity')->nullable();
            $table->string('prerequisite')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->json('skills_covered')->nullable();
            $table->json('learning_objectives')->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->json('custom_fields')->nullable();
            $table->boolean('is_mandatory')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        // Training Materials
        Schema::create('training_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('training_sessions')->onDelete('cascade');
            $table->string('title');
            $table->enum('type', ['document', 'video', 'presentation', 'quiz', 'link', 'other'])->default('document');
            $table->text('description')->nullable();
            $table->string('file_path')->nullable();
            $table->string('external_url')->nullable();
            $table->integer('sequence')->default(0);
            $table->boolean('is_required')->default(true);
            $table->integer('duration_minutes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Training Enrollments
        Schema::create('training_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('training_sessions')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['enrolled', 'in_progress', 'completed', 'failed', 'withdrawn'])->default('enrolled');
            $table->dateTime('enrollment_date');
            $table->dateTime('completion_date')->nullable();
            $table->decimal('score', 5, 2)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('certificate_issued')->default(false);
            $table->string('certificate_number')->nullable();
            $table->json('progress_data')->nullable();
            $table->timestamps();
            $table->unique(['session_id', 'user_id']);
        });

        // Training Assignments
        Schema::create('training_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('training_sessions')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('due_date')->nullable();
            $table->integer('max_score')->default(100);
            $table->boolean('is_required')->default(true);
            $table->enum('type', ['quiz', 'project', 'reflection', 'assessment', 'other'])->default('quiz');
            $table->json('instructions')->nullable();
            $table->json('resources')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Training Assignment Submissions
        Schema::create('training_assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained('training_assignments')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('submission_content')->nullable();
            $table->json('submission_files')->nullable();
            $table->dateTime('submitted_at');
            $table->decimal('score', 5, 2)->nullable();
            $table->text('feedback')->nullable();
            $table->foreignId('graded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->dateTime('graded_at')->nullable();
            $table->enum('status', ['draft', 'submitted', 'graded', 'resubmit'])->default('draft');
            $table->timestamps();
            $table->unique(['assignment_id', 'user_id']);
        });

        // Training Feedback
        Schema::create('training_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('training_sessions')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('content_rating')->nullable();
            $table->integer('instructor_rating')->nullable();
            $table->integer('materials_rating')->nullable();
            $table->integer('overall_rating')->nullable();
            $table->text('comments')->nullable();
            $table->json('responses')->nullable();
            $table->boolean('is_anonymous')->default(false);
            $table->timestamps();
            $table->unique(['session_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('training_feedback');
        Schema::dropIfExists('training_assignment_submissions');
        Schema::dropIfExists('training_assignments');
        Schema::dropIfExists('training_enrollments');
        Schema::dropIfExists('training_materials');
        Schema::dropIfExists('training_sessions');
        Schema::dropIfExists('training_categories');
    }
};
