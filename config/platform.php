<?php

declare(strict_types=1);

$defaultAppUrl = env('APP_URL', 'http://localhost');
$defaultDomain = parse_url($defaultAppUrl, PHP_URL_HOST) ?: 'localhost';

return [
    'central_domain' => env('CENTRAL_DOMAIN', $defaultDomain),

    'trial_days' => (int) env('PLATFORM_TRIAL_DAYS', 14),

    'registration' => [
        'module_pricing' => [
            'monthly' => (int) env('PLATFORM_MODULE_PRICE_MONTHLY', 20),
            'yearly' => (int) env('PLATFORM_MODULE_PRICE_YEARLY', 200),
        ],
        'modules' => [
            [
                'code' => 'hr',
                'name' => 'HR & People Ops',
                'description' => 'Core HRIS, attendance, payroll readiness, and workforce analytics.',
                'category' => 'Core',
            ],
            [
                'code' => 'projects',
                'name' => 'Projects & Delivery',
                'description' => 'Portfolio planning, sprint execution, RAID tracking, and budget guardrails.',
                'category' => 'Execution',
            ],
            [
                'code' => 'compliance',
                'name' => 'Compliance & Risk',
                'description' => 'Audits, policy lifecycle, incident playbooks, and regulatory workflows.',
                'category' => 'Governance',
            ],
            [
                'code' => 'finance',
                'name' => 'Finance & Spend',
                'description' => 'Billing, expense controls, AR/AP, and treasury level visibility.',
                'category' => 'Core',
            ],
            [
                'code' => 'supply_chain',
                'name' => 'Supply Chain & Procurement',
                'description' => 'Vendor orchestration, demand planning, and logistics across regions.',
                'category' => 'Operations',
            ],
            [
                'code' => 'crm',
                'name' => 'Revenue & CRM',
                'description' => 'Pipeline, renewals, customer success rooms, and revenue reporting.',
                'category' => 'Growth',
            ],
        ],
        'default_modules' => ['hr', 'projects'],
    ],
];
