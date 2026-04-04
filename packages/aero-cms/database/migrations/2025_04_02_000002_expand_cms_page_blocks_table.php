<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cms_page_blocks', function (Blueprint $table) {
            if (!Schema::hasColumn('cms_page_blocks', 'parent_block_id')) {
                $table->unsignedBigInteger('parent_block_id')->nullable()->after('page_id');
                $table->foreign('parent_block_id')->references('id')->on('cms_page_blocks')->onDelete('cascade');
            }

            if (!Schema::hasColumn('cms_page_blocks', 'conditions')) {
                $table->json('conditions')->nullable()->comment('Conditional visibility rules');
            }

            if (!Schema::hasColumn('cms_page_blocks', 'variant')) {
                $table->string('variant')->nullable()->comment('A/B testing variant');
            }

            if (!Schema::hasColumn('cms_page_blocks', 'dependencies')) {
                $table->json('dependencies')->nullable()->comment('Block dependencies');
            }

            if (!Schema::hasColumn('cms_page_blocks', 'metadata')) {
                $table->json('metadata')->nullable()->comment('Additional metadata');
            }

            if (!Schema::hasColumn('cms_page_blocks', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable();
            }

            if (!Schema::hasColumn('cms_page_blocks', 'updated_by')) {
                $table->unsignedBigInteger('updated_by')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('cms_page_blocks', function (Blueprint $table) {
            $table->dropForeignKeyIfExists('cms_page_blocks_parent_block_id_foreign');
            $table->dropColumnIfExists(['parent_block_id', 'conditions', 'variant', 'dependencies', 'metadata', 'created_by', 'updated_by']);
        });
    }
};
