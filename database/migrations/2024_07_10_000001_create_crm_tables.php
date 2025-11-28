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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('company')->nullable();
            $table->enum('status', ['active', 'inactive', 'lead', 'prospect'])->default('lead');
            $table->text('notes')->nullable();
            $table->enum('customer_type', ['individual', 'company'])->default('individual');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_contact_date')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('opportunities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('value', 15, 2)->default(0);
            $table->enum('status', ['open', 'won', 'lost', 'in-progress'])->default('open');
            $table->string('stage')->nullable();
            $table->integer('probability')->default(0);
            $table->date('expected_close_date')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('source')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('customer_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('opportunity_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['call', 'email', 'meeting', 'note', 'task'])->default('note');
            $table->string('subject');
            $table->text('description')->nullable();
            $table->timestamp('interaction_date');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('outcome')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_interactions');
        Schema::dropIfExists('opportunities');
        Schema::dropIfExists('customers');
    }
};
