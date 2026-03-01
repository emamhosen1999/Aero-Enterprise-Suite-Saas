<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add GPS Validation Fields - PATENTABLE CORE IP
     *
     * Adds HasGeoLock trait support to Rfi model.
     * Stores GPS coordinates and validation results for anti-fraud protection.
     */
    public function up(): void
    {
        Schema::table('daily_works', function (Blueprint $table) {
            // GPS Coordinates (captured from user's device)
            $table->decimal('latitude', 10, 7)->nullable()->comment('User GPS latitude');
            $table->decimal('longitude', 10, 7)->nullable()->comment('User GPS longitude');
            $table->decimal('gps_accuracy', 8, 2)->nullable()->comment('GPS accuracy in meters');
            $table->timestamp('gps_captured_at')->nullable();

            // Geo Validation Results (from GeoFencingService)
            $table->json('geo_validation_result')->nullable()->comment('Full validation result from service');
            $table->enum('geo_validation_status', ['passed', 'failed', 'pending', 'skipped'])->nullable();
            $table->boolean('requires_review')->default(false)->comment('Flag for supervisor review');
            $table->text('review_reason')->nullable();

            // Indexes
            $table->index(['geo_validation_status', 'requires_review'], 'idx_geo_validation');
            $table->index(['latitude', 'longitude'], 'idx_gps_coords');
        });
    }

    public function down(): void
    {
        Schema::table('daily_works', function (Blueprint $table) {
            $table->dropIndex('idx_geo_validation');
            $table->dropIndex('idx_gps_coords');
            $table->dropColumn([
                'latitude',
                'longitude',
                'gps_accuracy',
                'gps_captured_at',
                'geo_validation_result',
                'geo_validation_status',
                'requires_review',
                'review_reason',
            ]);
        });
    }
};
