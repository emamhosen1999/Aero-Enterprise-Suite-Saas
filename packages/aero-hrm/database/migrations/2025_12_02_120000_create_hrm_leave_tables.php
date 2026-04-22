<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Canonical HRM Leave tables migration.
 *
 * Split from: 2025_12_02_121546_create_hrm_core_tables.php (section 2.3)
 *
 * Absorbed additive migrations:
 *  - 2026_04_21_000004_create_leave_accrual_rules_table.php        (new table, domain-grouped here)
 *  - 2026_04_21_000005_create_leave_accrual_transactions_table.php (new table, domain-grouped here)
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── leave_settings ─────────────────────────────────────────────────────
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

        // ── leaves ─────────────────────────────────────────────────────────────
        if (! Schema::hasTable('leaves')) {
            Schema::create('leaves', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('leave_setting_id')->nullable()->constrained('leave_settings')->nullOnDelete();
                $table->string('leave_type');
                $table->date('from_date');
                $table->date('to_date');
                $table->integer('no_of_days');
                $table->text('reason');
                $table->string('status')->default('New');
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

        // ── leave_balances ─────────────────────────────────────────────────────
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

        // ── holidays ───────────────────────────────────────────────────────────
        if (! Schema::hasTable('holidays')) {
            Schema::create('holidays', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->date('date');
                $table->date('end_date')->nullable();
                $table->enum('type', ['public', 'optional', 'religious', 'national'])->default('public');
                $table->boolean('is_recurring')->default(false);
                $table->json('applicable_to')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index('date');
                $table->index(['date', 'is_active']);
            });
        }

        // ── leave_accrual_rules ────────────────────────────────────────────────
        // Absorbed from: 2026_04_21_000004_create_leave_accrual_rules_table.php
        if (! Schema::hasTable('leave_accrual_rules')) {
            Schema::create('leave_accrual_rules', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->foreignId('leave_type_id')->constrained('leave_settings')->cascadeOnDelete();
                $table->string('name');
                $table->enum('accrual_frequency', ['monthly', 'bi-weekly', 'weekly', 'annually']);
                $table->decimal('accrual_rate', 8, 2)->comment('Days accrued per period');
                $table->decimal('max_balance', 8, 2)->nullable()->comment('Maximum days cap');
                $table->unsignedInteger('min_service_months')->default(0)->comment('Eligibility threshold in months');
                $table->boolean('is_active')->default(true);
                $table->boolean('carry_forward')->default(false);
                $table->decimal('max_carry_forward_days', 8, 2)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // ── leave_accrual_transactions ─────────────────────────────────────────
        // Absorbed from: 2026_04_21_000005_create_leave_accrual_transactions_table.php
        if (! Schema::hasTable('leave_accrual_transactions')) {
            Schema::create('leave_accrual_transactions', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('leave_type_id')->constrained('leave_settings');
                $table->foreignId('accrual_rule_id')->nullable()->constrained('leave_accrual_rules')->nullOnDelete();
                $table->enum('transaction_type', ['accrual', 'adjustment', 'reset', 'carryforward']);
                $table->decimal('days', 8, 2);
                $table->decimal('balance_before', 8, 2);
                $table->decimal('balance_after', 8, 2);
                $table->date('period_month')->comment('The accrual month');
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_accrual_transactions');
        Schema::dropIfExists('leave_accrual_rules');
        Schema::dropIfExists('holidays');
        Schema::dropIfExists('leave_balances');
        Schema::dropIfExists('leaves');
        Schema::dropIfExists('leave_settings');
    }
};
