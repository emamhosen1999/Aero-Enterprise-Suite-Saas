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
        // Create dashboards table
        Schema::create('dashboards', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('dashboard_type');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->boolean('is_public')->default(false);
            $table->integer('refresh_interval')->nullable();
            $table->json('layout')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        // Create dashboard widgets table
        Schema::create('dashboard_widgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dashboard_id')->constrained('dashboards')->onDelete('cascade');
            $table->string('title');
            $table->string('widget_type');
            $table->string('chart_type')->nullable();
            $table->string('size')->default('medium');
            $table->integer('position');
            $table->string('data_source')->nullable();
            $table->integer('refresh_interval')->nullable();
            $table->json('settings')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        // Create KPIs table
        Schema::create('kpis', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category');
            $table->decimal('target_value', 15, 2);
            $table->string('unit', 20);
            $table->string('frequency');
            $table->text('formula')->nullable();
            $table->string('data_source')->nullable();
            $table->foreignId('responsible_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('status')->default('active');
            $table->timestamps();
        });

        // Create KPI values table
        Schema::create('kpi_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kpi_id')->constrained('kpis')->onDelete('cascade');
            $table->decimal('value', 15, 2);
            $table->date('date');
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kpi_values');
        Schema::dropIfExists('kpis');
        Schema::dropIfExists('dashboard_widgets');
        Schema::dropIfExists('dashboards');
    }
};
