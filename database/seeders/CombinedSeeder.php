<?php

namespace Database\Seeders;

use App\Models\Benefit;
use App\Models\Competency;
use App\Models\DocumentCategory;
use App\Models\HRM\AttendanceType;
use App\Models\SafetyTraining;
use App\Models\Skill;
use Illuminate\Database\Seeder;

class CombinedSeeder extends Seeder
{
    /**
     * Seed the application's database with all necessary data.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting combined database seeding...');

        // Clear permission cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create comprehensive roles and permissions
        $this->createRolesAndPermissions();

        // Create admin user and assign roles
        $this->createAdminUser();

        // Create attendance types and rules
        $this->createAttendanceTypes();

        // Seed departments
        $this->call(DepartmentSeeder::class);

        // Seed HRM module data
        $this->createDocumentCategories();
        $this->seedSkillsAndCompetencies();
        $this->seedEmployeeBenefits();
        $this->seedSafetyTrainingCategories();

        $this->command->info('✅ Database seeding completed successfully!');
    }

    /**
     * Create permissions for all modules and roles with proper assignments
     */
    private function createRolesAndPermissions(): void
    {
        $this->command->info('Setting up roles and permissions...');

        // Use the ComprehensiveRolePermissionSeeder directly
        $permissionSeeder = new ComprehensiveRolePermissionSeeder;
        $permissionSeeder->setCommand($this->command);
        $permissionSeeder->run();

        $this->command->info('✅ Comprehensive role and permission system created successfully!');
    }

    /**
     * Create default attendance types and rules
     */
    private function createAttendanceTypes(): void
    {
        $this->command->info('Creating attendance types and rules...');

        // Create all four attendance types if they don't exist
        if (AttendanceType::count() === 0) {
            // 1. Geo Polygon - Multiple location boundaries
            AttendanceType::create([
                'name' => 'Geofence Location',
                'slug' => 'geo_polygon',
                'icon' => '📍',
                'description' => 'Validate attendance using GPS location within defined polygon boundaries. Supports multiple locations.',
                'config' => [
                    'polygons' => [],
                    'validation_mode' => 'any',
                    'allow_without_location' => false,
                ],
                'priority' => 1,
                'is_active' => true,
            ]);

            // 2. WiFi/IP - Multiple office networks
            AttendanceType::create([
                'name' => 'Office Network',
                'slug' => 'wifi_ip',
                'icon' => '📶',
                'description' => 'Validate attendance using office WiFi or IP address. Supports multiple office locations.',
                'config' => [
                    'ip_locations' => [],
                    'validation_mode' => 'any',
                    'allow_without_network' => false,
                ],
                'priority' => 2,
                'is_active' => true,
            ]);

            // 3. Route Waypoint - Multiple routes
            AttendanceType::create([
                'name' => 'Route Tracking',
                'slug' => 'route_waypoint',
                'icon' => '🛣️',
                'description' => 'Validate attendance for field workers on defined routes. Supports multiple routes with tolerance settings.',
                'config' => [
                    'routes' => [],
                    'validation_mode' => 'any',
                    'allow_without_location' => false,
                ],
                'priority' => 3,
                'is_active' => true,
            ]);

            // 4. QR Code - Complete implementation
            AttendanceType::create([
                'name' => 'QR Code',
                'slug' => 'qr_code',
                'icon' => '📱',
                'description' => 'Validate attendance by scanning QR codes at designated locations. Supports time-limited and one-time use codes.',
                'config' => [
                    'qr_codes' => [],
                    'code_expiry_hours' => 24,
                    'one_time_use' => false,
                    'require_location' => false,
                    'max_distance' => 100,
                ],
                'priority' => 4,
                'is_active' => true,
            ]);

            $this->command->info('✅ Created 4 attendance types: Geofence, Office Network, Route Tracking, QR Code');
        } else {
            // Update existing types to new multi-config format if needed
            $this->updateExistingAttendanceTypes();
        }
    }

