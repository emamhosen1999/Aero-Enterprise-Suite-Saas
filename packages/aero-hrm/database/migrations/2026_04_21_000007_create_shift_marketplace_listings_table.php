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
        Schema::create('shift_marketplace_listings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shift_swap_request_id');
            $table->unsignedBigInteger('listed_by');
            $table->unsignedInteger('view_count')->default(0);
            $table->unsignedInteger('interest_count')->default(0);
            $table->dateTime('expires_at');
            $table->boolean('is_featured')->default(false);
            $table->timestamps();

            // Foreign keys
            $table->foreign('shift_swap_request_id')->references('id')->on('shift_swap_requests')->cascadeOnDelete();
            $table->foreign('listed_by')->references('id')->on('users')->cascadeOnDelete();

            // Indexes
            $table->index('shift_swap_request_id');
            $table->index('listed_by');
            $table->index('expires_at');
            $table->index('is_featured');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_marketplace_listings');
    }
};
