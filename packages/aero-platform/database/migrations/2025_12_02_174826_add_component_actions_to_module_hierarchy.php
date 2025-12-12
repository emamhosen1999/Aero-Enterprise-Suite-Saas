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
        // Add description field to module_components
        Schema::table('module_components', function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
        });

        // Create module_component_actions table
        Schema::create('module_component_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_component_id')->constrained()->onDelete('cascade');
            $table->string('code')->comment('Action code: view, create, update, delete, etc.');
            $table->string('name')->comment('Display name for the action');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['module_component_id', 'code']);
            $table->index('module_component_id');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {

        Schema::dropIfExists('module_component_actions');

        Schema::table('module_components', function (Blueprint $table) {
            $table->dropColumn('description');
        });
    }
};
