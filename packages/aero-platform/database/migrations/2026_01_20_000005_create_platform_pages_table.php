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
        // Platform Pages (for SEO management of static pages)
        Schema::create('platform_pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('page_type')->default('custom'); // landing, features, pricing, about, contact, custom
            $table->boolean('is_active')->default(true);
            $table->boolean('is_system')->default(false); // System pages can't be deleted

            // SEO Fields
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('meta_keywords')->nullable();
            $table->string('canonical_url')->nullable();
            $table->string('og_title')->nullable();
            $table->text('og_description')->nullable();
            $table->string('og_image')->nullable();
            $table->string('og_type')->default('website');
            $table->string('twitter_card')->default('summary_large_image');
            $table->string('twitter_title')->nullable();
            $table->text('twitter_description')->nullable();
            $table->string('twitter_image')->nullable();
            $table->json('schema_markup')->nullable(); // JSON-LD structured data
            $table->string('robots')->default('index, follow');

            // Page content configuration
            $table->json('sections')->nullable(); // Page sections configuration
            $table->json('metadata')->nullable();

            $table->integer('priority')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['page_type', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_pages');
    }
};
