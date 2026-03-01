<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add Permit Validation Fields - PATENTABLE CORE IP
     *
     * Adds RequiresPermit trait support to Rfi model.
     * Stores permit validation results and authorization checks.
     */
    public function up(): void
    {
        Schema::table('daily_works', function (Blueprint $table) {
            // Permit Relationship (no FK constraint - permit_to_works may not exist)
            $table->unsignedBigInteger('permit_to_work_id')->nullable();

            // Permit Validation (from PermitValidationService)
            $table->json('permit_validation_result')->nullable()->comment('Permit check result');
            $table->enum('permit_validation_status', ['passed', 'failed', 'pending', 'skipped'])->nullable();
            $table->boolean('requires_hse_review')->default(false)->comment('Flag for HSE department review');
            $table->text('hse_review_reason')->nullable();

            // Emergency Override (users table may not exist during migration - skip FK)
            $table->unsignedBigInteger('permit_overridden_by')->nullable()->index();
            $table->timestamp('permit_overridden_at')->nullable();
            $table->text('permit_override_reason')->nullable();

            // Indexes
            $table->index('permit_to_work_id');
            $table->index(['permit_validation_status', 'requires_hse_review'], 'idx_permit_validation');
        });
    }

    public function down(): void
    {
        Schema::table('daily_works', function (Blueprint $table) {
            $table->dropIndex('idx_permit_validation');
            $table->dropIndex(['permit_to_work_id']);
            $table->dropForeign(['permit_overridden_by']);
            $table->dropColumn([
                'permit_to_work_id',
                'permit_validation_result',
                'permit_validation_status',
                'requires_hse_review',
                'hse_review_reason',
                'permit_overridden_by',
                'permit_overridden_at',
                'permit_override_reason',
            ]);
        });
    }
};
