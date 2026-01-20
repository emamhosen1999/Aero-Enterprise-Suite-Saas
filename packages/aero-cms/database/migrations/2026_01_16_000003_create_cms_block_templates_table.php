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
        Schema::connection($this->connection)->create('cms_block_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('block_type'); // e.g., 'hero-standard'
            $table->text('description')->nullable();
            $table->json('content'); // Pre-filled content template
            $table->json('settings')->nullable(); // Default styling
            $table->string('thumbnail')->nullable();
            $table->string('category')->nullable();
            $table->boolean('is_global')->default(false); // Global reusable block
            $table->boolean('is_system')->default(false); // System default, non-deletable
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index('block_type');
            $table->index('category');
            $table->index('is_global');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('cms_block_templates');
    }
};
