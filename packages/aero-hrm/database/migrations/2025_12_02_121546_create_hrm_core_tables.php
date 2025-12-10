<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * HRM Core Tables Migration
 *
 * Based on Section 2 of modules.md:
 * - Employee Information System
 * - Attendance Management
 * - Leave Management
 * - Payroll
 * - Recruitment
 * - Performance Management
 * - Training & Development
 */
return new class extends Migration
{
    public function up(): void
    {
        // =====================================================================
        // 2.1 Employee Information System - Core Tables
        // =====================================================================

        // Departments (already exists, but ensure proper structure)
        if (! Schema::hasTable('departments')) {
            Schema::create('departments', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->foreignId('parent_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['is_active', 'parent_id']);
            });
        }

        // Designations (already exists, ensure proper structure)
        if (! Schema::hasTable('designations')) {
            Schema::create('designations', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
                $table->integer('hierarchy_level')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['department_id', 'is_active']);
            });
        }

        // Employees (core employee records)
        if (! Schema::hasTable('employees')) {
            Schema::create('employees', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('designation_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();

                $table->string('employee_code')->unique();
                $table->date('date_of_joining');
                $table->date('date_of_leaving')->nullable();
                $table->date('probation_end_date')->nullable();
                $table->date('confirmation_date')->nullable();

                $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'intern'])->default('full_time');
                $table->enum('status', ['active', 'on_leave', 'resigned', 'terminated', 'retired'])->default('active');

                $table->decimal('basic_salary', 12, 2)->default(0);
                $table->string('work_location')->nullable();
                $table->string('shift')->nullable();

                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['status', 'date_of_joining']);
                $table->index(['department_id', 'status']);
                $table->index('employee_code');
            });
        }

        // Employee Documents (vault for certificates, contracts, etc.)
        if (! Schema::hasTable('employee_personal_documents')) {
            Schema::create('employee_personal_documents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->string('document_type')->nullable(); // 'contract', 'identity', 'certificate'
                $table->string('document_number')->nullable();
                $table->string('file_path');
                $table->string('file_name');
                $table->string('mime_type')->nullable();
                $table->integer('file_size_kb')->default(0);
                $table->date('issue_date')->nullable();
                $table->date('expiry_date')->nullable();
                $table->string('issued_by')->nullable();
                $table->string('issued_country', 3)->nullable();
                $table->string('status')->default('pending'); // pending, verified, rejected, expired
                $table->text('rejection_reason')->nullable();
                $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('verified_at')->nullable();
                $table->text('notes')->nullable();
                $table->boolean('is_confidential')->default(false);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['user_id', 'document_type']);
                $table->index('status');
                $table->index('expiry_date');
            });
        }

        // Emergency Contacts
        if (! Schema::hasTable('emergency_contacts')) {
            Schema::create('emergency_contacts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->string('relationship');
                $table->string('phone');
                $table->string('alternate_phone')->nullable();
                $table->string('email')->nullable();
                $table->text('address')->nullable();
                $table->string('city')->nullable();
                $table->string('country', 3)->nullable();
                $table->tinyInteger('priority')->default(1);
                $table->boolean('is_primary')->default(false);
                $table->boolean('notify_on_emergency')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['user_id', 'priority']);
            });
        }

        // Employee Addresses
        if (! Schema::hasTable('employee_addresses')) {
            Schema::create('employee_addresses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('address_type')->default('current'); // permanent, current, mailing, work
                $table->text('address_line_1');
                $table->text('address_line_2')->nullable();
                $table->string('city');
                $table->string('state')->nullable();
                $table->string('postal_code', 20)->nullable();
                $table->string('country', 3);
                $table->boolean('is_primary')->default(false);
                $table->date('valid_from')->nullable();
                $table->date('valid_until')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['user_id', 'address_type']);
            });
        }

        // Employee Education
        if (! Schema::hasTable('employee_education')) {
            Schema::create('employee_education', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('institution_name');
                $table->string('degree');
                $table->string('field_of_study');
                $table->string('grade')->nullable();
                $table->date('start_date');
                $table->date('end_date')->nullable();
                $table->boolean('is_current')->default(false);
                $table->string('city')->nullable();
                $table->string('country', 3)->nullable();
                $table->string('certificate_path')->nullable();
                $table->boolean('is_verified')->default(false);
                $table->text('achievements')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['user_id', 'is_current']);
            });
        }

        // Employee Work Experience
        if (! Schema::hasTable('employee_work_experience')) {
            Schema::create('employee_work_experience', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('company_name');
                $table->string('company_industry')->nullable();
                $table->string('company_location')->nullable();
                $table->string('job_title');
                $table->text('job_description')->nullable();
                $table->date('start_date');
                $table->date('end_date')->nullable();
                $table->boolean('is_current')->default(false);
                $table->text('responsibilities')->nullable();
                $table->text('achievements')->nullable();
                $table->string('leaving_reason')->nullable();
                $table->string('supervisor_name')->nullable();
                $table->string('supervisor_contact')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['user_id', 'is_current']);
            });
        }

        // Employee Bank Details
        if (! Schema::hasTable('employee_bank_details')) {
            Schema::create('employee_bank_details', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
                $table->string('bank_name');
                $table->string('branch_name')->nullable();
                $table->string('account_holder_name');
                $table->text('account_number'); // encrypted
                $table->string('swift_code', 20)->nullable();
                $table->string('iban', 50)->nullable();
                $table->string('routing_number', 20)->nullable();
                $table->string('account_type')->default('savings'); // savings, current, salary
                $table->string('tax_id', 100)->nullable(); // encrypted
                $table->string('currency', 3)->default('USD');
                $table->boolean('is_primary')->default(true);
                $table->boolean('is_verified')->default(false);
                $table->timestamp('verified_at')->nullable();
                $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index('is_primary');
            });
        }

        // Employee Dependents
        if (! Schema::hasTable('employee_dependents')) {
            Schema::create('employee_dependents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->string('relationship');
                $table->date('date_of_birth')->nullable();
                $table->string('gender')->nullable();
                $table->string('nationality')->nullable();
                $table->string('identification_number')->nullable();
                $table->boolean('is_beneficiary')->default(false);
                $table->boolean('is_covered_in_insurance')->default(false);
                $table->text('special_needs')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index('user_id');
            });
        }

        // Employee Certifications
        if (! Schema::hasTable('employee_certifications')) {
            Schema::create('employee_certifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('certification_name');
                $table->string('issuing_organization');
                $table->string('credential_id')->nullable();
                $table->string('credential_url')->nullable();
                $table->date('issue_date')->nullable();
                $table->date('expiry_date')->nullable();
                $table->boolean('never_expires')->default(false);
                $table->string('certificate_file_path')->nullable();
                $table->boolean('is_verified')->default(false);
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['user_id', 'expiry_date']);
            });
        }

        // =====================================================================
        // 2.2 Attendance Management
        // =====================================================================

        // Attendance Settings (per-tenant configuration)
        if (! Schema::hasTable('attendance_settings')) {
            Schema::create('attendance_settings', function (Blueprint $table) {
                $table->id();
                $table->time('shift_start_time')->default('09:00:00');
                $table->time('shift_end_time')->default('17:00:00');
                $table->integer('break_duration_minutes')->default(60);
                $table->integer('late_arrival_threshold_minutes')->default(15);
                $table->integer('early_leave_threshold_minutes')->default(15);
                $table->decimal('half_day_threshold_hours', 5, 2)->default(4);
                $table->decimal('full_day_hours', 5, 2)->default(8);
                $table->boolean('enable_ip_restriction')->default(false);
                $table->json('allowed_ip_addresses')->nullable();
                $table->boolean('enable_geolocation')->default(false);
                $table->decimal('office_latitude', 10, 7)->nullable();
                $table->decimal('office_longitude', 10, 7)->nullable();
                $table->integer('geofence_radius_meters')->default(100);
                $table->boolean('require_selfie')->default(false);
                $table->timestamps();
            });
        }

        // Attendance Types (Regular, WFH, On-Site, etc.)
        if (! Schema::hasTable('attendance_types')) {
            Schema::create('attendance_types', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code')->unique();
                $table->text('description')->nullable();
                $table->string('color')->nullable();
                $table->boolean('is_active')->default(true);
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        // Attendances (daily attendance records) - matches Attendance model
        if (! Schema::hasTable('attendances')) {
            Schema::create('attendances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('attendance_type_id')->nullable()->constrained()->nullOnDelete();
                $table->date('date');
                $table->dateTime('punchin')->nullable();
                $table->dateTime('punchout')->nullable();
                $table->text('punchin_location')->nullable(); // JSON for lat/lng
                $table->text('punchout_location')->nullable(); // JSON for lat/lng
                $table->decimal('work_hours', 5, 2)->default(0);
                $table->decimal('overtime_hours', 5, 2)->default(0);
                $table->boolean('is_late')->default(false);
                $table->boolean('is_early_leave')->default(false);
                $table->string('status')->default('Present'); // Present, Absent, Late, Half Day, etc.

                // IP tracking
                $table->string('punchin_ip')->nullable();
                $table->string('punchout_ip')->nullable();

                // Manual adjustment workflow
                $table->boolean('is_manual')->default(false);
                $table->text('adjustment_reason')->nullable();
                $table->foreignId('adjusted_by')->nullable()->constrained('users')->nullOnDelete();

                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['user_id', 'date']);
                $table->index(['date', 'status']);
                $table->index(['user_id', 'date']);
            });
        }

        // =====================================================================
        // 2.3 Leave Management
        // =====================================================================

        // Leave Settings (per-tenant leave policies)
        if (! Schema::hasTable('leave_settings')) {
            Schema::create('leave_settings', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code')->unique();
                $table->integer('annual_quota')->default(0);
                $table->enum('accrual_type', ['yearly', 'monthly', 'none'])->default('yearly');
                $table->boolean('carry_forward_allowed')->default(false);
                $table->integer('max_carry_forward_days')->default(0);
                $table->boolean('encashment_allowed')->default(false);
                $table->boolean('requires_approval')->default(true);
                $table->integer('min_days_notice')->default(0);
                $table->integer('max_consecutive_days')->default(0);
                $table->boolean('allow_half_day')->default(true);
                $table->boolean('is_paid')->default(true);
                $table->boolean('is_active')->default(true);
                $table->string('color')->nullable();
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        // Leaves (leave requests and approvals) - matches Leave model
        if (! Schema::hasTable('leaves')) {
            Schema::create('leaves', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('leave_type'); // references leave_settings
                $table->date('from_date');
                $table->date('to_date');
                $table->integer('no_of_days');
                $table->text('reason');
                $table->string('status')->default('New'); // New, Pending, Approved, Rejected, Cancelled

                // Approval workflow
                $table->json('approval_chain')->nullable();
                $table->integer('current_approval_level')->default(0);
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('submitted_at')->nullable();

                $table->timestamps();
                $table->softDeletes();

                $table->index(['user_id', 'status']);
                $table->index(['from_date', 'to_date']);
            });
        }

        // Leave Balances (track remaining leaves per employee)
        if (! Schema::hasTable('leave_balances')) {
            Schema::create('leave_balances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('leave_setting_id')->constrained()->cascadeOnDelete();
                $table->year('year');
                $table->decimal('allocated', 5, 2)->default(0);
                $table->decimal('used', 5, 2)->default(0);
                $table->decimal('pending', 5, 2)->default(0);
                $table->decimal('available', 5, 2)->default(0);
                $table->decimal('carried_forward', 5, 2)->default(0);
                $table->decimal('encashed', 5, 2)->default(0);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['user_id', 'leave_setting_id', 'year']);
            });
        }

        // Holidays (company holidays calendar)
        if (! Schema::hasTable('holidays')) {
            Schema::create('holidays', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->date('date');
                $table->date('end_date')->nullable(); // for multi-day holidays
                $table->enum('type', ['public', 'optional', 'religious', 'national'])->default('public');
                $table->boolean('is_recurring')->default(false);
                $table->json('applicable_to')->nullable(); // departments, locations, etc.
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index('date');
                $table->index(['date', 'is_active']);
            });
        }

        // =====================================================================
        // 2.4 Payroll
        // =====================================================================

        // Payrolls (monthly salary records) - matches Payroll model
        if (! Schema::hasTable('payrolls')) {
            Schema::create('payrolls', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->date('pay_period_start');
                $table->date('pay_period_end');

                // Salary components
                $table->decimal('basic_salary', 12, 2)->default(0);
                $table->decimal('gross_salary', 12, 2)->default(0);
                $table->decimal('total_deductions', 12, 2)->default(0);
                $table->decimal('net_salary', 12, 2)->default(0);

                // Attendance-based calculations
                $table->integer('working_days')->default(0);
                $table->integer('present_days')->default(0);
                $table->integer('absent_days')->default(0);
                $table->integer('leave_days')->default(0);
                $table->decimal('overtime_hours', 5, 2)->default(0);
                $table->decimal('overtime_amount', 10, 2)->default(0);

                $table->string('status')->default('draft'); // draft, processed, paid, hold
                $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('processed_at')->nullable();

                $table->text('remarks')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'pay_period_start']);
                $table->index(['status', 'pay_period_start']);
            });
        }

        // Payroll Allowances (breakdown of allowances)
        if (! Schema::hasTable('payroll_allowances')) {
            Schema::create('payroll_allowances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('payroll_id')->constrained()->cascadeOnDelete();
                $table->string('type'); // 'hra', 'transport', 'medical', 'bonus', etc.
                $table->string('description')->nullable();
                $table->decimal('amount', 10, 2);
                $table->boolean('is_taxable')->default(true);
                $table->timestamps();

                $table->index('payroll_id');
            });
        }

        // Payroll Deductions (breakdown of deductions)
        if (! Schema::hasTable('payroll_deductions')) {
            Schema::create('payroll_deductions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('payroll_id')->constrained()->cascadeOnDelete();
                $table->string('type'); // 'tax', 'pf', 'esi', 'loan', 'advance', etc.
                $table->string('description')->nullable();
                $table->decimal('amount', 10, 2);
                $table->timestamps();

                $table->index('payroll_id');
            });
        }

        // Payslips (generated payslip documents)
        if (! Schema::hasTable('payslips')) {
            Schema::create('payslips', function (Blueprint $table) {
                $table->id();
                $table->foreignId('payroll_id')->constrained()->cascadeOnDelete();
                $table->string('payslip_number')->unique();
                $table->string('file_path')->nullable();
                $table->boolean('is_sent')->default(false);
                $table->timestamp('sent_at')->nullable();
                $table->boolean('is_downloaded')->default(false);
                $table->timestamp('downloaded_at')->nullable();
                $table->timestamps();

                $table->index('payroll_id');
            });
        }

        // =====================================================================
        // 2.5 Recruitment
        // =====================================================================

        // Jobs (job postings) - matches Job model
        if (! Schema::hasTable('jobs_recruitment')) {
            Schema::create('jobs_recruitment', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
                $table->string('type')->nullable(); // full_time, part_time, contract, intern
                $table->string('location')->nullable();
                $table->boolean('is_remote_allowed')->default(false);
                $table->text('description')->nullable();
                $table->json('responsibilities')->nullable();
                $table->json('requirements')->nullable();
                $table->json('qualifications')->nullable();

                $table->decimal('salary_min', 12, 2)->nullable();
                $table->decimal('salary_max', 12, 2)->nullable();
                $table->string('salary_currency', 3)->default('BDT');
                $table->boolean('salary_visible')->default(true);
                $table->json('benefits')->nullable();

                $table->date('posting_date')->nullable();
                $table->date('closing_date')->nullable();
                $table->string('status')->default('draft'); // draft, open, closed, on_hold
                $table->foreignId('hiring_manager_id')->nullable()->constrained('users')->nullOnDelete();
                $table->integer('positions')->default(1);
                $table->boolean('is_featured')->default(false);
                $table->json('skills_required')->nullable();
                $table->json('custom_fields')->nullable();

                $table->timestamps();
                $table->softDeletes();

                $table->index(['status', 'posting_date']);
            });
        }

        // Job Hiring Stages (recruitment pipeline stages)
        if (! Schema::hasTable('job_hiring_stages')) {
            Schema::create('job_hiring_stages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('job_id')->constrained('jobs_recruitment')->cascadeOnDelete();
                $table->string('name');
                $table->text('description')->nullable();
                $table->integer('stage_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['job_id', 'stage_order']);
            });
        }

        // Job Applications (applicant submissions)
        if (! Schema::hasTable('job_applications')) {
            Schema::create('job_applications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('job_id')->constrained('jobs_recruitment')->cascadeOnDelete();
                $table->foreignId('current_stage_id')->nullable()->constrained('job_hiring_stages')->nullOnDelete();

                // Applicant information
                $table->string('first_name');
                $table->string('last_name');
                $table->string('email');
                $table->string('phone')->nullable();
                $table->date('date_of_birth')->nullable();
                $table->text('address')->nullable();
                $table->string('city')->nullable();
                $table->string('country')->nullable();

                // Application details
                $table->string('resume_path')->nullable();
                $table->string('cover_letter_path')->nullable();
                $table->text('cover_letter_text')->nullable();
                $table->string('portfolio_url')->nullable();
                $table->string('linkedin_url')->nullable();

                $table->decimal('expected_salary', 12, 2)->nullable();
                $table->integer('years_of_experience')->default(0);
                $table->date('available_from')->nullable();

                $table->enum('status', ['applied', 'screening', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn'])->default('applied');
                $table->integer('overall_score')->nullable(); // 0-100

                $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
                $table->text('notes')->nullable();

                $table->timestamps();
                $table->softDeletes();

                $table->index(['job_id', 'status']);
                $table->index('email');
            });
        }

        // Job Application Stage History (track movement through pipeline)
        if (! Schema::hasTable('job_application_stage_history')) {
            Schema::create('job_application_stage_history', function (Blueprint $table) {
                $table->id();
                $table->foreignId('application_id')->constrained('job_applications')->cascadeOnDelete();
                $table->foreignId('from_stage_id')->nullable()->constrained('job_hiring_stages')->nullOnDelete();
                $table->foreignId('to_stage_id')->constrained('job_hiring_stages')->cascadeOnDelete();
                $table->foreignId('moved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->timestamp('moved_at');
                $table->timestamps();

                $table->index('application_id');
            });
        }

        // Job Interviews (scheduled interviews)
        if (! Schema::hasTable('job_interviews')) {
            Schema::create('job_interviews', function (Blueprint $table) {
                $table->id();
                $table->foreignId('application_id')->constrained('job_applications')->cascadeOnDelete();
                $table->string('title');
                $table->enum('interview_type', ['phone', 'video', 'in_person', 'technical', 'hr', 'final'])->default('in_person');
                $table->dateTime('scheduled_at');
                $table->integer('duration_minutes')->default(60);
                $table->string('location')->nullable();
                $table->string('meeting_link')->nullable();
                $table->text('notes')->nullable();

                $table->enum('status', ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'])->default('scheduled');
                $table->foreignId('scheduled_by')->nullable()->constrained('users')->nullOnDelete();

                $table->timestamps();

                $table->index(['application_id', 'scheduled_at']);
            });
        }

        // Job Interview Interviewers (many-to-many: interviews <-> users)
        if (! Schema::hasTable('job_interview_interviewers')) {
            Schema::create('job_interview_interviewers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('interview_id')->constrained('job_interviews')->cascadeOnDelete();
                $table->foreignId('interviewer_id')->constrained('users')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['interview_id', 'interviewer_id']);
            });
        }

        // Job Interview Feedback (evaluation scores)
        if (! Schema::hasTable('job_interview_feedback')) {
            Schema::create('job_interview_feedback', function (Blueprint $table) {
                $table->id();
                $table->foreignId('interview_id')->constrained('job_interviews')->cascadeOnDelete();
                $table->foreignId('interviewer_id')->constrained('users')->cascadeOnDelete();
                $table->integer('technical_score')->nullable(); // 0-10
                $table->integer('communication_score')->nullable(); // 0-10
                $table->integer('cultural_fit_score')->nullable(); // 0-10
                $table->integer('problem_solving_score')->nullable(); // 0-10
                $table->integer('overall_score')->nullable(); // 0-10
                $table->text('strengths')->nullable();
                $table->text('weaknesses')->nullable();
                $table->text('comments')->nullable();
                $table->enum('recommendation', ['strong_hire', 'hire', 'maybe', 'no_hire'])->nullable();
                $table->timestamps();

                $table->unique(['interview_id', 'interviewer_id']);
            });
        }

        // Job Offers (offer letters)
        if (! Schema::hasTable('job_offers')) {
            Schema::create('job_offers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('application_id')->constrained('job_applications')->cascadeOnDelete();
                $table->string('offer_letter_path')->nullable();
                $table->decimal('offered_salary', 12, 2);
                $table->date('joining_date');
                $table->date('offer_valid_until');
                $table->text('terms_and_conditions')->nullable();
                $table->text('benefits')->nullable();

                $table->enum('status', ['draft', 'sent', 'accepted', 'rejected', 'expired'])->default('draft');
                $table->foreignId('sent_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('sent_at')->nullable();
                $table->timestamp('responded_at')->nullable();
                $table->text('candidate_response_notes')->nullable();

                $table->timestamps();

                $table->index(['application_id', 'status']);
            });
        }

        // =====================================================================
        // 2.6 Performance Management
        // =====================================================================

        // KPIs (Key Performance Indicators)
        if (! Schema::hasTable('kpis')) {
            Schema::create('kpis', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('category')->nullable(); // 'sales', 'quality', 'productivity', etc.
                $table->string('measurement_unit')->nullable(); // '%', 'count', 'hours', etc.
                $table->decimal('target_value', 10, 2)->nullable();
                $table->decimal('min_acceptable_value', 10, 2)->nullable();
                $table->enum('frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])->default('monthly');
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['category', 'is_active']);
            });
        }

        // KPI Values (actual performance data)
        if (! Schema::hasTable('kpi_values')) {
            Schema::create('kpi_values', function (Blueprint $table) {
                $table->id();
                $table->foreignId('kpi_id')->constrained()->cascadeOnDelete();
                $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
                $table->date('measurement_date');
                $table->decimal('actual_value', 10, 2);
                $table->decimal('target_value', 10, 2)->nullable();
                $table->integer('achievement_percentage')->nullable();
                $table->text('notes')->nullable();
                $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['employee_id', 'measurement_date']);
                $table->index(['kpi_id', 'measurement_date']);
            });
        }

        // Performance Review Templates (appraisal cycle templates)
        if (! Schema::hasTable('performance_review_templates')) {
            Schema::create('performance_review_templates', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->enum('review_type', ['annual', 'quarterly', 'probation', 'project_based'])->default('annual');
                $table->json('evaluation_criteria')->nullable(); // structured criteria with weightage
                $table->json('rating_scale')->nullable(); // e.g., 1-5, A-E, etc.
                $table->boolean('include_self_assessment')->default(false);
                $table->boolean('include_peer_review')->default(false);
                $table->boolean('include_360_feedback')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // Performance Reviews (actual review records)
        if (! Schema::hasTable('performance_reviews')) {
            Schema::create('performance_reviews', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
                $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('template_id')->nullable()->constrained('performance_review_templates')->nullOnDelete();

                $table->string('review_period'); // e.g., 'Q1 2025', '2024 Annual'
                $table->date('review_start_date');
                $table->date('review_end_date');
                $table->date('due_date')->nullable();

                $table->json('self_assessment')->nullable();
                $table->json('manager_assessment')->nullable();
                $table->json('peer_feedback')->nullable();
                $table->decimal('overall_rating', 3, 2)->nullable(); // out of 5.00

                $table->text('strengths')->nullable();
                $table->text('areas_of_improvement')->nullable();
                $table->text('goals_for_next_period')->nullable();
                $table->text('training_recommendations')->nullable();
                $table->text('comments')->nullable();

                $table->enum('status', ['draft', 'self_assessment_pending', 'manager_review_pending', 'completed', 'acknowledged'])->default('draft');
                $table->timestamp('completed_at')->nullable();
                $table->timestamp('acknowledged_at')->nullable();

                $table->timestamps();

                $table->index(['employee_id', 'status']);
                $table->index(['review_start_date', 'review_end_date']);
            });
        }

        // =====================================================================
        // 2.7 Training & Development
        // =====================================================================

        // Training Categories
        if (! Schema::hasTable('training_categories')) {
            Schema::create('training_categories', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // Training Sessions (scheduled training programs)
        if (! Schema::hasTable('training_sessions')) {
            Schema::create('training_sessions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('category_id')->nullable()->constrained('training_categories')->nullOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->enum('training_type', ['internal', 'external', 'online', 'workshop', 'seminar'])->default('internal');
                $table->string('trainer_name')->nullable();
                $table->string('trainer_organization')->nullable();
                $table->string('venue')->nullable();
                $table->dateTime('start_date');
                $table->dateTime('end_date');
                $table->integer('duration_hours')->nullable();
                $table->integer('max_participants')->nullable();
                $table->decimal('cost_per_participant', 10, 2)->default(0);
                $table->text('objectives')->nullable();
                $table->text('prerequisites')->nullable();
                $table->enum('status', ['scheduled', 'ongoing', 'completed', 'cancelled'])->default('scheduled');
                $table->foreignId('organized_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['start_date', 'status']);
            });
        }

        // Training Enrollments (employee registrations)
        if (! Schema::hasTable('training_enrollments')) {
            Schema::create('training_enrollments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('training_session_id')->constrained()->cascadeOnDelete();
                $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
                $table->enum('enrollment_type', ['mandatory', 'voluntary', 'nominated'])->default('voluntary');
                $table->enum('status', ['enrolled', 'attended', 'completed', 'absent', 'cancelled'])->default('enrolled');
                $table->integer('attendance_percentage')->nullable();
                $table->boolean('certificate_issued')->default(false);
                $table->string('certificate_path')->nullable();
                $table->foreignId('enrolled_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['training_session_id', 'employee_id']);
                $table->index(['employee_id', 'status']);
            });
        }

        // Training Feedback (post-training evaluation)
        if (! Schema::hasTable('training_feedback')) {
            Schema::create('training_feedback', function (Blueprint $table) {
                $table->id();
                $table->foreignId('enrollment_id')->constrained('training_enrollments')->cascadeOnDelete();
                $table->integer('content_rating')->nullable(); // 1-5
                $table->integer('trainer_rating')->nullable(); // 1-5
                $table->integer('relevance_rating')->nullable(); // 1-5
                $table->integer('venue_rating')->nullable(); // 1-5
                $table->integer('overall_rating')->nullable(); // 1-5
                $table->text('what_went_well')->nullable();
                $table->text('what_could_improve')->nullable();
                $table->text('suggestions')->nullable();
                $table->boolean('would_recommend')->default(false);
                $table->timestamps();

                $table->index('enrollment_id');
            });
        }

        // Training Materials (documents, resources)
        if (! Schema::hasTable('training_materials')) {
            Schema::create('training_materials', function (Blueprint $table) {
                $table->id();
                $table->foreignId('training_session_id')->constrained()->cascadeOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->enum('material_type', ['presentation', 'document', 'video', 'link', 'other'])->default('document');
                $table->string('file_path')->nullable();
                $table->string('external_url')->nullable();
                $table->boolean('is_downloadable')->default(true);
                $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index('training_session_id');
            });
        }

        // Training Assignments (homework/tests)
        if (! Schema::hasTable('training_assignments')) {
            Schema::create('training_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('training_session_id')->constrained()->cascadeOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->text('instructions')->nullable();
                $table->date('due_date')->nullable();
                $table->integer('max_score')->default(100);
                $table->integer('passing_score')->default(60);
                $table->boolean('is_mandatory')->default(false);
                $table->timestamps();

                $table->index('training_session_id');
            });
        }

        // Training Assignment Submissions
        if (! Schema::hasTable('training_assignment_submissions')) {
            Schema::create('training_assignment_submissions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('assignment_id')->constrained('training_assignments')->cascadeOnDelete();
                $table->foreignId('enrollment_id')->constrained('training_enrollments')->cascadeOnDelete();
                $table->text('submission_text')->nullable();
                $table->string('submission_file_path')->nullable();
                $table->timestamp('submitted_at')->nullable();
                $table->integer('score')->nullable();
                $table->boolean('is_passed')->default(false);
                $table->text('feedback')->nullable();
                $table->foreignId('evaluated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('evaluated_at')->nullable();
                $table->timestamps();

                $table->unique(['assignment_id', 'enrollment_id'], 'train_assign_sub_uniq');
            });
        }

        // Employee Skills Matrix (track skills & certifications)
        if (! Schema::hasTable('employee_skills')) {
            Schema::create('employee_skills', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
                $table->string('skill_name');
                $table->enum('proficiency_level', ['beginner', 'intermediate', 'advanced', 'expert'])->default('beginner');
                $table->integer('years_of_experience')->default(0);
                $table->date('last_used_date')->nullable();
                $table->boolean('is_certified')->default(false);
                $table->string('certification_name')->nullable();
                $table->date('certification_date')->nullable();
                $table->date('certification_expiry')->nullable();
                $table->string('certification_file_path')->nullable();
                $table->timestamps();

                $table->index(['employee_id', 'skill_name']);
            });
        }
    }

    public function down(): void
    {
        // Drop tables in reverse order to respect foreign key constraints
        Schema::dropIfExists('employee_skills');
        Schema::dropIfExists('training_assignment_submissions');
        Schema::dropIfExists('training_assignments');
        Schema::dropIfExists('training_materials');
        Schema::dropIfExists('training_feedback');
        Schema::dropIfExists('training_enrollments');
        Schema::dropIfExists('training_sessions');
        Schema::dropIfExists('training_categories');
        Schema::dropIfExists('performance_reviews');
        Schema::dropIfExists('performance_review_templates');
        Schema::dropIfExists('kpi_values');
        Schema::dropIfExists('kpis');
        Schema::dropIfExists('job_offers');
        Schema::dropIfExists('job_interview_feedback');
        Schema::dropIfExists('job_interview_interviewers');
        Schema::dropIfExists('job_interviews');
        Schema::dropIfExists('job_application_stage_history');
        Schema::dropIfExists('job_applications');
        Schema::dropIfExists('job_hiring_stages');
        Schema::dropIfExists('jobs_recruitment');
        Schema::dropIfExists('payslips');
        Schema::dropIfExists('payroll_deductions');
        Schema::dropIfExists('payroll_allowances');
        Schema::dropIfExists('payrolls');
        Schema::dropIfExists('holidays');
        Schema::dropIfExists('leave_balances');
        Schema::dropIfExists('leaves');
        Schema::dropIfExists('leave_settings');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('attendance_types');
        Schema::dropIfExists('attendance_settings');
        Schema::dropIfExists('employee_certifications');
        Schema::dropIfExists('employee_dependents');
        Schema::dropIfExists('employee_bank_details');
        Schema::dropIfExists('employee_work_experience');
        Schema::dropIfExists('employee_education');
        Schema::dropIfExists('employee_addresses');
        Schema::dropIfExists('emergency_contacts');
        Schema::dropIfExists('employee_personal_documents');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('designations');
        Schema::dropIfExists('departments');
    }
};
