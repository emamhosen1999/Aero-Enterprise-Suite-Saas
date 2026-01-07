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
        Schema::create('objections', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category')->comment('Objection category type');
            $table->string('chainage_from')->nullable()->comment('Start chainage of affected area');
            $table->string('chainage_to')->nullable()->comment('End chainage of affected area');
            $table->text('description')->nullable();
            $table->text('reason')->nullable()->comment('Reason for raising objection');
            $table->string('status')->default('draft')->comment('Workflow status');
            $table->text('resolution_notes')->nullable();
            // Users table may not exist during migration - skip FK
            $table->unsignedBigInteger('resolved_by')->nullable()->index();
            $table->timestamp('resolved_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->boolean('was_overridden')->default(false)->comment('Whether RFI was submitted despite this objection');
            $table->text('override_reason')->nullable();
            $table->unsignedBigInteger('overridden_by')->nullable()->index();
            $table->timestamp('overridden_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('category');
            $table->index(['chainage_from', 'chainage_to']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('objections');
    }
};
