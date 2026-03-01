<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Upgrade NonConformanceReport for chainage-based blocking.
     * PATENTABLE: "Spatial non-conformance blocking for construction workflows"
     */
    public function up(): void
    {
        // Only run if table exists (skip for fresh installs)
        if (! Schema::hasTable('non_conformance_reports')) {
            return;
        }

        Schema::table('non_conformance_reports', function (Blueprint $table) {
            // Project/Location context
            $table->foreignId('project_id')->nullable()->after('id')
                ->comment('Project reference');

            // Chainage blocking (PATENTABLE: "If NCR open at CH 100-200, block all RFIs at that chainage")
            $table->decimal('start_chainage_m', 12, 3)->nullable()->after('project_id')
                ->comment('Start chainage affected by this NCR');
            $table->decimal('end_chainage_m', 12, 3)->nullable()->after('start_chainage_m')
                ->comment('End chainage affected by this NCR');

            // Link to source RFI/Inspection
            $table->foreignId('daily_work_id')->nullable()->after('end_chainage_m')
                ->comment('The RFI that triggered this NCR');
            $table->foreignId('quality_inspection_id')->nullable()->after('daily_work_id')
                ->comment('The inspection that found the issue');
            $table->foreignId('work_layer_id')->nullable()->after('quality_inspection_id')
                ->comment('The layer affected');

            // Blocking scope
            $table->boolean('blocks_same_layer')->default(true)->after('work_layer_id')
                ->comment('Blocks RFIs for the same layer at this chainage');
            $table->boolean('blocks_all_layers')->default(false)->after('blocks_same_layer')
                ->comment('Blocks ALL layer RFIs at this chainage (critical NCR)');
            $table->boolean('blocks_payment')->default(true)->after('blocks_all_layers')
                ->comment('Prevents payment certification for this chainage');

            // Resolution tracking
            $table->timestamp('resolution_deadline')->nullable()->after('blocks_payment');
            $table->foreignId('assigned_to_user_id')->nullable()->after('resolution_deadline')
                ->comment('User responsible for resolution');
            $table->text('resolution_notes')->nullable()->after('assigned_to_user_id');

            // Cost impact (for QS integration)
            $table->decimal('estimated_rework_cost', 15, 2)->nullable()->after('resolution_notes');
            $table->decimal('actual_rework_cost', 15, 2)->nullable()->after('estimated_rework_cost');

            // Verification hash for audit trail
            $table->string('verification_hash', 64)->nullable()->after('actual_rework_cost');

            // Indexes
            $table->index(['project_id', 'start_chainage_m', 'end_chainage_m', 'status']);
            $table->index('daily_work_id');
            $table->index('work_layer_id');
        });
    }

    public function down(): void
    {
        Schema::table('non_conformance_reports', function (Blueprint $table) {
            $table->dropIndex(['project_id', 'start_chainage_m', 'end_chainage_m', 'status']);
            $table->dropIndex(['daily_work_id']);
            $table->dropIndex(['work_layer_id']);

            $table->dropColumn([
                'project_id',
                'start_chainage_m',
                'end_chainage_m',
                'daily_work_id',
                'quality_inspection_id',
                'work_layer_id',
                'blocks_same_layer',
                'blocks_all_layers',
                'blocks_payment',
                'resolution_deadline',
                'assigned_to_user_id',
                'resolution_notes',
                'estimated_rework_cost',
                'actual_rework_cost',
                'verification_hash',
            ]);
        });
    }
};
