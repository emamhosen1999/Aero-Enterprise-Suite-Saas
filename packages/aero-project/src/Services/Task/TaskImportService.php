<?php

namespace Aero\Project\Services\Task;

use Aero\Project\Models\Task;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;

class TaskImportService
{
    /**
     * Import tasks from a file.
     */
    public function import(UploadedFile $file): array
    {
        $results = [
            'success' => 0,
            'failed' => 0,
            'errors' => [],
        ];

        // Implementation would parse CSV/Excel and create tasks
        // This is a placeholder for the actual implementation

        return $results;
    }

    /**
     * Validate import data.
     */
    public function validate(array $data): array
    {
        $errors = [];

        // Validate required fields
        if (empty($data['title'])) {
            $errors[] = 'Title is required';
        }

        return $errors;
    }

    /**
     * Get import template headers.
     */
    public function getTemplateHeaders(): array
    {
        return [
            'title',
            'description',
            'status',
            'priority',
            'due_date',
            'assignee_email',
            'project_code',
        ];
    }
}
