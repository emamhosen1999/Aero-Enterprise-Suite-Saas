<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates the CMS pages tables on the central (landlord) database.
 *
 * Tables:
 *  twill_pages            — core page record
 *  twill_page_translations — translatable fields (title, description)
 *  twill_page_slugs        — URL slugs per locale
 *  twill_page_revisions    — full revision history
 */
return new class extends Migration
{
    protected $connection = 'central';

    public function up(): void
    {
        Schema::connection('central')->create('twill_pages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->boolean('published')->default(false);
            $table->boolean('is_homepage')->default(false);
            $table->string('meta_title')->nullable();
            $table->string('meta_description')->nullable();
            $table->unsignedSmallInteger('position')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('published');
            $table->index('is_homepage');
        });

        Schema::connection('central')->create('twill_page_translations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('page_id');
            $table->string('locale', 7);
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->boolean('active')->default(false);
            $table->timestamps();

            $table->unique(['page_id', 'locale']);
            $table->foreign('page_id')->references('id')->on('twill_pages')->onDelete('cascade');
        });

        Schema::connection('central')->create('twill_page_slugs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('page_id');
            $table->string('locale', 7);
            $table->string('slug');
            $table->boolean('active')->default(false);
            $table->timestamps();

            $table->unique(['page_id', 'locale', 'slug']);
            $table->foreign('page_id')->references('id')->on('twill_pages')->onDelete('cascade');
        });

        Schema::connection('central')->create('twill_page_revisions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('page_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->json('payload');
            $table->timestamps();

            $table->foreign('page_id')->references('id')->on('twill_pages')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::connection('central')->dropIfExists('twill_page_revisions');
        Schema::connection('central')->dropIfExists('twill_page_slugs');
        Schema::connection('central')->dropIfExists('twill_page_translations');
        Schema::connection('central')->dropIfExists('twill_pages');
    }
};
