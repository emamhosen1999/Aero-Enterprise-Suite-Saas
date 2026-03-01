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
        Schema::create('assistant_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('conversation_id')->nullable()->constrained('assistant_conversations')->onDelete('set null');
            $table->string('action_type'); // 'chat', 'search', 'action'
            $table->text('query')->nullable();
            $table->text('response')->nullable();
            $table->integer('tokens_used')->default(0);
            $table->integer('processing_time_ms')->nullable();
            $table->boolean('used_rag')->default(false);
            $table->integer('rag_chunks_retrieved')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index('action_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assistant_usage_logs');
    }
};
