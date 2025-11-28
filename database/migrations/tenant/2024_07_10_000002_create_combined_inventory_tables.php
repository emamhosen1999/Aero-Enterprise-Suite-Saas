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
        // Create inventory_locations table first if it doesn't exist
        if (! Schema::hasTable('inventory_locations')) {
            Schema::create('inventory_locations', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->text('address')->nullable();
                $table->boolean('is_active')->default(true);
                $table->string('type')->default('warehouse'); // warehouse, shelf, bin, etc.
                $table->foreignId('parent_id')->nullable()->constrained('inventory_locations')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Create inventory_items table if it doesn't exist
        if (! Schema::hasTable('inventory_items')) {
            Schema::create('inventory_items', function (Blueprint $table) {
                $table->id();
                $table->string('item_code')->unique();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('category')->nullable();
                $table->string('unit')->default('each'); // each, kg, liter, etc.
                $table->decimal('cost_price', 15, 2)->default(0);
                $table->decimal('selling_price', 15, 2)->default(0);
                $table->decimal('reorder_level', 15, 2)->default(0);
                $table->decimal('reorder_quantity', 15, 2)->default(0);
                $table->string('barcode')->nullable();
                $table->string('sku')->nullable();
                $table->boolean('is_active')->default(true);
                $table->boolean('is_taxable')->default(true);
                $table->decimal('tax_rate', 8, 2)->default(0);
                $table->boolean('track_inventory')->default(true);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Create inventory_stocks table if it doesn't exist
        if (! Schema::hasTable('inventory_stocks')) {
            Schema::create('inventory_stocks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete();
                $table->foreignId('location_id')->nullable()->constrained('inventory_locations')->nullOnDelete();
                $table->decimal('quantity', 15, 2)->default(0);
                $table->decimal('allocated_quantity', 15, 2)->default(0); // reserved for orders
                $table->decimal('available_quantity', 15, 2)->default(0); // quantity - allocated_quantity
                $table->timestamps();

                // Unique constraint to ensure one record per item per location
                $table->unique(['inventory_item_id', 'location_id']);
            });
        }

        // Create stock_movements table if it doesn't exist
        if (! Schema::hasTable('stock_movements')) {
            Schema::create('stock_movements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete();
                $table->morphs('reference', 191); // polymorphic relationship to any source of movement (sale, purchase, etc.)
                $table->decimal('quantity', 15, 2);
                $table->foreignId('from_location_id')->nullable()->constrained('inventory_locations')->nullOnDelete();
                $table->foreignId('to_location_id')->nullable()->constrained('inventory_locations')->nullOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('movement_type'); // purchase, sale, transfer, adjustment, return, etc.
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // Create inventory_adjustments table if it doesn't exist
        if (! Schema::hasTable('inventory_adjustments')) {
            Schema::create('inventory_adjustments', function (Blueprint $table) {
                $table->id();
                $table->string('reference_number');
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('location_id')->constrained('inventory_locations')->cascadeOnDelete();
                $table->timestamp('adjustment_date');
                $table->enum('type', ['addition', 'subtraction', 'write-off', 'count'])->default('count');
                $table->text('reason')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Create inventory_adjustment_items table if it doesn't exist
        if (! Schema::hasTable('inventory_adjustment_items')) {
            Schema::create('inventory_adjustment_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('inventory_adjustment_id')->constrained()->cascadeOnDelete();
                $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete();
                $table->decimal('expected_quantity', 15, 2);
                $table->decimal('actual_quantity', 15, 2);
                $table->decimal('adjusted_quantity', 15, 2);
                $table->decimal('cost', 15, 2)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // Create inventory_transfers table if it doesn't exist
        if (! Schema::hasTable('inventory_transfers')) {
            Schema::create('inventory_transfers', function (Blueprint $table) {
                $table->id();
                $table->string('reference_number');
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('from_location_id')->constrained('inventory_locations')->cascadeOnDelete();
                $table->foreignId('to_location_id')->constrained('inventory_locations')->cascadeOnDelete();
                $table->timestamp('transfer_date');
                $table->enum('status', ['pending', 'in_transit', 'completed', 'canceled'])->default('pending');
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Create inventory_transfer_items table if it doesn't exist
        if (! Schema::hasTable('inventory_transfer_items')) {
            Schema::create('inventory_transfer_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('inventory_transfer_id')->constrained()->cascadeOnDelete();
                $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete();
                $table->decimal('quantity', 15, 2);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop tables in reverse order to avoid foreign key constraint errors
        Schema::dropIfExists('inventory_transfer_items');
        Schema::dropIfExists('inventory_transfers');
        Schema::dropIfExists('inventory_adjustment_items');
        Schema::dropIfExists('inventory_adjustments');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('inventory_stocks');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('inventory_locations');
    }
};
