<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Enable pgvector extension if not already enabled
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS vector');
        }

        Schema::create('assistant_embeddings', function (Blueprint $table) {
            $table->id();
            $table->string('source_type'); // 'documentation', 'code', 'module'
            $table->string('source_path')->nullable();
            $table->string('module_name')->nullable();
            $table->text('content'); // Original text content
            $table->text('content_chunk'); // Chunked text for embedding
            $table->json('metadata')->nullable(); // File path, line numbers, module info, etc.

            // Vector column for embeddings (1536 dimensions for standard models)
            if (DB::connection()->getDriverName() === 'pgsql') {
                $table->addColumn('vector', 'embedding', ['dimensions' => 1536])->nullable();
            } else {
                // Fallback for non-PostgreSQL databases (store as JSON)
                $table->json('embedding')->nullable();
            }

            $table->timestamps();

            $table->index(['source_type', 'module_name']);
        });

        // Create vector similarity search index for PostgreSQL
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('CREATE INDEX assistant_embeddings_embedding_idx ON assistant_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assistant_embeddings');
    }
};
