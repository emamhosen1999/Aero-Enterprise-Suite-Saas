<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Material consumption tracking per daily work
        Schema::create('material_consumptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_work_id')->constrained('daily_works')->cascadeOnDelete();
            $table->foreignId('work_layer_id')->nullable()->constrained('work_layers')->nullOnDelete();

            // Material details
            $table->string('material_name');
            $table->string('material_code', 50)->nullable();
            $table->string('specification')->nullable();
            $table->string('unit', 20); // m3, kg, nos, bags, etc.
            $table->decimal('quantity_used', 15, 3);
            $table->decimal('unit_cost', 15, 2)->default(0);

            // Chainage location
            $table->decimal('start_chainage_m', 12, 3)->nullable();
            $table->decimal('end_chainage_m', 12, 3)->nullable();

            // Source & Quality
            $table->string('supplier_name')->nullable();
            $table->string('batch_number')->nullable();
            $table->date('delivery_date')->nullable();
            $table->string('test_certificate_ref')->nullable();
            $table->json('quality_test_results')->nullable(); // Store test data
            $table->enum('quality_status', ['approved', 'pending', 'rejected'])->default('pending');

            // Wastage tracking
            $table->decimal('wastage_quantity', 15, 3)->default(0);
            $table->text('wastage_reason')->nullable();

            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['daily_work_id', 'material_code']);
            $table->index(['start_chainage_m', 'end_chainage_m']);
        });

        // Equipment usage tracking
        Schema::create('equipment_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_work_id')->constrained('daily_works')->cascadeOnDelete();
            $table->foreignId('work_layer_id')->nullable()->constrained('work_layers')->nullOnDelete();

            // Equipment details
            $table->string('equipment_type'); // Excavator, Roller, Paver, etc.
            $table->string('equipment_id', 50); // Registration/Asset ID
            $table->string('model')->nullable();
            $table->string('operator_name')->nullable();

            // Usage tracking
            $table->time('start_time');
            $table->time('end_time');
            $table->decimal('working_hours', 8, 2); // Calculated productive hours
            $table->decimal('idle_hours', 8, 2)->default(0);
            $table->decimal('breakdown_hours', 8, 2)->default(0);

            // Location
            $table->decimal('start_chainage_m', 12, 3)->nullable();
            $table->decimal('end_chainage_m', 12, 3)->nullable();
            $table->string('work_location')->nullable();

            // Fuel consumption
            $table->decimal('fuel_consumed_liters', 10, 2)->nullable();
            $table->string('fuel_type', 20)->nullable(); // Diesel, Petrol

            // Maintenance
            $table->decimal('odometer_reading', 12, 2)->nullable();
            $table->string('maintenance_status', 20)->default('good'); // good, needs_service, breakdown
            $table->text('breakdown_details')->nullable();

            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['daily_work_id', 'equipment_id']);
            $table->index('equipment_type');
        });

        // Weather conditions tracking
        Schema::create('weather_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_work_id')->constrained('daily_works')->cascadeOnDelete();

            // Date and time tracking
            $table->date('observation_date');
            $table->time('observation_time');

            // Weather conditions
            $table->string('condition', 50); // Sunny, Cloudy, Rainy, Stormy
            $table->decimal('temperature_celsius', 5, 2)->nullable();
            $table->decimal('humidity_percent', 5, 2)->nullable();
            $table->decimal('rainfall_mm', 8, 2)->default(0);
            $table->string('wind_condition', 30)->nullable(); // Calm, Moderate, Strong
            $table->decimal('wind_speed_kmh', 6, 2)->nullable();

            // Work impact
            $table->enum('work_impact', ['no_impact', 'minor_delay', 'major_delay', 'work_stopped'])->default('no_impact');
            $table->decimal('hours_lost', 8, 2)->default(0);
            $table->text('impact_description')->nullable();

            // Documentation
            $table->json('affected_activities')->nullable(); // List of affected work types
            $table->string('photo_path')->nullable();

            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index('observation_date');
            $table->index(['daily_work_id', 'observation_date']);
        });

        // Progress photos with metadata (Photolog)
        Schema::create('progress_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_work_id')->constrained('daily_works')->cascadeOnDelete();
            $table->foreignId('work_layer_id')->nullable()->constrained('work_layers')->nullOnDelete();
            $table->foreignId('chainage_progress_id')->nullable()->constrained('chainage_progress')->nullOnDelete();

            // Photo details
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->string('thumbnail_path')->nullable();
            $table->string('original_filename');
            $table->unsignedBigInteger('file_size_bytes')->nullable();

            // Location tracking
            $table->decimal('chainage_m', 12, 3)->nullable();
            $table->string('location_description')->nullable();

            // GPS coordinates
            $table->decimal('gps_latitude', 10, 7)->nullable();
            $table->decimal('gps_longitude', 10, 7)->nullable();
            $table->decimal('gps_altitude', 10, 2)->nullable();
            $table->json('gps_metadata')->nullable(); // Store full EXIF GPS data

            // Photo metadata
            $table->timestamp('photo_taken_at')->nullable(); // From EXIF
            $table->string('camera_make')->nullable();
            $table->string('camera_model')->nullable();
            $table->string('direction_facing', 20)->nullable(); // North, South, East, West, NE, etc.

            // Categorization
            $table->string('photo_type', 30)->default('progress'); // progress, issue, completion, before, after
            $table->string('view_type', 30)->nullable(); // aerial, ground, close-up, panoramic
            $table->json('tags')->nullable(); // Searchable tags

            // Approval tracking
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected'])->default('draft');
            // Users table may not exist during migration - skip FK
            $table->unsignedBigInteger('approved_by_user_id')->nullable()->index();
            $table->timestamp('approved_at')->nullable();

            $table->unsignedBigInteger('uploaded_by_user_id')->index();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['daily_work_id', 'photo_type']);
            $table->index('chainage_m');
            $table->index(['gps_latitude', 'gps_longitude']);
        });

        // Labor/Manpower tracking
        Schema::create('labor_deployments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_work_id')->constrained('daily_works')->cascadeOnDelete();
            $table->foreignId('work_layer_id')->nullable()->constrained('work_layers')->nullOnDelete();

            // Labor category
            $table->string('skill_category'); // Mason, Carpenter, Laborer, Supervisor, etc.
            $table->string('trade', 50)->nullable(); // Specific trade

            // Deployment
            $table->integer('head_count');
            $table->decimal('man_hours', 10, 2); // Total man-hours (head_count × hours_worked)
            $table->decimal('hours_worked_per_person', 8, 2);
            $table->decimal('overtime_hours', 8, 2)->default(0);

            // Location
            $table->decimal('start_chainage_m', 12, 3)->nullable();
            $table->decimal('end_chainage_m', 12, 3)->nullable();
            $table->string('work_location')->nullable();

            // Task details
            $table->string('task_assigned')->nullable();
            $table->decimal('productivity_rate', 10, 2)->nullable(); // Units completed per man-hour
            $table->string('productivity_unit', 20)->nullable();

            // Contractor info
            $table->string('contractor_name')->nullable();
            $table->string('supervisor_name')->nullable();

            // Safety
            $table->boolean('safety_briefing_done')->default(false);
            $table->boolean('ppe_provided')->default(false); // Personal Protective Equipment

            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['daily_work_id', 'skill_category']);
        });

        // Site instructions/directives
        Schema::create('site_instructions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_work_id')->nullable()->constrained('daily_works')->nullOnDelete();

            // Instruction details
            $table->string('instruction_number', 50)->unique();
            $table->date('instruction_date');
            $table->string('subject');
            $table->text('description');
            $table->enum('instruction_type', ['directive', 'clarification', 'variation', 'stop_work', 'proceed'])->default('directive');

            // Issued by (Consultant/Engineer)
            $table->string('issued_by_name');
            $table->string('issued_by_designation')->nullable();
            $table->string('issued_by_organization')->nullable();

            // Related to
            $table->foreignId('work_layer_id')->nullable()->constrained('work_layers')->nullOnDelete();
            $table->decimal('chainage_from_m', 12, 3)->nullable();
            $table->decimal('chainage_to_m', 12, 3)->nullable();

            // Response tracking
            $table->date('response_due_date')->nullable();
            $table->date('responded_at')->nullable();
            $table->text('response_details')->nullable();
            // Users table may not exist during migration - skip FK
            $table->unsignedBigInteger('responded_by_user_id')->nullable()->index();

            // Implementation
            $table->enum('status', ['pending', 'acknowledged', 'in_progress', 'completed', 'closed'])->default('pending');
            $table->date('completed_at')->nullable();

            // Attachments
            $table->json('attachment_paths')->nullable();

            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('instruction_number');
            $table->index(['instruction_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_instructions');
        Schema::dropIfExists('labor_deployments');
        Schema::dropIfExists('progress_photos');
        Schema::dropIfExists('weather_logs');
        Schema::dropIfExists('equipment_logs');
        Schema::dropIfExists('material_consumptions');
    }
};
