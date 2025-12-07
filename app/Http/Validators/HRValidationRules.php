<?php

namespace App\Http\Validators;

/**
 * Common validation rule builders for HR modules
 * Reduces duplication of validation patterns
 */
class HRValidationRules
{
    /**
     * Basic training validation rules
     */
    public static function trainingRules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:training_categories,id',
            'type' => 'required|string',
            'status' => 'required|in:draft,scheduled,active,completed,cancelled',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'duration' => 'nullable|numeric',
            'duration_unit' => 'nullable|in:hours,days,weeks,months',
            'location' => 'nullable|string|max:255',
            'is_online' => 'boolean',
            'instructor_id' => 'nullable|exists:users,id',
            'max_participants' => 'nullable|integer|min:1',
            'cost' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'prerequisites' => 'nullable|array',
            'learning_outcomes' => 'nullable|array',
            'certification' => 'nullable|string|max:255',
            'approval_required' => 'boolean',
            'department_id' => 'nullable|exists:departments,id',
        ];
    }

    /**
     * Training category validation rules
     */
    public static function trainingCategoryRules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'parent_id' => 'nullable|exists:training_categories,id',
        ];
    }

    /**
     * Training material validation rules
     */
    public static function trainingMaterialRules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string',
            'url' => 'nullable|url',
            'is_required' => 'boolean',
            'order' => 'nullable|integer',
            'visibility' => 'required|in:public,staff,completion_based',
        ];
    }

    /**
     * Training enrollment validation rules
     */
    public static function trainingEnrollmentRules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'status' => 'required|in:pending,approved,rejected,in_progress,completed,withdrawn',
            'enrollment_date' => 'nullable|date',
            'completion_date' => 'nullable|date',
            'score' => 'nullable|numeric',
            'feedback' => 'nullable|string',
            'certificate_issued' => 'boolean',
            'rejected_reason' => 'nullable|string',
        ];
    }

    /**
     * Update enrollment validation rules (without user_id)
     */
    public static function updateEnrollmentRules(): array
    {
        return [
            'status' => 'required|in:pending,approved,rejected,in_progress,completed,withdrawn',
            'completion_date' => 'nullable|date',
            'score' => 'nullable|numeric',
            'feedback' => 'nullable|string',
            'certificate_issued' => 'boolean',
            'rejected_reason' => 'nullable|string',
        ];
    }

    /**
     * Common basic entity rules (name, description, active status)
     */
    public static function basicEntityRules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Department assignment rules
     */
    public static function departmentAssignmentRules(): array
    {
        return [
            'department_id' => 'required|exists:departments,id',
        ];
    }

    /**
     * User assignment rules
     */
    public static function userAssignmentRules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
        ];
    }

    /**
     * Date range validation rules
     */
    public static function dateRangeRules(): array
    {
        return [
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ];
    }

    /**
     * File upload validation rules
     */
    public static function fileUploadRules(): array
    {
        return [
            'file' => 'nullable|file|max:10240', // 10MB max
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240',
        ];
    }

    /**
     * Status-only validation rules
     */
    public static function statusRules(array $allowedStatuses = ['active', 'inactive']): array
    {
        return [
            'status' => 'required|in:' . implode(',', $allowedStatuses),
        ];
    }
}