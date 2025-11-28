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
        // Document Categories
        Schema::create('document_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('document_categories')->nullOnDelete();
            $table->timestamps();
        });

        // HR Documents
        Schema::create('hr_documents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('document_type'); // policy, procedure, form, template, contract, certificate, other
            $table->foreignId('category_id')->nullable()->constrained('document_categories')->nullOnDelete();
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->string('version')->default('1.0');
            $table->date('effective_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('status')->default('draft'); // draft, active, archived, expired
            $table->boolean('is_confidential')->default(false);
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
        });

        // Employee Documents (for document assignments to employees)
        Schema::create('employee_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('hr_document_id')->constrained()->onDelete('cascade');
            $table->string('acknowledgment_status')->default('pending'); // pending, acknowledged, rejected
            $table->datetime('acknowledgment_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_documents');
        Schema::dropIfExists('hr_documents');
        Schema::dropIfExists('document_categories');
    }
};
