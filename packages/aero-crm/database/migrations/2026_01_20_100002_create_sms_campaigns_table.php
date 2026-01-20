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
        Schema::create('sms_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('message');
            $table->string('sender_id')->nullable();
            $table->enum('status', ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'failed'])
                ->default('draft');
            $table->enum('type', ['regular', 'automated', 'triggered'])
                ->default('regular');
            $table->json('segment_criteria')->nullable();
            $table->unsignedBigInteger('list_id')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('total_recipients')->default(0);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('delivered_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->unsignedInteger('clicked_count')->default(0);
            $table->decimal('cost', 10, 4)->default(0);
            $table->string('currency', 3)->default('USD');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('tags')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'scheduled_at']);
            $table->index('type');
            $table->index('created_by');
        });

        Schema::create('sms_campaign_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained('sms_campaigns')->cascadeOnDelete();
            $table->string('phone_number');
            $table->string('name')->nullable();
            $table->morphs('recipient');
            $table->enum('status', ['pending', 'sent', 'delivered', 'failed', 'clicked'])
                ->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('clicked_at')->nullable();
            $table->string('error_code')->nullable();
            $table->text('error_message')->nullable();
            $table->string('message_id')->nullable();
            $table->decimal('cost', 8, 4)->nullable();
            $table->json('merge_fields')->nullable();
            $table->timestamps();

            $table->unique(['campaign_id', 'phone_number']);
            $table->index('status');
            $table->index('message_id');
        });

        Schema::create('sms_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('category')->nullable();
            $table->text('message');
            $table->json('variables')->nullable();
            $table->unsignedSmallInteger('character_count')->default(0);
            $table->unsignedTinyInteger('segment_count')->default(1);
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index('category');
            $table->index('is_active');
        });

        Schema::create('sms_lists', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('subscriber_count')->default(0);
            $table->unsignedInteger('active_count')->default(0);
            $table->unsignedInteger('opted_out_count')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('sms_list_subscribers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('list_id')->constrained('sms_lists')->cascadeOnDelete();
            $table->string('phone_number');
            $table->string('name')->nullable();
            $table->morphs('subscribable');
            $table->enum('status', ['active', 'opted_out', 'invalid', 'blocked'])
                ->default('active');
            $table->timestamp('opted_out_at')->nullable();
            $table->json('custom_fields')->nullable();
            $table->string('source')->nullable();
            $table->timestamps();

            $table->unique(['list_id', 'phone_number']);
            $table->index('status');
        });

        Schema::create('sms_providers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('provider'); // twilio, nexmo, messagebird, sslwireless, etc.
            $table->json('credentials');
            $table->json('settings')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_default');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sms_providers');
        Schema::dropIfExists('sms_list_subscribers');
        Schema::dropIfExists('sms_lists');
        Schema::dropIfExists('sms_templates');
        Schema::dropIfExists('sms_campaign_recipients');
        Schema::dropIfExists('sms_campaigns');
    }
};
