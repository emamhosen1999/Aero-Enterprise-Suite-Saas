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
        // Performance Review Templates
        Schema::create('performance_review_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status')->default('draft');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('default_for_department_id')->nullable()->constrained('departments');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Performance Competency Categories
        Schema::create('performance_competency_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('performance_review_templates')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('weight')->default(1);
            $table->integer('order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        // Performance Competencies
        Schema::create('performance_competencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('performance_competency_categories')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('weight')->default(1);
            $table->integer('order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        // Performance Reviews
        Schema::create('performance_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('users');
            $table->foreignId('reviewer_id')->constrained('users');
            $table->date('review_period_start');
            $table->date('review_period_end');
            $table->date('review_date');
            $table->string('status')->default('scheduled');
            $table->float('overall_rating')->nullable();
            $table->text('goals_achieved')->nullable();
            $table->text('strengths')->nullable();
            $table->text('areas_for_improvement')->nullable();
            $table->text('comments')->nullable();
            $table->date('acknowledgment_date')->nullable();
            $table->text('employee_comments')->nullable();
            $table->date('next_review_date')->nullable();
            $table->foreignId('department_id')->constrained('departments');
            $table->foreignId('template_id')->constrained('performance_review_templates');
            $table->timestamps();
            $table->softDeletes();
        });

        // Performance Review Ratings (for individual competencies)
        Schema::create('performance_competency_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_id')->constrained('performance_reviews')->cascadeOnDelete();
            $table->foreignId('competency_id')->constrained('performance_competencies');
            $table->float('rating');
            $table->text('comments')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('performance_competency_ratings');
        Schema::dropIfExists('performance_reviews');
        Schema::dropIfExists('performance_competencies');
        Schema::dropIfExists('performance_competency_categories');
        Schema::dropIfExists('performance_review_templates');
    }
};
