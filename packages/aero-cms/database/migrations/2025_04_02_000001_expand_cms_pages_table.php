<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cms_pages', function (Blueprint $table) {
            // Hierarchy & Organization
            if (!Schema::hasColumn('cms_pages', 'parent_id')) {
                $table->unsignedBigInteger('parent_id')->nullable()->after('id');
                $table->foreign('parent_id')->references('id')->on('cms_pages')->onDelete('cascade');
            }
            
            if (!Schema::hasColumn('cms_pages', 'category_id')) {
                $table->unsignedBigInteger('category_id')->nullable()->after('parent_id');
            }

            // Ordering
            if (!Schema::hasColumn('cms_pages', 'order')) {
                $table->integer('order')->default(0)->after('slug');
            }

            // Layout/Template
            if (!Schema::hasColumn('cms_pages', 'template_id')) {
                $table->unsignedBigInteger('template_id')->nullable()->after('layout');
            }

            // Status & Scheduling
            if (!Schema::hasColumn('cms_pages', 'scheduled_at')) {
                $table->timestamp('scheduled_at')->nullable();
            }

            // SEO Fields
            if (!Schema::hasColumn('cms_pages', 'meta_title')) {
                $table->string('meta_title')->nullable();
            }

            if (!Schema::hasColumn('cms_pages', 'meta_description')) {
                $table->text('meta_description')->nullable();
            }

            if (!Schema::hasColumn('cms_pages', 'meta_keywords')) {
                $table->string('meta_keywords')->nullable();
            }

            if (!Schema::hasColumn('cms_pages', 'canonical_url')) {
                $table->string('canonical_url')->nullable();
            }

            // Navigation
            if (!Schema::hasColumn('cms_pages', 'show_in_nav')) {
                $table->boolean('show_in_nav')->default(false);
            }

            if (!Schema::hasColumn('cms_pages', 'nav_label')) {
                $table->string('nav_label')->nullable();
            }

            // Analytics
            if (!Schema::hasColumn('cms_pages', 'view_count')) {
                $table->unsignedInteger('view_count')->default(0);
            }

            if (!Schema::hasColumn('cms_pages', 'seo_index')) {
                $table->boolean('seo_index')->default(true);
            }

            // Internationalization
            if (!Schema::hasColumn('cms_pages', 'language')) {
                $table->string('language')->default('en');
            }

            if (!Schema::hasColumn('cms_pages', 'translation_key')) {
                $table->string('translation_key')->nullable()->unique();
            }

            // Audit Fields
            if (!Schema::hasColumn('cms_pages', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable();
            }

            if (!Schema::hasColumn('cms_pages', 'updated_by')) {
                $table->unsignedBigInteger('updated_by')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('cms_pages', function (Blueprint $table) {
            $table->dropForeignKeyIfExists('cms_pages_parent_id_foreign');
            $table->dropColumnIfExists(['parent_id', 'category_id', 'order', 'template_id', 'scheduled_at', 'meta_title', 'meta_description', 'meta_keywords', 'canonical_url', 'show_in_nav', 'nav_label', 'view_count', 'seo_index', 'language', 'translation_key', 'created_by', 'updated_by']);
        });
    }
};
