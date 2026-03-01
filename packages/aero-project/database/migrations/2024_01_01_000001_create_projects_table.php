<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Projects Table - Core entity for project management
     *
     * Supports both general project management and construction-specific features.
     */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();

            // Core fields (matches existing Project model)
            $table->string('project_name');
            $table->string('code', 50)->nullable()->comment('Project code/reference');
            $table->text('description')->nullable();
            // Users table may not exist during migration - skip FK
            $table->unsignedBigInteger('client_id')->nullable()->index();
            $table->unsignedBigInteger('department_id')->nullable()->comment('FK to departments if HRM installed');

            // Dates
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            // Team
            $table->unsignedBigInteger('project_leader_id')->nullable()->index();
            $table->unsignedBigInteger('team_leader_id')->nullable()->index();

            // Financial
            $table->decimal('budget', 15, 2)->nullable();
            $table->decimal('rate', 10, 2)->nullable();
            $table->string('rate_type', 50)->nullable()->comment('hourly, daily, fixed');

            // Status & Progress
            $table->string('status', 50)->default('active');
            $table->string('priority', 20)->default('medium');
            $table->integer('progress')->default(0);
            $table->string('color', 20)->nullable();

            // Files & Notes
            $table->json('files')->nullable();
            $table->text('notes')->nullable();

            // ===== Construction-Specific Fields (PATENTABLE FEATURES) =====

            // Project classification for construction
            $table->string('type', 100)->default('general')
                ->comment('general, construction, infrastructure, highway, etc.');
            $table->string('category', 100)->nullable()
                ->comment('road, bridge, tunnel, building, etc.');

            // Location & Linear alignment
            $table->string('location')->nullable()->comment('General location/region');
            $table->decimal('start_chainage', 10, 3)->nullable()->comment('Start chainage in km');
            $table->decimal('end_chainage', 10, 3)->nullable()->comment('End chainage in km');
            $table->decimal('total_length', 10, 3)->nullable()->comment('Total length in km');

            // GPS boundaries for geofencing
            $table->decimal('boundary_lat_min', 10, 7)->nullable();
            $table->decimal('boundary_lat_max', 10, 7)->nullable();
            $table->decimal('boundary_lng_min', 10, 7)->nullable();
            $table->decimal('boundary_lng_max', 10, 7)->nullable();

            // Geofence settings
            $table->json('geofence_settings')->nullable()
                ->comment('GPS validation radius, tolerance settings');

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('type');
            $table->index('priority');
            $table->index(['start_chainage', 'end_chainage']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