    /**
     * Update existing attendance types to new multi-config format
     */
    private function updateExistingAttendanceTypes(): void
    {
        $types = AttendanceType::all();

        foreach ($types as $type) {
            $config = $type->config ?? [];
            $needsUpdate = false;

            switch ($type->slug) {
                case 'geo_polygon':
                    if (! isset($config['polygons']) && isset($config['polygon'])) {
                        // Migrate single polygon to array
                        $config = [
                            'polygons' => [
                                [
                                    'id' => 'polygon_1',
                                    'name' => 'Primary Location',
                                    'points' => $config['polygon'],
                                    'is_active' => true,
                                ],
                            ],
                            'validation_mode' => 'any',
                            'allow_without_location' => $config['allow_without_location'] ?? false,
                        ];
                        $needsUpdate = true;
                    }
                    break;

                case 'wifi_ip':
                    if (! isset($config['ip_locations']) && (isset($config['allowed_ips']) || isset($config['allowed_ranges']))) {
                        $config = [
                            'ip_locations' => [
                                [
                                    'id' => 'office_1',
                                    'name' => 'Primary Office',
                                    'allowed_ips' => $config['allowed_ips'] ?? [],
                                    'allowed_ranges' => $config['allowed_ranges'] ?? [],
                                    'is_active' => true,
                                ],
                            ],
                            'validation_mode' => 'any',
                            'allow_without_network' => false,
                        ];
                        $needsUpdate = true;
                    }
                    break;

                case 'route_waypoint':
                case 'route-waypoint':
                    if (! isset($config['routes']) && isset($config['waypoints'])) {
                        $config = [
                            'routes' => [
                                [
                                    'id' => 'route_1',
                                    'name' => 'Primary Route',
                                    'waypoints' => $config['waypoints'],
                                    'tolerance' => $config['tolerance'] ?? 300,
                                    'is_active' => true,
                                ],
                            ],
                            'validation_mode' => 'any',
                            'allow_without_location' => $config['allow_without_location'] ?? false,
                        ];
                        $needsUpdate = true;

                        // Fix slug if needed
                        if ($type->slug === 'route-waypoint') {
                            $type->slug = 'route_waypoint';
                        }
                    }
                    break;
            }

            if ($needsUpdate) {
                $type->update(['config' => $config]);
            }
        }

        // Ensure QR Code type exists
        if (! AttendanceType::where('slug', 'qr_code')->exists()) {
            AttendanceType::create([
                'name' => 'QR Code',
                'slug' => 'qr_code',
                'icon' => '📱',
                'description' => 'Validate attendance by scanning QR codes at designated locations.',
                'config' => [
                    'qr_codes' => [],
                    'code_expiry_hours' => 24,
                    'one_time_use' => false,
                    'require_location' => false,
                    'max_distance' => 100,
                ],
                'priority' => 4,
                'is_active' => true,
            ]);
        }
    }

    /**
     * Create default document categories
     */
    private function createDocumentCategories(): void
    {
        $this->command->info('Creating document categories...');

        $categories = [
            [
                'name' => 'Policies',
                'description' => 'Company policies and regulations',
            ],
            [
                'name' => 'Procedures',
                'description' => 'Standard operating procedures',
            ],
            [
                'name' => 'Forms',
                'description' => 'HR and administrative forms',
            ],
            [
                'name' => 'Templates',
                'description' => 'Document templates for various purposes',
            ],
            [
                'name' => 'Employee Documents',
                'description' => 'General employee document category',
            ],
            [
                'name' => 'Contracts',
                'description' => 'Employment contracts and agreements',
            ],
            [
                'name' => 'Certificates',
                'description' => 'Certifications and official documents',
            ],
            [
                'name' => 'Training Materials',
                'description' => 'Resources for employee training',
            ],
            [
                'name' => 'Onboarding',
                'description' => 'Documents related to employee onboarding',
            ],
            [
                'name' => 'Offboarding',
                'description' => 'Documents related to employee offboarding',
            ],
        ];

        foreach ($categories as $category) {
            DocumentCategory::firstOrCreate(
                ['name' => $category['name']],
                ['description' => $category['description']]
            );
        }
    }

