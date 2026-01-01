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
        if (Schema::hasTable('modules')) {
            return;
        }

        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->comment('Unique module identifier, e.g., hrm, crm, finance');
            $table->string('scope')->default('tenant')->comment('tenant or platform');
            $table->string('name')->comment('Display name for the module');
            $table->text('description')->nullable();
            $table->string('icon')->nullable()->comment('Icon class or SVG path');
            $table->string('route_prefix')->nullable();
            $table->string('category')->default('core_system');
            $table->integer('priority')->default(100);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_core')->default(false);
            $table->json('settings')->nullable();
            $table->string('version')->nullable();
            $table->string('min_plan')->nullable();
            $table->string('license_type')->nullable();
            $table->json('dependencies')->nullable();
            $table->date('release_date')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['scope', 'is_active']);
            $table->index('priority');
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('modules');
    }
};
