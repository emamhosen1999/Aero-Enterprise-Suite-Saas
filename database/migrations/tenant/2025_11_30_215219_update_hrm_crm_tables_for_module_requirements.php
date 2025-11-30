<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * HRM & CRM Module Requirements Migration
 *
 * This migration ensures the tenant database schema meets the requirements
 * for the HRM and CRM modules as specified in the FYP documentation.
 *
 * Changes:
 * - departments: Fix manager_id type (VARCHAR -> BIGINT FK)
 * - employees: Create new table (separate from users)
 * - customers: Add company_name, update status enum values
 * - interactions: Create standardized table (rename customer_interactions)
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // =====================================================================
        // MODULE 1: HRM - DEPARTMENTS TABLE UPDATE
        // =====================================================================
        Schema::table('departments', function (Blueprint $table) {
            // Drop old manager_id varchar column and add proper FK
            // Note: We need to handle existing data
        });

        // Use raw SQL to modify manager_id column type safely
        if (Schema::hasColumn('departments', 'manager_id')) {
            // First, update any non-null varchar values to null (or convert if numeric)
            DB::statement('UPDATE `departments` SET `manager_id` = NULL WHERE `manager_id` IS NOT NULL AND `manager_id` NOT REGEXP \'^[0-9]+$\'');

            // Convert varchar manager_id to bigint
            DB::statement('ALTER TABLE `departments` MODIFY `manager_id` BIGINT UNSIGNED NULL');

            // Add index for the foreign key (FK will be added after users table exists)
            Schema::table('departments', function (Blueprint $table) {
                $table->index('manager_id', 'departments_manager_id_index');
            });
        }

        // =====================================================================
        // MODULE 1: HRM - EMPLOYEES TABLE (NEW)
        // =====================================================================
        if (! Schema::hasTable('employees')) {
            Schema::create('employees', function (Blueprint $table) {
                $table->id();

                // Foreign key to users table with CASCADE delete
                $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                // Foreign key to departments with SET NULL on delete
                $table->foreignId('department_id')
                    ->nullable()
                    ->constrained('departments')
                    ->nullOnDelete();

                // Employee details
                $table->string('employee_code')->unique()->nullable();
                $table->string('job_title');
                $table->date('date_of_joining');

                // Salary - DECIMAL(12,2) as specified
                $table->decimal('basic_salary', 12, 2)->default(0);

                // Status enum as specified
                $table->enum('status', ['active', 'resigned', 'terminated'])->default('active');

                // Additional useful fields
                $table->date('date_of_leaving')->nullable();
                $table->string('leaving_reason')->nullable();
                $table->text('notes')->nullable();

                $table->timestamps();
                $table->softDeletes(); // Required: deleted_at column

                // Indexes for common queries
                $table->index('status');
                $table->index('date_of_joining');
                $table->index(['department_id', 'status']);
            });
        }

        // =====================================================================
        // MODULE 2: CRM - CUSTOMERS TABLE UPDATE
        // =====================================================================
        Schema::table('customers', function (Blueprint $table) {
            // Add company_name if it doesn't exist (requirement says company_name, table has company)
            if (! Schema::hasColumn('customers', 'company_name')) {
                $table->string('company_name')->nullable()->after('phone');
            }
        });

        // Update status enum to match requirements: 'lead', 'opportunity', 'customer', 'churned'
        // Current: 'active', 'inactive', 'lead', 'prospect'
        DB::statement("ALTER TABLE `customers` MODIFY `status` ENUM('lead', 'opportunity', 'customer', 'churned', 'active', 'inactive', 'prospect') NOT NULL DEFAULT 'lead'");

        // Migrate existing status values
        DB::statement("UPDATE `customers` SET `status` = 'customer' WHERE `status` = 'active'");
        DB::statement("UPDATE `customers` SET `status` = 'churned' WHERE `status` = 'inactive'");
        DB::statement("UPDATE `customers` SET `status` = 'opportunity' WHERE `status` = 'prospect'");

        // Now restrict to only the required values
        DB::statement("ALTER TABLE `customers` MODIFY `status` ENUM('lead', 'opportunity', 'customer', 'churned') NOT NULL DEFAULT 'lead'");

        // Copy data from 'company' to 'company_name' if company_name was just created
        if (Schema::hasColumn('customers', 'company') && Schema::hasColumn('customers', 'company_name')) {
            DB::statement('UPDATE `customers` SET `company_name` = `company` WHERE `company_name` IS NULL AND `company` IS NOT NULL');
        }

        // =====================================================================
        // MODULE 2: CRM - INTERACTIONS TABLE (NEW/STANDARDIZED)
        // =====================================================================
        // Create the standardized 'interactions' table as per requirements
        if (! Schema::hasTable('interactions')) {
            Schema::create('interactions', function (Blueprint $table) {
                $table->id();

                // Foreign key to customers with CASCADE delete
                $table->foreignId('customer_id')
                    ->constrained('customers')
                    ->cascadeOnDelete();

                // Type enum as specified
                $table->enum('type', ['call', 'email', 'meeting'])->default('call');

                // Notes and date
                $table->text('notes')->nullable();
                $table->dateTime('date');

                // Additional useful fields
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('outcome')->nullable();
                $table->integer('duration_minutes')->nullable();

                $table->timestamps();

                // Indexes
                $table->index('type');
                $table->index('date');
                $table->index(['customer_id', 'date']);
            });
        }

        // =====================================================================
        // ADD FOREIGN KEY CONSTRAINTS (after all tables exist)
        // =====================================================================
        // Add FK for departments.manager_id -> users.id
        // Using raw SQL to avoid issues if constraint already exists
        try {
            DB::statement('ALTER TABLE `departments` ADD CONSTRAINT `departments_manager_id_foreign` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL');
        } catch (\Exception $e) {
            // Constraint may already exist, ignore
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove FK constraint from departments
        Schema::table('departments', function (Blueprint $table) {
            try {
                $table->dropForeign(['manager_id']);
                $table->dropIndex('departments_manager_id_index');
            } catch (\Exception $e) {
                // Ignore if doesn't exist
            }
        });

        // Convert manager_id back to varchar
        DB::statement('ALTER TABLE `departments` MODIFY `manager_id` VARCHAR(255) NULL');

        // Drop new tables
        Schema::dropIfExists('interactions');
        Schema::dropIfExists('employees');

        // Revert customers status enum
        DB::statement("ALTER TABLE `customers` MODIFY `status` ENUM('active', 'inactive', 'lead', 'prospect') NOT NULL DEFAULT 'lead'");

        // Drop company_name column
        Schema::table('customers', function (Blueprint $table) {
            if (Schema::hasColumn('customers', 'company_name')) {
                $table->dropColumn('company_name');
            }
        });
    }
};
