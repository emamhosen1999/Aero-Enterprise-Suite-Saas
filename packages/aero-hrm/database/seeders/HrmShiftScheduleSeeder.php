<?php

namespace Aero\HRM\Database\Seeders;

use Aero\HRM\Models\ShiftSchedule;
use Illuminate\Database\Seeder;

class HrmShiftScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

        $shifts = [
            [
                'name' => 'General Shift',
                'code' => 'GEN',
                'start_time' => '09:00',
                'end_time' => '17:00',
                'break_duration' => 60,
                'grace_period' => 15,
                'working_days' => $weekdays,
            ],
            [
                'name' => 'Morning Shift',
                'code' => 'MRN',
                'start_time' => '06:00',
                'end_time' => '14:00',
                'break_duration' => 45,
                'grace_period' => 10,
                'working_days' => $weekdays,
            ],
            [
                'name' => 'Afternoon Shift',
                'code' => 'AFT',
                'start_time' => '14:00',
                'end_time' => '22:00',
                'break_duration' => 45,
                'grace_period' => 10,
                'working_days' => $weekdays,
            ],
            [
                'name' => 'Night Shift',
                'code' => 'NGT',
                'start_time' => '22:00',
                'end_time' => '06:00',
                'break_duration' => 60,
                'grace_period' => 15,
                'working_days' => $weekdays,
            ],
            [
                'name' => 'Flexible Shift',
                'code' => 'FLX',
                'start_time' => '08:00',
                'end_time' => '16:00',
                'break_duration' => 60,
                'grace_period' => 30,
                'working_days' => $weekdays,
            ],
        ];

        foreach ($shifts as $shift) {
            ShiftSchedule::firstOrCreate(
                ['code' => $shift['code']],
                array_merge($shift, ['is_active' => true])
            );
        }
    }
}
