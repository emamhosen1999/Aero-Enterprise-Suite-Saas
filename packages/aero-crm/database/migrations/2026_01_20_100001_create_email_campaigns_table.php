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
        Schema::create('email_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('subject');
            $table->string('preview_text')->nullable();
            $table->string('from_name')->nullable();
            $table->string('from_email')->nullable();
            $table->string('reply_to')->nullable();
            $table->longText('html_content')->nullable();
            $table->longText('plain_content')->nullable();
            $table->json('template_data')->nullable();
            $table->string('template_id')->nullable();
            $table->enum('status', ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'failed'])
                ->default('draft');
            $table->enum('type', ['regular', 'automated', 'ab_test', 'triggered'])
                ->default('regular');
            $table->json('segment_criteria')->nullable();
            $table->json('ab_test_config')->nullable();
            $table->unsignedBigInteger('list_id')->nullable();
            $table->unsignedBigInteger('template_version_id')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('total_recipients')->default(0);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('delivered_count')->default(0);
            $table->unsignedInteger('opened_count')->default(0);
            $table->unsignedInteger('clicked_count')->default(0);
            $table->unsignedInteger('bounced_count')->default(0);
            $table->unsignedInteger('unsubscribed_count')->default(0);
            $table->unsignedInteger('complained_count')->default(0);
            $table->decimal('open_rate', 5, 2)->nullable();
            $table->decimal('click_rate', 5, 2)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('tags')->nullable();
            $table->json('tracking_settings')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'scheduled_at']);
            $table->index('type');
            $table->index('created_by');
        });

        Schema::create('email_campaign_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained('email_campaigns')->cascadeOnDelete();
            $table->string('email');
            $table->string('name')->nullable();
            $table->morphs('recipient'); // Lead, Customer, Contact, etc.
            $table->enum('status', ['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'complained', 'failed'])
                ->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('clicked_at')->nullable();
            $table->unsignedSmallInteger('open_count')->default(0);
            $table->unsignedSmallInteger('click_count')->default(0);
            $table->string('bounce_type')->nullable();
            $table->text('bounce_message')->nullable();
            $table->string('complaint_type')->nullable();
            $table->json('merge_fields')->nullable();
            $table->string('message_id')->nullable();
            $table->timestamps();

            $table->unique(['campaign_id', 'email']);
            $table->index('status');
            $table->index('message_id');
        });

        Schema::create('email_campaign_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained('email_campaigns')->cascadeOnDelete();
            $table->string('url');
            $table->string('short_code')->unique();
            $table->unsignedInteger('click_count')->default(0);
            $table->unsignedInteger('unique_clicks')->default(0);
            $table->timestamps();

            $table->index('short_code');
        });

        Schema::create('email_link_clicks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('link_id')->constrained('email_campaign_links')->cascadeOnDelete();
            $table->foreignId('recipient_id')->constrained('email_campaign_recipients')->cascadeOnDelete();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->string('device_type')->nullable();
            $table->string('browser')->nullable();
            $table->string('os')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->timestamp('clicked_at');
            $table->timestamps();

            $table->index('clicked_at');
        });

        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('category')->nullable();
            $table->longText('html_content');
            $table->longText('plain_content')->nullable();
            $table->json('variables')->nullable();
            $table->string('thumbnail')->nullable();
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index('category');
            $table->index('is_active');
        });

        Schema::create('email_lists', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(false);
            $table->boolean('double_optin')->default(true);
            $table->string('welcome_email_template_id')->nullable();
            $table->unsignedInteger('subscriber_count')->default(0);
            $table->unsignedInteger('active_count')->default(0);
            $table->unsignedInteger('unsubscribed_count')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index('is_public');
        });

        Schema::create('email_list_subscribers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('list_id')->constrained('email_lists')->cascadeOnDelete();
            $table->string('email');
            $table->string('name')->nullable();
            $table->morphs('subscribable');
            $table->enum('status', ['pending', 'active', 'unsubscribed', 'bounced', 'complained'])
                ->default('pending');
            $table->string('confirmation_token')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('unsubscribed_at')->nullable();
            $table->json('custom_fields')->nullable();
            $table->json('tags')->nullable();
            $table->string('source')->nullable();
            $table->timestamps();

            $table->unique(['list_id', 'email']);
            $table->index('status');
            $table->index('confirmation_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_list_subscribers');
        Schema::dropIfExists('email_lists');
        Schema::dropIfExists('email_templates');
        Schema::dropIfExists('email_link_clicks');
        Schema::dropIfExists('email_campaign_links');
        Schema::dropIfExists('email_campaign_recipients');
        Schema::dropIfExists('email_campaigns');
    }
};
