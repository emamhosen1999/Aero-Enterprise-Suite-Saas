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
        Schema::create('work_locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('start_chainage')->nullable()->comment('Start chainage (e.g., KM 0+000)');
            $table->string('end_chainage')->nullable()->comment('End chainage (e.g., KM 5+000)');
            $table->foreignId('incharge_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->comment('User responsible for this work location');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('is_active');
            $table->index('incharge_user_id');
            $table->index(['start_chainage', 'end_chainage']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_locations');
    }
};
