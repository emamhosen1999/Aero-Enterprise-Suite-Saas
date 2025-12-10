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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            
            // Who performed the action
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('user_name')->nullable(); // Store name in case user is deleted
            $table->string('user_email')->nullable(); // Store email in case user is deleted
            
            // What happened
            $table->string('action'); // created, updated, deleted, activated, deactivated, invited, etc.
            $table->string('auditable_type'); // Model class name (User, Role, etc.)
            $table->unsignedBigInteger('auditable_id')->nullable(); // Model ID
            
            // Additional context
            $table->text('description')->nullable(); // Human-readable description
            $table->json('old_values')->nullable(); // Previous state
            $table->json('new_values')->nullable(); // New state
            $table->json('metadata')->nullable(); // Additional context (IP, user agent, etc.)
            
            // When
            $table->timestamp('created_at');
            
            // Indexes for performance
            $table->index('user_id');
            $table->index(['auditable_type', 'auditable_id']);
            $table->index('action');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
