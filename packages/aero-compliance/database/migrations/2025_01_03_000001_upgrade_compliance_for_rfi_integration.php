<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Upgrade Compliance tables for RFI/Project integration.
     * PATENTABLE: "Construction compliance verification with spatial indexing"
     */
    public function up(): void
    {
        // Add chainage/project context to regulatory requirements (if table exists)
        if (Schema::hasTable('regulatory_requirements')) {
            Schema::table('regulatory_requirements', function (Blueprint $table) {
                if (!Schema::hasColumn('regulatory_requirements', 'project_id')) {
                    $table->foreignId('project_id')->nullable()->after('id')
                        ->comment('Associated project');
                }
                
                // Chainage applicability
                if (!Schema::hasColumn('regulatory_requirements', 'start_chainage_m')) {
                    $table->decimal('start_chainage_m', 12, 3)->nullable()->after('project_id')
                        ->comment('Start chainage where this requirement applies');
                    $table->decimal('end_chainage_m', 12, 3)->nullable()->after('start_chainage_m')
                        ->comment('End chainage where this requirement applies');
                }
                
                // Auto-check trigger keywords
                if (!Schema::hasColumn('regulatory_requirements', 'trigger_keywords')) {
                    $table->json('trigger_keywords')->nullable()->after('evidence_documents')
                        ->comment('Keywords that trigger compliance check in RFI descriptions');
                }
                
                // RFI blocking
                if (!Schema::hasColumn('regulatory_requirements', 'blocks_rfi_if_non_compliant')) {
                    $table->boolean('blocks_rfi_if_non_compliant')->default(false)->after('trigger_keywords')
                        ->comment('If true, RFIs in this chainage are blocked until compliant');
                }
                
                $table->index(['project_id', 'start_chainage_m', 'end_chainage_m'], 'reg_req_chainage_idx');
            });
        }

        // Add chainage to risk assessments (if table exists)
        if (Schema::hasTable('risk_assessments')) {
            Schema::table('risk_assessments', function (Blueprint $table) {
                if (!Schema::hasColumn('risk_assessments', 'project_id')) {
                    $table->foreignId('project_id')->nullable()->after('id');
                    $table->decimal('start_chainage_m', 12, 3)->nullable()->after('project_id');
                    $table->decimal('end_chainage_m', 12, 3)->nullable()->after('start_chainage_m');
                }
                
                // Link to work layer
                if (!Schema::hasColumn('risk_assessments', 'work_layer_id')) {
                    $table->foreignId('work_layer_id')->nullable()->after('end_chainage_m')
                        ->comment('Specific layer this risk applies to');
                }
                
                // Predictive AI fields
                if (!Schema::hasColumn('risk_assessments', 'predicted_failure_probability')) {
                    $table->decimal('predicted_failure_probability', 5, 2)->nullable()->after('work_layer_id')
                        ->comment('AI-predicted probability of RFI failure (0-100%)');
                    $table->json('prediction_factors')->nullable()->after('predicted_failure_probability')
                        ->comment('Factors used in prediction (soil type, weather, history)');
                }
                
                $table->index(['project_id', 'start_chainage_m', 'end_chainage_m'], 'risk_chainage_idx');
            });
        }

        // Create compliance check log (auto-checks on RFI submission)
        if (!Schema::hasTable('compliance_check_logs')) {
            Schema::create('compliance_check_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('project_id')->nullable();
                $table->foreignId('daily_work_id')->constrained('daily_works')->cascadeOnDelete()
                    ->comment('The RFI that triggered this check');
                $table->unsignedBigInteger('regulatory_requirement_id')->nullable();
                
                $table->string('check_type'); // 'keyword', 'chainage', 'manual'
                $table->string('result'); // 'compliant', 'non_compliant', 'warning', 'not_applicable'
                $table->text('details')->nullable();
                $table->boolean('blocks_submission')->default(false);
                
                $table->foreignId('checked_by_user_id')->nullable()->constrained('users');
                $table->timestamp('checked_at');
                
                $table->timestamps();
                
                $table->index(['daily_work_id', 'result']);
                $table->index(['project_id', 'checked_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('compliance_check_logs');

        if (Schema::hasTable('risk_assessments')) {
            Schema::table('risk_assessments', function (Blueprint $table) {
                // Drop index if exists
                try {
                    $table->dropIndex('risk_chainage_idx');
                } catch (\Exception $e) {}
                
                $columns = ['project_id', 'start_chainage_m', 'end_chainage_m', 'work_layer_id', 'predicted_failure_probability', 'prediction_factors'];
                foreach ($columns as $col) {
                    if (Schema::hasColumn('risk_assessments', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('regulatory_requirements')) {
            Schema::table('regulatory_requirements', function (Blueprint $table) {
                try {
                    $table->dropIndex('reg_req_chainage_idx');
                } catch (\Exception $e) {}
                
                $columns = ['project_id', 'start_chainage_m', 'end_chainage_m', 'trigger_keywords', 'blocks_rfi_if_non_compliant'];
                foreach ($columns as $col) {
                    if (Schema::hasColumn('regulatory_requirements', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
