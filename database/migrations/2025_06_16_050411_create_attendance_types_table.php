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
        Schema::create('attendance_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug', 191)->unique(); // 'geo_polygon', 'wifi_ip'
            $table->json('config');           // polygons, allowed IPs, etc
            $table->string('icon')->nullable();
            $table->text('description')->nullable();
            $table->integer('priority')->default(100);
            $table->boolean('is_active')->default(true);
            $table->json('required_permissions')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_types');
    }
};
