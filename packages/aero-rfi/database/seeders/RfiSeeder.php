<?php

namespace Aero\Rfi\Database\Seeders;

use Aero\Rfi\Models\Rfi;
use Aero\Rfi\Models\WorkLocation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * RfiSeeder
 *
 * Seeds sample RFI data for testing the patentable features:
 * - GPS Geofencing validation
 * - Layer continuity validation
 * - Permit validation integration
 */
class RfiSeeder extends Seeder
{
    /**
     * Layer hierarchy for road construction.
     */
    private const LAYERS = [
        'earthwork_excavation',
        'earthwork_compaction',
        'sub_base',
        'base_course',
        'binder_course',
        'wearing_course',
    ];

    /**
     * Layer hierarchy order mapping.
     */
    private const LAYER_ORDER = [
        'earthwork_excavation' => 1,
        'earthwork_compaction' => 2,
        'sub_base' => 3,
        'base_course' => 4,
        'binder_course' => 5,
        'wearing_course' => 6,
    ];

    public function run(): void
    {
        // Check if work_locations table has data
        $workLocation = WorkLocation::first();

        if (! $workLocation) {
            $this->command?->info('Creating sample work locations for RFI seeding...');
            $this->seedWorkLocations();
            $workLocation = WorkLocation::first();
        }

        if (! $workLocation) {
            $this->command?->warn('Could not create work locations. Skipping RFI seeding.');

            return;
        }

        $this->command?->info('Seeding RFIs for work location: '.$workLocation->name);

        // Seed approved RFIs for lower layers to support continuity validation
        $this->seedApprovedLayers($workLocation);

        // Seed some pending RFIs for workflow testing
        $this->seedPendingRfis($workLocation);

        $this->command?->info('RFI seeding complete.');
    }

    /**
     * Create sample work locations with chainage data.
     */
    private function seedWorkLocations(): void
    {
        $projectId = DB::table('projects')->value('id') ?? 1;

        $locations = [
            [
                'name' => 'Ch 0+000 to 2+000',
                'description' => 'Road segment from km 0 to km 2',
                'start_chainage' => 'KM 0+000',
                'end_chainage' => 'KM 2+000',
                'start_chainage_m' => 0.000,
                'end_chainage_m' => 2000.000,
                'project_id' => $projectId,
                'is_active' => true,
            ],
            [
                'name' => 'Ch 2+000 to 4+000',
                'description' => 'Road segment from km 2 to km 4',
                'start_chainage' => 'KM 2+000',
                'end_chainage' => 'KM 4+000',
                'start_chainage_m' => 2000.000,
                'end_chainage_m' => 4000.000,
                'project_id' => $projectId,
                'is_active' => true,
            ],
            [
                'name' => 'Ch 4+000 to 6+000',
                'description' => 'Road segment from km 4 to km 6',
                'start_chainage' => 'KM 4+000',
                'end_chainage' => 'KM 6+000',
                'start_chainage_m' => 4000.000,
                'end_chainage_m' => 6000.000,
                'project_id' => $projectId,
                'is_active' => true,
            ],
        ];

        foreach ($locations as $location) {
            WorkLocation::updateOrCreate(
                ['name' => $location['name']],
                $location
            );
        }
    }

    /**
     * Seed approved RFIs for the first few layers.
     */
    private function seedApprovedLayers(WorkLocation $workLocation): void
    {
        $layersToSeed = ['earthwork_excavation', 'earthwork_compaction', 'sub_base'];
        $workLocations = WorkLocation::where('is_active', true)->get();

        foreach ($layersToSeed as $layer) {
            foreach ($workLocations as $wl) {
                $rfiNumber = sprintf('RFI-%s-%s-%03d',
                    now()->format('Ymd'),
                    strtoupper(substr($layer, 0, 3)),
                    $wl->id
                );

                Rfi::updateOrCreate(
                    [
                        'number' => $rfiNumber,
                    ],
                    [
                        'date' => now()->subDays(rand(5, 30)),
                        'type' => Rfi::TYPE_PAVEMENT,
                        'work_location_id' => $wl->id,
                        'layer' => $layer,
                        'layer_order' => self::LAYER_ORDER[$layer],
                        'description' => "Auto-seeded {$layer} for testing",
                        'side' => 'Both',
                        'qty_layer' => 1,
                        'status' => Rfi::STATUS_COMPLETED,
                        'inspection_result' => Rfi::INSPECTION_APPROVED,
                        'rfi_response_status' => Rfi::RFI_RESPONSE_APPROVED,
                        'rfi_submission_date' => now()->subDays(rand(10, 35)),
                        'rfi_response_date' => now()->subDays(rand(5, 10)),
                        'completion_time' => now()->subDays(rand(1, 5)),
                        'continuity_status' => 'validated',
                        'prerequisite_coverage' => 100,
                        'can_approve' => true,
                    ]
                );
            }
        }

        $this->command?->info('  - Seeded approved RFIs for layers: '.implode(', ', $layersToSeed));
    }

    /**
     * Seed pending RFIs for workflow testing.
     */
    private function seedPendingRfis(WorkLocation $workLocation): void
    {
        $pendingRfis = [
            [
                'layer' => 'base_course',
                'description' => 'Pending approval - base course over approved sub-base',
            ],
            [
                'layer' => 'binder_course',
                'description' => 'Should be blocked - no base course approved yet',
            ],
        ];

        foreach ($pendingRfis as $index => $rfiData) {
            $rfiNumber = sprintf('RFI-%s-PEND-%03d', now()->format('Ymd'), $index + 1);

            Rfi::updateOrCreate(
                ['number' => $rfiNumber],
                [
                    'date' => now(),
                    'type' => Rfi::TYPE_PAVEMENT,
                    'work_location_id' => $workLocation->id,
                    'layer' => $rfiData['layer'],
                    'layer_order' => self::LAYER_ORDER[$rfiData['layer']],
                    'description' => $rfiData['description'],
                    'side' => 'Both',
                    'qty_layer' => 1,
                    'status' => Rfi::STATUS_PENDING,
                    'inspection_result' => Rfi::INSPECTION_PENDING,
                    'rfi_submission_date' => now(),
                    'continuity_status' => 'pending',
                    'can_approve' => true,
                ]
            );
        }

        $this->command?->info('  - Seeded '.count($pendingRfis).' pending RFIs for testing');
    }
}
