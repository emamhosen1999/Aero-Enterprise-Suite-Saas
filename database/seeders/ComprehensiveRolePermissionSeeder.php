<?php

namespace Database\Seeders;

use Illuminate\Console\Command;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ComprehensiveRolePermissionSeeder extends Seeder
{
    /**
     * The command instance.
     *
     * @var Command
     */
    protected $command;

    /**
     * Set the console command instance.
     *
     * @return void
     */
    public function setCommand(Command $command)
    {
        $this->command = $command;

        return $this;
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions for all modules
        $this->createPermissions();

        // Create roles with hierarchy
        $this->createRoles();

        // Assign permissions to roles
        $this->assignPermissionsToRoles();

        if ($this->command) {
            $this->command->info('✅ Comprehensive role and permission system created successfully!');
        }
    }

    /**
     * Create all permissions based on modules
     */
    private function createPermissions(): void
    {
        $modules = [
            // Core System
            'core' => [
                'core.dashboard.view' => 'View dashboard and analytics',
                'core.stats.view' => 'View system statistics',
                'core.updates.view' => 'View system updates',
            ],

            // Self Service Module
            'self-service' => [
                'attendance.own.view' => 'View own attendance records',
                'attendance.own.punch' => 'Punch in/out attendance',
                'leave.own.view' => 'View own leave requests',
                'leave.own.create' => 'Create own leave requests',
                'leave.own.update' => 'Update own leave requests',
                'leave.own.delete' => 'Delete own leave requests',
                'communications.own.view' => 'View own communications',
                'profile.own.view' => 'View own profile',
                'profile.own.update' => 'Update own profile',
                'profile.password.change' => 'Change own password',
            ],

            // Human Resource Management
            'hrm' => [
                'employees.view' => 'View employee records',
                'employees.create' => 'Create employee records',
                'employees.update' => 'Update employee records',
                'employees.delete' => 'Delete employee records',
                'employees.import' => 'Import employee data',
                'employees.export' => 'Export employee data',
                'departments.view' => 'View departments',
                'departments.create' => 'Create departments',
                'departments.update' => 'Update departments',
                'departments.delete' => 'Delete departments',
                'designations.view' => 'View designations/positions',
                'designations.create' => 'Create designations',
                'designations.update' => 'Update designations',
                'designations.delete' => 'Delete designations',
                'attendance.view' => 'View all attendance records',
                'attendance.create' => 'Create attendance records',
                'attendance.update' => 'Update attendance records',
                'attendance.delete' => 'Delete attendance records',
                'attendance.import' => 'Import attendance data',
                'attendance.export' => 'Export attendance data',
                'holidays.view' => 'View holidays',
                'holidays.create' => 'Create holidays',
                'holidays.update' => 'Update holidays',
                'holidays.delete' => 'Delete holidays',
                'leaves.view' => 'View all leave requests',
                'leaves.create' => 'Create leave requests',
                'leaves.update' => 'Update leave requests',
                'leaves.delete' => 'Delete leave requests',
                'leaves.approve' => 'Approve/reject leave requests',
                'leaves.analytics' => 'View leave analytics',
                'leave-settings.view' => 'View leave policy settings',
                'leave-settings.update' => 'Update leave policy settings',
                'jurisdiction.view' => 'View work locations',
                'jurisdiction.create' => 'Create work locations',
                'jurisdiction.update' => 'Update work locations',
                'jurisdiction.delete' => 'Delete work locations',

                // New HRM Permissions
                // Onboarding & Offboarding
                'hr.onboarding.view' => 'View employee onboarding',
                'hr.onboarding.create' => 'Create onboarding process',
                'hr.onboarding.update' => 'Update onboarding process',
                'hr.onboarding.delete' => 'Delete onboarding process',
                'hr.offboarding.view' => 'View employee offboarding',
                'hr.offboarding.create' => 'Create offboarding process',
                'hr.offboarding.update' => 'Update offboarding process',
                'hr.offboarding.delete' => 'Delete offboarding process',
                'hr.checklists.view' => 'View HR checklists',
                'hr.checklists.create' => 'Create HR checklists',
                'hr.checklists.update' => 'Update HR checklists',
                'hr.checklists.delete' => 'Delete HR checklists',

                // Skills & Competency Management
                'hr.skills.view' => 'View skills database',
                'hr.skills.create' => 'Create skills',
                'hr.skills.update' => 'Update skills',
                'hr.skills.delete' => 'Delete skills',
                'hr.competencies.view' => 'View competencies',
                'hr.competencies.create' => 'Create competencies',
                'hr.competencies.update' => 'Update competencies',
                'hr.competencies.delete' => 'Delete competencies',
                'hr.employee.skills.view' => 'View employee skills',
                'hr.employee.skills.create' => 'Add employee skills',
                'hr.employee.skills.update' => 'Update employee skills',
                'hr.employee.skills.delete' => 'Remove employee skills',

                // Employee Benefits Administration
                'hr.benefits.view' => 'View benefits programs',
                'hr.benefits.create' => 'Create benefits programs',
                'hr.benefits.update' => 'Update benefits programs',
                'hr.benefits.delete' => 'Delete benefits programs',
                'hr.employee.benefits.view' => 'View employee benefits',
                'hr.employee.benefits.assign' => 'Assign benefits to employees',
                'hr.employee.benefits.update' => 'Update employee benefits',
                'hr.employee.benefits.remove' => 'Remove employee benefits',

                // Enhanced Time-off Management
                'hr.timeoff.view' => 'View time-off management',
                'hr.timeoff.calendar.view' => 'View time-off calendar',
                'hr.timeoff.approve' => 'Approve time-off requests',
                'hr.timeoff.reject' => 'Reject time-off requests',
                'hr.timeoff.reports.view' => 'View time-off reports',
                'hr.timeoff.settings.view' => 'View time-off settings',
                'hr.timeoff.settings.update' => 'Update time-off settings',

                // Workplace Health & Safety
                'hr.safety.view' => 'View workplace safety',
                'hr.safety.incidents.view' => 'View safety incidents',
                'hr.safety.incidents.create' => 'Create safety incidents',
                'hr.safety.incidents.update' => 'Update safety incidents',
                'hr.safety.inspections.view' => 'View safety inspections',
                'hr.safety.inspections.create' => 'Create safety inspections',
                'hr.safety.inspections.update' => 'Update safety inspections',
                'hr.safety.training.view' => 'View safety training',
                'hr.safety.training.create' => 'Create safety training',
                'hr.safety.training.update' => 'Update safety training',

                // HR Analytics & Reporting
                'hr.analytics.view' => 'View HR analytics',
                'hr.analytics.attendance' => 'View attendance analytics',
                'hr.analytics.performance' => 'View performance analytics',
                'hr.analytics.recruitment' => 'View recruitment analytics',
                'hr.analytics.turnover' => 'View employee turnover analytics',
                'hr.analytics.training' => 'View training analytics',
                'hr.analytics.reports.view' => 'View HR reports',
                'hr.analytics.reports.generate' => 'Generate HR reports',

                // HR Document Management
                'hr.documents.view' => 'View HR documents',
                'hr.documents.create' => 'Create HR documents',
                'hr.documents.update' => 'Update HR documents',
                'hr.documents.delete' => 'Delete HR documents',
                'hr.documents.categories.view' => 'View document categories',
                'hr.documents.categories.create' => 'Create document categories',
                'hr.documents.categories.update' => 'Update document categories',
                'hr.documents.categories.delete' => 'Delete document categories',
                'hr.employee.documents.view' => 'View employee documents',
                'hr.employee.documents.create' => 'Create employee documents',
                'hr.employee.documents.delete' => 'Delete employee documents',

                // Enhanced Employee Self-Service
                'hr.selfservice.view' => 'Access self-service portal',
                'hr.selfservice.profile.view' => 'View own profile in self-service',
                'hr.selfservice.profile.update' => 'Update own profile in self-service',
                'hr.selfservice.documents.view' => 'View own documents in self-service',
                'hr.selfservice.benefits.view' => 'View own benefits in self-service',
                'hr.selfservice.timeoff.view' => 'View own time-off in self-service',
                'hr.selfservice.timeoff.request' => 'Request time-off in self-service',
                'hr.selfservice.trainings.view' => 'View own trainings in self-service',
                'hr.selfservice.payslips.view' => 'View own payslips in self-service',
                'hr.selfservice.performance.view' => 'View own performance in self-service',

                // Payroll Management System
                'hr.payroll.view' => 'View payroll records',
                'hr.payroll.create' => 'Create payroll records',
                'hr.payroll.update' => 'Update payroll records',
                'hr.payroll.delete' => 'Delete payroll records',
                'hr.payroll.process' => 'Process payroll records',
                'hr.payroll.bulk' => 'Bulk payroll operations',
                'hr.payslips.view' => 'View payslips',
                'hr.payslips.download' => 'Download payslips',
                'hr.payslips.email' => 'Email payslips',
                'hr.payroll.reports' => 'View payroll reports',
                'hr.payroll.analytics' => 'View payroll analytics',
            ],

            // Project & Portfolio Management
            'ppm' => [
                'daily-works.view' => 'View work logs',
                'daily-works.create' => 'Create work logs',
                'daily-works.update' => 'Update work logs',
                'daily-works.delete' => 'Delete work logs',
                'daily-works.import' => 'Import work log data',
                'daily-works.export' => 'Export work log data',
                'projects.analytics' => 'View project analytics',
                'tasks.view' => 'View tasks',
                'tasks.create' => 'Create tasks',
                'tasks.update' => 'Update tasks',
                'tasks.delete' => 'Delete tasks',
                'tasks.assign' => 'Assign tasks',
                'reports.view' => 'View reports',
                'reports.create' => 'Create reports',
                'reports.update' => 'Update reports',
                'reports.delete' => 'Delete reports',
            ],

            // HR Performance Management
            'performance' => [
                'performance-reviews.view' => 'View performance reviews',
                'performance-reviews.create' => 'Create performance reviews',
                'performance-reviews.update' => 'Update performance reviews',
                'performance-reviews.delete' => 'Delete performance reviews',
                'performance-reviews.approve' => 'Approve/reject performance reviews',
                'performance-reviews.own.view' => 'View own performance reviews',
                'performance-reviews.own.create' => 'Create own performance reviews',
                'performance-reviews.own.update' => 'Update own performance reviews',
                'performance-templates.view' => 'View performance review templates',
                'performance-templates.create' => 'Create performance review templates',
                'performance-templates.update' => 'Update performance review templates',
                'performance-templates.delete' => 'Delete performance review templates',
                'performance-analytics.view' => 'View performance analytics',
            ],

            // HR Training Management
            'training' => [
                'training-sessions.view' => 'View training sessions',
                'training-sessions.create' => 'Create training sessions',
                'training-sessions.update' => 'Update training sessions',
                'training-sessions.delete' => 'Delete training sessions',
                'training-categories.view' => 'View training categories',
                'training-categories.create' => 'Create training categories',
                'training-categories.update' => 'Update training categories',
                'training-categories.delete' => 'Delete training categories',
                'training-materials.view' => 'View training materials',
                'training-materials.create' => 'Create training materials',
                'training-materials.update' => 'Update training materials',
                'training-materials.delete' => 'Delete training materials',
                'training-enrollments.view' => 'View training enrollments',
                'training-enrollments.create' => 'Create training enrollments',
                'training-enrollments.update' => 'Update training enrollments',
                'training-enrollments.delete' => 'Delete training enrollments',
                'training-assignments.view' => 'View training assignments',
                'training-assignments.create' => 'Create training assignments',
                'training-assignments.update' => 'Update training assignments',
                'training-assignments.delete' => 'Delete training assignments',
                'training-assignment-submissions.view' => 'View training assignment submissions',
                'training-assignment-submissions.create' => 'Create training assignment submissions',
                'training-assignment-submissions.update' => 'Update training assignment submissions',
                'training-assignment-submissions.grade' => 'Grade training assignment submissions',
                'training-feedback.view' => 'View training feedback',
                'training-feedback.create' => 'Create training feedback',
                'training-feedback.own.view' => 'View own training enrollments',
                'training-feedback.own.create' => 'Create own training feedback',
                'training-analytics.view' => 'View training analytics',
            ],

            // HR Recruitment Management
            'recruitment' => [
                'jobs.view' => 'View job postings',
                'jobs.create' => 'Create job postings',
                'jobs.update' => 'Update job postings',
                'jobs.delete' => 'Delete job postings',
                'job-applications.view' => 'View job applications',
                'job-applications.create' => 'Create job applications',
                'job-applications.update' => 'Update job applications',
                'job-applications.delete' => 'Delete job applications',
                'job-hiring-stages.view' => 'View job hiring stages',
                'job-hiring-stages.create' => 'Create job hiring stages',
                'job-hiring-stages.update' => 'Update job hiring stages',
                'job-hiring-stages.delete' => 'Delete job hiring stages',
                'job-interviews.view' => 'View job interviews',
                'job-interviews.create' => 'Create job interviews',
                'job-interviews.update' => 'Update job interviews',
                'job-interviews.delete' => 'Delete job interviews',
                'job-interview-feedback.view' => 'View job interview feedback',
                'job-interview-feedback.create' => 'Create job interview feedback',
                'job-interview-feedback.update' => 'Update job interview feedback',
                'job-offers.view' => 'View job offers',
                'job-offers.create' => 'Create job offers',
                'job-offers.update' => 'Update job offers',
                'job-offers.delete' => 'Delete job offers',
                'job-offers.approve' => 'Approve job offers',
                'recruitment-analytics.view' => 'View recruitment analytics',
            ],

            // Document & Knowledge Management
            'dms' => [
                'letters.view' => 'View official correspondence',
                'letters.create' => 'Create official correspondence',
                'letters.update' => 'Update official correspondence',
                'letters.delete' => 'Delete official correspondence',
                'documents.view' => 'View documents',
                'documents.create' => 'Create documents',
                'documents.update' => 'Update documents',
                'documents.delete' => 'Delete documents',
            ],

            // Customer Relationship Management (Future)
            'crm' => [
                'customers.view' => 'View customer records',
                'customers.create' => 'Create customer records',
                'customers.update' => 'Update customer records',
                'customers.delete' => 'Delete customer records',
                'leads.view' => 'View leads and opportunities',
                'leads.create' => 'Create leads',
                'leads.update' => 'Update leads',
                'leads.delete' => 'Delete leads',
                'feedback.view' => 'View customer feedback',
                'feedback.create' => 'Create feedback records',
                'feedback.update' => 'Update feedback',
                'feedback.delete' => 'Delete feedback',
            ],

            // Supply Chain & Inventory Management (Future)
            'scm' => [
                'inventory.view' => 'View inventory',
                'inventory.create' => 'Create inventory items',
                'inventory.update' => 'Update inventory',
                'inventory.delete' => 'Delete inventory items',
                'suppliers.view' => 'View suppliers',
                'suppliers.create' => 'Create supplier records',
                'suppliers.update' => 'Update suppliers',
                'suppliers.delete' => 'Delete suppliers',
                'purchase-orders.view' => 'View purchase orders',
                'purchase-orders.create' => 'Create purchase orders',
                'purchase-orders.update' => 'Update purchase orders',
                'purchase-orders.delete' => 'Delete purchase orders',
                'warehousing.view' => 'View warehouse operations',
                'warehousing.manage' => 'Manage warehouse operations',
            ],

            // Retail & Sales Operations (Future)
            'retail' => [
                'pos.view' => 'View point of sale',
                'pos.operate' => 'Operate POS terminal',
                'sales.view' => 'View sales records',
                'sales.create' => 'Create sales transactions',
                'sales.analytics' => 'View sales analytics',
            ],

            // Financial Management & Accounting (Future)
            'finance' => [
                'accounts-payable.view' => 'View accounts payable',
                'accounts-payable.manage' => 'Manage accounts payable',
                'accounts-receivable.view' => 'View accounts receivable',
                'accounts-receivable.manage' => 'Manage accounts receivable',
                'ledger.view' => 'View general ledger',
                'ledger.manage' => 'Manage general ledger',
                'financial-reports.view' => 'View financial reports',
                'financial-reports.create' => 'Create financial reports',
            ],

            // System Administration
            'admin' => [
                'users.view' => 'View user accounts',
                'users.create' => 'Create user accounts',
                'users.update' => 'Update user accounts',
                'users.delete' => 'Delete user accounts',
                'users.impersonate' => 'Impersonate other users',
                'roles.view' => 'View roles and permissions',
                'roles.create' => 'Create roles',
                'roles.update' => 'Update roles',
                'roles.delete' => 'Delete roles',
                'permissions.assign' => 'Assign permissions to roles',
                'settings.view' => 'View system settings',
                'settings.update' => 'Update system settings',
                'company.settings' => 'Manage company settings',
                'attendance.settings' => 'Manage attendance settings',
                'email.settings' => 'Manage email settings',
                'notification.settings' => 'Manage notification settings',
                'theme.settings' => 'Manage theme and branding',
                'localization.settings' => 'Manage localization settings',
                'performance.settings' => 'Manage performance settings',
                'approval.settings' => 'Manage approval workflows',
                'invoice.settings' => 'Manage invoice settings',
                'salary.settings' => 'Manage salary settings',
                'system.settings' => 'Manage system architecture',
                'audit.view' => 'View audit logs',
                'audit.export' => 'Export audit data',
                'backup.create' => 'Create system backups',
                'backup.restore' => 'Restore system backups',
            ],

            // Compliance Management
            'compliance' => [
                'compliance.view' => 'Access compliance module',
                'compliance.dashboard.view' => 'View compliance dashboard',
                'compliance.documents.view' => 'View compliance documents',
                'compliance.documents.create' => 'Create compliance documents',
                'compliance.documents.update' => 'Update compliance documents',
                'compliance.documents.delete' => 'Delete compliance documents',
                'compliance.audits.view' => 'View compliance audits',
                'compliance.audits.create' => 'Create compliance audits',
                'compliance.audits.update' => 'Update compliance audits',
                'compliance.audits.delete' => 'Delete compliance audits',
                'compliance.requirements.view' => 'View compliance requirements',
                'compliance.requirements.create' => 'Create compliance requirements',
                'compliance.requirements.update' => 'Update compliance requirements',
                'compliance.requirements.delete' => 'Delete compliance requirements',
                'compliance.settings' => 'Manage compliance settings',
            ],

            // Quality Management
            'quality' => [
                'quality.view' => 'Access quality control module',
                'quality.dashboard.view' => 'View quality dashboard',
                'quality.inspections.view' => 'View quality inspections',
                'quality.inspections.create' => 'Create quality inspections',
                'quality.inspections.update' => 'Update quality inspections',
                'quality.inspections.delete' => 'Delete quality inspections',
                'quality.ncr.view' => 'View non-conformance reports',
                'quality.ncr.create' => 'Create non-conformance reports',
                'quality.ncr.update' => 'Update non-conformance reports',
                'quality.ncr.delete' => 'Delete non-conformance reports',
                'quality.calibrations.view' => 'View equipment calibrations',
                'quality.calibrations.create' => 'Create equipment calibrations',
                'quality.calibrations.update' => 'Update equipment calibrations',
                'quality.calibrations.delete' => 'Delete equipment calibrations',
                'quality.settings' => 'Manage quality control settings',
            ],

            // Analytics & Business Intelligence
            'analytics' => [
                'analytics.view' => 'Access analytics module',
                'analytics.reports.view' => 'View analytics reports',
                'analytics.reports.create' => 'Create analytics reports',
                'analytics.reports.update' => 'Update analytics reports',
                'analytics.reports.delete' => 'Delete analytics reports',
                'analytics.reports.schedule' => 'Schedule analytics reports',
                'analytics.dashboards.view' => 'View analytics dashboards',
                'analytics.dashboards.create' => 'Create analytics dashboards',
                'analytics.dashboards.update' => 'Update analytics dashboards',
                'analytics.dashboards.delete' => 'Delete analytics dashboards',
                'analytics.kpi.view' => 'View key performance indicators',
                'analytics.kpi.create' => 'Create key performance indicators',
                'analytics.kpi.update' => 'Update key performance indicators',
                'analytics.kpi.delete' => 'Delete key performance indicators',
                'analytics.kpi.log' => 'Log KPI values',
                'analytics.settings' => 'Manage analytics settings',
            ],

            // Project Management (Extended)
            'project-management' => [
                'project-management.view' => 'Access project management module',
                'project-management.dashboard.view' => 'View project management dashboard',
                'project-management.projects.view' => 'View projects',
                'project-management.projects.create' => 'Create projects',
                'project-management.projects.update' => 'Update projects',
                'project-management.projects.delete' => 'Delete projects',
                'project-management.milestones.view' => 'View project milestones',
                'project-management.milestones.create' => 'Create project milestones',
                'project-management.milestones.update' => 'Update project milestones',
                'project-management.milestones.delete' => 'Delete project milestones',
                'project-management.tasks.view' => 'View project tasks',
                'project-management.tasks.create' => 'Create project tasks',
                'project-management.tasks.update' => 'Update project tasks',
                'project-management.tasks.delete' => 'Delete project tasks',
                'project-management.tasks.assign' => 'Assign project tasks',
                'project-management.resources.view' => 'View project resources',
                'project-management.resources.assign' => 'Assign project resources',
                'project-management.issues.view' => 'View project issues',
                'project-management.issues.create' => 'Create project issues',
                'project-management.issues.update' => 'Update project issues',
                'project-management.issues.delete' => 'Delete project issues',
                'project-management.reports.view' => 'View project reports',
                'project-management.settings' => 'Manage project settings',
            ],

            // Learning Management System (LMS)
            'lms' => [
                'lms.view' => 'View LMS dashboard',

                // Course Management
                'lms.courses.view' => 'View courses',
                'lms.courses.create' => 'Create courses',
                'lms.courses.update' => 'Update courses',
                'lms.courses.delete' => 'Delete courses',

                // Student Management
                'lms.students.view' => 'View students',
                'lms.students.create' => 'Enroll students',
                'lms.students.update' => 'Update student records',
                'lms.students.delete' => 'Remove students',

                // Instructor Management
                'lms.instructors.view' => 'View instructors',
                'lms.instructors.create' => 'Add instructors',
                'lms.instructors.update' => 'Update instructor records',
                'lms.instructors.delete' => 'Remove instructors',

                // Assessment Management
                'lms.assessments.view' => 'View assessments',
                'lms.assessments.create' => 'Create assessments',
                'lms.assessments.update' => 'Update assessments',
                'lms.assessments.delete' => 'Delete assessments',

                // Certificate Management
                'lms.certificates.view' => 'View certificates',
                'lms.certificates.create' => 'Issue certificates',
                'lms.certificates.update' => 'Update certificates',
                'lms.certificates.delete' => 'Revoke certificates',

                // Reports and Analytics
                'lms.reports.view' => 'View LMS reports',

                // Settings
                'lms.settings.manage' => 'Manage LMS settings',
            ],
        ];

        foreach ($modules as $module => $permissions) {
            foreach ($permissions as $permissionName => $description) {
                Permission::firstOrCreate([
                    'name' => $permissionName,
                    'guard_name' => 'web',
                ], [
                    'module' => $module,
                    'description' => $description,
                ]);
            }
        }

        if ($this->command) {
            $this->command->info('✅ Permissions created for all modules');
        }
    }

    /**
     * Create roles with hierarchy levels
     */
    private function createRoles(): void
    {
        $roles = [
            [
                'name' => 'Super Administrator',
                'description' => 'Full system access with all privileges',
                'hierarchy_level' => 1,
                'is_system_role' => true,
            ],
            [
                'name' => 'Administrator',
                'description' => 'Administrative access to most system functions',
                'hierarchy_level' => 10,
                'is_system_role' => true,
            ],
            [
                'name' => 'HR Manager',
                'description' => 'Human resources management and employee operations',
                'hierarchy_level' => 20,
                'is_system_role' => false,
            ],
            [
                'name' => 'Project Manager',
                'description' => 'Project and portfolio management capabilities',
                'hierarchy_level' => 20,
                'is_system_role' => false,
            ],
            [
                'name' => 'Department Manager',
                'description' => 'Departmental management and team oversight',
                'hierarchy_level' => 30,
                'is_system_role' => false,
            ],
            [
                'name' => 'Team Lead',
                'description' => 'Team leadership and basic management functions',
                'hierarchy_level' => 40,
                'is_system_role' => false,
            ],
            [
                'name' => 'Senior Employee',
                'description' => 'Senior level employee with extended access',
                'hierarchy_level' => 50,
                'is_system_role' => false,
            ],
            [
                'name' => 'Employee',
                'description' => 'Standard employee access to self-service functions',
                'hierarchy_level' => 60,
                'is_system_role' => false,
            ],
            [
                'name' => 'Contractor',
                'description' => 'Limited access for contractors and temporary staff',
                'hierarchy_level' => 70,
                'is_system_role' => false,
            ],
            [
                'name' => 'Intern',
                'description' => 'Basic access for interns and trainees',
                'hierarchy_level' => 80,
                'is_system_role' => false,
            ],
        ];

        foreach ($roles as $roleData) {
            Role::firstOrCreate([
                'name' => $roleData['name'],
                'guard_name' => 'web',
            ], $roleData);
        }

        if ($this->command) {
            $this->command->info('✅ Roles created with hierarchy levels');
        }
    }

    /**
     * Assign permissions to roles based on hierarchy and responsibility
     */
    private function assignPermissionsToRoles(): void
    {
        // Super Administrator - All permissions
        $superAdmin = Role::findByName('Super Administrator');
        $superAdmin->givePermissionTo(Permission::all());

        // Administrator - Most permissions except super admin functions
        $admin = Role::findByName('Administrator');
        $adminPermissions = Permission::whereNotIn('name', [
            'users.impersonate',
            'backup.create',
            'backup.restore',
        ])->get();
        $admin->givePermissionTo($adminPermissions);

        // HR Manager - HR and employee management
        $hrManager = Role::findByName('HR Manager');
        $hrPermissions = Permission::whereIn('module', ['core', 'self-service', 'hrm', 'dms', 'performance', 'training', 'recruitment'])
            ->orWhere('name', 'like', 'users.%')
            ->orWhere('name', 'like', 'settings.%')
            ->orWhere('name', 'like', 'company.%')
            ->orWhere('name', 'like', 'attendance.%')
            ->orWhere('name', 'like', 'leave-%')
            ->orWhere('name', 'like', 'performance-%')
            ->orWhere('name', 'like', 'training-%')
            ->orWhere('name', 'like', 'jobs.%')
            ->orWhere('name', 'like', 'job-%')
            ->orWhere('name', 'like', 'recruitment-%')
            ->orWhere('name', 'like', 'hr.%') // Include all new HR permissions
            ->get();
        $hrManager->givePermissionTo($hrPermissions);

        // Project Manager - Project and portfolio management
        $projectManager = Role::findByName('Project Manager');
        $projectPermissions = Permission::whereIn('module', ['core', 'self-service', 'ppm', 'dms'])
            ->orWhere('name', 'like', 'employees.view')
            ->orWhere('name', 'like', 'departments.view')
            ->orWhere('name', 'like', 'designations.view')
            ->get();
        $projectManager->givePermissionTo($projectPermissions);

        // Department Manager - Departmental oversight
        $deptManager = Role::findByName('Department Manager');
        $deptPermissions = Permission::whereIn('module', ['core', 'self-service', 'ppm'])
            ->orWhereIn('name', [
                'employees.view',
                'employees.update',
                'attendance.view',
                'attendance.create',
                'leaves.view',
                'leaves.approve',
                'departments.view',
                'designations.view',
                'performance-reviews.view',
                'performance-reviews.create',
                'performance-reviews.update',
                'performance-reviews.approve',
                'performance-analytics.view',
                'hr.onboarding.view',
                'hr.offboarding.view',
                'hr.skills.view',
                'hr.employee.skills.view',
                'hr.employee.skills.update',
                'hr.timeoff.view',
                'hr.timeoff.approve',
                'hr.timeoff.reject',
                'hr.analytics.view',
                'hr.employee.documents.view',
            ])
            ->get();
        $deptManager->givePermissionTo($deptPermissions);

        // Team Lead - Team management
        $teamLead = Role::findByName('Team Lead');
        $teamPermissions = Permission::whereIn('module', ['core', 'self-service'])
            ->orWhereIn('name', [
                'employees.view',
                'attendance.view',
                'leaves.view',
                'daily-works.view',
                'daily-works.create',
                'daily-works.update',
                'tasks.view',
                'tasks.create',
                'tasks.update',
                'tasks.assign',
                'performance-reviews.view',
                'performance-reviews.create',
                'performance-reviews.update',
                'training-sessions.view',
                'training-enrollments.view',
                'training-enrollments.create',
                'training-assignment-submissions.view',
                'training-assignment-submissions.grade',
                'hr.employee.skills.view',
                'hr.timeoff.view',
                'hr.timeoff.approve',
                'hr.timeoff.calendar.view',
                'hr.safety.view',
                'hr.safety.incidents.view',
            ])
            ->get();
        $teamLead->givePermissionTo($teamPermissions);

        // Senior Employee - Extended self-service
        $seniorEmployee = Role::findByName('Senior Employee');
        $seniorPermissions = Permission::whereIn('module', ['core', 'self-service'])
            ->orWhereIn('name', [
                'daily-works.view',
                'daily-works.create',
                'daily-works.update',
                'tasks.view',
                'tasks.create',
                'tasks.update',
                'performance-reviews.own.view',
                'performance-reviews.own.create',
                'performance-reviews.own.update',
                'training-feedback.own.view',
                'training-feedback.own.create',
                'training-assignment-submissions.create',
                'training-assignment-submissions.update',
            ])
            ->get();
        $seniorEmployee->givePermissionTo($seniorPermissions);

        // Employee - Basic self-service
        $employee = Role::findByName('Employee');
        $employeePermissions = Permission::whereIn('module', ['core', 'self-service'])
            ->orWhereIn('name', [
                'daily-works.view',
                'daily-works.create',
                'tasks.view',
                'performance-reviews.own.view',
                'training-feedback.own.view',
                'training-feedback.own.create',
                'training-assignment-submissions.create',
                'hr.selfservice.view',
                'hr.selfservice.profile.view',
                'hr.selfservice.profile.update',
                'hr.selfservice.documents.view',
                'hr.selfservice.benefits.view',
                'hr.selfservice.timeoff.view',
                'hr.selfservice.timeoff.request',
                'hr.selfservice.trainings.view',
                'hr.selfservice.payslips.view',
                'hr.selfservice.performance.view',
                'hr.safety.incidents.create',
            ])
            ->get();
        $employee->givePermissionTo($employeePermissions);

        // Contractor - Limited access
        $contractor = Role::findByName('Contractor');
        $contractorPermissions = Permission::whereIn('name', [
            'dashboard.view',
            'attendance.own.view',
            'attendance.own.punch',
            'profile.own.view',
            'profile.own.update',
            'profile.password.change',
            'daily-works.view',
            'daily-works.create',
            'tasks.view',
        ])
            ->get();
        $contractor->givePermissionTo($contractorPermissions);

        // Intern - Minimal access
        $intern = Role::findByName('Intern');
        $internPermissions = Permission::whereIn('name', [
            'dashboard.view',
            'attendance.own.view',
            'attendance.own.punch',
            'profile.own.view',
            'profile.password.change',
            'tasks.view',
        ])
            ->get();
        $intern->givePermissionTo($internPermissions);

        if ($this->command) {
            $this->command->info('✅ Permissions assigned to all roles');
        }
    }
}
