<?php

namespace Database\Seeders;

use App\Models\Compliance\ComplianceAudit;
use App\Models\Compliance\CompliancePolicy;
use App\Models\Compliance\ComplianceTrainingRecord;
use App\Models\Compliance\ControlledDocument;
use App\Models\Compliance\RegulatoryRequirement;
use App\Models\Compliance\RiskAssessment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ComplianceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->createPermissions();
        $this->assignPermissionsToRoles();
        $this->createSampleData();
    }

    /**
     * Create compliance permissions
     */
    private function createPermissions(): void
    {
        $permissions = [
            // Dashboard permissions
            'compliance.dashboard.view',

            // Policy permissions
            'compliance.policies.view',
            'compliance.policies.create',
            'compliance.policies.update',
            'compliance.policies.delete',
            'compliance.policies.approve',
            'compliance.policies.publish',
            'compliance.policies.archive',
            'compliance.policies.acknowledge',

            // Regulatory requirements permissions
            'compliance.regulatory.view',
            'compliance.regulatory.create',
            'compliance.regulatory.update',
            'compliance.regulatory.delete',

            // Risk assessment permissions
            'compliance.risks.view',
            'compliance.risks.create',
            'compliance.risks.update',
            'compliance.risks.delete',

            // Audit permissions
            'compliance.audits.view',
            'compliance.audits.create',
            'compliance.audits.update',
            'compliance.audits.delete',

            // Audit findings permissions
            'compliance.findings.view',
            'compliance.findings.create',
            'compliance.findings.update',
            'compliance.findings.delete',

            // Training permissions
            'compliance.training.view',
            'compliance.training.create',
            'compliance.training.update',
            'compliance.training.delete',

            // Document permissions
            'compliance.documents.view',
            'compliance.documents.create',
            'compliance.documents.update',
            'compliance.documents.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }
    }

    /**
     * Assign permissions to roles
     */
    private function assignPermissionsToRoles(): void
    {
        // Get or create roles
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin']);
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $complianceManager = Role::firstOrCreate(['name' => 'compliance-manager']);
        $complianceOfficer = Role::firstOrCreate(['name' => 'compliance-officer']);
        $employee = Role::firstOrCreate(['name' => 'employee']);

        // Super Admin gets all permissions
        $superAdmin->givePermissionTo(Permission::where('name', 'like', 'compliance.%')->get());

        // Admin gets most permissions
        $adminPermissions = [
            'compliance.dashboard.view',
            'compliance.policies.view',
            'compliance.policies.create',
            'compliance.policies.update',
            'compliance.policies.approve',
            'compliance.policies.publish',
            'compliance.regulatory.view',
            'compliance.regulatory.create',
            'compliance.regulatory.update',
            'compliance.risks.view',
            'compliance.risks.create',
            'compliance.risks.update',
            'compliance.audits.view',
            'compliance.audits.create',
            'compliance.audits.update',
            'compliance.findings.view',
            'compliance.findings.create',
            'compliance.findings.update',
            'compliance.training.view',
            'compliance.training.create',
            'compliance.training.update',
            'compliance.documents.view',
            'compliance.documents.create',
            'compliance.documents.update',
        ];
        $admin->givePermissionTo($adminPermissions);

        // Compliance Manager gets full compliance permissions
        $complianceManager->givePermissionTo(Permission::where('name', 'like', 'compliance.%')->get());

        // Compliance Officer gets most permissions except delete and archive
        $officerPermissions = [
            'compliance.dashboard.view',
            'compliance.policies.view',
            'compliance.policies.create',
            'compliance.policies.update',
            'compliance.regulatory.view',
            'compliance.regulatory.create',
            'compliance.regulatory.update',
            'compliance.risks.view',
            'compliance.risks.create',
            'compliance.risks.update',
            'compliance.audits.view',
            'compliance.audits.create',
            'compliance.audits.update',
            'compliance.findings.view',
            'compliance.findings.create',
            'compliance.findings.update',
            'compliance.training.view',
            'compliance.training.create',
            'compliance.training.update',
            'compliance.documents.view',
            'compliance.documents.create',
            'compliance.documents.update',
        ];
        $complianceOfficer->givePermissionTo($officerPermissions);

        // Employee gets basic view and acknowledge permissions
        $employeePermissions = [
            'compliance.dashboard.view',
            'compliance.policies.view',
            'compliance.policies.acknowledge',
            'compliance.regulatory.view',
            'compliance.training.view',
            'compliance.documents.view',
        ];
        $employee->givePermissionTo($employeePermissions);
    }

    /**
     * Create sample compliance data
     */
    private function createSampleData(): void
    {
        // Get the first user or create one
        $user = User::first();
        if (! $user) {
            $user = User::create([
                'name' => 'System Administrator',
                'email' => 'admin@company.com',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]);
        }

        // Create sample compliance policies
        $policies = [
            [
                'policy_id' => 'POL-001',
                'title' => 'Code of Conduct',
                'description' => 'Company-wide code of conduct and ethical standards',
                'category' => CompliancePolicy::CATEGORY_HR,
                'type' => CompliancePolicy::TYPE_POLICY,
                'content' => 'This policy outlines the expected behavior and ethical standards for all employees...',
                'status' => CompliancePolicy::STATUS_ACTIVE,
                'version' => '1.0',
                'effective_date' => now()->subMonths(6),
                'review_frequency_months' => 12,
                'next_review_date' => now()->addMonths(6),
                'owner_id' => $user->id,
                'requires_acknowledgment' => true,
                'tags' => ['ethics', 'conduct', 'mandatory'],
            ],
            [
                'policy_id' => 'POL-002',
                'title' => 'Information Security Policy',
                'description' => 'Data protection and information security guidelines',
                'category' => CompliancePolicy::CATEGORY_SECURITY,
                'type' => CompliancePolicy::TYPE_POLICY,
                'content' => 'This policy defines the requirements for protecting company information assets...',
                'status' => CompliancePolicy::STATUS_ACTIVE,
                'version' => '2.1',
                'effective_date' => now()->subMonths(3),
                'review_frequency_months' => 12,
                'next_review_date' => now()->addMonths(9),
                'owner_id' => $user->id,
                'requires_acknowledgment' => true,
                'tags' => ['security', 'data-protection', 'mandatory'],
            ],
            [
                'policy_id' => 'POL-003',
                'title' => 'Workplace Safety Policy',
                'description' => 'Health and safety requirements for the workplace',
                'category' => CompliancePolicy::CATEGORY_SAFETY,
                'type' => CompliancePolicy::TYPE_POLICY,
                'content' => 'This policy ensures a safe and healthy work environment for all employees...',
                'status' => CompliancePolicy::STATUS_ACTIVE,
                'version' => '1.3',
                'effective_date' => now()->subMonths(4),
                'review_frequency_months' => 6,
                'next_review_date' => now()->addMonths(2),
                'owner_id' => $user->id,
                'requires_acknowledgment' => true,
                'tags' => ['safety', 'health', 'mandatory'],
            ],
        ];

        foreach ($policies as $policyData) {
            CompliancePolicy::firstOrCreate(['policy_id' => $policyData['policy_id']], $policyData);
        }

        // Create sample regulatory requirements
        $requirements = [
            [
                'requirement_number' => 'REQ-GDPR-001',
                'title' => 'GDPR Data Protection Compliance',
                'description' => 'Compliance with General Data Protection Regulation requirements',
                'regulatory_body' => 'European Commission',
                'regulation_reference' => 'GDPR Article 32',
                'requirement_type' => RegulatoryRequirement::TYPE_DATA_PROTECTION,
                'industry' => 'Technology',
                'applicable_locations' => ['EU', 'UK'],
                'effective_date' => now()->subMonths(12),
                'compliance_deadline' => now()->addMonths(6),
                'status' => RegulatoryRequirement::STATUS_IN_PROGRESS,
                'priority' => RegulatoryRequirement::PRIORITY_HIGH,
                'assigned_to' => $user->id,
                'compliance_percentage' => 75.0,
            ],
            [
                'requirement_number' => 'REQ-SOX-001',
                'title' => 'Sarbanes-Oxley Financial Controls',
                'description' => 'Implementation of SOX financial reporting controls',
                'regulatory_body' => 'SEC',
                'regulation_reference' => 'SOX Section 404',
                'requirement_type' => RegulatoryRequirement::TYPE_FINANCIAL,
                'industry' => 'Public Company',
                'applicable_locations' => ['US'],
                'effective_date' => now()->subMonths(18),
                'compliance_deadline' => now()->addMonths(3),
                'status' => RegulatoryRequirement::STATUS_COMPLIANT,
                'priority' => RegulatoryRequirement::PRIORITY_CRITICAL,
                'assigned_to' => $user->id,
                'compliance_percentage' => 100.0,
            ],
        ];

        foreach ($requirements as $requirementData) {
            RegulatoryRequirement::firstOrCreate(
                ['requirement_number' => $requirementData['requirement_number']],
                $requirementData
            );
        }

        // Create sample risk assessments
        $risks = [
            [
                'risk_id' => 'RISK-001',
                'name' => 'Data Breach Risk',
                'description' => 'Risk of unauthorized access to customer data',
                'category' => RiskAssessment::CATEGORY_REGULATORY,
                'likelihood' => 3,
                'impact' => 5,
                'risk_score' => 15.0,
                'risk_level' => RiskAssessment::LEVEL_HIGH,
                'status' => RiskAssessment::STATUS_IN_PROGRESS,
                'assessment_date' => now()->subMonths(2),
                'next_review_date' => now()->addMonths(4),
                'owner_id' => $user->id,
                'notes' => 'Regular security audits and training required',
            ],
            [
                'risk_id' => 'RISK-002',
                'name' => 'Regulatory Non-Compliance',
                'description' => 'Risk of failing to meet regulatory requirements',
                'category' => RiskAssessment::CATEGORY_REGULATORY,
                'likelihood' => 2,
                'impact' => 4,
                'risk_score' => 8.0,
                'risk_level' => RiskAssessment::LEVEL_MEDIUM,
                'status' => RiskAssessment::STATUS_COMPLETED,
                'assessment_date' => now()->subMonths(1),
                'next_review_date' => now()->addMonths(5),
                'owner_id' => $user->id,
                'notes' => 'Compliance monitoring system in place',
            ],
        ];

        foreach ($risks as $riskData) {
            RiskAssessment::firstOrCreate(['risk_id' => $riskData['risk_id']], $riskData);
        }

        // Create sample compliance audits
        $audits = [
            [
                'audit_id' => 'AUD-2024-001',
                'title' => 'Annual Information Security Audit',
                'description' => 'Comprehensive review of information security controls',
                'type' => ComplianceAudit::TYPE_INTERNAL,
                'scope' => 'Information Security Management System',
                'status' => ComplianceAudit::STATUS_COMPLETED,
                'scheduled_date' => now()->subMonths(3),
                'start_date' => now()->subMonths(3),
                'end_date' => now()->subMonths(2),
                'auditor_id' => $user->id,
                'auditee_department' => 'IT Security',
                'risk_level' => ComplianceAudit::RISK_MEDIUM,
                'overall_rating' => ComplianceAudit::RATING_GOOD,
                'summary' => 'Security controls are generally effective with minor improvements needed',
                'follow_up_required' => true,
                'follow_up_date' => now()->addMonths(3),
            ],
            [
                'audit_id' => 'AUD-2024-002',
                'title' => 'HR Compliance Audit',
                'description' => 'Review of HR policies and procedures compliance',
                'type' => ComplianceAudit::TYPE_INTERNAL,
                'scope' => 'Human Resources Management',
                'status' => ComplianceAudit::STATUS_IN_PROGRESS,
                'scheduled_date' => now()->subDays(15),
                'start_date' => now()->subDays(15),
                'auditor_id' => $user->id,
                'auditee_department' => 'Human Resources',
                'risk_level' => ComplianceAudit::RISK_LOW,
                'summary' => 'Audit in progress',
            ],
        ];

        foreach ($audits as $auditData) {
            ComplianceAudit::firstOrCreate(['audit_id' => $auditData['audit_id']], $auditData);
        }

        // Create sample training records
        $trainingRecords = [
            [
                'record_id' => 'TRN-001',
                'employee_id' => $user->id,
                'training_title' => 'Information Security Awareness',
                'training_description' => 'Annual mandatory security awareness training',
                'training_type' => ComplianceTrainingRecord::TYPE_MANDATORY,
                'training_category' => ComplianceTrainingRecord::CATEGORY_SECURITY,
                'provider' => 'Internal Training Team',
                'scheduled_date' => now()->subMonths(1),
                'completion_date' => now()->subMonths(1)->addDays(5),
                'expiry_date' => now()->addMonths(11),
                'status' => ComplianceTrainingRecord::STATUS_COMPLETED,
                'score' => 92.0,
                'passing_score' => 80.0,
                'duration_hours' => 2.5,
                'certificate_number' => 'CERT-SEC-001',
            ],
            [
                'record_id' => 'TRN-002',
                'employee_id' => $user->id,
                'training_title' => 'GDPR Data Protection Training',
                'training_description' => 'Training on GDPR compliance requirements',
                'training_type' => ComplianceTrainingRecord::TYPE_MANDATORY,
                'training_category' => ComplianceTrainingRecord::CATEGORY_COMPLIANCE,
                'provider' => 'External Training Provider',
                'scheduled_date' => now()->addDays(30),
                'expiry_date' => now()->addMonths(12),
                'status' => ComplianceTrainingRecord::STATUS_SCHEDULED,
                'passing_score' => 85.0,
                'duration_hours' => 4.0,
            ],
        ];

        foreach ($trainingRecords as $trainingData) {
            ComplianceTrainingRecord::firstOrCreate(['record_id' => $trainingData['record_id']], $trainingData);
        }

        // Create sample controlled documents
        $documents = [
            [
                'document_id' => 'DOC-QMS-001',
                'title' => 'Quality Management System Manual',
                'description' => 'Master document defining the QMS structure and processes',
                'category' => ControlledDocument::CATEGORY_MANUAL,
                'type' => ControlledDocument::TYPE_QUALITY,
                'status' => ControlledDocument::STATUS_ACTIVE,
                'current_version' => '3.2',
                'document_owner_id' => $user->id,
                'creation_date' => now()->subMonths(24),
                'effective_date' => now()->subMonths(6),
                'next_review_date' => now()->addMonths(6),
                'retention_period' => 7, // years
                'confidentiality_level' => ControlledDocument::CONFIDENTIALITY_INTERNAL,
                'access_level' => ControlledDocument::ACCESS_ALL_EMPLOYEES,
                'is_template' => false,
                'approval_required' => true,
                'tags' => ['QMS', 'quality', 'manual'],
            ],
            [
                'document_id' => 'DOC-POL-001',
                'title' => 'Document Control Procedure',
                'description' => 'Procedure for managing controlled documents',
                'category' => ControlledDocument::CATEGORY_PROCEDURE,
                'type' => ControlledDocument::TYPE_OPERATIONAL,
                'status' => ControlledDocument::STATUS_ACTIVE,
                'current_version' => '2.0',
                'document_owner_id' => $user->id,
                'creation_date' => now()->subMonths(18),
                'effective_date' => now()->subMonths(3),
                'next_review_date' => now()->addMonths(9),
                'retention_period' => 5, // years
                'confidentiality_level' => ControlledDocument::CONFIDENTIALITY_INTERNAL,
                'access_level' => ControlledDocument::ACCESS_ROLE_BASED,
                'is_template' => false,
                'approval_required' => true,
                'tags' => ['procedure', 'document-control'],
            ],
        ];

        foreach ($documents as $documentData) {
            ControlledDocument::firstOrCreate(['document_id' => $documentData['document_id']], $documentData);
        }

        $this->command->info('Compliance seed data created successfully.');
    }
}
