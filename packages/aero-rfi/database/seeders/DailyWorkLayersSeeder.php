<?php

namespace Aero\Rfi\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * DailyWorkLayersSeeder - PATENTABLE CORE IP
 * 
 * Seeds demo DailyWork records with layer information for testing
 * LinearContinuityValidator and layer progression enforcement.
 * 
 * Creates realistic work progression across 7 construction layers:
 * 1. Earthwork (sub_base)
 * 2. Sub-base Course (granular)
 * 3. Base Course (aggregate)
 * 4. Prime Coat (bitumen)
 * 5. Binder Course (asphalt)
 * 6. Tack Coat (adhesive)
 * 7. Surface Course (wearing surface)
 */
class DailyWorkLayersSeeder extends Seeder
{
    /**
     * Layer hierarchy with chainage coverage
     */
    private const LAYERS = [
        ['code' => 'sub_base', 'order' => 1, 'name' => 'Earthwork & Sub-base'],
        ['code' => 'base_course', 'order' => 2, 'name' => 'Base Course'],
        ['code' => 'prime_coat', 'order' => 3, 'name' => 'Prime Coat'],
        ['code' => 'binder_course', 'order' => 4, 'name' => 'Binder Course'],
        ['code' => 'tack_coat', 'order' => 5, 'name' => 'Tack Coat'],
        ['code' => 'surface_course', 'order' => 6, 'name' => 'Surface Course'],
        ['code' => 'markings', 'order' => 7, 'name' => 'Road Markings'],
    ];

    public function run(): void
    {
        // Check if any project exists
        $project = DB::table('projects')->first();
        
        if (!$project) {
            $this->command->warn('No projects found. Please create a project first.');
            return;
        }

        // Check if permits exist
        $permits = DB::table('permit_to_works')
            ->where('project_id', $project->id)
            ->where('status', 'active')
            ->get();

        if ($permits->isEmpty()) {
            $this->command->warn('No active permits found. Creating works without permits.');
        }

        $this->command->info("Seeding layered daily works for project: {$project->name}");

        // Clear existing test data
        DB::table('daily_works')
            ->where('project_id', $project->id)
            ->where('layer', '!=', null)
            ->delete();

        $dailyWorks = [];
        $workId = 1;

        // Create realistic work progression:
        // Layer 1 (sub_base): Ch 0.000 - 5.500 (mostly complete, some gaps)
        $dailyWorks = array_merge($dailyWorks, $this->createLayerWorks(
            $project,
            self::LAYERS[0],
            [
                [0.000, 1.500, 'approved'],
                [1.500, 3.000, 'approved'],
                [3.200, 4.500, 'approved'], // Gap: 3.0-3.2
                [4.500, 5.500, 'submitted'],
            ],
            $workId,
            $permits->first()?->id
        ));
        $workId += 4;

        // Layer 2 (base_course): Ch 0.000 - 3.800 (following layer 1)
        $dailyWorks = array_merge($dailyWorks, $this->createLayerWorks(
            $project,
            self::LAYERS[1],
            [
                [0.000, 1.500, 'approved'],
                [1.500, 3.000, 'approved'],
                [3.200, 3.800, 'submitted'], // Can't go further - gap in layer 1 at 3.0-3.2
            ],
            $workId,
            $permits->first()?->id
        ));
        $workId += 3;

        // Layer 3 (prime_coat): Ch 0.000 - 3.000 (following layer 2)
        $dailyWorks = array_merge($dailyWorks, $this->createLayerWorks(
            $project,
            self::LAYERS[2],
            [
                [0.000, 1.200, 'approved'],
                [1.200, 2.500, 'submitted'],
                [2.500, 3.000, 'draft'], // Can't go further - layer 2 incomplete
            ],
            $workId,
            $permits->first()?->id
        ));
        $workId += 3;

        // Layer 4 (binder_course): Ch 0.000 - 2.500 (following layer 3)
        $dailyWorks = array_merge($dailyWorks, $this->createLayerWorks(
            $project,
            self::LAYERS[3],
            [
                [0.000, 1.200, 'approved'],
                [1.200, 2.500, 'submitted'],
                // Can't continue - layer 3 incomplete beyond 2.500
            ],
            $workId,
            $permits->first()?->id
        ));
        $workId += 2;

        // Layer 5 (tack_coat): Ch 0.000 - 1.200 (only where binder is approved)
        $dailyWorks = array_merge($dailyWorks, $this->createLayerWorks(
            $project,
            self::LAYERS[4],
            [
                [0.000, 1.200, 'submitted'],
            ],
            $workId,
            $permits->first()?->id
        ));
        $workId += 1;

        // Layer 6 (surface_course): Ch 0.000 - 1.000 (only where tack coat done)
        // This will FAIL validation because tack_coat is not approved yet
        $dailyWorks = array_merge($dailyWorks, $this->createLayerWorks(
            $project,
            self::LAYERS[5],
            [
                [0.000, 1.000, 'draft'], // BLOCKED: prerequisite not approved
            ],
            $workId,
            $permits->first()?->id
        ));
        $workId += 1;

        // Layer 7 (markings): No works yet (too early in construction)

        // Insert all daily works
        foreach ($dailyWorks as $work) {
            DB::table('daily_works')->insert($work);
        }

        $this->command->info("✓ Created " . count($dailyWorks) . " layered daily works");
        $this->command->line("");
        $this->command->info("Layer Progression Summary:");
        $this->command->line("  Layer 1 (sub_base):       Ch 0.000 - 5.500 (95% complete, 1 gap)");
        $this->command->line("  Layer 2 (base_course):    Ch 0.000 - 3.800 (blocked by gap)");
        $this->command->line("  Layer 3 (prime_coat):     Ch 0.000 - 3.000 (following layer 2)");
        $this->command->line("  Layer 4 (binder_course):  Ch 0.000 - 2.500 (following layer 3)");
        $this->command->line("  Layer 5 (tack_coat):      Ch 0.000 - 1.200 (submitted, pending)");
        $this->command->line("  Layer 6 (surface_course): Ch 0.000 - 1.000 (BLOCKED - waiting tack coat approval)");
        $this->command->line("  Layer 7 (markings):       No works yet");
        $this->command->line("");
        $this->command->info("Linear continuity validation is now testable!");
        $this->command->info("Try creating a Layer 6 work at Ch 0.000 - it should be blocked.");
    }

