<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('author_id');
            $table->string('title');
            $table->text('body');
            $table->string('type', 20)->default('info'); // info, warning, success, danger
            $table->string('priority', 20)->default('normal'); // low, normal, high, urgent
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_dismissible')->default(true);
            $table->json('target_roles')->nullable();
            $table->json('target_departments')->nullable();
            $table->json('dismissed_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('author_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['starts_at', 'expires_at']);
            $table->index('is_pinned');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