    /**
     * Seed skills and competencies
     */
    private function seedSkillsAndCompetencies(): void
    {
        $this->command->info('Creating skills and competencies...');

        // Seed skills
        $skills = [
            // Technical skills
            ['name' => 'Microsoft Office', 'description' => 'Proficiency in Word, Excel, PowerPoint, etc.', 'category' => 'Software', 'type' => 'technical'],
            ['name' => 'Programming', 'description' => 'Software development and coding', 'category' => 'Software', 'type' => 'technical'],
            ['name' => 'Data Analysis', 'description' => 'Ability to analyze and interpret data', 'category' => 'Analysis', 'type' => 'technical'],
            ['name' => 'Project Management', 'description' => 'Managing projects from initiation to closure', 'category' => 'Management', 'type' => 'technical'],
            ['name' => 'Database Management', 'description' => 'Working with databases and SQL', 'category' => 'Software', 'type' => 'technical'],

            // Soft skills
            ['name' => 'Communication', 'description' => 'Effective verbal and written communication', 'category' => 'Interpersonal', 'type' => 'soft-skill'],
            ['name' => 'Leadership', 'description' => 'Ability to lead and inspire teams', 'category' => 'Management', 'type' => 'soft-skill'],
            ['name' => 'Problem Solving', 'description' => 'Identifying and resolving issues', 'category' => 'Cognitive', 'type' => 'soft-skill'],
            ['name' => 'Teamwork', 'description' => 'Working effectively in team environments', 'category' => 'Interpersonal', 'type' => 'soft-skill'],
            ['name' => 'Time Management', 'description' => 'Efficiently managing time and priorities', 'category' => 'Personal', 'type' => 'soft-skill'],

            // Languages
            ['name' => 'English', 'description' => 'English language proficiency', 'category' => 'Language', 'type' => 'language'],
            ['name' => 'Spanish', 'description' => 'Spanish language proficiency', 'category' => 'Language', 'type' => 'language'],
            ['name' => 'French', 'description' => 'French language proficiency', 'category' => 'Language', 'type' => 'language'],

            // Certifications
            ['name' => 'PMP', 'description' => 'Project Management Professional', 'category' => 'Certification', 'type' => 'certification'],
            ['name' => 'SHRM-CP', 'description' => 'SHRM Certified Professional', 'category' => 'Certification', 'type' => 'certification'],
            ['name' => 'CPA', 'description' => 'Certified Public Accountant', 'category' => 'Certification', 'type' => 'certification'],
        ];

        foreach ($skills as $skill) {
            Skill::firstOrCreate(
                ['name' => $skill['name']],
                $skill
            );
        }

        // Seed competencies
        $competencies = [
            ['name' => 'Strategic Thinking', 'description' => 'Ability to think strategically and long-term', 'category' => 'Leadership', 'level' => 'senior'],
            ['name' => 'People Management', 'description' => 'Managing and developing teams', 'category' => 'Leadership', 'level' => 'senior'],
            ['name' => 'Business Acumen', 'description' => 'Understanding business operations and financials', 'category' => 'Business', 'level' => 'mid'],
            ['name' => 'Technical Expertise', 'description' => 'Advanced knowledge in specific technical areas', 'category' => 'Technical', 'level' => 'expert'],
            ['name' => 'Customer Focus', 'description' => 'Prioritizing customer needs and satisfaction', 'category' => 'Service', 'level' => 'entry'],
            ['name' => 'Innovation', 'description' => 'Creating and implementing new ideas', 'category' => 'Creative', 'level' => 'mid'],
            ['name' => 'Adaptability', 'description' => 'Adjusting effectively to changing conditions', 'category' => 'Personal', 'level' => 'entry'],
            ['name' => 'Decision Making', 'description' => 'Making sound and timely decisions', 'category' => 'Leadership', 'level' => 'senior'],
        ];

        foreach ($competencies as $competency) {
            Competency::firstOrCreate(
                ['name' => $competency['name']],
                $competency
            );
        }
    }

