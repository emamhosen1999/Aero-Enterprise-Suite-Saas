<?php

return [
    'code' => 'compliance',
    'name' => 'Compliance Management',
    'description' => 'Compliance management system with regulatory tracking, audit trails, and compliance reporting',
    'version' => '1.0.0',
    'category' => 'business',
    'icon' => 'ShieldCheckIcon',
    'priority' => 17,
    'enabled' => env('COMPLIANCE_MODULE_ENABLED', true),
    'minimum_plan' => 'enterprise',
    'dependencies' => ['core'],

    /*
    |--------------------------------------------------------------------------
    | Compliance Settings
    |--------------------------------------------------------------------------
    */
    'regulatory' => [
        'enable_automated_assessment' => env('COMPLIANCE_AUTO_ASSESS', true),
        'assessment_frequency' => env('COMPLIANCE_ASSESS_FREQUENCY', 'monthly'),
        'require_evidence' => env('COMPLIANCE_REQUIRE_EVIDENCE', true),
    ],

    'audit' => [
        'enable_audit_trail' => env('COMPLIANCE_AUDIT_TRAIL', true),
        'retention_days' => env('COMPLIANCE_AUDIT_RETENTION', 2555), // 7 years
        'require_approval' => env('COMPLIANCE_AUDIT_APPROVAL', true),
    ],

    'policies' => [
        'version_control' => env('COMPLIANCE_POLICY_VERSIONING', true),
        'approval_workflow' => env('COMPLIANCE_POLICY_APPROVAL', true),
        'acknowledgment_required' => env('COMPLIANCE_POLICY_ACK', true),
    ],

    'reporting' => [
        'enable_automated_reports' => env('COMPLIANCE_AUTO_REPORTS', true),
        'report_formats' => ['pdf', 'excel', 'csv'],
    ],
];
