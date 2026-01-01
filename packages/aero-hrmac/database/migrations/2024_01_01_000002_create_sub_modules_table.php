<?php

declare(strict_types=1);

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
        if (Schema::hasTable('sub_modules')) {
            return;
        }

        Schema::create('sub_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
            $table->string('code')->comment('Unique key within module, e.g., dashboard, leaves');
            $table->string('name')->comment('Display name for the sub-module');
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->string('route')->nullable()->comment('Route path for this sub-module');
            $table->integer('priority')->default(100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['module_id', 'code']);
            $table->index('route');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sub_modules');
    }
};
