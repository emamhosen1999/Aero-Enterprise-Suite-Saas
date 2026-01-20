<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The database connection for CMS tables.
     */
    protected $connection = 'central';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::connection($this->connection)->create('cms_page_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('page_id')
                ->constrained('cms_pages')
                ->onDelete('cascade');
            $table->integer('version_number');
            $table->json('blocks'); // Snapshot of all blocks
            $table->json('settings')->nullable(); // Snapshot of page settings
            $table->string('change_summary')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('created_at');

            $table->index(['page_id', 'version_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('cms_page_versions');
    }
};
