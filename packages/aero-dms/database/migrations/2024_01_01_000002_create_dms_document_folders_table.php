<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Pivot table for document-folder many-to-many relationship
        Schema::create('dms_document_folders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('dms_documents')->cascadeOnDelete();
            $table->foreignId('folder_id')->constrained('dms_folders')->cascadeOnDelete();
            $table->foreignId('added_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['document_id', 'folder_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dms_document_folders');
    }
};
