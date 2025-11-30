<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Employee Profile Supporting Tables Migration
 *
 * Creates the following tables to expand the Employee Profile module:
 *
 * 1. employee_bank_details (1:1 with users) - Bank account information with encryption
 * 2. employee_personal_documents (1:Many with users) - Personal documents (passport, contracts, etc.)
 * 3. emergency_contacts (1:Many with users) - Multiple emergency contacts per employee
 * 4. employee_addresses (1:Many with users) - Multiple addresses (permanent, current, etc.)
 * 5. employee_education (1:Many with users) - Educational background
 * 6. employee_work_experience (1:Many with users) - Previous work experience
 *
 * Security Note: Sensitive fields (account_number, tax_id) require encrypted casting in Models.
 *
 * @see \App\Models\EmployeeBankDetail
 * @see \App\Models\EmployeePersonalDocument
 * @see \App\Models\EmergencyContact
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // =====================================================================
        // TABLE 1: EMPLOYEE BANK DETAILS (1:1 with users)
        // =====================================================================
        if (! Schema::hasTable('employee_bank_details')) {
            Schema::create('employee_bank_details', function (Blueprint $table) {
                $table->id();

                // Foreign key to users table - CASCADE on delete
                $table->foreignId('user_id')
                    ->unique() // Ensures 1:1 relationship
                    ->constrained('users')
                    ->cascadeOnDelete();

                // Bank information
                $table->string('bank_name');
                $table->string('branch_name')->nullable();
                $table->string('account_holder_name');

                /**
                 * SECURITY CRITICAL: Account Number
                 *
                 * This column stores ENCRYPTED data using Laravel's encrypt() function.
                 * Must use `encrypted` cast in the Model:
                 *
                 * protected $casts = [
                 *     'account_number' => 'encrypted',
                 * ];
                 *
                 * @see https://laravel.com/docs/11.x/encryption#using-encrypter
                 */
                $table->text('account_number');

                // International banking
                $table->string('swift_code', 20)->nullable();
                $table->string('iban', 50)->nullable();
                $table->string('routing_number', 20)->nullable();

                // Account type
                $table->enum('account_type', ['savings', 'current', 'salary'])->default('savings');

                /**
                 * SECURITY CRITICAL: Tax Identification Number
                 *
                 * This column stores ENCRYPTED data.
                 * Must use `encrypted` cast in the Model.
                 */
                $table->string('tax_id', 100)->nullable();

                // Currency preference
                $table->string('currency', 3)->default('USD');

                // Primary account flag
                $table->boolean('is_primary')->default(true);

                // Verification status
                $table->boolean('is_verified')->default(false);
                $table->timestamp('verified_at')->nullable();
                $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();

                $table->timestamps();
                $table->softDeletes();

                // Indexes
                $table->index('is_primary');
                $table->index('is_verified');
            });
        }

        // =====================================================================
        // TABLE 2: EMPLOYEE PERSONAL DOCUMENTS (1:Many with users)
        // =====================================================================
        if (! Schema::hasTable('employee_personal_documents')) {
            Schema::create('employee_personal_documents', function (Blueprint $table) {
                $table->id();

                // Foreign key to users table
                $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                // Document information
                $table->string('name'); // e.g., 'Employment Contract', 'Passport', 'NID'
                $table->string('document_type')->nullable(); // e.g., 'contract', 'identity', 'certificate'
                $table->string('document_number')->nullable(); // e.g., Passport number

                // File information
                $table->string('file_path'); // Relative path in storage
                $table->string('file_name'); // Original filename
                $table->string('mime_type')->nullable();
                $table->integer('file_size_kb')->default(0);

                // Document validity
                $table->date('issue_date')->nullable();
                $table->date('expiry_date')->nullable(); // For passports, certifications

                // Issuing authority
                $table->string('issued_by')->nullable();
                $table->string('issued_country', 3)->nullable(); // ISO country code

                // Status
                $table->enum('status', ['pending', 'verified', 'rejected', 'expired'])->default('pending');
                $table->text('rejection_reason')->nullable();

                // Verification
                $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('verified_at')->nullable();

                // Notes
                $table->text('notes')->nullable();

                // Confidentiality flag
                $table->boolean('is_confidential')->default(false);

                $table->timestamps();
                $table->softDeletes();

                // Indexes
                $table->index('document_type');
                $table->index('status');
                $table->index('expiry_date');
                $table->index(['user_id', 'document_type']);
            });
        }

        // =====================================================================
        // TABLE 3: EMERGENCY CONTACTS (1:Many with users)
        // =====================================================================
        if (! Schema::hasTable('emergency_contacts')) {
            Schema::create('emergency_contacts', function (Blueprint $table) {
                $table->id();

                // Foreign key to users table
                $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                // Contact information
                $table->string('name');
                $table->string('relationship'); // e.g., Spouse, Father, Mother, Sibling
                $table->string('phone');
                $table->string('alternate_phone')->nullable();
                $table->string('email')->nullable();

                // Address
                $table->text('address')->nullable();
                $table->string('city')->nullable();
                $table->string('country', 3)->nullable(); // ISO country code

                // Priority (for ordering)
                $table->tinyInteger('priority')->default(1); // 1 = Primary, 2 = Secondary, etc.
                $table->boolean('is_primary')->default(false);

                // Notification preferences
                $table->boolean('notify_on_emergency')->default(true);

                $table->timestamps();
                $table->softDeletes();

                // Indexes
                $table->index('is_primary');
                $table->index('priority');
                $table->index(['user_id', 'priority']);
            });
        }

        // =====================================================================
        // TABLE 4: EMPLOYEE ADDRESSES (1:Many with users)
        // =====================================================================
        if (! Schema::hasTable('employee_addresses')) {
            Schema::create('employee_addresses', function (Blueprint $table) {
                $table->id();

                // Foreign key to users table
                $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                // Address type
                $table->enum('address_type', ['permanent', 'current', 'mailing', 'work'])->default('current');

                // Address details
                $table->text('address_line_1');
                $table->text('address_line_2')->nullable();
                $table->string('city');
                $table->string('state')->nullable();
                $table->string('postal_code', 20)->nullable();
                $table->string('country', 3); // ISO country code

                // Flags
                $table->boolean('is_primary')->default(false);

                // Validity period (for temporary addresses)
                $table->date('valid_from')->nullable();
                $table->date('valid_until')->nullable();

                $table->timestamps();
                $table->softDeletes();

                // Indexes
                $table->index('address_type');
                $table->index('is_primary');
                $table->index(['user_id', 'address_type']);
            });
        }

        // =====================================================================
        // TABLE 5: EMPLOYEE EDUCATION (1:Many with users)
        // =====================================================================
        if (! Schema::hasTable('employee_education')) {
            Schema::create('employee_education', function (Blueprint $table) {
                $table->id();

                // Foreign key to users table
                $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                // Education details
                $table->string('institution_name');
                $table->string('degree'); // e.g., Bachelor's, Master's, PhD
                $table->string('field_of_study'); // e.g., Computer Science
                $table->string('grade')->nullable(); // GPA or grade

                // Duration
                $table->date('start_date');
                $table->date('end_date')->nullable();
                $table->boolean('is_current')->default(false);

                // Location
                $table->string('city')->nullable();
                $table->string('country', 3)->nullable();

                // Certificate/Document
                $table->string('certificate_path')->nullable();
                $table->boolean('is_verified')->default(false);

                // Notes
                $table->text('achievements')->nullable();
                $table->text('notes')->nullable();

                $table->timestamps();
                $table->softDeletes();

                // Indexes
                $table->index('degree');
                $table->index(['user_id', 'is_current']);
            });
        }

        // =====================================================================
        // TABLE 6: EMPLOYEE WORK EXPERIENCE (1:Many with users)
        // =====================================================================
        if (! Schema::hasTable('employee_work_experience')) {
            Schema::create('employee_work_experience', function (Blueprint $table) {
                $table->id();

                // Foreign key to users table
                $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                // Company details
                $table->string('company_name');
                $table->string('company_industry')->nullable();
                $table->string('company_location')->nullable();

                // Job details
                $table->string('job_title');
                $table->text('job_description')->nullable();
                $table->text('responsibilities')->nullable();

                // Duration
                $table->date('start_date');
                $table->date('end_date')->nullable();
                $table->boolean('is_current')->default(false);

                // Employment type
                $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'internship', 'freelance'])
                    ->default('full_time');

                // Salary (optional, for reference)
                $table->decimal('last_salary', 12, 2)->nullable();
                $table->string('salary_currency', 3)->nullable();

                // Reason for leaving
                $table->string('reason_for_leaving')->nullable();

                // Reference contact
                $table->string('reference_name')->nullable();
                $table->string('reference_phone')->nullable();
                $table->string('reference_email')->nullable();

                // Verification
                $table->boolean('is_verified')->default(false);
                $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();

                // Documents (e.g., experience letter)
                $table->string('document_path')->nullable();

                // Notes
                $table->text('notes')->nullable();

                $table->timestamps();
                $table->softDeletes();

                // Indexes
                $table->index('company_name');
                $table->index(['user_id', 'is_current']);
                $table->index('start_date');
            });
        }

        // =====================================================================
        // TABLE 7: EMPLOYEE CERTIFICATIONS (1:Many with users)
        // =====================================================================
        if (! Schema::hasTable('employee_certifications')) {
            Schema::create('employee_certifications', function (Blueprint $table) {
                $table->id();

                // Foreign key to users table
                $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                // Certification details
                $table->string('name'); // e.g., 'AWS Solutions Architect'
                $table->string('issuing_organization'); // e.g., 'Amazon Web Services'
                $table->string('credential_id')->nullable();
                $table->string('credential_url')->nullable();

                // Validity
                $table->date('issue_date');
                $table->date('expiry_date')->nullable();
                $table->boolean('does_not_expire')->default(false);

                // Certificate document
                $table->string('certificate_path')->nullable();

                // Verification
                $table->boolean('is_verified')->default(false);
                $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('verified_at')->nullable();

                $table->text('notes')->nullable();

                $table->timestamps();
                $table->softDeletes();

                // Indexes
                $table->index('expiry_date');
                $table->index(['user_id', 'is_verified']);
            });
        }

        // =====================================================================
        // TABLE 8: EMPLOYEE DEPENDENTS (1:Many with users)
        // =====================================================================
        if (! Schema::hasTable('employee_dependents')) {
            Schema::create('employee_dependents', function (Blueprint $table) {
                $table->id();

                // Foreign key to users table
                $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                // Dependent information
                $table->string('name');
                $table->enum('relationship', ['spouse', 'child', 'parent', 'sibling', 'other']);
                $table->date('date_of_birth')->nullable();
                $table->enum('gender', ['male', 'female', 'other'])->nullable();

                // Contact
                $table->string('phone')->nullable();
                $table->string('email')->nullable();

                // Benefits eligibility
                $table->boolean('is_beneficiary')->default(false);
                $table->boolean('is_insurance_covered')->default(false);

                // Documents
                $table->string('document_path')->nullable(); // Birth certificate, marriage cert, etc.

                $table->text('notes')->nullable();

                $table->timestamps();
                $table->softDeletes();

                // Indexes
                $table->index('relationship');
                $table->index(['user_id', 'is_beneficiary']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_dependents');
        Schema::dropIfExists('employee_certifications');
        Schema::dropIfExists('employee_work_experience');
        Schema::dropIfExists('employee_education');
        Schema::dropIfExists('employee_addresses');
        Schema::dropIfExists('emergency_contacts');
        Schema::dropIfExists('employee_personal_documents');
        Schema::dropIfExists('employee_bank_details');
    }
};
