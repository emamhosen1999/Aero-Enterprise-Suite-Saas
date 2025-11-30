<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * CRM Kanban Pipeline Migration
 *
 * This migration creates a flexible Kanban-based sales pipeline system with:
 *
 * CORE KANBAN TABLES:
 * 1. pipelines - Multiple sales pipelines (e.g., 'Sales Pipeline', 'Partner Pipeline')
 * 2. pipeline_stages - Ordered columns within each pipeline (e.g., 'Lead', 'Qualified', 'Proposal')
 * 3. deals - The Kanban cards representing sales opportunities
 *
 * SUPPORTING TABLES:
 * 4. deal_activities - Activity log for each deal (calls, emails, meetings, notes)
 * 5. deal_products - Products/services associated with deals
 * 6. deal_contacts - Multiple contacts per deal
 * 7. deal_attachments - Files and documents attached to deals
 * 8. deal_custom_fields - Extensible custom field values for deals
 * 9. pipeline_automations - Automation rules for pipeline actions
 * 10. deal_stage_history - Historical tracking of stage transitions
 *
 * ARCHITECTURAL NOTES:
 * - `position` fields are crucial for drag-and-drop ordering
 * - Soft deletes on all tables for audit trail
 * - Deals maintain history of all stage changes
 * - Supports multiple pipelines per organization
 * - Activity tracking for complete customer journey visibility
 *
 * @see \App\Models\CRM\Pipeline
 * @see \App\Models\CRM\PipelineStage
 * @see \App\Models\CRM\Deal
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // =====================================================================
        // TABLE 1: PIPELINES
        // =====================================================================
        if (! Schema::hasTable('pipelines')) {
            Schema::create('pipelines', function (Blueprint $table) {
                $table->id();

                // Pipeline identification
                $table->string('name');
                $table->string('code', 50)->nullable()->unique()->comment('Unique code for programmatic reference');
                $table->text('description')->nullable();

                // Configuration
                $table->boolean('is_default')->default(false)->comment('Default pipeline for new deals');
                $table->boolean('is_active')->default(true);

                // Visual settings
                $table->string('color', 7)->nullable()->comment('Hex color code for UI');
                $table->string('icon')->nullable()->comment('Icon name for UI');

                // Pipeline type for different use cases
                $table->enum('type', [
                    'sales',       // Standard sales pipeline
                    'support',     // Support ticket pipeline
                    'recruitment', // Hiring pipeline
                    'custom',      // Custom user-defined pipeline
                ])->default('sales');

                // Currency settings (inherits from tenant but can override)
                $table->string('currency', 3)->default('USD');

                // Goal tracking
                $table->decimal('monthly_target', 15, 2)->nullable()->comment('Monthly revenue target');
                $table->decimal('quarterly_target', 15, 2)->nullable()->comment('Quarterly revenue target');
                $table->decimal('yearly_target', 15, 2)->nullable()->comment('Yearly revenue target');

                // Access control
                $table->json('allowed_roles')->nullable()->comment('Roles that can access this pipeline');
                $table->json('allowed_users')->nullable()->comment('Specific users that can access');

                // Audit
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                // Indexes
                $table->index(['is_active', 'is_default']);
                $table->index('type');
            });
        }

        // =====================================================================
        // TABLE 2: PIPELINE STAGES (Kanban Columns)
        // =====================================================================
        if (! Schema::hasTable('pipeline_stages')) {
            Schema::create('pipeline_stages', function (Blueprint $table) {
                $table->id();

                // Relationship
                $table->foreignId('pipeline_id')->constrained('pipelines')->cascadeOnDelete();

                // Stage identification
                $table->string('name');
                $table->string('code', 50)->nullable()->comment('Unique code within pipeline');
                $table->text('description')->nullable();

                // Ordering - CRUCIAL for Kanban column order (Left to Right)
                $table->unsignedInteger('position')->default(0)->comment('Order position in pipeline (0 = leftmost)');

                // Win probability (0-100%)
                $table->unsignedTinyInteger('probability')->default(0)->comment('Likelihood of closing (0-100)');

                // Stage behavior
                $table->enum('stage_type', [
                    'open',       // Normal open stage
                    'won',        // Deal won (closed-won)
                    'lost',       // Deal lost (closed-lost)
                    'rotting',    // Deals that have been inactive too long
                ])->default('open');

                // Rotting configuration
                $table->unsignedInteger('rotting_days')->nullable()->comment('Days until deal is considered rotting');

                // Visual settings
                $table->string('color', 7)->nullable()->comment('Hex color code for stage');
                $table->string('icon')->nullable();

                // Stage limits
                $table->unsignedInteger('max_deals')->nullable()->comment('Maximum deals allowed in this stage (WIP limit)');
                $table->unsignedInteger('sla_hours')->nullable()->comment('SLA hours - max time deal should stay in stage');

                // Automation triggers
                $table->boolean('auto_email_on_enter')->default(false);
                $table->boolean('auto_task_on_enter')->default(false);
                $table->json('automation_config')->nullable()->comment('JSON config for stage automations');

                // Status
                $table->boolean('is_active')->default(true);

                // Audit
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                // Indexes
                $table->index(['pipeline_id', 'position']);
                $table->index(['pipeline_id', 'is_active']);
                $table->unique(['pipeline_id', 'code']);
            });
        }

        // =====================================================================
        // TABLE 3: DEALS (The Kanban Cards)
        // =====================================================================
        if (! Schema::hasTable('deals')) {
            Schema::create('deals', function (Blueprint $table) {
                $table->id();

                // Relationships
                $table->foreignId('pipeline_stage_id')->constrained('pipeline_stages')->restrictOnDelete();
                $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
                $table->foreignId('opportunity_id')->nullable()->constrained('opportunities')->nullOnDelete()->comment('Link to legacy opportunity');

                // Deal identification
                $table->string('title');
                $table->string('deal_number')->nullable()->unique()->comment('Auto-generated deal reference number');
                $table->text('description')->nullable();

                // Value
                $table->decimal('value', 15, 2)->default(0)->comment('Deal monetary value');
                $table->string('currency', 3)->default('USD');
                $table->decimal('weighted_value', 15, 2)->virtualAs('value * (SELECT probability FROM pipeline_stages WHERE id = pipeline_stage_id) / 100')->nullable();

                // Ordering - CRUCIAL for card order (Top to Bottom within stage)
                $table->unsignedInteger('position')->default(0)->comment('Order position within stage (0 = topmost)');

                // Dates
                $table->date('expected_close_date')->nullable();
                $table->date('actual_close_date')->nullable();
                $table->timestamp('won_at')->nullable();
                $table->timestamp('lost_at')->nullable();

                // Status (derived from stage_type but stored for quick filtering)
                $table->enum('status', [
                    'open',
                    'won',
                    'lost',
                ])->default('open')->index();

                // Deal source
                $table->string('source')->nullable()->comment('Lead source (website, referral, cold call, etc.)');
                $table->string('source_campaign')->nullable()->comment('Marketing campaign attribution');

                // Win/Loss analysis
                $table->string('lost_reason')->nullable();
                $table->text('lost_reason_notes')->nullable();
                $table->string('won_reason')->nullable();
                $table->text('won_reason_notes')->nullable();
                $table->foreignId('competitor_id')->nullable()->comment('Competitor who won if lost');

                // Assignment
                $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

                // Tags and categorization
                $table->json('tags')->nullable();
                $table->string('priority')->nullable()->default('medium');

                // Rotting tracking
                $table->timestamp('last_activity_at')->nullable();
                $table->boolean('is_rotting')->default(false)->index();
                $table->timestamp('rotting_since')->nullable();

                // Scoring
                $table->unsignedInteger('score')->nullable()->comment('Lead/deal score');

                // Custom fields (JSON for flexibility)
                $table->json('custom_fields')->nullable();

                // Timestamps
                $table->timestamps();
                $table->softDeletes();

                // Indexes for common queries
                $table->index(['pipeline_stage_id', 'position']);
                $table->index(['pipeline_stage_id', 'status']);
                $table->index(['assigned_to', 'status']);
                $table->index(['customer_id', 'status']);
                $table->index('expected_close_date');
                $table->index(['status', 'is_rotting']);
            });
        }

        // =====================================================================
        // TABLE 4: DEAL ACTIVITIES (Activity Feed)
        // =====================================================================
        if (! Schema::hasTable('deal_activities')) {
            Schema::create('deal_activities', function (Blueprint $table) {
                $table->id();

                $table->foreignId('deal_id')->constrained('deals')->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

                // Activity type
                $table->enum('type', [
                    'note',
                    'call',
                    'email',
                    'meeting',
                    'task',
                    'stage_change',
                    'value_change',
                    'assignment_change',
                    'system',
                ])->index();

                // Activity details
                $table->string('subject')->nullable();
                $table->text('description')->nullable();
                $table->text('outcome')->nullable();

                // For scheduled activities
                $table->timestamp('scheduled_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->unsignedInteger('duration_minutes')->nullable();

                // For stage changes
                $table->foreignId('from_stage_id')->nullable()->constrained('pipeline_stages')->nullOnDelete();
                $table->foreignId('to_stage_id')->nullable()->constrained('pipeline_stages')->nullOnDelete();

                // For value changes
                $table->decimal('old_value', 15, 2)->nullable();
                $table->decimal('new_value', 15, 2)->nullable();

                // Metadata
                $table->json('metadata')->nullable()->comment('Additional activity data');

                // Email tracking
                $table->string('email_message_id')->nullable();
                $table->boolean('email_opened')->nullable();
                $table->timestamp('email_opened_at')->nullable();
                $table->boolean('email_clicked')->nullable();
                $table->timestamp('email_clicked_at')->nullable();

                // Status
                $table->boolean('is_completed')->default(false);
                $table->boolean('is_pinned')->default(false)->comment('Pin to top of activity feed');

                $table->timestamps();
                $table->softDeletes();

                // Indexes
                $table->index(['deal_id', 'created_at']);
                $table->index(['deal_id', 'type']);
                $table->index(['user_id', 'type', 'scheduled_at']);
            });
        }

        // =====================================================================
        // TABLE 5: DEAL PRODUCTS (Products/Services in Deal)
        // =====================================================================
        if (! Schema::hasTable('deal_products')) {
            Schema::create('deal_products', function (Blueprint $table) {
                $table->id();

                $table->foreignId('deal_id')->constrained('deals')->cascadeOnDelete();
                $table->foreignId('product_id')->nullable()->comment('Link to inventory_items or products table');

                // Product details (snapshot at time of adding)
                $table->string('name');
                $table->string('sku')->nullable();
                $table->text('description')->nullable();

                // Pricing
                $table->decimal('unit_price', 15, 2)->default(0);
                $table->decimal('quantity', 15, 2)->default(1);
                $table->decimal('discount_percent', 5, 2)->default(0);
                $table->decimal('discount_amount', 15, 2)->default(0);
                $table->decimal('tax_percent', 5, 2)->default(0);
                $table->decimal('total', 15, 2)->default(0);

                // Billing type
                $table->enum('billing_type', [
                    'one_time',
                    'monthly',
                    'quarterly',
                    'yearly',
                    'custom',
                ])->default('one_time');

                // Recurring billing
                $table->unsignedInteger('billing_cycles')->nullable()->comment('Number of billing cycles');
                $table->date('billing_start_date')->nullable();

                $table->timestamps();

                // Indexes
                $table->index(['deal_id']);
            });
        }

        // =====================================================================
        // TABLE 6: DEAL CONTACTS (Multiple Contacts per Deal)
        // =====================================================================
        if (! Schema::hasTable('deal_contacts')) {
            Schema::create('deal_contacts', function (Blueprint $table) {
                $table->id();

                $table->foreignId('deal_id')->constrained('deals')->cascadeOnDelete();
                $table->foreignId('contact_id')->nullable()->comment('Link to contacts table if exists');

                // Contact details
                $table->string('name');
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->string('title')->nullable()->comment('Job title');
                $table->string('role')->nullable()->comment('Role in deal: decision_maker, influencer, user, etc.');

                // Flags
                $table->boolean('is_primary')->default(false);

                $table->timestamps();

                // Indexes
                $table->index(['deal_id', 'is_primary']);
            });
        }

        // =====================================================================
        // TABLE 7: DEAL ATTACHMENTS
        // =====================================================================
        if (! Schema::hasTable('deal_attachments')) {
            Schema::create('deal_attachments', function (Blueprint $table) {
                $table->id();

                $table->foreignId('deal_id')->constrained('deals')->cascadeOnDelete();
                $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();

                // File details
                $table->string('name');
                $table->string('file_path');
                $table->string('file_type')->nullable();
                $table->unsignedBigInteger('file_size')->nullable();

                // Categorization
                $table->string('category')->nullable()->comment('proposal, contract, invoice, other');

                $table->timestamps();
                $table->softDeletes();

                // Indexes
                $table->index(['deal_id', 'category']);
            });
        }

        // =====================================================================
        // TABLE 8: DEAL CUSTOM FIELD DEFINITIONS
        // =====================================================================
        if (! Schema::hasTable('deal_custom_field_definitions')) {
            Schema::create('deal_custom_field_definitions', function (Blueprint $table) {
                $table->id();

                $table->foreignId('pipeline_id')->nullable()->constrained('pipelines')->cascadeOnDelete()->comment('Pipeline-specific or global if null');

                // Field definition
                $table->string('name');
                $table->string('key', 100)->unique();
                $table->enum('field_type', [
                    'text',
                    'textarea',
                    'number',
                    'currency',
                    'date',
                    'datetime',
                    'select',
                    'multi_select',
                    'checkbox',
                    'url',
                    'email',
                    'phone',
                    'user',
                    'file',
                ]);

                // Field configuration
                $table->json('options')->nullable()->comment('Options for select/multi_select fields');
                $table->string('default_value')->nullable();
                $table->boolean('is_required')->default(false);
                $table->unsignedInteger('display_order')->default(0);

                // Visibility
                $table->boolean('show_in_list')->default(true);
                $table->boolean('show_in_create')->default(true);
                $table->boolean('show_in_edit')->default(true);
                $table->boolean('is_active')->default(true);

                $table->timestamps();

                // Indexes
                $table->index(['pipeline_id', 'is_active']);
            });
        }

        // =====================================================================
        // TABLE 9: DEAL STAGE HISTORY (Audit Trail)
        // =====================================================================
        if (! Schema::hasTable('deal_stage_history')) {
            Schema::create('deal_stage_history', function (Blueprint $table) {
                $table->id();

                $table->foreignId('deal_id')->constrained('deals')->cascadeOnDelete();
                $table->foreignId('from_stage_id')->nullable()->constrained('pipeline_stages')->nullOnDelete();
                $table->foreignId('to_stage_id')->constrained('pipeline_stages')->restrictOnDelete();
                $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();

                // Timing analytics
                $table->unsignedBigInteger('time_in_stage_seconds')->nullable()->comment('Time spent in previous stage');

                // Snapshot values at transition
                $table->decimal('deal_value_at_change', 15, 2)->nullable();
                $table->unsignedTinyInteger('probability_at_change')->nullable();

                $table->timestamp('changed_at');

                // Indexes
                $table->index(['deal_id', 'changed_at']);
                $table->index(['to_stage_id', 'changed_at']);
            });
        }

        // =====================================================================
        // TABLE 10: PIPELINE AUTOMATIONS
        // =====================================================================
        if (! Schema::hasTable('pipeline_automations')) {
            Schema::create('pipeline_automations', function (Blueprint $table) {
                $table->id();

                $table->foreignId('pipeline_id')->constrained('pipelines')->cascadeOnDelete();
                $table->foreignId('stage_id')->nullable()->constrained('pipeline_stages')->cascadeOnDelete()->comment('Specific stage or null for all');

                // Automation details
                $table->string('name');
                $table->text('description')->nullable();

                // Trigger
                $table->enum('trigger_type', [
                    'deal_created',
                    'deal_stage_changed',
                    'deal_won',
                    'deal_lost',
                    'deal_value_changed',
                    'deal_assigned',
                    'deal_rotting',
                    'scheduled',
                ]);

                // Condition (JSON logic format)
                $table->json('conditions')->nullable();

                // Actions
                $table->json('actions')->comment('Array of actions to perform');

                // Status
                $table->boolean('is_active')->default(true);
                $table->unsignedInteger('execution_count')->default(0);
                $table->timestamp('last_executed_at')->nullable();

                // Audit
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                // Indexes
                $table->index(['pipeline_id', 'is_active', 'trigger_type']);
            });
        }

        // =====================================================================
        // TABLE 11: LOST REASONS (Lookup Table)
        // =====================================================================
        if (! Schema::hasTable('deal_lost_reasons')) {
            Schema::create('deal_lost_reasons', function (Blueprint $table) {
                $table->id();

                $table->string('name');
                $table->text('description')->nullable();
                $table->unsignedInteger('display_order')->default(0);
                $table->boolean('is_active')->default(true);

                $table->timestamps();
            });
        }

        // =====================================================================
        // TABLE 12: COMPETITORS
        // =====================================================================
        if (! Schema::hasTable('competitors')) {
            Schema::create('competitors', function (Blueprint $table) {
                $table->id();

                $table->string('name');
                $table->string('website')->nullable();
                $table->text('description')->nullable();
                $table->text('strengths')->nullable();
                $table->text('weaknesses')->nullable();
                $table->json('products')->nullable()->comment('Competing products/services');

                $table->boolean('is_active')->default(true);

                $table->timestamps();
                $table->softDeletes();
            });
        }

        // =====================================================================
        // ADD FOREIGN KEY: deals.competitor_id -> competitors.id
        // =====================================================================
        if (Schema::hasTable('deals') && Schema::hasTable('competitors')) {
            Schema::table('deals', function (Blueprint $table) {
                if (! $this->hasForeignKey('deals', 'deals_competitor_id_foreign')) {
                    $table->foreign('competitor_id')->references('id')->on('competitors')->nullOnDelete();
                }
            });
        }

        // =====================================================================
        // MODIFY EXISTING OPPORTUNITIES TABLE (if needed for migration path)
        // =====================================================================
        if (Schema::hasTable('opportunities')) {
            Schema::table('opportunities', function (Blueprint $table) {
                if (! Schema::hasColumn('opportunities', 'deal_id')) {
                    $table->foreignId('deal_id')->nullable()->after('id')->comment('Link to new deals table for migration');
                }
                if (! Schema::hasColumn('opportunities', 'migrated_at')) {
                    $table->timestamp('migrated_at')->nullable()->comment('When this was migrated to deals');
                }
            });
        }

        // =====================================================================
        // SEED DEFAULT DATA
        // =====================================================================
        $this->seedDefaultPipeline();
        $this->seedDefaultLostReasons();
    }

    /**
     * Seed default sales pipeline with stages
     */
    private function seedDefaultPipeline(): void
    {
        // Skip if pipeline already exists
        if (DB::table('pipelines')->where('code', 'sales')->exists()) {
            return;
        }

        // Create default sales pipeline
        $pipelineId = DB::table('pipelines')->insertGetId([
            'name' => 'Sales Pipeline',
            'code' => 'sales',
            'description' => 'Default sales pipeline for managing deals from lead to close',
            'is_default' => true,
            'is_active' => true,
            'type' => 'sales',
            'color' => '#3b82f6',
            'currency' => 'USD',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create default stages
        $stages = [
            [
                'name' => 'Lead',
                'code' => 'lead',
                'description' => 'Initial contact or inquiry',
                'position' => 0,
                'probability' => 10,
                'stage_type' => 'open',
                'color' => '#6366f1',
                'rotting_days' => 14,
            ],
            [
                'name' => 'Qualified',
                'code' => 'qualified',
                'description' => 'Lead has been qualified and shows potential',
                'position' => 1,
                'probability' => 25,
                'stage_type' => 'open',
                'color' => '#8b5cf6',
                'rotting_days' => 21,
            ],
            [
                'name' => 'Proposal',
                'code' => 'proposal',
                'description' => 'Proposal or quote has been sent',
                'position' => 2,
                'probability' => 50,
                'stage_type' => 'open',
                'color' => '#a855f7',
                'rotting_days' => 14,
            ],
            [
                'name' => 'Negotiation',
                'code' => 'negotiation',
                'description' => 'Active negotiation in progress',
                'position' => 3,
                'probability' => 75,
                'stage_type' => 'open',
                'color' => '#d946ef',
                'rotting_days' => 7,
            ],
            [
                'name' => 'Closed Won',
                'code' => 'won',
                'description' => 'Deal successfully closed',
                'position' => 4,
                'probability' => 100,
                'stage_type' => 'won',
                'color' => '#22c55e',
                'rotting_days' => null,
            ],
            [
                'name' => 'Closed Lost',
                'code' => 'lost',
                'description' => 'Deal was lost',
                'position' => 5,
                'probability' => 0,
                'stage_type' => 'lost',
                'color' => '#ef4444',
                'rotting_days' => null,
            ],
        ];

        foreach ($stages as $stage) {
            DB::table('pipeline_stages')->insert([
                'pipeline_id' => $pipelineId,
                'name' => $stage['name'],
                'code' => $stage['code'],
                'description' => $stage['description'],
                'position' => $stage['position'],
                'probability' => $stage['probability'],
                'stage_type' => $stage['stage_type'],
                'color' => $stage['color'],
                'rotting_days' => $stage['rotting_days'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Seed default lost reasons
     */
    private function seedDefaultLostReasons(): void
    {
        // Skip if already seeded
        if (DB::table('deal_lost_reasons')->count() > 0) {
            return;
        }

        $reasons = [
            ['name' => 'Price too high', 'display_order' => 1],
            ['name' => 'Went with competitor', 'display_order' => 2],
            ['name' => 'No budget', 'display_order' => 3],
            ['name' => 'No decision', 'display_order' => 4],
            ['name' => 'Project cancelled', 'display_order' => 5],
            ['name' => 'Timing not right', 'display_order' => 6],
            ['name' => 'Product not a fit', 'display_order' => 7],
            ['name' => 'Lost contact', 'display_order' => 8],
            ['name' => 'Other', 'display_order' => 99],
        ];

        foreach ($reasons as $reason) {
            DB::table('deal_lost_reasons')->insert([
                'name' => $reason['name'],
                'display_order' => $reason['display_order'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Check if a foreign key exists
     */
    private function hasForeignKey(string $table, string $foreignKey): bool
    {
        $foreignKeys = Schema::getConnection()
            ->getDoctrineSchemaManager()
            ->listTableForeignKeys($table);

        foreach ($foreignKeys as $fk) {
            if ($fk->getName() === $foreignKey) {
                return true;
            }
        }

        return false;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove foreign key from deals before dropping competitors
        if (Schema::hasTable('deals')) {
            Schema::table('deals', function (Blueprint $table) {
                if ($this->hasForeignKey('deals', 'deals_competitor_id_foreign')) {
                    $table->dropForeign(['competitor_id']);
                }
            });
        }

        // Remove added columns from opportunities
        if (Schema::hasTable('opportunities')) {
            Schema::table('opportunities', function (Blueprint $table) {
                if (Schema::hasColumn('opportunities', 'deal_id')) {
                    $table->dropColumn('deal_id');
                }
                if (Schema::hasColumn('opportunities', 'migrated_at')) {
                    $table->dropColumn('migrated_at');
                }
            });
        }

        // Drop tables in reverse order of creation (respecting foreign keys)
        Schema::dropIfExists('pipeline_automations');
        Schema::dropIfExists('deal_stage_history');
        Schema::dropIfExists('deal_custom_field_definitions');
        Schema::dropIfExists('deal_attachments');
        Schema::dropIfExists('deal_contacts');
        Schema::dropIfExists('deal_products');
        Schema::dropIfExists('deal_activities');
        Schema::dropIfExists('deal_lost_reasons');
        Schema::dropIfExists('competitors');
        Schema::dropIfExists('deals');
        Schema::dropIfExists('pipeline_stages');
        Schema::dropIfExists('pipelines');
    }
};
