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
        // Update jobs_recruitment table to ensure all enum values are included
        Schema::table('jobs_recruitment', function (Blueprint $table) {
            // Drop and recreate the type enum to include 'temporary'
            $table->dropColumn('type');
        });

        Schema::table('jobs_recruitment', function (Blueprint $table) {
            $table->enum('type', ['full_time', 'part_time', 'contract', 'temporary', 'internship', 'remote'])
                ->default('full_time')
                ->after('location');
        });

        // Update status enum to include 'cancelled'
        Schema::table('jobs_recruitment', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('jobs_recruitment', function (Blueprint $table) {
            $table->enum('status', ['draft', 'open', 'closed', 'on_hold', 'cancelled'])
                ->default('draft')
                ->after('type');
        });

        // Update job_applications table - ensure it matches the fillable fields
        Schema::table('job_applications', function (Blueprint $table) {
            // Add missing columns if they don't exist
            if (! Schema::hasColumn('job_applications', 'application_ip')) {
                $table->string('application_ip')->nullable()->after('custom_fields');
            }
            if (! Schema::hasColumn('job_applications', 'referral_source')) {
                $table->string('referral_source')->nullable()->after('source');
            }
            if (! Schema::hasColumn('job_applications', 'referrer_id')) {
                $table->foreignId('referrer_id')->nullable()->constrained('users')->onDelete('set null')->after('referral_source');
            }
            if (! Schema::hasColumn('job_applications', 'notice_period')) {
                $table->integer('notice_period')->nullable()->after('salary_currency');
            }
            if (! Schema::hasColumn('job_applications', 'experience_years')) {
                $table->decimal('experience_years', 4, 1)->nullable()->after('notice_period');
            }
            if (! Schema::hasColumn('job_applications', 'rating')) {
                $table->decimal('rating', 3, 2)->nullable()->after('status');
            }
            if (! Schema::hasColumn('job_applications', 'last_status_change')) {
                $table->datetime('last_status_change')->nullable()->after('application_date');
            }
        });

        // Update job_interviews table to ensure column names match model
        Schema::table('job_interviews', function (Blueprint $table) {
            // Rename scheduled_at to interview_date if it exists
            if (Schema::hasColumn('job_interviews', 'scheduled_at') && ! Schema::hasColumn('job_interviews', 'interview_date')) {
                $table->renameColumn('scheduled_at', 'interview_date');
            }

            // Add missing columns
            if (! Schema::hasColumn('job_interviews', 'scheduled_by')) {
                $table->foreignId('scheduled_by')->nullable()->constrained('users')->onDelete('set null')->after('interviewers');
            }
            if (! Schema::hasColumn('job_interviews', 'interview_notes')) {
                $table->text('interview_notes')->nullable()->after('scheduled_by');
            }
            if (! Schema::hasColumn('job_interviews', 'feedback')) {
                $table->text('feedback')->nullable()->after('interview_notes');
            }
            if (! Schema::hasColumn('job_interviews', 'interviewer_ids')) {
                $table->json('interviewer_ids')->nullable()->after('interviewers');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse the changes
        Schema::table('jobs_recruitment', function (Blueprint $table) {
            $table->dropColumn(['type', 'status']);
        });

        Schema::table('jobs_recruitment', function (Blueprint $table) {
            $table->enum('type', ['full_time', 'part_time', 'contract', 'internship', 'remote'])->default('full_time');
            $table->enum('status', ['draft', 'open', 'closed', 'on_hold'])->default('draft');
        });

        Schema::table('job_applications', function (Blueprint $table) {
            $table->dropColumn([
                'application_ip',
                'referral_source',
                'referrer_id',
                'experience_years',
                'notice_period',
                'rating',
                'last_status_change',
            ]);
        });

        Schema::table('job_interviews', function (Blueprint $table) {
            if (Schema::hasColumn('job_interviews', 'interview_date')) {
                $table->renameColumn('interview_date', 'scheduled_at');
            }
            $table->dropColumn([
                'scheduled_by',
                'interview_notes',
                'feedback',
                'interviewer_ids',
            ]);
        });
    }
};
