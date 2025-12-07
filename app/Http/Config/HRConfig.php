<?php

namespace App\Http\Config;

/**
 * Common status and option configurations for HR modules
 * Centralized to reduce duplication across controllers
 */
class HRConfig
{
    /**
     * Common status options for various HR modules
     */
    public static function getStatusOptions(): array
    {
        return [
            ['id' => 'draft', 'name' => 'Draft'],
            ['id' => 'active', 'name' => 'Active'],
            ['id' => 'inactive', 'name' => 'Inactive'],
            ['id' => 'completed', 'name' => 'Completed'],
            ['id' => 'cancelled', 'name' => 'Cancelled'],
            ['id' => 'pending', 'name' => 'Pending'],
            ['id' => 'approved', 'name' => 'Approved'],
            ['id' => 'rejected', 'name' => 'Rejected'],
        ];
    }

    /**
     * Training specific status options
     */
    public static function getTrainingStatuses(): array
    {
        return [
            ['id' => 'draft', 'name' => 'Draft'],
            ['id' => 'scheduled', 'name' => 'Scheduled'],
            ['id' => 'active', 'name' => 'Active'],
            ['id' => 'completed', 'name' => 'Completed'],
            ['id' => 'cancelled', 'name' => 'Cancelled'],
        ];
    }

    /**
     * Job/Recruitment status options
     */
    public static function getJobStatuses(): array
    {
        return [
            ['id' => 'draft', 'name' => 'Draft'],
            ['id' => 'open', 'name' => 'Open'],
            ['id' => 'closed', 'name' => 'Closed'],
            ['id' => 'on_hold', 'name' => 'On Hold'],
            ['id' => 'cancelled', 'name' => 'Cancelled'],
        ];
    }

    /**
     * Job type options
     */
    public static function getJobTypes(): array
    {
        return [
            ['id' => 'full_time', 'name' => 'Full Time'],
            ['id' => 'part_time', 'name' => 'Part Time'],
            ['id' => 'contract', 'name' => 'Contract'],
            ['id' => 'temporary', 'name' => 'Temporary'],
            ['id' => 'internship', 'name' => 'Internship'],
            ['id' => 'remote', 'name' => 'Remote'],
        ];
    }

    /**
     * Training type options
     */
    public static function getTrainingTypes(): array
    {
        return [
            ['id' => 'course', 'name' => 'Course'],
            ['id' => 'workshop', 'name' => 'Workshop'],
            ['id' => 'seminar', 'name' => 'Seminar'],
            ['id' => 'certification', 'name' => 'Certification'],
            ['id' => 'on_the_job', 'name' => 'On-the-job Training'],
            ['id' => 'webinar', 'name' => 'Webinar'],
            ['id' => 'conference', 'name' => 'Conference'],
        ];
    }

    /**
     * Training enrollment status options
     */
    public static function getEnrollmentStatuses(): array
    {
        return [
            ['id' => 'pending', 'name' => 'Pending'],
            ['id' => 'approved', 'name' => 'Approved'],
            ['id' => 'rejected', 'name' => 'Rejected'],
            ['id' => 'in_progress', 'name' => 'In Progress'],
            ['id' => 'completed', 'name' => 'Completed'],
            ['id' => 'withdrawn', 'name' => 'Withdrawn'],
        ];
    }

    /**
     * Duration unit options
     */
    public static function getDurationUnits(): array
    {
        return [
            ['id' => 'hours', 'name' => 'Hours'],
            ['id' => 'days', 'name' => 'Days'],
            ['id' => 'weeks', 'name' => 'Weeks'],
            ['id' => 'months', 'name' => 'Months'],
        ];
    }

    /**
     * Visibility options
     */
    public static function getVisibilityOptions(): array
    {
        return [
            ['id' => 'public', 'name' => 'Public'],
            ['id' => 'staff', 'name' => 'Staff Only'],
            ['id' => 'completion_based', 'name' => 'Completion Based'],
        ];
    }
}