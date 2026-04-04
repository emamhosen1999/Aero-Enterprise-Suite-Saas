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
        Schema::table('cms_block_templates', function (Blueprint $table) {
            // This table stores reusable block templates for advanced block types
            // No changes needed if table already exists from previous migration
        });

        // Add new advanced block types if they don't exist yet
        if (!Schema::hasTable('cms_block_types')) {
            Schema::create('cms_block_types', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique(); // e.g., "Testimonial", "Pricing Table"
                $table->string('slug')->unique(); // e.g., "testimonial", "pricing-table"
                $table->text('description')->nullable();
                $table->json('schema')->nullable(); // JSON schema for the block structure
                $table->string('category')->default('advanced'); // advanced, media, layout, etc.
                $table->string('icon')->nullable(); // Icon class or URL
                $table->text('preview_image')->nullable(); // Base64 preview image
                $table->integer('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cms_block_types');
    }
};
