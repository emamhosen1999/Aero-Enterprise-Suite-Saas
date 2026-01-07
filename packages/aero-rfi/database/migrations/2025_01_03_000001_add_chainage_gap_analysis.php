<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds chainage gap analysis and layer sequencing support.
     * This is the PATENTABLE enhancement for spatial indexing.
     */
    public function up(): void
    {
        // Enhance work_locations with numeric chainage for precise calculations
        Schema::table('work_locations', function (Blueprint $table) {
            // Numeric chainage in meters for precise gap analysis
            if (!Schema::hasColumn('work_locations', 'start_chainage_m')) {
                $table->decimal('start_chainage_m', 12, 3)->nullable()->after('end_chainage')
                    ->comment('Start chainage in meters (e.g., 15200.500)');
            }
            if (!Schema::hasColumn('work_locations', 'end_chainage_m')) {
                $table->decimal('end_chainage_m', 12, 3)->nullable()->after('start_chainage_m')
                    ->comment('End chainage in meters');
            }
            
            // Offset and elevation for 3D positioning (roads have left/right sides)
            if (!Schema::hasColumn('work_locations', 'offset_left')) {
                $table->decimal('offset_left', 8, 3)->nullable()->after('end_chainage_m')
                    ->comment('Left offset from centerline in meters');
            }
            if (!Schema::hasColumn('work_locations', 'offset_right')) {
                $table->decimal('offset_right', 8, 3)->nullable()->after('offset_left')
                    ->comment('Right offset from centerline in meters');
            }
            
            // Project reference (multi-project support)
            if (!Schema::hasColumn('work_locations', 'project_id')) {
                $table->foreignId('project_id')->nullable()->after('id')
                    ->comment('Associated project for this work location');
            }
        });
        
        // Add indexes separately to avoid issues with conditional column creation
        if (Schema::hasColumn('work_locations', 'start_chainage_m') && Schema::hasColumn('work_locations', 'end_chainage_m')) {
            try {
                Schema::table('work_locations', function (Blueprint $table) {
                    $table->index(['start_chainage_m', 'end_chainage_m'], 'work_locations_chainage_idx');
                });
            } catch (\Exception $e) {
                // Index may already exist
            }
        }
        if (Schema::hasColumn('work_locations', 'project_id')) {
            try {
                Schema::table('work_locations', function (Blueprint $table) {
                    $table->index('project_id', 'work_locations_project_idx');
                });
            } catch (\Exception $e) {
                // Index may already exist
            }
        }

        // Create layer definitions table (Embankment Layer 1, Layer 2, etc.)
        Schema::create('work_layers', function (Blueprint $table) {
            $table->id();
            // Project ID is nullable and only references if projects table exists
            if (Schema::hasTable('projects')) {
                $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            } else {
                $table->unsignedBigInteger('project_id')->nullable();
                $table->index('project_id');
            }
            $table->string('code')->index(); // e.g., "EMB-L1"
            $table->string('name'); // "Embankment Layer 1"
            $table->string('work_type'); // Embankment, Structure, Pavement
            $table->integer('sequence_order'); // 1, 2, 3 (Layer 1 must precede Layer 2)
            $table->foreignId('prerequisite_layer_id')->nullable()
                ->constrained('work_layers')->nullOnDelete()
                ->comment('Layer that must be approved before this one');
            $table->json('required_quality_checks')->nullable()
                ->comment('Array of required quality inspection types');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            // Only create unique constraint if project_id is present
            if (Schema::hasTable('projects')) {
                $table->unique(['project_id', 'code']);
            } else {
                $table->unique('code');
            }
        });

        // Create chainage progress tracking (the "Golden Ledger")
        Schema::create('chainage_progress', function (Blueprint $table) {
            $table->id();
            // Project ID is nullable and only references if projects table exists
            if (Schema::hasTable('projects')) {
                $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            } else {
                $table->unsignedBigInteger('project_id');
                $table->index('project_id');
            }
            $table->foreignId('work_layer_id')->constrained()->cascadeOnDelete();
            $table->decimal('start_chainage_m', 12, 3);
            $table->decimal('end_chainage_m', 12, 3);
            
            // Status tracking
            $table->string('status')->default('not_started')
                ->comment('not_started, rfi_submitted, inspected, approved, rejected');
            
            // Links to source records
            $table->foreignId('daily_work_id')->nullable()
                ->constrained('daily_works')->nullOnDelete()
                ->comment('The RFI that covers this chainage segment');
            $table->foreignId('quality_inspection_id')->nullable()
                ->comment('The quality inspection for this segment');
            $table->foreignId('boq_measurement_id')->nullable()
                ->comment('The approved measurement for billing');
            
            // Audit trail
            $table->timestamp('rfi_submitted_at')->nullable();
            $table->timestamp('inspected_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            // Users table may not exist during migration - skip FK
            $table->unsignedBigInteger('approved_by_user_id')->nullable()->index();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for gap analysis queries
            $table->index(['project_id', 'work_layer_id', 'status']);
            $table->index(['start_chainage_m', 'end_chainage_m']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chainage_progress');
        Schema::dropIfExists('work_layers');
        
        // Drop indexes if they exist
        try {
            Schema::table('work_locations', function (Blueprint $table) {
                $table->dropIndex('work_locations_chainage_idx');
            });
        } catch (\Exception $e) {
            // Index may not exist
        }
        try {
            Schema::table('work_locations', function (Blueprint $table) {
                $table->dropIndex('work_locations_project_idx');
            });
        } catch (\Exception $e) {
            // Index may not exist
        }
        
        // Drop columns if they exist
        $columnsToDrop = [];
        foreach (['start_chainage_m', 'end_chainage_m', 'offset_left', 'offset_right', 'project_id'] as $column) {
            if (Schema::hasColumn('work_locations', $column)) {
                $columnsToDrop[] = $column;
            }
        }
        if (!empty($columnsToDrop)) {
            Schema::table('work_locations', function (Blueprint $table) use ($columnsToDrop) {
                $table->dropColumn($columnsToDrop);
            });
        }
    }
};