    /**
     * Create daily work records for a specific layer
     */
    private function createLayerWorks(
        $project,
        array $layerConfig,
        array $segments,
        int $startWorkId,
        ?int $permitId = null
    ): array {
        $works = [];
        $workCounter = $startWorkId;

        foreach ($segments as $segment) {
            [$startCh, $endCh, $status] = $segment;

            $works[] = [
                'project_id' => $project->id,
                'work_date' => Carbon::now()->subDays(rand(1, 30)),
                'shift' => 'day',
                'start_chainage' => $startCh,
                'chainage' => ($startCh + $endCh) / 2, // Midpoint
                'end_chainage' => $endCh,
                'description' => "{$layerConfig['name']} construction from Ch {$startCh} to Ch {$endCh}",
                'activity_type' => $layerConfig['code'],
                'quantity' => round(($endCh - $startCh) * 1000, 2), // Linear meters
                'unit' => 'm',
                'progress_percentage' => $status === 'approved' ? 100 : ($status === 'submitted' ? 95 : 50),
                'status' => $status,
                'submitted_at' => in_array($status, ['submitted', 'approved']) ? Carbon::now()->subDays(rand(1, 15)) : null,
                'approved_at' => $status === 'approved' ? Carbon::now()->subDays(rand(1, 10)) : null,
                
                // Layer continuity fields (PATENTABLE)
                'layer' => $layerConfig['code'],
                'layer_order' => $layerConfig['order'],
                'continuity_status' => $status === 'approved' ? 'validated' : 'pending',
                'can_approve' => $layerConfig['order'] === 1 || $status === 'draft', // Layer 1 always approvable
                
                // GPS fields (simulated)
                'latitude' => 23.8103 + ($startCh * 0.0009),
                'longitude' => 90.4125 + ($startCh * 0.00098),
                'gps_accuracy' => rand(3, 15),
                'gps_captured_at' => Carbon::now()->subDays(rand(1, 30)),
                'geo_validation_status' => 'passed',
                
                // Permit fields
                'permit_to_work_id' => $permitId,
                'permit_validation_status' => $permitId ? 'passed' : 'skipped',
                
                'incharge_user_id' => 1,
                'created_by' => 1,
                'created_at' => Carbon::now()->subDays(rand(1, 30)),
                'updated_at' => Carbon::now(),
            ];

            $workCounter++;
        }

        return $works;
    }
}
