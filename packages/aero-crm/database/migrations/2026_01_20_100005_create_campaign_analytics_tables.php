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
        Schema::create('campaign_metrics', function (Blueprint $table) {
            $table->id();
            $table->morphs('campaign'); // EmailCampaign or SmsCampaign
            $table->date('date');
            $table->unsignedInteger('sent')->default(0);
            $table->unsignedInteger('delivered')->default(0);
            $table->unsignedInteger('opens')->default(0);
            $table->unsignedInteger('unique_opens')->default(0);
            $table->unsignedInteger('clicks')->default(0);
            $table->unsignedInteger('unique_clicks')->default(0);
            $table->unsignedInteger('bounces')->default(0);
            $table->unsignedInteger('hard_bounces')->default(0);
            $table->unsignedInteger('soft_bounces')->default(0);
            $table->unsignedInteger('unsubscribes')->default(0);
            $table->unsignedInteger('complaints')->default(0);
            $table->unsignedInteger('conversions')->default(0);
            $table->decimal('revenue', 12, 2)->default(0);
            $table->decimal('cost', 10, 4)->default(0);
            $table->timestamps();

            $table->unique(['campaign_type', 'campaign_id', 'date']);
            $table->index('date');
        });

        Schema::create('campaign_conversions', function (Blueprint $table) {
            $table->id();
            $table->morphs('campaign');
            $table->morphs('converted'); // Lead, Customer, etc.
            $table->string('conversion_type'); // signup, purchase, download, etc.
            $table->decimal('value', 12, 2)->default(0);
            $table->string('currency', 3)->default('USD');
            $table->json('attribution_data')->nullable();
            $table->string('conversion_window')->nullable(); // 24h, 7d, 30d
            $table->timestamp('converted_at');
            $table->timestamps();

            $table->index(['campaign_type', 'campaign_id', 'converted_at']);
            $table->index('conversion_type');
        });

        Schema::create('marketing_attributions', function (Blueprint $table) {
            $table->id();
            $table->morphs('attributable'); // Lead, Customer, Deal
            $table->string('channel'); // email, sms, social, organic, paid, referral
            $table->string('source')->nullable();
            $table->string('medium')->nullable();
            $table->string('campaign_name')->nullable();
            $table->morphs('touchpoint'); // EmailCampaign, SmsCampaign, etc.
            $table->enum('attribution_model', ['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based'])
                ->default('last_touch');
            $table->decimal('attribution_weight', 5, 4)->default(1.0000);
            $table->decimal('attributed_value', 12, 2)->default(0);
            $table->unsignedInteger('touch_order')->default(1);
            $table->timestamp('touched_at');
            $table->timestamps();

            $table->index(['attributable_type', 'attributable_id', 'touched_at']);
            $table->index('channel');
        });

        Schema::create('marketing_goals', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('goal_type'); // leads, conversions, revenue, engagement
            $table->decimal('target_value', 12, 2);
            $table->decimal('current_value', 12, 2)->default(0);
            $table->string('metric_unit')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('period_type', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'])
                ->default('monthly');
            $table->json('criteria')->nullable();
            $table->enum('status', ['active', 'completed', 'missed', 'cancelled'])->default('active');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'end_date']);
            $table->index('goal_type');
        });

        Schema::create('marketing_reports', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('report_type'); // campaign_performance, lead_funnel, attribution, roi
            $table->json('config')->nullable();
            $table->json('filters')->nullable();
            $table->json('columns')->nullable();
            $table->string('schedule_frequency')->nullable(); // daily, weekly, monthly
            $table->time('schedule_time')->nullable();
            $table->json('recipients')->nullable();
            $table->timestamp('last_generated_at')->nullable();
            $table->string('last_report_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('report_type');
            $table->index('is_active');
        });

        Schema::create('ab_tests', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->morphs('testable'); // EmailCampaign, etc.
            $table->string('test_element'); // subject, content, sender, send_time
            $table->json('variants');
            $table->string('winning_metric'); // open_rate, click_rate, conversion_rate
            $table->unsignedTinyInteger('sample_size_percent')->default(20);
            $table->unsignedInteger('minimum_sample')->default(100);
            $table->enum('status', ['draft', 'running', 'completed', 'cancelled'])->default('draft');
            $table->string('winner_variant')->nullable();
            $table->decimal('statistical_confidence', 5, 2)->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->json('results')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ab_tests');
        Schema::dropIfExists('marketing_reports');
        Schema::dropIfExists('marketing_goals');
        Schema::dropIfExists('marketing_attributions');
        Schema::dropIfExists('campaign_conversions');
        Schema::dropIfExists('campaign_metrics');
    }
};
