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
        Schema::connection('landlord')->create('usage_records', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('type', 50)->index(); // users, employees, storage, api_calls, etc.
            $table->string('action', 20); // increment, decrement
            $table->unsignedInteger('amount')->default(1);
            $table->timestamp('recorded_at')->useCurrent();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->index(['tenant_id', 'type']);
            $table->index(['tenant_id', 'recorded_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('landlord')->dropIfExists('usage_records');
    }
};
