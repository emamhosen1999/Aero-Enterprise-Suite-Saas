<?php

/**
 * HRM Navigation Pages Verification
 * Simple check for JSX files existence
 */

echo "=== HRM NAVIGATION PAGES VERIFICATION ===\n\n";

// Define expected JSX pages based on our implementation
$expectedPages = [
    // Employee Management
    'packages/aero-ui/resources/js/Pages/HRM/EmployeeList.jsx' => 'Employee List',
    
    // My Self Service  
    'packages/aero-ui/resources/js/Pages/HRM/SelfService/MyExpenses.jsx' => 'My Expenses',
    'packages/aero-ui/resources/js/Pages/HRM/SelfService/MyAttendance.jsx' => 'My Attendance',
    'packages/aero-ui/resources/js/Pages/HRM/SelfService/LeaveBalances.jsx' => 'Leave Balances',
    
    // Leave Management
    'packages/aero-ui/resources/js/Pages/HRM/LeavesAdmin.jsx' => 'Leaves Administration',
    'packages/aero-ui/resources/js/Pages/HRM/LeavePolicies.jsx' => 'Leave Policies',
    
    // Attendance Rules
    'packages/aero-ui/resources/js/Pages/HRM/AttendanceRules.jsx' => 'Attendance Rules',
    'packages/aero-ui/resources/js/Pages/HRM/OvertimeRules.jsx' => 'Overtime Rules',
    
    // Recruitment
    'packages/aero-ui/resources/js/Pages/HRM/Recruitment/Applicants.jsx' => 'Applicants',
    'packages/aero-ui/resources/js/Pages/HRM/Recruitment/InterviewScheduling.jsx' => 'Interview Scheduling',
    'packages/aero-ui/resources/js/Pages/HRM/Recruitment/Evaluations.jsx' => 'Evaluation Scores',
    'packages/aero-ui/resources/js/Pages/HRM/Recruitment/OfferLetters.jsx' => 'Offer Letters',
    
    // Performance Management
    'packages/aero-ui/resources/js/Pages/HRM/Performance/Reviews360.jsx' => '360 Reviews',
    'packages/aero-ui/resources/js/Pages/HRM/Performance/Cycles.jsx' => 'Performance Cycles',
    'packages/aero-ui/resources/js/Pages/HRM/Performance/Scores.jsx' => 'Score Aggregation',
    'packages/aero-ui/resources/js/Pages/HRM/Performance/Promotions.jsx' => 'Promotion Recommendations',
    
    // Payroll
    'packages/aero-ui/resources/js/Pages/HRM/Payroll/Loans.jsx' => 'Employee Loans',
    'packages/aero-ui/resources/js/Pages/HRM/Payroll/TaxSetup.jsx' => 'Tax Setup',
    'packages/aero-ui/resources/js/Pages/HRM/Payroll/BankFile.jsx' => 'Bank File Generation',
    'packages/aero-ui/resources/js/Pages/HRM/Payroll/TaxDeclarations.jsx' => 'Tax Declarations',
    
    // Training & Development
    'packages/aero-ui/resources/js/Pages/HRM/Training/Programs.jsx' => 'Training Programs',
    'packages/aero-ui/resources/js/Pages/HRM/Training/Pipeline.jsx' => 'Training Pipeline',
    'packages/aero-ui/resources/js/Pages/HRM/Training/Trainers.jsx' => 'Trainers',
    'packages/aero-ui/resources/js/Pages/HRM/Training/Enrollment.jsx' => 'Course Enrollment',
    'packages/aero-ui/resources/js/Pages/HRM/Training/Certifications.jsx' => 'Certification Issuance',
    
    // Configuration
    'packages/aero-ui/resources/js/Pages/HRM/CustomFields.jsx' => 'Custom Fields',
    
    // Analytics
    'packages/aero-ui/resources/js/Pages/HRM/Workforce.jsx' => 'Workforce Analytics',
];

$found = 0;
$missing = [];
$baseDir = __DIR__ . '/../';

echo "Checking " . count($expectedPages) . " expected pages:\n";
echo "--------------------------------------------------\n";

foreach ($expectedPages as $filePath => $description) {
    $fullPath = $baseDir . $filePath;
    
    if (file_exists($fullPath)) {
        echo "✓ {$description} - {$filePath}\n";
        $found++;
    } else {
        echo "✗ {$description} - {$filePath}\n";
        $missing[] = $description;
    }
}

$total = count($expectedPages);
$coveragePercent = ($found / $total) * 100;

echo "\n=== SUMMARY ===\n";
echo "Total Expected Pages: {$total}\n";
echo "Found Pages: {$found}\n";
echo "Missing Pages: " . count($missing) . "\n";
echo "Coverage: " . number_format($coveragePercent, 2) . "%\n";

if (!empty($missing)) {
    echo "\nMissing Pages:\n";
    foreach ($missing as $page) {
        echo "- {$page}\n";
    }
}

// Additional analysis of recently created files
echo "\n=== RECENT ADDITIONS CHECK ===\n";
$recentFiles = [
    'packages/aero-ui/resources/js/Pages/HRM/Recruitment/Evaluations.jsx',
    'packages/aero-ui/resources/js/Pages/HRM/Training/Certifications.jsx', 
    'packages/aero-ui/resources/js/Pages/HRM/Performance/Scores.jsx',
    'packages/aero-ui/resources/js/Pages/HRM/Performance/Promotions.jsx'
];

foreach ($recentFiles as $file) {
    $fullPath = $baseDir . $file;
    if (file_exists($fullPath)) {
        echo "✓ Recently created: " . basename($file) . "\n";
    } else {
        echo "✗ Missing recent file: " . basename($file) . "\n";
    }
}

echo "\n=== VERIFICATION COMPLETE ===\n";