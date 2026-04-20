<?php

namespace Aero\HRM\Database\Seeders;

use Aero\HRM\Models\DisciplinaryActionType;
use Illuminate\Database\Seeder;

class HrmDisciplinaryActionTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Verbal Warning', 'code' => 'VW', 'description' => 'Informal verbal notice about unacceptable behavior.', 'severity' => 'minor', 'points' => 1, 'requires_investigation' => false],
            ['name' => 'Written Warning', 'code' => 'WW', 'description' => 'Formal written notice documenting the offense and expectations.', 'severity' => 'minor', 'points' => 2, 'requires_investigation' => false],
            ['name' => 'Final Warning', 'code' => 'FW', 'description' => 'Last formal warning before severe action is taken.', 'severity' => 'moderate', 'points' => 4, 'requires_investigation' => true],
            ['name' => 'Suspension', 'code' => 'SUS', 'description' => 'Temporary removal from duties with or without pay.', 'severity' => 'major', 'points' => 6, 'requires_investigation' => true],
            ['name' => 'Demotion', 'code' => 'DEM', 'description' => 'Reduction in rank, title, or responsibilities.', 'severity' => 'major', 'points' => 7, 'requires_investigation' => true],
            ['name' => 'Termination', 'code' => 'TRM', 'description' => 'Dismissal from employment due to policy violations.', 'severity' => 'critical', 'points' => 10, 'requires_investigation' => true],
            ['name' => 'Probation Extension', 'code' => 'PE', 'description' => 'Extension of probation period with specific performance targets.', 'severity' => 'moderate', 'points' => 3, 'requires_investigation' => false],
            ['name' => 'Performance Improvement Plan', 'code' => 'PIP', 'description' => 'Structured plan with clear goals, timelines, and support for improvement.', 'severity' => 'moderate', 'points' => 3, 'requires_investigation' => false],
        ];

        foreach ($types as $type) {
            DisciplinaryActionType::firstOrCreate(
                ['code' => $type['code']],
                array_merge($type, ['is_active' => true])
            );
        }
    }
}
