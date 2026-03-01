<?php

namespace Aero\Rfi\Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * ProjectAlignmentPointsSeeder - PATENTABLE CORE IP
 *
 * Seeds demo GPS control points for testing GeoFencing validation.
 * Creates a sample road alignment with GPS coordinates every 100m.
 *
 * Example: 10km road from chainage 0.000 to 10.000
 * Starting point: Latitude 23.8103, Longitude 90.4125 (Dhaka, Bangladesh)
 * Each segment increases by ~0.001 degrees (approximately 100m)
 */
class ProjectAlignmentPointsSeeder extends Seeder
{
    public function run(): void
    {
        // Check if any project exists
        $project = DB::table('projects')->first();

        if (! $project) {
            $this->command->warn('No projects found. Please create a project first.');

            return;
        }

        $this->command->info("Seeding alignment points for project: {$project->project_name}");

        // Clear existing points for this project
        DB::table('project_alignment_points')->where('project_id', $project->id)->delete();

        // Sample road alignment: 10km road (Ch 0.000 to Ch 10.000)
        // Starting coordinates (Dhaka, Bangladesh - adjust for your project location)
        $startLat = 23.8103;
        $startLng = 90.4125;

        // Create control points every 100m (0.1 km)
        $points = [];
        $totalLength = 10.0; // 10 km
        $interval = 0.1; // Every 100m

        // Approximate degree change per 100m (depends on latitude)
        // At equator: 1 degree ≈ 111 km
        // At latitude 23°: 1 degree latitude ≈ 111 km, 1 degree longitude ≈ 102 km
        $latDegreesPer100m = 0.0009; // ~100m in latitude
        $lngDegreesPer100m = 0.00098; // ~100m in longitude at this latitude

        $currentChainage = 0.0;
        $pointCounter = 0;

        while ($currentChainage <= $totalLength) {
            // Calculate GPS coordinates with slight curve (not perfectly straight)
            // Add small variations to simulate real road alignment
            $curveFactor = sin($currentChainage * 0.5); // Adds gentle curves

            $lat = $startLat + ($latDegreesPer100m * $pointCounter);
            $lng = $startLng + ($lngDegreesPer100m * $pointCounter) + ($curveFactor * 0.0001);
            $elevation = 5 + ($currentChainage * 0.5); // Gradually rising terrain

            $points[] = [
                'project_id' => $project->id,
                'chainage' => round($currentChainage, 3),
                'latitude' => round($lat, 7),
                'longitude' => round($lng, 7),
                'elevation' => round($elevation, 2),
                'point_type' => $currentChainage % 1.0 === 0.0 ? 'control' : 'survey', // Major points every 1km
                'source' => 'GPS Survey - Trimble R10',
                'surveyed_date' => Carbon::now()->subDays(rand(10, 60)),
                'surveyed_by' => null, // No user reference for demo data
                'is_verified' => true,
                'verified_by' => null, // No user reference for demo data
                'verified_at' => Carbon::now()->subDays(rand(1, 10)),
                'notes' => $currentChainage % 1.0 === 0.0
                    ? "Major control point at Ch {$currentChainage}"
                    : null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ];

            $currentChainage += $interval;
            $pointCounter++;
        }

        // Insert in batches
        $chunks = array_chunk($points, 50);
        foreach ($chunks as $chunk) {
            DB::table('project_alignment_points')->insert($chunk);
        }

        $this->command->info('✓ Created '.count($points).' alignment points');
        $this->command->info("  Range: Ch 0.000 to Ch {$totalLength}");
        $this->command->info("  Start: Lat {$startLat}, Lng {$startLng}");
        $this->command->info('  GPS validation is now functional!');
    }
}
