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
        Schema::create('disciplinary_cases', function (Blueprint $table) {
            $table->id();
            $table->string('case_number')->unique();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('action_type_id')->constrained('disciplinary_action_types')->onDelete('restrict');
            $table->foreignId('reported_by')->constrained('users')->onDelete('restrict');
            $table->date('incident_date');
            $table->text('incident_description');
            $table->enum('status', ['pending', 'investigating', 'action_taken', 'closed', 'dismissed'])->default('pending');
            $table->text('investigation_notes')->nullable();
            $table->text('action_taken')->nullable();
            $table->date('action_date')->nullable();
            $table->foreignId('action_by')->nullable()->constrained('users')->onDelete('restrict');
            $table->text('employee_statement')->nullable();
            $table->text('witness_statements')->nullable();
            $table->boolean('appeal_filed')->default(false);
            $table->text('appeal_notes')->nullable();
            $table->date('closed_date')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('case_number');
            $table->index('status');
            $table->index('incident_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('disciplinary_cases');
    }
};
