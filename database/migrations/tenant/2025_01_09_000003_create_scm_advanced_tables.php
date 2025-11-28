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
        // Procurement Portal Tables
        if (! Schema::hasTable('procurement_requests')) {
            Schema::create('procurement_requests', function (Blueprint $table) {
                $table->id();
                $table->string('request_number')->unique();
                $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
                $table->string('title');
                $table->text('description');
                $table->decimal('estimated_budget', 15, 2)->nullable();
                $table->date('required_by');
                $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
                $table->enum('status', ['draft', 'submitted', 'approved', 'rejected', 'in_sourcing', 'completed', 'cancelled'])->default('draft');
                $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();
                $table->text('approval_notes')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (! Schema::hasTable('procurement_request_items')) {
            Schema::create('procurement_request_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('procurement_request_id')->constrained()->cascadeOnDelete();
                $table->string('item_name');
                $table->text('specifications');
                $table->decimal('quantity', 15, 2);
                $table->string('unit_of_measure');
                $table->decimal('estimated_unit_price', 15, 2)->nullable();
                $table->decimal('estimated_total', 15, 2)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // Demand Forecasting Tables
        if (! Schema::hasTable('demand_forecasts')) {
            Schema::create('demand_forecasts', function (Blueprint $table) {
                $table->id();
                $table->string('forecast_name');
                $table->foreignId('inventory_item_id')->nullable()->constrained()->nullOnDelete();
                $table->string('forecast_type'); // product, category, total
                $table->date('forecast_period_start');
                $table->date('forecast_period_end');
                $table->enum('forecast_method', ['historical', 'linear_regression', 'moving_average', 'exponential_smoothing', 'manual'])->default('historical');
                $table->json('forecast_parameters')->nullable(); // Store method-specific parameters
                $table->decimal('forecasted_demand', 15, 2);
                $table->decimal('confidence_level', 5, 2)->default(80); // percentage
                $table->decimal('actual_demand', 15, 2)->nullable();
                $table->decimal('accuracy_percentage', 5, 2)->nullable();
                $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
                $table->enum('status', ['draft', 'active', 'completed', 'archived'])->default('draft');
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Production Planning Tables
        if (! Schema::hasTable('production_plans')) {
            Schema::create('production_plans', function (Blueprint $table) {
                $table->id();
                $table->string('plan_number')->unique();
                $table->string('plan_name');
                $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete(); // product to produce
                $table->decimal('planned_quantity', 15, 2);
                $table->date('planned_start_date');
                $table->date('planned_end_date');
                $table->date('actual_start_date')->nullable();
                $table->date('actual_end_date')->nullable();
                $table->decimal('actual_quantity', 15, 2)->default(0);
                $table->enum('status', ['planning', 'scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold'])->default('planning');
                $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
                $table->decimal('estimated_cost', 15, 2)->nullable();
                $table->decimal('actual_cost', 15, 2)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (! Schema::hasTable('production_plan_materials')) {
            Schema::create('production_plan_materials', function (Blueprint $table) {
                $table->id();
                $table->foreignId('production_plan_id')->constrained()->cascadeOnDelete();
                $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete(); // raw material
                $table->decimal('required_quantity', 15, 2);
                $table->decimal('allocated_quantity', 15, 2)->default(0);
                $table->decimal('consumed_quantity', 15, 2)->default(0);
                $table->timestamps();
            });
        }

        // Return Management (RMA) Tables
        if (! Schema::hasTable('return_requests')) {
            Schema::create('return_requests', function (Blueprint $table) {
                $table->id();
                $table->string('rma_number')->unique();
                $table->string('returnable_type', 100);
                $table->unsignedBigInteger('returnable_id');
                $table->index(['returnable_type', 'returnable_id'], 'return_requests_returnable_index');

                $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
                $table->enum('return_type', ['defective', 'wrong_item', 'overage', 'damaged', 'expired', 'other'])->default('defective');
                $table->text('reason');
                $table->decimal('quantity_returned', 15, 2);
                $table->enum('condition', ['new', 'used', 'damaged', 'defective'])->default('used');
                $table->enum('status', ['requested', 'approved', 'rejected', 'in_transit', 'received', 'processed', 'completed'])->default('requested');
                $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();
                $table->date('expected_return_date')->nullable();
                $table->date('actual_return_date')->nullable();
                $table->enum('resolution', ['refund', 'replacement', 'credit', 'disposal', 'repair'])->nullable();
                $table->decimal('refund_amount', 15, 2)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Import/Export Management Tables
        if (! Schema::hasTable('trade_documents')) {
            Schema::create('trade_documents', function (Blueprint $table) {
                $table->id();
                $table->string('document_number')->unique();
                $table->enum('document_type', ['invoice', 'bill_of_lading', 'packing_list', 'certificate_of_origin', 'customs_declaration', 'other']);
                $table->string('trade_transaction_type', 100);
                $table->unsignedBigInteger('trade_transaction_id');
                $table->index(['trade_transaction_type', 'trade_transaction_id'], 'trade_docs_transaction_index');

                $table->string('document_name');
                $table->string('file_path')->nullable();
                $table->string('file_name')->nullable();
                $table->integer('file_size')->nullable();
                $table->string('mime_type')->nullable();
                $table->date('issue_date')->nullable();
                $table->date('expiry_date')->nullable();
                $table->string('issued_by')->nullable();
                $table->enum('status', ['draft', 'submitted', 'approved', 'rejected', 'expired'])->default('draft');
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (! Schema::hasTable('customs_declarations')) {
            Schema::create('customs_declarations', function (Blueprint $table) {
                $table->id();
                $table->string('declaration_number')->unique();
                $table->enum('declaration_type', ['import', 'export']);
                $table->string('declarable_type', 100);
                $table->unsignedBigInteger('declarable_id');
                $table->index(['declarable_type', 'declarable_id'], 'customs_declarable_index');

                $table->string('origin_country', 3); // ISO country code
                $table->string('destination_country', 3); // ISO country code
                $table->string('port_of_entry')->nullable();
                $table->string('port_of_exit')->nullable();
                $table->decimal('declared_value', 15, 2);
                $table->string('currency', 3)->default('USD');
                $table->decimal('duties_amount', 15, 2)->default(0);
                $table->decimal('taxes_amount', 15, 2)->default(0);
                $table->decimal('total_charges', 15, 2)->default(0);
                $table->json('hs_codes')->nullable(); // Harmonized System codes
                $table->date('declaration_date');
                $table->date('clearance_date')->nullable();
                $table->enum('status', ['pending', 'submitted', 'under_review', 'cleared', 'held', 'rejected'])->default('pending');
                $table->string('customs_officer')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customs_declarations');
        Schema::dropIfExists('trade_documents');
        Schema::dropIfExists('return_requests');
        Schema::dropIfExists('production_plan_materials');
        Schema::dropIfExists('production_plans');
        Schema::dropIfExists('demand_forecasts');
        Schema::dropIfExists('procurement_request_items');
        Schema::dropIfExists('procurement_requests');
    }
};
