<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boq_items', function (Blueprint $table) {
            $table->id();
            // Project ID is optional since projects table may not exist in all installations
            $table->unsignedBigInteger('project_id')->nullable()->index();
            $table->foreignId('parent_id')->nullable()->constrained('boq_items')->nullOnDelete();
            $table->foreignId('work_layer_id')->nullable()->index()
                ->comment('Link to work layer for chainage-centric integration');
            $table->string('item_code', 50)->index(); // e.g., "2.01"
            $table->text('description');
            $table->string('unit', 20); // m3, kg, nos
            $table->decimal('unit_rate', 15, 2)->default(0);
            $table->decimal('total_quantity', 15, 3)->default(0);
            $table->text('specification')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('currency', 3)->default('BDT');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('boq_measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boq_item_id')->constrained()->cascadeOnDelete();
            // Nullable because a measurement might be drafted before RFI is linked,
            // but for the patentable workflow, this link is crucial.
            // Daily works table lives in aero-rfi; skip FK to avoid failures when module isn't present
            $table->foreignId('daily_work_id')->nullable()->index();

            // Chainage integration for patentable feature
            $table->decimal('start_chainage_m', 12, 3)->nullable()
                ->comment('Start chainage in meters');
            $table->decimal('end_chainage_m', 12, 3)->nullable()
                ->comment('End chainage in meters');

            $table->decimal('measured_quantity', 15, 3);
            $table->string('formula')->nullable(); // "L*W*D"
            $table->json('dimensions')->nullable(); // {L: 100, W: 10, D: 0.5}
            $table->string('location_description')->nullable(); // "CH 10+000 to 10+100"

            $table->string('status')->default('draft'); // draft, verified, rejected, billed
            // Users table may not exist during migration - skip FK
            $table->unsignedBigInteger('verified_by_user_id')->nullable()->index();
            $table->timestamp('verified_at')->nullable();
            $table->text('rejection_reason')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['start_chainage_m', 'end_chainage_m']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('boq_measurements');
        Schema::dropIfExists('boq_items');
    }
};
