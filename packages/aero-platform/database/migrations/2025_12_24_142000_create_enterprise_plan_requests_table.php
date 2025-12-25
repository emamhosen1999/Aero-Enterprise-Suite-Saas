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
        if (Schema::hasTable('enterprise_plan_requests')) {
            return;
        }

        Schema::create('enterprise_plan_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tenant_id')->index();
            $table->foreignId('requested_by_user_id')->constrained('landlord_users')->onDelete('cascade');
            $table->string('status', 20)->default('pending')->index(); // pending, approved, rejected, cancelled
            $table->json('plan_details'); // Custom pricing, quotas, modules
            $table->text('business_justification')->nullable();
            $table->string('contract_length', 20)->default('1_year'); // 1_year, 2_year, 3_year, 5_year
            $table->decimal('proposed_monthly_price', 10, 2);
            $table->decimal('proposed_yearly_price', 10, 2)->nullable();
            $table->string('currency', 3)->default('USD');
            $table->foreignId('reviewed_by_admin_id')->nullable()->constrained('landlord_users')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->text('admin_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('created_plan_id')->nullable()->constrained('plans')->onDelete('set null'); // If approved
            $table->timestamps();
            $table->softDeletes();

            // Foreign key for tenant
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            
            // Composite indexes for common queries
            $table->index(['tenant_id', 'status']);
            $table->index(['status', 'created_at']);
            $table->index(['reviewed_by_admin_id', 'reviewed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enterprise_plan_requests');
    }
};
