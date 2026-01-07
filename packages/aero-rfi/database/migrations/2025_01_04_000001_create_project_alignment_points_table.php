<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Project Alignment Points - PATENTABLE CORE IP
     * 
     * Stores surveyed GPS coordinates for chainage-to-GPS conversion.
     * Used by GeoFencingService for linear interpolation validation.
     * 
     * NOVELTY: Enables GPS validation on linear infrastructure projects
     * by mapping chainage positions to actual GPS coordinates.
     */
    public function up(): void
    {
        Schema::create('project_alignment_points', function (Blueprint $table) {
            $table->id();
            // No FK constraint - projects table may be from aero-project or host app
            $table->unsignedBigInteger('project_id');
            $table->decimal('chainage', 10, 3)->comment('Linear position in km');
            $table->decimal('latitude', 10, 7)->comment('GPS latitude (7 decimal places = ~1cm accuracy)');
            $table->decimal('longitude', 10, 7)->comment('GPS longitude');
            $table->decimal('elevation', 8, 2)->nullable()->comment('Elevation in meters');
            $table->string('point_type', 50)->default('control')->comment('control, survey, marker');
            $table->string('source', 100)->nullable()->comment('Survey method or equipment used');
            $table->date('surveyed_date')->nullable();
            // Users table may not exist during migration - skip FK
            $table->unsignedBigInteger('surveyed_by')->nullable()->index();
            $table->text('notes')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->unsignedBigInteger('verified_by')->nullable()->index();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index(['project_id', 'chainage'], 'idx_project_chainage');
            $table->index(['project_id', 'latitude', 'longitude'], 'idx_project_gps');
            $table->index('is_verified');
            
            // Unique constraint: one point per chainage per project
            $table->unique(['project_id', 'chainage']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_alignment_points');
    }
};
