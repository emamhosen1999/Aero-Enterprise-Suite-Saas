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
        Schema::create('prospect_leads', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('name')->nullable();
            $table->string('company_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('country')->nullable();
            $table->string('source')->default('website'); // website, referral, social, advertising, event
            $table->string('source_detail')->nullable(); // utm_source, referrer_url, etc.
            $table->string('status')->default('new'); // new, contacted, qualified, converted, lost
            $table->integer('score')->default(0); // Lead score 0-100
            $table->string('interest_level')->nullable(); // low, medium, high
            $table->json('interests')->nullable(); // Which modules/features they're interested in
            $table->json('utm_data')->nullable(); // UTM tracking data
            $table->json('metadata')->nullable(); // Additional custom fields
            $table->text('notes')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('landlord_users')->nullOnDelete();
            $table->foreignId('converted_tenant_id')->nullable(); // If converted to tenant
            $table->timestamp('contacted_at')->nullable();
            $table->timestamp('qualified_at')->nullable();
            $table->timestamp('converted_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'created_at']);
            $table->index(['source', 'created_at']);
            $table->index(['score']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prospect_leads');
    }
};
