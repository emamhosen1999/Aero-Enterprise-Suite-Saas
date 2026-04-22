<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Canonical HRM Employee Core tables migration.
 *
 * Consolidates (from create_hrm_core_tables.php domain split):
 *  - departments, designations, employees, employee_personal_documents,
 *    emergency_contacts, employee_addresses, employee_education,
 *    employee_work_experience, employee_bank_details, employee_dependents,
 *    employee_certifications
 *
 * Absorbed additive migrations:
 *  - 2026_01_07_000001_add_missing_columns_to_departments_table.php
 *    → code, location, established_date
 *  - 2026_01_07_000002_add_parent_id_to_designations_table.php
 *    → parent_id self-FK
 *  - 2026_01_11_000003_add_personal_info_to_employees_table.php
 *    → birthday, gender, nationality, religion, marital_status, blood_group,
 *       passport_no, passport_expiry, visa_no, visa_expiry, emirates_id,
 *       emirates_id_expiry, joining_date, probation_period_months,
 *       contract_start_date, contract_end_date
 *  - 2026_04_22_040116_add_demographic_columns_to_employees_table.php
 *    → date_of_birth (gender duplicate RESOLVED – single canonical definition)
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── departments ────────────────────────────────────────────────────────
        if (! Schema::hasTable('departments')) {
            Schema::create('departments', function (Blueprint $table) {
                $table->id();
                $table->string('name');

                // Absorbed from: add_missing_columns_to_departments_table
                $table->string('code', 50)->nullable()->unique();

                $table->text('description')->nullable();
                $table->foreignId('parent_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();

                // Absorbed from: add_missing_columns_to_departments_table
                $table->string('location')->nullable();
                $table->date('established_date')->nullable();

                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['is_active', 'parent_id']);
            });
        }

        // ── designations ───────────────────────────────────────────────────────
        if (! Schema::hasTable('designations')) {
            Schema::create('designations', function (Blueprint $table) {
                $table->id();
                $table->string('title');

                // Absorbed from: add_parent_id_to_designations_table
                $table->foreignId('parent_id')->nullable()->constrained('designations')->nullOnDelete();

                $table->text('description')->nullable();
                $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
                $table->integer('hierarchy_level')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['department_id', 'is_active']);
            });
        }

        // ── employees ──────────────────────────────────────────────────────────
        if (! Schema::hasTable('employees')) {
            Schema::create('employees', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('designation_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();

                $table->string('employee_code')->unique();
                $table->date('date_of_joining');

                // Absorbed from: add_personal_info_to_employees_table
                // (alias kept for backward compat – same value, different accessor)
                $table->date('joining_date')->nullable();

                $table->date('date_of_leaving')->nullable();
                $table->date('probation_end_date')->nullable();

                // Absorbed from: add_personal_info_to_employees_table
                $table->integer('probation_period_months')->nullable();
                $table->date('contract_start_date')->nullable();
                $table->date('contract_end_date')->nullable();

                $table->date('confirmation_date')->nullable();

                $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'intern'])->default('full_time');
                $table->enum('status', ['active', 'on_leave', 'resigned', 'terminated', 'retired'])->default('active');

                $table->decimal('basic_salary', 12, 2)->default(0);
                $table->string('work_location')->nullable();
                $table->string('shift')->nullable();

                // ── Personal / Demographic Info ────────────────────────────────
                // Canonical single definition. Resolves duplicate across:
                //   add_personal_info_to_employees_table  (gender, birthday, …)
                //   add_demographic_columns_to_employees_table (gender + date_of_birth)
                $table->date('birthday')->nullable();
                $table->date('date_of_birth')->nullable();   // from demographic migration
                $table->string('gender', 20)->nullable();    // ONE definition, 20-char width wins
                $table->string('nationality')->nullable();
                $table->string('religion')->nullable();
                $table->string('marital_status')->nullable();
                $table->string('blood_group')->nullable();

                // ── Document Numbers ───────────────────────────────────────────
                $table->string('passport_no')->nullable();
                $table->date('passport_expiry')->nullable();
                $table->string('visa_no')->nullable();
                $table->date('visa_expiry')->nullable();
                $table->string('emirates_id')->nullable();
                $table->date('emirates_id_expiry')->nullable();

                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['status', 'date_of_joining']);
                $table->index(['department_id', 'status']);
                $table->index('employee_code');
            });
        }

        // ── employee_personal_documents ────────────────────────────────────────
        if (! Schema::hasTable('employee_personal_documents')) {
            Schema::create('employee_personal_documents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->string('document_type')->nullable();
                $table->string('document_number')->nullable();
                $table->string('file_path');
                $table->string('file_name');
                $table->string('mime_type')->nullable();
                $table->integer('file_size_kb')->default(0);
                $table->date('issue_date')->nullable();
                $table->date('expiry_date')->nullable();
                $table->string('issued_by')->nullable();
                $table->string('issued_country', 3)->nullable();
                $table->string('status')->default('pending');
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

        // ── emergency_contacts ─────────────────────────────────────────────────
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

        // ── employee_addresses ─────────────────────────────────────────────────
        if (! Schema::hasTable('employee_addresses')) {
            Schema::create('employee_addresses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('address_type')->default('current');
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

        // ── employee_education ─────────────────────────────────────────────────
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

        // ── employee_work_experience ───────────────────────────────────────────
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

        // ── employee_bank_details ──────────────────────────────────────────────
        if (! Schema::hasTable('employee_bank_details')) {
            Schema::create('employee_bank_details', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
                $table->string('bank_name');
                $table->string('branch_name')->nullable();
                $table->string('account_holder_name');
                $table->text('account_number');        // encrypted
                $table->string('swift_code', 20)->nullable();
                $table->string('iban', 50)->nullable();
                $table->string('routing_number', 20)->nullable();
                $table->string('account_type')->default('savings');
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

        // ── employee_dependents ────────────────────────────────────────────────
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

        // ── employee_certifications ────────────────────────────────────────────
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
    }

    public function down(): void
    {
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
