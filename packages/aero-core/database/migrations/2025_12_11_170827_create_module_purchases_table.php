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
        Schema::create('module_purchases', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('module_code')->index();
            $table->string('purchase_code')->unique();
            $table->timestamp('purchased_at')->nullable();
            $table->timestamps();
            
            $table->unique(['tenant_id', 'module_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('module_purchases');
    }
};
