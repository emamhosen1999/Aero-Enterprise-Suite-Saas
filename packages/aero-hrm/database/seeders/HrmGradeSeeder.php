<?php

namespace Aero\HRM\Database\Seeders;

use Aero\HRM\Models\Grade;
use Illuminate\Database\Seeder;

class HrmGradeSeeder extends Seeder
{
    public function run(): void
    {
        $grades = [
            ['name' => 'Grade 1', 'code' => 'G01', 'level' => 1, 'min_salary' => 15000.00, 'max_salary' => 25000.00, 'description' => 'Entry level — Interns and trainees.'],
            ['name' => 'Grade 2', 'code' => 'G02', 'level' => 2, 'min_salary' => 25000.00, 'max_salary' => 40000.00, 'description' => 'Junior level — Associates and junior staff.'],
            ['name' => 'Grade 3', 'code' => 'G03', 'level' => 3, 'min_salary' => 40000.00, 'max_salary' => 60000.00, 'description' => 'Mid level — Engineers, analysts, and specialists.'],
            ['name' => 'Grade 4', 'code' => 'G04', 'level' => 4, 'min_salary' => 60000.00, 'max_salary' => 85000.00, 'description' => 'Senior level — Senior engineers and senior analysts.'],
            ['name' => 'Grade 5', 'code' => 'G05', 'level' => 5, 'min_salary' => 85000.00, 'max_salary' => 120000.00, 'description' => 'Lead level — Team leads and managers.'],
            ['name' => 'Grade 6', 'code' => 'G06', 'level' => 6, 'min_salary' => 120000.00, 'max_salary' => 170000.00, 'description' => 'Senior management — Senior managers and directors.'],
            ['name' => 'Grade 7', 'code' => 'G07', 'level' => 7, 'min_salary' => 170000.00, 'max_salary' => 250000.00, 'description' => 'Executive level — Vice presidents and heads.'],
            ['name' => 'Grade 8', 'code' => 'G08', 'level' => 8, 'min_salary' => 250000.00, 'max_salary' => 500000.00, 'description' => 'C-Suite — Chief officers and executive leadership.'],
        ];

        foreach ($grades as $grade) {
            Grade::firstOrCreate(
                ['code' => $grade['code']],
                array_merge($grade, ['is_active' => true])
            );
        }
    }
}
