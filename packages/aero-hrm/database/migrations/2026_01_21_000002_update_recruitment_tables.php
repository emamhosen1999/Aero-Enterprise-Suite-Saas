<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('job_hiring_stages')) {
            Schema::table('job_hiring_stages', function (Blueprint $table) {
                if (! Schema::hasColumn('job_hiring_stages', 'sequence')) {
                    $table->integer('sequence')->default(0)->after('description');
                }
                if (! Schema::hasColumn('job_hiring_stages', 'required_actions')) {
                    $table->json('required_actions')->nullable()->after('sequence');
                }
                if (! Schema::hasColumn('job_hiring_stages', 'requires_approval')) {
                    $table->boolean('requires_approval')->default(false)->after('required_actions');
                }
                if (! Schema::hasColumn('job_hiring_stages', 'is_final')) {
                    $table->boolean('is_final')->default(false)->after('requires_approval');
                }
            });

            if (Schema::hasColumn('job_hiring_stages', 'stage_order') && Schema::hasColumn('job_hiring_stages', 'sequence')) {
                DB::table('job_hiring_stages')->whereNull('sequence')->orWhere('sequence', 0)->update([
                    'sequence' => DB::raw('stage_order'),
                ]);
            }
        }

        if (Schema::hasTable('jobs_recruitment') && ! Schema::hasColumn('jobs_recruitment', 'created_by')) {
            Schema::table('jobs_recruitment', function (Blueprint $table) {
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete()->after('custom_fields');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('jobs_recruitment') && Schema::hasColumn('jobs_recruitment', 'created_by')) {
            Schema::table('jobs_recruitment', function (Blueprint $table) {
                $table->dropForeign(['created_by']);
                $table->dropColumn('created_by');
            });
        }

        if (Schema::hasTable('job_hiring_stages')) {
            Schema::table('job_hiring_stages', function (Blueprint $table) {
                if (Schema::hasColumn('job_hiring_stages', 'is_final')) {
                    $table->dropColumn('is_final');
                }
                if (Schema::hasColumn('job_hiring_stages', 'requires_approval')) {
                    $table->dropColumn('requires_approval');
                }
                if (Schema::hasColumn('job_hiring_stages', 'required_actions')) {
                    $table->dropColumn('required_actions');
                }
                if (Schema::hasColumn('job_hiring_stages', 'sequence')) {
                    $table->dropColumn('sequence');
                }
            });
        }
    }
};