    /**
     * Seed employee benefits
     */
    private function seedEmployeeBenefits(): void
    {
        $this->command->info('Creating employee benefits...');

        $benefits = [
            [
                'name' => 'Health Insurance',
                'description' => 'Comprehensive health insurance coverage',
                'type' => 'health',
                'provider' => 'Example Health Insurance Co.',
                'cost' => 500.00,
                'eligibility_criteria' => 'Full-time employees after 90 days of employment',
                'status' => 'active',
            ],
            [
                'name' => 'Dental Insurance',
                'description' => 'Dental care coverage',
                'type' => 'dental',
                'provider' => 'Example Dental Care',
                'cost' => 100.00,
                'eligibility_criteria' => 'Full-time employees after 90 days of employment',
                'status' => 'active',
            ],
            [
                'name' => 'Vision Insurance',
                'description' => 'Vision care coverage',
                'type' => 'vision',
                'provider' => 'Example Vision Care',
                'cost' => 50.00,
                'eligibility_criteria' => 'Full-time employees after 90 days of employment',
                'status' => 'active',
            ],
            [
                'name' => '401(k) Retirement Plan',
                'description' => 'Retirement savings plan with employer matching',
                'type' => 'retirement',
                'provider' => 'Example Investment Services',
                'cost' => 0.00,
                'eligibility_criteria' => 'All employees after 6 months of employment',
                'status' => 'active',
            ],
            [
                'name' => 'Life Insurance',
                'description' => 'Basic life insurance coverage',
                'type' => 'insurance',
                'provider' => 'Example Life Insurance',
                'cost' => 30.00,
                'eligibility_criteria' => 'Full-time employees',
                'status' => 'active',
            ],
            [
                'name' => 'Gym Membership',
                'description' => 'Subsidized gym membership',
                'type' => 'perks',
                'provider' => 'Various Local Gyms',
                'cost' => 50.00,
                'eligibility_criteria' => 'All employees',
                'status' => 'active',
            ],
            [
                'name' => 'Professional Development',
                'description' => 'Annual budget for courses and conferences',
                'type' => 'perks',
                'provider' => 'Various Educational Providers',
                'cost' => 1000.00,
                'eligibility_criteria' => 'Full-time employees after 1 year',
                'status' => 'active',
            ],
        ];

        foreach ($benefits as $benefit) {
            Benefit::firstOrCreate(
                ['name' => $benefit['name']],
                $benefit
            );
        }
    }

    /**
     * Seed safety training categories
     */
    private function seedSafetyTrainingCategories(): void
    {
        $this->command->info('Creating safety training categories...');

        $trainings = [
            [
                'title' => 'Workplace Safety Orientation',
                'description' => 'Basic safety orientation for all employees',
                'training_type' => 'required',
                'frequency' => 'one-time',
                'duration_minutes' => 60,
                'status' => 'active',
            ],
            [
                'title' => 'Fire Safety Training',
                'description' => 'Training on fire prevention and emergency response',
                'training_type' => 'required',
                'frequency' => 'annual',
                'duration_minutes' => 90,
                'status' => 'active',
            ],
            [
                'title' => 'First Aid & CPR',
                'description' => 'Basic first aid and CPR certification',
                'training_type' => 'recommended',
                'frequency' => 'bi-annual',
                'duration_minutes' => 240,
                'status' => 'active',
            ],
            [
                'title' => 'Ergonomics Training',
                'description' => 'Proper ergonomics to prevent workplace injuries',
                'training_type' => 'recommended',
                'frequency' => 'one-time',
                'duration_minutes' => 60,
                'status' => 'active',
            ],
            [
                'title' => 'Hazard Communication',
                'description' => 'Understanding workplace hazards and safety data sheets',
                'training_type' => 'required',
                'frequency' => 'annual',
                'duration_minutes' => 120,
                'status' => 'active',
            ],
        ];

        foreach ($trainings as $training) {
            SafetyTraining::firstOrCreate(
                ['title' => $training['title']],
                $training
            );
        }
    }

    /**
     * Create admin user and assign super admin role
     */
    private function createAdminUser(): void
    {
        $this->command->info('Creating admin user...');

        // Get the User model
        $userModel = app(\App\Models\User::class);

        // Check if any user exists
        $user = $userModel::first();

        if (! $user) {
            // Create a default admin user
            $user = $userModel::create([
                'name' => 'Test Administrator',
                'email' => 'admin@example.com',
                'password' => bcrypt('password'),
                'user_name' => 'admin',
                'employee_id' => 'EMP001',
            ]);
            $this->command->info('Created admin user: admin@example.com / password');
        }

        // Get the Super Administrator role
        $superAdminRole = \Spatie\Permission\Models\Role::where('name', 'Super Administrator')->first();

        if ($superAdminRole) {
            // Check if the user already has the role
            if (! $user->hasRole('Super Administrator')) {
                $user->assignRole($superAdminRole);
                $this->command->info("Assigned Super Administrator role to user: {$user->email}");
            } else {
                $this->command->info("User {$user->email} already has Super Administrator role");
            }
        } else {
            $this->command->warn('Super Administrator role not found.');
        }
    }
}
