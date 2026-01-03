<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Upgrade QualityInspection for construction RFI integration.
     * PATENTABLE: "Geo-fenced quality verification with chainage indexing"
     */
    public function up(): void
    {
        Schema::table('quality_inspections', function (Blueprint $table) {
            // Link to RFI/DailyWork
            $table->foreignId('daily_work_id')->nullable()->after('id')
                ->comment('The RFI this inspection is for');
            
            // Project context
            $table->foreignId('project_id')->nullable()->after('daily_work_id')
                ->comment('Project reference');
            
            // Chainage indexing (spatial)
            $table->decimal('start_chainage_m', 12, 3)->nullable()->after('project_id')
                ->comment('Start chainage in meters');
            $table->decimal('end_chainage_m', 12, 3)->nullable()->after('start_chainage_m')
                ->comment('End chainage in meters');
            
            // Geo-fencing fields (PATENTABLE: "Location-verified inspection")
            $table->decimal('inspector_latitude', 10, 8)->nullable()->after('end_chainage_m')
                ->comment('GPS latitude when inspection started');
            $table->decimal('inspector_longitude', 11, 8)->nullable()->after('inspector_latitude')
                ->comment('GPS longitude when inspection started');
            $table->decimal('geo_accuracy_m', 8, 2)->nullable()->after('inspector_longitude')
                ->comment('GPS accuracy in meters');
            $table->boolean('geo_verified')->default(false)->after('geo_accuracy_m')
                ->comment('True if inspector was within allowed radius of site');
            
            // Digital signature / blockchain hash (PATENTABLE)
            $table->string('verification_hash', 64)->nullable()->after('geo_verified')
                ->comment('SHA-256 hash of inspection data for immutability');
            $table->timestamp('hash_generated_at')->nullable()->after('verification_hash');
            
            // Work layer reference
            $table->foreignId('work_layer_id')->nullable()->after('hash_generated_at')
                ->comment('The layer being inspected');
            
            // Enhanced result tracking
            $table->json('checklist_results')->nullable()->after('checklist_data')
                ->comment('Individual pass/fail for each checklist item');
            $table->integer('pass_count')->default(0)->after('checklist_results');
            $table->integer('fail_count')->default(0)->after('pass_count');
            $table->decimal('compliance_percentage', 5, 2)->nullable()->after('fail_count');
            
            // Indexes
            $table->index(['daily_work_id']);
            $table->index(['project_id', 'start_chainage_m', 'end_chainage_m']);
            $table->index('verification_hash');
        });
    }

    public function down(): void
    {
        Schema::table('quality_inspections', function (Blueprint $table) {
            $table->dropIndex(['daily_work_id']);
            $table->dropIndex(['project_id', 'start_chainage_m', 'end_chainage_m']);
            $table->dropIndex(['verification_hash']);
            
            $table->dropColumn([
                'daily_work_id',
                'project_id',
                'start_chainage_m',
                'end_chainage_m',
                'inspector_latitude',
                'inspector_longitude',
                'geo_accuracy_m',
                'geo_verified',
                'verification_hash',
                'hash_generated_at',
                'work_layer_id',
                'checklist_results',
                'pass_count',
                'fail_count',
                'compliance_percentage',
            ]);
        });
    }
};
