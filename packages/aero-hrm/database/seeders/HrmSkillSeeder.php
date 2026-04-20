<?php

namespace Aero\HRM\Database\Seeders;

use Aero\HRM\Models\Skill;
use Illuminate\Database\Seeder;

class HrmSkillSeeder extends Seeder
{
    public function run(): void
    {
        $skills = [
            ['name' => 'JavaScript', 'category' => 'technical', 'type' => 'technical', 'description' => 'Frontend and backend JavaScript programming.'],
            ['name' => 'Python', 'category' => 'technical', 'type' => 'technical', 'description' => 'Python programming for web, data science, and automation.'],
            ['name' => 'PHP', 'category' => 'technical', 'type' => 'technical', 'description' => 'Server-side PHP development.'],
            ['name' => 'Laravel', 'category' => 'technical', 'type' => 'technical', 'description' => 'Laravel framework for PHP web applications.'],
            ['name' => 'React', 'category' => 'technical', 'type' => 'technical', 'description' => 'React.js library for building user interfaces.'],
            ['name' => 'Project Management', 'category' => 'soft_skill', 'type' => 'soft-skill', 'description' => 'Planning, executing, and closing projects effectively.'],
            ['name' => 'Leadership', 'category' => 'soft_skill', 'type' => 'soft-skill', 'description' => 'Guiding teams, decision-making, and inspiring others.'],
            ['name' => 'Communication', 'category' => 'soft_skill', 'type' => 'soft-skill', 'description' => 'Verbal and written communication skills.'],
            ['name' => 'Problem Solving', 'category' => 'soft_skill', 'type' => 'soft-skill', 'description' => 'Analytical thinking and creative problem resolution.'],
            ['name' => 'Data Analysis', 'category' => 'technical', 'type' => 'technical', 'description' => 'Statistical analysis, data visualization, and interpretation.'],
            ['name' => 'SQL', 'category' => 'technical', 'type' => 'technical', 'description' => 'Database querying and management with SQL.'],
            ['name' => 'DevOps', 'category' => 'technical', 'type' => 'technical', 'description' => 'CI/CD pipelines, infrastructure automation, and deployment.'],
            ['name' => 'Cloud Computing', 'category' => 'technical', 'type' => 'technical', 'description' => 'AWS, Azure, GCP cloud services and architecture.'],
            ['name' => 'UI/UX Design', 'category' => 'technical', 'type' => 'technical', 'description' => 'User interface design and user experience research.'],
            ['name' => 'Agile/Scrum', 'category' => 'soft_skill', 'type' => 'soft-skill', 'description' => 'Agile methodology, Scrum framework, and sprint management.'],
        ];

        foreach ($skills as $skill) {
            Skill::firstOrCreate(
                ['name' => $skill['name']],
                array_merge($skill, ['status' => 'active'])
            );
        }
    }
}
