<?php

namespace Aero\HRM\Database\Seeders;

use Aero\HRM\Models\LeaveSetting;
use Illuminate\Database\Seeder;

class HrmLeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        $leaveTypes = [
            [
                'name' => 'Annual Leave',
                'code' => 'AL',
                'type' => 'annual',
                'annual_quota' => 21,
                'is_paid' => true,
                'carry_forward_allowed' => true,
                'max_carry_forward_days' => 10,
                'requires_approval' => true,
                'min_days_notice' => 7,
                'max_consecutive_days' => 15,
                'allow_half_day' => true,
                'color' => '#3B82F6',
                'description' => 'Standard annual paid leave for all employees.',
            ],
            [
                'name' => 'Sick Leave',
                'code' => 'SL',
                'type' => 'sick',
                'annual_quota' => 15,
                'is_paid' => true,
                'carry_forward_allowed' => false,
                'max_carry_forward_days' => 0,
                'requires_approval' => true,
                'min_days_notice' => 0,
                'max_consecutive_days' => 15,
                'allow_half_day' => true,
                'color' => '#EF4444',
                'description' => 'Leave for medical reasons with doctor certificate for 3+ days.',
            ],
            [
                'name' => 'Casual Leave',
                'code' => 'CL',
                'type' => 'casual',
                'annual_quota' => 12,
                'is_paid' => true,
                'carry_forward_allowed' => false,
                'max_carry_forward_days' => 0,
                'requires_approval' => true,
                'min_days_notice' => 1,
                'max_consecutive_days' => 3,
                'allow_half_day' => true,
                'color' => '#F59E0B',
                'description' => 'Short-notice leave for personal matters.',
            ],
            [
                'name' => 'Maternity Leave',
                'code' => 'ML',
                'type' => 'maternity',
                'annual_quota' => 90,
                'is_paid' => true,
                'carry_forward_allowed' => false,
                'max_carry_forward_days' => 0,
                'requires_approval' => true,
                'min_days_notice' => 30,
                'max_consecutive_days' => 90,
                'allow_half_day' => false,
                'color' => '#EC4899',
                'description' => 'Maternity leave for female employees.',
                'eligibility' => 'female',
            ],
            [
                'name' => 'Paternity Leave',
                'code' => 'PL',
                'type' => 'paternity',
                'annual_quota' => 14,
                'is_paid' => true,
                'carry_forward_allowed' => false,
                'max_carry_forward_days' => 0,
                'requires_approval' => true,
                'min_days_notice' => 7,
                'max_consecutive_days' => 14,
                'allow_half_day' => false,
                'color' => '#8B5CF6',
                'description' => 'Paternity leave for male employees.',
                'eligibility' => 'male',
            ],
            [
                'name' => 'Bereavement Leave',
                'code' => 'BL',
                'type' => 'bereavement',
                'annual_quota' => 5,
                'is_paid' => true,
                'carry_forward_allowed' => false,
                'max_carry_forward_days' => 0,
                'requires_approval' => true,
                'min_days_notice' => 0,
                'max_consecutive_days' => 5,
                'allow_half_day' => false,
                'color' => '#6B7280',
                'description' => 'Leave due to death of an immediate family member.',
            ],
            [
                'name' => 'Marriage Leave',
                'code' => 'MRL',
                'type' => 'marriage',
                'annual_quota' => 3,
                'is_paid' => true,
                'carry_forward_allowed' => false,
                'max_carry_forward_days' => 0,
                'requires_approval' => true,
                'min_days_notice' => 14,
                'max_consecutive_days' => 3,
                'allow_half_day' => false,
                'color' => '#10B981',
                'description' => 'Leave for employee\'s own marriage.',
            ],
            [
                'name' => 'Unpaid Leave',
                'code' => 'UL',
                'type' => 'unpaid',
                'annual_quota' => 30,
                'is_paid' => false,
                'carry_forward_allowed' => false,
                'max_carry_forward_days' => 0,
                'requires_approval' => true,
                'min_days_notice' => 3,
                'max_consecutive_days' => 30,
                'allow_half_day' => true,
                'color' => '#9CA3AF',
                'description' => 'Leave without pay for extended personal reasons.',
            ],
        ];

        foreach ($leaveTypes as $leaveType) {
            LeaveSetting::firstOrCreate(
                ['code' => $leaveType['code']],
                array_merge($leaveType, ['is_active' => true])
            );
        }
    }
}
