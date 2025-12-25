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
        if (Schema::hasTable('rate_limit_configs')) {
            return;
        }

        Schema::create('rate_limit_configs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tenant_id')->nullable()->index();
            $table->string('limit_type')->default('api'); // api, web, webhook, custom
            $table->integer('max_requests')->default(1000);
            $table->integer('time_window_seconds')->default(3600);
            $table->integer('burst_limit')->nullable();
            $table->integer('throttle_percentage')->default(100);
            $table->integer('block_duration_seconds')->default(3600);
            $table->json('whitelist_ips')->nullable();
            $table->json('blacklist_ips')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Unique constraint: one config per tenant per limit type
            $table->unique(['tenant_id', 'limit_type']);

            // Foreign key
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rate_limit_configs');
    }
};
