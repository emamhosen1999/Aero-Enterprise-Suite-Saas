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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('venue');
            $table->date('event_date');
            $table->time('event_time');
            $table->string('banner_image')->nullable();
            $table->text('description')->nullable();
            $table->text('food_details')->nullable();
            $table->text('rules')->nullable();
            $table->string('organizer_name')->nullable();
            $table->string('organizer_email')->nullable();
            $table->string('organizer_phone')->nullable();
            $table->dateTime('registration_deadline')->nullable();
            $table->integer('max_participants')->nullable();
            $table->boolean('is_published')->default(false);
            $table->boolean('is_registration_open')->default(true);
            $table->string('venue_map_url')->nullable();
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('meta_keywords')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('slug');
            $table->index('event_date');
            $table->index('is_published');
            $table->index('created_by');
            $table->index('updated_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
