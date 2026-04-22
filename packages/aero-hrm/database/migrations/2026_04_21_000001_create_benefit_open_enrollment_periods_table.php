<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('benefit_open_enrollment_periods')) {
            Schema::create('benefit_open_enrollment_periods', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->date('starts_at');
                $table->date('ends_at');
                $table->enum('status', ['draft', 'active', 'closed'])->default('draft');
                $table->text('description')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->index('status');
                $table->index(['starts_at', 'ends_at']);
                $table->index('created_by');
            });
        }

        if (Schema::hasTable('benefit_enrollments') && ! Schema::hasColumn('benefit_enrollments', 'benefit_open_enrollment_period_id')) {
            Schema::table('benefit_enrollments', function (Blueprint $table) {
                $table->foreignId('benefit_open_enrollment_period_id')
                    ->nullable()
                    ->after('benefit_plan_id')
                    ->constrained('benefit_open_enrollment_periods')
                    ->nullOnDelete();

                $table->index(['employee_id', 'benefit_open_enrollment_period_id'], 'benefit_enrollments_employee_period_index');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('benefit_enrollments') && Schema::hasColumn('benefit_enrollments', 'benefit_open_enrollment_period_id')) {
            Schema::table('benefit_enrollments', function (Blueprint $table) {
                $table->dropForeign(['benefit_open_enrollment_period_id']);
                $table->dropIndex('benefit_enrollments_employee_period_index');
                $table->dropColumn('benefit_open_enrollment_period_id');
            });
        }

        Schema::dropIfExists('benefit_open_enrollment_periods');
    }
};
