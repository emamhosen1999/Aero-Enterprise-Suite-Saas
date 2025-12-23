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
        Schema::create('module_licenses', function (Blueprint $table) {
            $table->id();
            
            // Module identification
            $table->string('module_code', 50)->index();
            $table->string('module_name', 100);
            
            // License details
            $table->string('license_key')->unique();
            $table->string('provider', 50)->index(); // aero, codecanyon, enterprise
            $table->string('license_type', 50)->default('regular'); // regular, extended, enterprise
            
            // Customer information
            $table->string('customer_name')->nullable();
            $table->string('customer_email')->nullable();
            $table->string('domain')->nullable();
            
            // Purchase/Activation details
            $table->string('purchase_code')->nullable(); // For CodeCanyon
            $table->string('activation_id')->nullable(); // Unique activation identifier
            $table->timestamp('purchase_date')->nullable();
            $table->timestamp('activated_at')->nullable();
            
            // License status
            $table->enum('status', ['active', 'expired', 'suspended', 'revoked'])->default('active')->index();
            $table->timestamp('expires_at')->nullable();
            
            // Support & Updates
            $table->timestamp('support_until')->nullable();
            $table->timestamp('updates_until')->nullable();
            
            // Validation tracking
            $table->timestamp('last_verified_at')->nullable();
            $table->integer('verification_failures')->default(0);
            $table->timestamp('grace_period_started_at')->nullable();
            
            // Additional metadata
            $table->json('metadata')->nullable(); // Store provider-specific data
            $table->text('notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['status', 'module_code']);
            $table->index('activated_at');
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('module_licenses');
    }
};
