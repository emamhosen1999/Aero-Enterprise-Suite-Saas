<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('daily_works', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('number')->comment('RFI number/reference');
            $table->string('status')->default('new')->comment('Workflow status');
            $table->string('inspection_result')->nullable()->comment('Result of inspection');
            $table->string('type')->comment('Work type: Embankment, Structure, Pavement');
            $table->text('description')->nullable();
            $table->string('location')->nullable()->comment('Free-form chainage/location text');
            $table->foreignId('work_location_id')
                ->nullable()
                ->constrained('work_locations')
                ->nullOnDelete()
                ->comment('Predefined work location zone');
            $table->string('side')->nullable()->comment('Road side: TR-R, TR-L, SR-R, SR-L, Both');
            $table->integer('qty_layer')->nullable()->comment('Quantity/layer number');
            $table->string('planned_time')->nullable();
            $table->foreignId('incharge_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->comment('User in charge of this work');
            $table->foreignId('assigned_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->comment('User assigned to perform this work');
            $table->timestamp('completion_time')->nullable();
            $table->text('inspection_details')->nullable();
            $table->integer('resubmission_count')->default(0);
            $table->date('resubmission_date')->nullable();
            $table->date('rfi_submission_date')->nullable()->comment('Date RFI was formally submitted');
            $table->string('rfi_response_status')->nullable()->comment('Response status: approved, rejected, returned, concurred, not_concurred');
            $table->date('rfi_response_date')->nullable()->comment('Date of RFI response');
            $table->timestamps();
            $table->softDeletes();

            // Indexes for common queries
            $table->index('date', 'daily_works_date_index');
            $table->index('number');
            $table->index('status');
            $table->index('type');
            $table->index('inspection_result');
            $table->index('incharge_user_id');
            $table->index('assigned_user_id');
            $table->index('work_location_id');

            // Composite indexes for common filter combinations
            $table->index(['date', 'status'], 'daily_works_date_status_index');
            $table->index(['date', 'type'], 'daily_works_date_type_index');
            $table->index(['date', 'id'], 'daily_works_date_id_index');
            $table->index(['incharge_user_id', 'date'], 'daily_works_incharge_date_index');
            $table->index(['assigned_user_id', 'status'], 'daily_works_assigned_status_index');
            $table->index(['rfi_submission_date', 'status'], 'daily_works_submission_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_works');
    }
};
