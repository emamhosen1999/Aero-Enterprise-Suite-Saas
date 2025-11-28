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
        // Skills
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->string('type'); // technical, soft-skill, certification, language, etc.
            $table->string('status')->default('active'); // active, inactive
            $table->timestamps();
        });

        // Competencies
        Schema::create('competencies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->string('level')->nullable(); // entry, mid, senior, expert
            $table->string('status')->default('active'); // active, inactive
            $table->timestamps();
        });

        // Pivot table for competencies and skills
        Schema::create('competency_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competency_id')->constrained()->onDelete('cascade');
            $table->foreignId('skill_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });

        // Pivot table for employees and skills
        Schema::create('employee_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('skill_id')->constrained()->onDelete('cascade');
            $table->string('proficiency_level')->nullable(); // beginner, intermediate, advanced, expert
            $table->date('acquired_date')->nullable();
            $table->date('expires_at')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->foreignId('verified_by')->nullable()->constrained('users');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });

        // Add a table for position competencies if it doesn't exist
        if (! Schema::hasTable('position_competencies')) {
            Schema::create('position_competencies', function (Blueprint $table) {
                $table->id();
                $table->foreignId('position_id')->constrained('designations')->onDelete('cascade');
                $table->foreignId('competency_id')->constrained()->onDelete('cascade');
                $table->string('importance')->nullable(); // required, preferred, optional
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('position_competencies');
        Schema::dropIfExists('employee_skills');
        Schema::dropIfExists('competency_skills');
        Schema::dropIfExists('competencies');
        Schema::dropIfExists('skills');
    }
};
