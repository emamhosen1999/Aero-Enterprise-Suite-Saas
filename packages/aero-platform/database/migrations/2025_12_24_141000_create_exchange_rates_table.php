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
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->id();
            $table->string('from_currency', 3)->index(); // e.g., 'USD'
            $table->string('to_currency', 3)->index(); // e.g., 'EUR'
            $table->decimal('rate', 10, 6); // e.g., 0.892500 for USD to EUR
            $table->date('effective_date')->index();
            $table->string('source', 50)->default('manual'); // 'manual', 'api', 'ecb', 'exchangerate-api'
            $table->json('metadata')->nullable(); // Additional rate information
            $table->timestamps();

            // Composite unique index to prevent duplicate rates for same currency pair on same date
            $table->unique(['from_currency', 'to_currency', 'effective_date']);
            
            // Index for quick rate lookups
            $table->index(['from_currency', 'to_currency', 'effective_date']);
        });

        // Insert default exchange rates (as of Dec 2025 - approximate)
        DB::table('exchange_rates')->insert([
            // USD to other currencies
            ['from_currency' => 'USD', 'to_currency' => 'EUR', 'rate' => 0.92, 'effective_date' => now()->toDateString(), 'source' => 'manual', 'created_at' => now(), 'updated_at' => now()],
            ['from_currency' => 'USD', 'to_currency' => 'GBP', 'rate' => 0.79, 'effective_date' => now()->toDateString(), 'source' => 'manual', 'created_at' => now(), 'updated_at' => now()],
            ['from_currency' => 'USD', 'to_currency' => 'CAD', 'rate' => 1.35, 'effective_date' => now()->toDateString(), 'source' => 'manual', 'created_at' => now(), 'updated_at' => now()],
            ['from_currency' => 'USD', 'to_currency' => 'AUD', 'rate' => 1.52, 'effective_date' => now()->toDateString(), 'source' => 'manual', 'created_at' => now(), 'updated_at' => now()],
            ['from_currency' => 'USD', 'to_currency' => 'JPY', 'rate' => 148.50, 'effective_date' => now()->toDateString(), 'source' => 'manual', 'created_at' => now(), 'updated_at' => now()],
            
            // Reverse rates (other currencies to USD)
            ['from_currency' => 'EUR', 'to_currency' => 'USD', 'rate' => 1.087, 'effective_date' => now()->toDateString(), 'source' => 'manual', 'created_at' => now(), 'updated_at' => now()],
            ['from_currency' => 'GBP', 'to_currency' => 'USD', 'rate' => 1.266, 'effective_date' => now()->toDateString(), 'source' => 'manual', 'created_at' => now(), 'updated_at' => now()],
            ['from_currency' => 'CAD', 'to_currency' => 'USD', 'rate' => 0.741, 'effective_date' => now()->toDateString(), 'source' => 'manual', 'created_at' => now(), 'updated_at' => now()],
            ['from_currency' => 'AUD', 'to_currency' => 'USD', 'rate' => 0.658, 'effective_date' => now()->toDateString(), 'source' => 'manual', 'created_at' => now(), 'updated_at' => now()],
            ['from_currency' => 'JPY', 'to_currency' => 'USD', 'rate' => 0.0067, 'effective_date' => now()->toDateString(), 'source' => 'manual', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exchange_rates');
    }
};
