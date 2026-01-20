<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The database connection for CMS tables.
     */
    protected $connection = 'central';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::connection($this->connection)->create('cms_page_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('page_id')
                ->constrained('cms_pages')
                ->onDelete('cascade');
            $table->string('block_type'); // e.g., 'hero-standard', 'feature-grid'
            $table->string('block_id')->nullable(); // Unique identifier for the block instance
            $table->integer('order_index')->default(0);
            $table->json('content'); // Block-specific content (title, text, images, etc.)
            $table->json('settings')->nullable(); // Block styling settings (padding, colors, etc.)
            $table->json('visibility')->nullable(); // Show/hide rules (device, schedule, etc.)
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['page_id', 'order_index']);
            $table->index('block_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('cms_page_blocks');
    }
};
