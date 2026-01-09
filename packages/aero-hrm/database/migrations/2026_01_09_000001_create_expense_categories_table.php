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
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->decimal('max_amount', 10, 2)->nullable()->comment('Maximum claimable amount per expense');
            $table->boolean('requires_receipt')->default(true);
            $table->boolean('requires_approval')->default(true);
            $table->integer('approval_levels')->default(1);
            $table->boolean('is_active')->default(true);
            $table->json('allowed_file_types')->nullable();
            $table->integer('max_file_size_mb')->default(5);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expense_categories');
    }
};
