<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the module_permissions table for tenant databases.
     * This allows each tenant to manage their own module permission assignments.
     */
    public function up(): void
    {
        Schema::create('module_permissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('module_id')->comment('References modules table in landlord DB');
            $table->unsignedBigInteger('sub_module_id')->nullable()->comment('References sub_modules table in landlord DB');
            $table->unsignedBigInteger('component_id')->nullable()->comment('References module_components table in landlord DB');
            $table->unsignedBigInteger('permission_id')->comment('Links to Spatie permissions table in tenant DB');
            $table->boolean('is_required')->default(true)->comment('Whether this permission is required');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
            $table->index(['module_id', 'permission_id']);
            $table->index(['sub_module_id', 'permission_id']);
            $table->index(['component_id', 'permission_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('module_permissions');
    }
};
