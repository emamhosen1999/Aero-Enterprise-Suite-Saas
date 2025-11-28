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
        // First create supplier_categories
        if (! Schema::hasTable('supplier_categories')) {
            Schema::create('supplier_categories', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Then create suppliers table with proper foreign key to categories
        if (! Schema::hasTable('suppliers')) {
            Schema::create('suppliers', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('contact_person')->nullable();
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->string('address')->nullable();
                $table->string('city')->nullable();
                $table->string('state')->nullable();
                $table->string('zip_code')->nullable();
                $table->string('country')->nullable();
                $table->string('tax_id')->nullable();
                $table->string('website')->nullable();
                $table->decimal('credit_limit', 15, 2)->nullable();
                $table->integer('payment_terms_days')->default(30);
                $table->foreignId('category_id')->nullable()->constrained('supplier_categories')->nullOnDelete();
                $table->enum('status', ['active', 'inactive', 'blacklisted'])->default('active');
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Create SCM tables after suppliers is properly created
        if (! Schema::hasTable('purchase_orders')) {
            Schema::create('purchase_orders', function (Blueprint $table) {
                $table->id();
                $table->string('po_number')->unique();
                $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // creator
                $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('order_date');
                $table->timestamp('expected_delivery_date')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->string('shipping_method')->nullable();
                $table->text('shipping_address')->nullable();
                $table->text('billing_address')->nullable();
                $table->decimal('subtotal', 15, 2);
                $table->decimal('tax', 15, 2)->default(0);
                $table->decimal('shipping_cost', 15, 2)->default(0);
                $table->decimal('total', 15, 2);
                $table->enum('status', ['draft', 'pending_approval', 'approved', 'sent', 'received', 'partially_received', 'cancelled'])->default('draft');
                $table->text('notes')->nullable();
                $table->text('terms')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (! Schema::hasTable('purchase_order_items')) {
            Schema::create('purchase_order_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
                $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete();
                $table->decimal('quantity', 15, 2);
                $table->decimal('unit_price', 15, 2);
                $table->decimal('tax_rate', 8, 2)->default(0);
                $table->decimal('tax_amount', 15, 2)->default(0);
                $table->decimal('subtotal', 15, 2);
                $table->string('description')->nullable();
                $table->decimal('received_quantity', 15, 2)->default(0);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('purchase_receipts')) {
            Schema::create('purchase_receipts', function (Blueprint $table) {
                $table->id();
                $table->string('receipt_number')->unique();
                $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // receiver
                $table->timestamp('receipt_date');
                $table->string('carrier')->nullable();
                $table->string('tracking_number')->nullable();
                $table->enum('status', ['complete', 'partial', 'damaged', 'returned'])->default('complete');
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (! Schema::hasTable('purchase_receipt_items')) {
            Schema::create('purchase_receipt_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('purchase_receipt_id')->constrained()->cascadeOnDelete();
                $table->foreignId('purchase_order_item_id')->constrained()->cascadeOnDelete();
                $table->decimal('received_quantity', 15, 2);
                $table->enum('condition', ['good', 'damaged', 'wrong_item'])->default('good');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('logistics_carriers')) {
            Schema::create('logistics_carriers', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('contact_info')->nullable();
                $table->string('website')->nullable();
                $table->string('tracking_url_format')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (! Schema::hasTable('logistics_shipments')) {
            Schema::create('logistics_shipments', function (Blueprint $table) {
                $table->id();
                $table->string('shipment_number')->unique();
                $table->foreignId('carrier_id')->nullable()->constrained('logistics_carriers')->nullOnDelete();
                $table->string('tracking_number')->nullable();
                $table->morphs('shippable'); // polymorphic relationship (can be purchase, sale, return, etc.)
                $table->foreignId('from_location_id')->nullable()->constrained('inventory_locations')->nullOnDelete();
                $table->foreignId('to_location_id')->nullable()->constrained('inventory_locations')->nullOnDelete();
                $table->string('shipping_method')->nullable();
                $table->decimal('shipping_cost', 15, 2)->default(0);
                $table->decimal('weight', 10, 2)->nullable();
                $table->string('weight_unit')->default('kg');
                $table->decimal('length', 10, 2)->nullable();
                $table->decimal('width', 10, 2)->nullable();
                $table->decimal('height', 10, 2)->nullable();
                $table->string('dimensions_unit')->default('cm');
                $table->text('from_address')->nullable();
                $table->text('to_address')->nullable();
                $table->timestamp('ship_date')->nullable();
                $table->timestamp('estimated_delivery')->nullable();
                $table->timestamp('delivered_at')->nullable();
                $table->enum('status', ['pending', 'processed', 'shipped', 'in_transit', 'delivered', 'failed', 'returned'])->default('pending');
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
        Schema::dropIfExists('logistics_shipments');
        Schema::dropIfExists('logistics_carriers');
        Schema::dropIfExists('purchase_receipt_items');
        Schema::dropIfExists('purchase_receipts');
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('supplier_categories');
    }
};
