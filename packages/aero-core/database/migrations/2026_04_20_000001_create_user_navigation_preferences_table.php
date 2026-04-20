<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_navigation_preferences', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->json('pinned_items')->nullable();     // Array of nav item paths pinned by user
            $table->json('hidden_items')->nullable();     // Array of nav item paths hidden by user
            $table->json('custom_order')->nullable();     // Array of nav item paths in custom order
            $table->json('quick_actions')->nullable();    // Array of quick-action item paths (for bottom nav)
            $table->boolean('show_labels')->default(true);
            $table->boolean('compact_mode')->default(false);
            $table->string('sidebar_position', 10)->default('left'); // left, right
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_navigation_preferences');
    }
};
