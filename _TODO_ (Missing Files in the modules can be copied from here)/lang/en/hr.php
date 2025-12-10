<?php

return [
    // Module Title
    'title' => 'Human Resources',

    // Employee Management
    'employees' => [
        'title' => 'Employees',
        'list' => 'Employee List',
        'add' => 'Add Employee',
        'edit' => 'Edit Employee',
        'view' => 'View Employee',
        'delete' => 'Delete Employee',
        'delete_confirm' => 'Are you sure you want to delete this employee?',
        'search_placeholder' => 'Search employees...',
        'filter_by_department' => 'Filter by Department',
        'filter_by_designation' => 'Filter by Designation',
        'filter_by_status' => 'Filter by Status',
        'export_excel' => 'Export to Excel',
        'export_pdf' => 'Export to PDF',
        'import_employees' => 'Import Employees',
        'bulk_actions' => 'Bulk Actions',
        'no_employees' => 'No employees found.',
        'create_success' => 'Employee created successfully.',
        'update_success' => 'Employee updated successfully.',
        'delete_success' => 'Employee deleted successfully.',

        // Employee Fields
        'fields' => [
            'employee_id' => 'Employee ID',
            'name' => 'Full Name',
            'email' => 'Email Address',
            'phone' => 'Phone Number',
            'department' => 'Department',
            'designation' => 'Designation',
            'date_of_joining' => 'Date of Joining',
            'birthday' => 'Birthday',
            'gender' => 'Gender',
            'address' => 'Address',
            'salary' => 'Salary',
            'status' => 'Status',
            'reporting_manager' => 'Reporting Manager',
            'profile_picture' => 'Profile Picture',
            'roles' => 'Roles',
            'attendance_type' => 'Attendance Type',
            'device_access' => 'Device Access',
        ],

        // Gender Options
        'gender_options' => [
            'male' => 'Male',
            'female' => 'Female',
            'other' => 'Other',
        ],
    ],

    // Department Management
    'departments' => [
        'title' => 'Departments',
        'list' => 'Department List',
        'add' => 'Add Department',
        'edit' => 'Edit Department',
        'delete' => 'Delete Department',
        'delete_confirm' => 'Are you sure you want to delete this department?',
        'no_departments' => 'No departments found.',
        'create_success' => 'Department created successfully.',
        'update_success' => 'Department updated successfully.',
        'delete_success' => 'Department deleted successfully.',

        'fields' => [
            'name' => 'Department Name',
            'code' => 'Department Code',
            'description' => 'Description',
            'head' => 'Department Head',
            'parent' => 'Parent Department',
            'employees_count' => 'Employees',
            'status' => 'Status',
        ],
    ],

    // Designation Management
    'designations' => [
        'title' => 'Designations',
        'list' => 'Designation List',
        'add' => 'Add Designation',
        'edit' => 'Edit Designation',
        'delete' => 'Delete Designation',
        'delete_confirm' => 'Are you sure you want to delete this designation?',
        'no_designations' => 'No designations found.',
        'create_success' => 'Designation created successfully.',
        'update_success' => 'Designation updated successfully.',
        'delete_success' => 'Designation deleted successfully.',

        'fields' => [
            'title' => 'Designation Title',
            'code' => 'Designation Code',
            'description' => 'Description',
            'department' => 'Department',
            'level' => 'Level',
            'employees_count' => 'Employees',
            'status' => 'Status',
        ],
    ],

    // Attendance
    'attendance' => [
        'title' => 'Attendance',
        'my_attendance' => 'My Attendance',
        'team_attendance' => 'Team Attendance',
        'admin_view' => 'Attendance Admin',
        'mark_attendance' => 'Mark Attendance',
        'edit_attendance' => 'Edit Attendance',
        'approve' => 'Approve',
        'reject' => 'Reject',
        'pending_approval' => 'Pending Approval',
        'regularization' => 'Regularization Request',
        'no_records' => 'No attendance records found.',

        'status' => [
            'present' => 'Present',
            'absent' => 'Absent',
            'late' => 'Late',
            'half_day' => 'Half Day',
            'on_leave' => 'On Leave',
            'holiday' => 'Holiday',
            'weekend' => 'Weekend',
        ],

        'fields' => [
            'date' => 'Date',
            'employee' => 'Employee',
            'punch_in' => 'Punch In',
            'punch_out' => 'Punch Out',
            'working_hours' => 'Working Hours',
            'overtime' => 'Overtime',
            'status' => 'Status',
            'location' => 'Location',
            'remarks' => 'Remarks',
        ],
    ],

    // Leave Management
    'leaves' => [
        'title' => 'Leaves',
        'my_leaves' => 'My Leaves',
        'team_leaves' => 'Team Leaves',
        'admin_view' => 'Leaves Admin',
        'apply' => 'Apply Leave',
        'edit' => 'Edit Leave',
        'cancel' => 'Cancel Leave',
        'approve' => 'Approve Leave',
        'reject' => 'Reject Leave',
        'balance' => 'Leave Balance',
        'history' => 'Leave History',
        'summary' => 'Leave Summary',
        'calendar' => 'Leave Calendar',
        'no_records' => 'No leave records found.',

        'status' => [
            'pending' => 'Pending',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            'cancelled' => 'Cancelled',
        ],

        'types' => [
            'casual' => 'Casual Leave',
            'sick' => 'Sick Leave',
            'earned' => 'Earned Leave',
            'maternity' => 'Maternity Leave',
            'paternity' => 'Paternity Leave',
            'unpaid' => 'Unpaid Leave',
            'compensatory' => 'Compensatory Off',
        ],

        'fields' => [
            'leave_type' => 'Leave Type',
            'from_date' => 'From Date',
            'to_date' => 'To Date',
            'days' => 'Number of Days',
            'reason' => 'Reason',
            'status' => 'Status',
            'applied_on' => 'Applied On',
            'approved_by' => 'Approved By',
            'remarks' => 'Remarks',
            'attachment' => 'Attachment',
        ],

        'messages' => [
            'apply_success' => 'Leave application submitted successfully.',
            'update_success' => 'Leave application updated successfully.',
            'cancel_success' => 'Leave cancelled successfully.',
            'approve_success' => 'Leave approved successfully.',
            'reject_success' => 'Leave rejected successfully.',
            'insufficient_balance' => 'Insufficient leave balance.',
            'overlapping_dates' => 'Leave dates overlap with existing application.',
        ],
    ],

    // Holidays
    'holidays' => [
        'title' => 'Holidays',
        'list' => 'Holiday List',
        'add' => 'Add Holiday',
        'edit' => 'Edit Holiday',
        'delete' => 'Delete Holiday',
        'no_holidays' => 'No holidays found.',
        'upcoming' => 'Upcoming Holidays',

        'fields' => [
            'name' => 'Holiday Name',
            'date' => 'Date',
            'type' => 'Type',
            'description' => 'Description',
        ],

        'types' => [
            'national' => 'National Holiday',
            'religious' => 'Religious Holiday',
            'company' => 'Company Holiday',
            'optional' => 'Optional Holiday',
        ],
    ],

    // Onboarding
    'onboarding' => [
        'title' => 'Onboarding',
        'new_hire' => 'New Hire Onboarding',
        'checklist' => 'Onboarding Checklist',
        'progress' => 'Onboarding Progress',
        'tasks' => 'Tasks',
        'documents' => 'Documents',
        'training' => 'Training',
        'complete' => 'Complete Onboarding',
    ],

    // Offboarding
    'offboarding' => [
        'title' => 'Offboarding',
        'initiate' => 'Initiate Offboarding',
        'checklist' => 'Offboarding Checklist',
        'exit_interview' => 'Exit Interview',
        'handover' => 'Knowledge Transfer',
        'clearance' => 'Clearance',
        'complete' => 'Complete Offboarding',
    ],
];
