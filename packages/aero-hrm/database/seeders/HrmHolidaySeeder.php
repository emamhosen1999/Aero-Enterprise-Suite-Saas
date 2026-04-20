<?php

namespace Aero\HRM\Database\Seeders;

use Aero\HRM\Models\Holiday;
use Illuminate\Database\Seeder;

class HrmHolidaySeeder extends Seeder
{
    public function run(): void
    {
        $year = now()->year;

        $holidays = [
            [
                'title' => 'New Year\'s Day',
                'date' => "{$year}-01-01",
                'type' => 'public',
                'description' => 'Celebration of the new calendar year.',
                'is_recurring' => true,
            ],
            [
                'title' => 'Labor Day',
                'date' => "{$year}-05-01",
                'type' => 'public',
                'description' => 'International Workers\' Day.',
                'is_recurring' => true,
            ],
            [
                'title' => 'Independence Day',
                'date' => "{$year}-07-04",
                'type' => 'public',
                'description' => 'National independence celebration.',
                'is_recurring' => true,
            ],
            [
                'title' => 'Eid Al Fitr',
                'date' => "{$year}-04-10",
                'type' => 'religious',
                'description' => 'Celebration marking the end of Ramadan.',
                'is_recurring' => false,
            ],
            [
                'title' => 'Eid Al Adha',
                'date' => "{$year}-06-17",
                'type' => 'religious',
                'description' => 'Festival of Sacrifice.',
                'is_recurring' => false,
            ],
            [
                'title' => 'National Day',
                'date' => "{$year}-12-02",
                'type' => 'public',
                'description' => 'National day celebration.',
                'is_recurring' => true,
            ],
            [
                'title' => 'Christmas Day',
                'date' => "{$year}-12-25",
                'type' => 'public',
                'description' => 'Christmas holiday.',
                'is_recurring' => true,
            ],
        ];

        foreach ($holidays as $holiday) {
            Holiday::firstOrCreate(
                ['title' => $holiday['title'], 'date' => $holiday['date']],
                array_merge($holiday, ['is_active' => true])
            );
        }
    }
}
