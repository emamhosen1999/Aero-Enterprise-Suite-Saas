<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Layer Continuity Tracking - PATENTABLE CORE IP
     *
     * Adds fields to track layer progression and validation.
     * Used by LinearContinuityValidator for sequence enforcement.
     */
    public function up(): void
    {
        Schema::table('daily_works', function (Blueprint $table) {
            // Layer Information
            $table->string('layer', 50)->nullable()->comment('Layer code: sub_base, base_course, etc.');
            $table->integer('layer_order')->nullable()->comment('Layer hierarchy level (1-7)');

            // Continuity Validation (from LinearContinuityValidator)
            $table->json('continuity_validation_result')->nullable()->comment('Layer continuity check result');
            $table->enum('continuity_status', ['validated', 'blocked', 'pending', 'overridden'])->nullable();
            $table->decimal('prerequisite_coverage', 5, 2)->nullable()->comment('Coverage % of required layers');
            $table->boolean('can_approve')->default(true)->comment('False if layer sequence violated');
            $table->json('detected_gaps')->nullable()->comment('List of gaps in prerequisite layers');

            // Override capability (for emergency situations)
            // Users table may not exist during migration - skip FK
            $table->unsignedBigInteger('continuity_overridden_by')->nullable()->index();
            $table->timestamp('continuity_overridden_at')->nullable();
            $table->text('continuity_override_reason')->nullable();

            // Indexes (only on columns that exist)
            $table->index(['continuity_status', 'can_approve'], 'idx_continuity');
            $table->index(['layer', 'layer_order'], 'idx_layer_order');
        });
    }

    public function down(): void
    {
        Schema::table('daily_works', function (Blueprint $table) {
            $table->dropIndex('idx_continuity');
            $table->dropIndex('idx_layer_order');
            $table->dropForeign(['continuity_overridden_by']);
            $table->dropColumn([
                'layer',
                'layer_order',
                'continuity_validation_result',
                'continuity_status',
                'prerequisite_coverage',
                'can_approve',
                'detected_gaps',
                'continuity_overridden_by',
                'continuity_overridden_at',
                'continuity_override_reason',
            ]);
        });
    }
};
