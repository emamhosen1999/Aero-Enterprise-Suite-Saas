<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates Twill's shared core tables on the central (landlord) database.
 *
 * Skips twill_users and twill_password_resets — we reuse landlord_users.
 */
return new class extends Migration
{
    protected $connection = 'central';

    public function up(): void
    {
        // ── Media library ─────────────────────────────────────────────────
        if (! Schema::connection('central')->hasTable('twill_medias')) {
            Schema::connection('central')->create('twill_medias', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('uuid')->unique();
                $table->string('filename');
                $table->string('caption')->nullable();
                $table->string('alt_text')->nullable();
                $table->unsignedBigInteger('width')->nullable();
                $table->unsignedBigInteger('height')->nullable();
                $table->boolean('no_crop')->default(false);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (! Schema::connection('central')->hasTable('twill_mediables')) {
            Schema::connection('central')->create('twill_mediables', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('media_id');
                $table->morphs('mediable');
                $table->string('role')->nullable();
                $table->string('crop')->nullable();
                $table->unsignedInteger('lqip_data')->nullable();
                $table->unsignedInteger('ratio')->nullable();
                $table->json('metadatas')->nullable();
                $table->unsignedInteger('pivot_id')->nullable();
                $table->unsignedSmallInteger('position')->default(1);
                $table->timestamps();
                $table->foreign('media_id')->references('id')->on('twill_medias');
            });
        }

        // ── Block editor ──────────────────────────────────────────────────
        if (! Schema::connection('central')->hasTable('twill_blocks')) {
            Schema::connection('central')->create('twill_blocks', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->morphs('blockable');
                $table->text('content')->nullable();
                $table->string('relation')->nullable();
                $table->string('position')->nullable();
                $table->string('type');
                $table->unsignedSmallInteger('position_in_block')->default(0);
                $table->timestamps();
            });
        }

        // ── Related content pivot ─────────────────────────────────────────
        if (! Schema::connection('central')->hasTable('twill_related')) {
            Schema::connection('central')->create('twill_related', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->morphs('subject');
                $table->morphs('related');
                $table->string('role_name')->nullable();
                $table->unsignedSmallInteger('position')->nullable();
                $table->timestamps();
            });
        }

        // ── Tags ──────────────────────────────────────────────────────────
        if (! Schema::connection('central')->hasTable('twill_tags')) {
            Schema::connection('central')->create('twill_tags', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('name');
                $table->string('slug');
                $table->string('namespace')->nullable();
                $table->unsignedBigInteger('count')->default(0);
                $table->timestamps();
            });
        }

        if (! Schema::connection('central')->hasTable('twill_taggables')) {
            Schema::connection('central')->create('twill_taggables', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('tag_id');
                $table->morphs('taggable');
                $table->timestamps();
                $table->foreign('tag_id')->references('id')->on('twill_tags')->onDelete('cascade');
            });
        }

        // ── Features ──────────────────────────────────────────────────────
        if (! Schema::connection('central')->hasTable('twill_features')) {
            Schema::connection('central')->create('twill_features', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('bucket_key');
                $table->morphs('featured');
                $table->unsignedSmallInteger('position');
                $table->timestamps();
            });
        }

        // ── Settings ──────────────────────────────────────────────────────
        if (! Schema::connection('central')->hasTable('twill_settings')) {
            Schema::connection('central')->create('twill_settings', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('key');
                $table->string('section')->nullable();
                $table->string('locale')->nullable();
                $table->text('value')->nullable();
                $table->timestamps();
                $table->unique(['section', 'key', 'locale']);
            });
        }
    }

    public function down(): void
    {
        foreach ([
            'twill_settings',
            'twill_features',
            'twill_taggables',
            'twill_tags',
            'twill_related',
            'twill_blocks',
            'twill_mediables',
            'twill_medias',
        ] as $table) {
            Schema::connection('central')->dropIfExists($table);
        }
    }
};
