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
        Schema::table('leads', function (Blueprint $table) {
            // Lead scoring enhancements
            $table->unsignedSmallInteger('behavior_score')->default(0)->after('score');
            $table->unsignedSmallInteger('demographic_score')->default(0)->after('behavior_score');
            $table->unsignedSmallInteger('engagement_score')->default(0)->after('demographic_score');
            $table->json('score_breakdown')->nullable()->after('engagement_score');
            $table->timestamp('last_score_update')->nullable()->after('score_breakdown');

            // Lifecycle stage
            $table->enum('lifecycle_stage', [
                'subscriber',
                'lead',
                'marketing_qualified_lead',
                'sales_qualified_lead',
                'opportunity',
                'customer',
                'evangelist',
                'other'
            ])->default('lead')->after('status');

            // Marketing attribution
            $table->string('first_touch_source')->nullable()->after('source_id');
            $table->string('first_touch_medium')->nullable()->after('first_touch_source');
            $table->string('first_touch_campaign')->nullable()->after('first_touch_medium');
            $table->string('last_touch_source')->nullable()->after('first_touch_campaign');
            $table->string('last_touch_medium')->nullable()->after('last_touch_source');
            $table->string('last_touch_campaign')->nullable()->after('last_touch_medium');
            $table->string('utm_source')->nullable()->after('last_touch_campaign');
            $table->string('utm_medium')->nullable()->after('utm_source');
            $table->string('utm_campaign')->nullable()->after('utm_medium');
            $table->string('utm_term')->nullable()->after('utm_campaign');
            $table->string('utm_content')->nullable()->after('utm_term');
            $table->string('referrer_url', 500)->nullable()->after('utm_content');
            $table->string('landing_page', 500)->nullable()->after('referrer_url');

            // Engagement tracking
            $table->unsignedInteger('email_opens')->default(0)->after('landing_page');
            $table->unsignedInteger('email_clicks')->default(0)->after('email_opens');
            $table->unsignedInteger('page_views')->default(0)->after('email_clicks');
            $table->unsignedInteger('form_submissions')->default(0)->after('page_views');
            $table->timestamp('last_email_opened_at')->nullable()->after('form_submissions');
            $table->timestamp('last_email_clicked_at')->nullable()->after('last_email_opened_at');
            $table->timestamp('last_page_view_at')->nullable()->after('last_email_clicked_at');
            $table->timestamp('last_activity_at')->nullable()->after('last_page_view_at');

            // Marketing preferences
            $table->boolean('email_opt_in')->default(false)->after('last_activity_at');
            $table->boolean('sms_opt_in')->default(false)->after('email_opt_in');
            $table->boolean('phone_opt_in')->default(false)->after('sms_opt_in');
            $table->timestamp('email_opted_in_at')->nullable()->after('phone_opt_in');
            $table->timestamp('sms_opted_in_at')->nullable()->after('email_opted_in_at');

            // Tags and segments
            $table->json('tags')->nullable()->after('sms_opted_in_at');
            $table->json('custom_fields')->nullable()->after('tags');

            // Additional contact info
            $table->string('mobile_phone')->nullable()->after('phone');
            $table->string('job_title')->nullable()->after('company');
            $table->string('industry')->nullable()->after('job_title');
            $table->string('company_size')->nullable()->after('industry');
            $table->string('website')->nullable()->after('company_size');
            $table->string('linkedin_url')->nullable()->after('website');
            $table->string('city')->nullable()->after('linkedin_url');
            $table->string('state')->nullable()->after('city');
            $table->string('country')->nullable()->after('state');
            $table->string('timezone')->nullable()->after('country');

            // Indexes for marketing queries
            $table->index('lifecycle_stage');
            $table->index('behavior_score');
            $table->index('last_activity_at');
            $table->index(['email_opt_in', 'status']);
        });

        // Create lead activities table for tracking all interactions
        Schema::create('lead_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->string('type'); // email_open, email_click, page_view, form_submit, etc.
            $table->string('category')->nullable(); // marketing, sales, support
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->string('device_type')->nullable();
            $table->string('browser')->nullable();
            $table->string('os')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->unsignedInteger('score_change')->default(0);
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['lead_id', 'type']);
            $table->index('occurred_at');
            $table->index('category');
        });

        // Create lead scoring rules table
        Schema::create('lead_scoring_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('category', ['behavior', 'demographic', 'engagement'])->default('behavior');
            $table->string('trigger_type'); // email_opened, page_viewed, form_submitted, field_value, etc.
            $table->json('conditions')->nullable();
            $table->integer('score_value'); // Can be positive or negative
            $table->boolean('is_recurring')->default(false);
            $table->unsignedInteger('max_score')->nullable();
            $table->unsignedInteger('decay_days')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('priority')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['category', 'is_active']);
            $table->index('trigger_type');
        });

        // Create segments table for dynamic lead grouping
        Schema::create('lead_segments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['static', 'dynamic'])->default('dynamic');
            $table->json('criteria')->nullable();
            $table->unsignedInteger('member_count')->default(0);
            $table->timestamp('last_calculated_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index('type');
            $table->index('is_active');
        });

        Schema::create('lead_segment_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('segment_id')->constrained('lead_segments')->cascadeOnDelete();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->timestamp('added_at');
            $table->string('added_reason')->nullable();
            $table->timestamps();

            $table->unique(['segment_id', 'lead_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lead_segment_members');
        Schema::dropIfExists('lead_segments');
        Schema::dropIfExists('lead_scoring_rules');
        Schema::dropIfExists('lead_activities');

        Schema::table('leads', function (Blueprint $table) {
            // Remove indexes
            $table->dropIndex(['lifecycle_stage']);
            $table->dropIndex(['behavior_score']);
            $table->dropIndex(['last_activity_at']);
            $table->dropIndex(['email_opt_in', 'status']);

            // Remove columns
            $table->dropColumn([
                'behavior_score',
                'demographic_score',
                'engagement_score',
                'score_breakdown',
                'last_score_update',
                'lifecycle_stage',
                'first_touch_source',
                'first_touch_medium',
                'first_touch_campaign',
                'last_touch_source',
                'last_touch_medium',
                'last_touch_campaign',
                'utm_source',
                'utm_medium',
                'utm_campaign',
                'utm_term',
                'utm_content',
                'referrer_url',
                'landing_page',
                'email_opens',
                'email_clicks',
                'page_views',
                'form_submissions',
                'last_email_opened_at',
                'last_email_clicked_at',
                'last_page_view_at',
                'last_activity_at',
                'email_opt_in',
                'sms_opt_in',
                'phone_opt_in',
                'email_opted_in_at',
                'sms_opted_in_at',
                'tags',
                'custom_fields',
                'mobile_phone',
                'job_title',
                'industry',
                'company_size',
                'website',
                'linkedin_url',
                'city',
                'state',
                'country',
                'timezone',
            ]);
        });
    }
};
