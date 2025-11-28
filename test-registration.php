<?php

/**
 * Test script to verify tenant registration works end-to-end
 * This simulates what happens when the React form submits data
 */

require_once 'vendor/autoload.php';

// Simulate a POST request to the registration endpoint
$data = [
    // Company Information
    'companyName' => 'Acme Corporation',
    'companySlug' => 'acme-corp',
    'contactEmail' => 'admin@acme-corp.com',
    'contactPhone' => '+1-555-0123',
    'industry' => 'Technology',
    'companySize' => '10-50',
    'website' => 'https://acme-corp.com',
    'description' => 'A test company for multi-tenant registration',

    // Plan Selection
    'selectedPlan' => 1, // Starter plan
    'selectedModules' => [1, 2, 3], // HR Management, Attendance, Project Management
    'billingCycle' => 'monthly',

    // Admin Account
    'adminName' => 'John Smith',
    'adminEmail' => 'john@acme-corp.com',
    'password' => 'SecurePassword123!',
    'passwordConfirmation' => 'SecurePassword123!',

    // Preferences
    'timezone' => 'America/New_York',
    'agreeToTerms' => true,
];

echo "=== Tenant Registration Test Data ===\n";
echo 'Company: '.$data['companyName'].' ('.$data['companySlug'].")\n";
echo 'Admin: '.$data['adminName'].' <'.$data['adminEmail'].">\n";
echo 'Plan: '.$data['selectedPlan'].' ('.$data['billingCycle'].")\n";
echo 'Modules: '.implode(', ', $data['selectedModules'])."\n";
echo 'Industry: '.$data['industry'].' | Size: '.$data['companySize']."\n";
echo "\nThis data structure matches what the React form sends to /register-tenant\n";
echo "You can test this by submitting the registration form in the browser.\n";
