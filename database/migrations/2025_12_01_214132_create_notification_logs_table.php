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
        Schema::create('notification_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->nullableMorphs('notifiable');
            $table->string('channel', 50)->index(); // email, sms, push, database, slack
            $table->string('notification_type')->index(); // class name or identifier
            $table->string('recipient'); // email, phone, device token, etc.
            $table->string('subject')->nullable();
            $table->text('content')->nullable();
            $table->string('status', 20)->default('pending')->index(); // pending, sending, sent, delivered, failed, retrying
            $table->text('error_message')->nullable();
            $table->json('metadata')->nullable(); // extra data like message IDs, provider responses
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->unsignedTinyInteger('max_attempts')->default(3);
            $table->timestamp('last_attempt_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();

            // Composite indexes for common queries
            $table->index(['channel', 'status']);
            $table->index(['user_id', 'created_at']);
            $table->index(['status', 'attempts', 'max_attempts']); // For retry queries
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_logs');
    }
};
