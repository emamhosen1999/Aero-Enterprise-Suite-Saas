<?php

namespace Aero\RFI\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * RFI Template Service
 *
 * Manages RFI (Request for Information/Inspection) templates for
 * streamlined inspection workflows. Supports customizable templates,
 * versioning, and template inheritance.
 */
class RfiTemplateService
{
    /**
     * Template types.
     */
    public const TYPE_INSPECTION = 'inspection';

    public const TYPE_CHECKLIST = 'checklist';

    public const TYPE_AUDIT = 'audit';

    public const TYPE_SURVEY = 'survey';

    public const TYPE_COMPLIANCE = 'compliance';

    /**
     * Field types for template sections.
     */
    public const FIELD_TEXT = 'text';

    public const FIELD_TEXTAREA = 'textarea';

    public const FIELD_NUMBER = 'number';

    public const FIELD_DATE = 'date';

    public const FIELD_SELECT = 'select';

    public const FIELD_MULTISELECT = 'multiselect';

    public const FIELD_CHECKBOX = 'checkbox';

    public const FIELD_RADIO = 'radio';

    public const FIELD_FILE = 'file';

    public const FIELD_PHOTO = 'photo';

    public const FIELD_SIGNATURE = 'signature';

    public const FIELD_RATING = 'rating';

    public const FIELD_GPS = 'gps';

    /**
     * Create a new template.
     */
    public function createTemplate(array $data): array
    {
        $template = [
            'id' => Str::uuid()->toString(),
            'name' => $data['name'],
            'slug' => Str::slug($data['name']),
            'description' => $data['description'] ?? '',
            'type' => $data['type'] ?? self::TYPE_INSPECTION,
            'category_id' => $data['category_id'] ?? null,
            'version' => 1,
            'is_active' => $data['is_active'] ?? true,
            'is_default' => $data['is_default'] ?? false,
            'sections' => $this->processSections($data['sections'] ?? []),
            'settings' => $this->processSettings($data['settings'] ?? []),
            'metadata' => [
                'created_by' => $data['created_by'] ?? null,
                'created_at' => now()->toIso8601String(),
                'updated_at' => now()->toIso8601String(),
                'tags' => $data['tags'] ?? [],
            ],
        ];

        Log::info('RFI template created', [
            'template_id' => $template['id'],
            'name' => $template['name'],
            'type' => $template['type'],
        ]);

        return [
            'success' => true,
            'template' => $template,
        ];
    }

    /**
     * Clone an existing template.
     */
    public function cloneTemplate(string $templateId, array $overrides = []): array
    {
        // In production, fetch from database
        $sourceTemplate = $this->getTemplate($templateId);

        if (! $sourceTemplate) {
            return [
                'success' => false,
                'error' => 'Source template not found',
            ];
        }

        $newTemplate = array_merge($sourceTemplate, [
            'id' => Str::uuid()->toString(),
            'name' => $overrides['name'] ?? $sourceTemplate['name'].' (Copy)',
            'version' => 1,
            'is_default' => false,
            'parent_template_id' => $templateId,
            'metadata' => array_merge($sourceTemplate['metadata'], [
                'cloned_from' => $templateId,
                'cloned_at' => now()->toIso8601String(),
                'created_at' => now()->toIso8601String(),
                'updated_at' => now()->toIso8601String(),
            ]),
        ], $overrides);

        $newTemplate['slug'] = Str::slug($newTemplate['name']);

        Log::info('RFI template cloned', [
            'source_id' => $templateId,
            'new_id' => $newTemplate['id'],
        ]);

        return [
            'success' => true,
            'template' => $newTemplate,
        ];
    }

    /**
     * Update template (creates new version).
     */
    public function updateTemplate(string $templateId, array $changes, bool $createNewVersion = true): array
    {
        $template = $this->getTemplate($templateId);

        if (! $template) {
            return [
                'success' => false,
                'error' => 'Template not found',
            ];
        }

        if ($createNewVersion) {
            // Archive current version
            $archivedVersion = array_merge($template, [
                'archived_at' => now()->toIso8601String(),
                'is_active' => false,
            ]);

            // Create new version
            $newVersion = $template['version'] + 1;
            $template = array_merge($template, $changes, [
                'version' => $newVersion,
                'metadata' => array_merge($template['metadata'], [
                    'updated_at' => now()->toIso8601String(),
                    'previous_version' => $template['version'],
                ]),
            ]);

            Log::info('RFI template updated with new version', [
                'template_id' => $templateId,
                'new_version' => $newVersion,
            ]);

            return [
                'success' => true,
                'template' => $template,
                'archived_version' => $archivedVersion,
                'version' => $newVersion,
            ];
        }

        // Update in place
        $template = array_merge($template, $changes, [
            'metadata' => array_merge($template['metadata'], [
                'updated_at' => now()->toIso8601String(),
            ]),
        ]);

        return [
            'success' => true,
            'template' => $template,
        ];
    }

    /**
     * Add a section to template.
     */
    public function addSection(string $templateId, array $sectionData): array
    {
        $section = [
            'id' => Str::uuid()->toString(),
            'title' => $sectionData['title'],
            'description' => $sectionData['description'] ?? '',
            'order' => $sectionData['order'] ?? 999,
            'is_required' => $sectionData['is_required'] ?? false,
            'is_repeatable' => $sectionData['is_repeatable'] ?? false,
            'max_repetitions' => $sectionData['max_repetitions'] ?? null,
            'conditional_logic' => $sectionData['conditional_logic'] ?? null,
            'fields' => $this->processFields($sectionData['fields'] ?? []),
        ];

        Log::info('Section added to RFI template', [
            'template_id' => $templateId,
            'section_id' => $section['id'],
        ]);

        return [
            'success' => true,
            'section' => $section,
        ];
    }

    /**
     * Add a field to a section.
     */
    public function addField(string $templateId, string $sectionId, array $fieldData): array
    {
        $field = $this->createField($fieldData);

        Log::info('Field added to RFI template section', [
            'template_id' => $templateId,
            'section_id' => $sectionId,
            'field_id' => $field['id'],
            'field_type' => $field['type'],
        ]);

        return [
            'success' => true,
            'field' => $field,
        ];
    }

    /**
     * Create a field definition.
     */
    public function createField(array $data): array
    {
        $field = [
            'id' => $data['id'] ?? Str::uuid()->toString(),
            'name' => Str::snake($data['label']),
            'label' => $data['label'],
            'type' => $data['type'] ?? self::FIELD_TEXT,
            'placeholder' => $data['placeholder'] ?? '',
            'help_text' => $data['help_text'] ?? '',
            'is_required' => $data['is_required'] ?? false,
            'order' => $data['order'] ?? 999,
            'default_value' => $data['default_value'] ?? null,
            'validation' => $this->processValidation($data['validation'] ?? [], $data['type'] ?? self::FIELD_TEXT),
            'options' => $data['options'] ?? [],
            'conditional_logic' => $data['conditional_logic'] ?? null,
            'settings' => $data['settings'] ?? [],
        ];

        // Type-specific settings
        $field = match ($field['type']) {
            self::FIELD_RATING => array_merge($field, [
                'settings' => array_merge($field['settings'], [
                    'max_rating' => $data['max_rating'] ?? 5,
                    'allow_half' => $data['allow_half'] ?? false,
                ]),
            ]),
            self::FIELD_FILE, self::FIELD_PHOTO => array_merge($field, [
                'settings' => array_merge($field['settings'], [
                    'max_size_mb' => $data['max_size_mb'] ?? 10,
                    'allowed_types' => $data['allowed_types'] ?? ['jpg', 'png', 'pdf'],
                    'max_files' => $data['max_files'] ?? 5,
                ]),
            ]),
            self::FIELD_NUMBER => array_merge($field, [
                'settings' => array_merge($field['settings'], [
                    'min' => $data['min'] ?? null,
                    'max' => $data['max'] ?? null,
                    'step' => $data['step'] ?? 1,
                    'unit' => $data['unit'] ?? null,
                ]),
            ]),
            default => $field,
        };

        return $field;
    }

    /**
     * Get predefined template library.
     */
    public function getTemplateLibrary(): array
    {
        return [
            'inspections' => [
                [
                    'id' => 'lib_safety_inspection',
                    'name' => 'Safety Inspection',
                    'description' => 'Comprehensive workplace safety inspection checklist',
                    'type' => self::TYPE_INSPECTION,
                    'preview_sections' => ['General Safety', 'Fire Safety', 'Equipment', 'Emergency Exits'],
                ],
                [
                    'id' => 'lib_equipment_inspection',
                    'name' => 'Equipment Inspection',
                    'description' => 'Regular equipment maintenance and inspection form',
                    'type' => self::TYPE_INSPECTION,
                    'preview_sections' => ['Equipment Details', 'Condition Assessment', 'Maintenance Required'],
                ],
                [
                    'id' => 'lib_vehicle_inspection',
                    'name' => 'Vehicle Inspection',
                    'description' => 'Pre-trip and post-trip vehicle inspection checklist',
                    'type' => self::TYPE_CHECKLIST,
                    'preview_sections' => ['Exterior', 'Interior', 'Engine', 'Safety Equipment'],
                ],
            ],
            'audits' => [
                [
                    'id' => 'lib_quality_audit',
                    'name' => 'Quality Audit',
                    'description' => 'ISO-compliant quality management audit template',
                    'type' => self::TYPE_AUDIT,
                    'preview_sections' => ['Documentation', 'Processes', 'Training', 'Non-Conformances'],
                ],
                [
                    'id' => 'lib_compliance_audit',
                    'name' => 'Compliance Audit',
                    'description' => 'Regulatory compliance verification audit',
                    'type' => self::TYPE_COMPLIANCE,
                    'preview_sections' => ['Policies', 'Procedures', 'Records', 'Findings'],
                ],
            ],
            'surveys' => [
                [
                    'id' => 'lib_site_survey',
                    'name' => 'Site Survey',
                    'description' => 'Site assessment and survey form',
                    'type' => self::TYPE_SURVEY,
                    'preview_sections' => ['Location Details', 'Environment', 'Infrastructure', 'Photos'],
                ],
            ],
        ];
    }

    /**
     * Install template from library.
     */
    public function installFromLibrary(string $libraryId, array $customizations = []): array
    {
        $libraryTemplates = $this->getTemplateLibrary();
        $template = null;

        foreach ($libraryTemplates as $category => $templates) {
            foreach ($templates as $t) {
                if ($t['id'] === $libraryId) {
                    $template = $t;
                    break 2;
                }
            }
        }

        if (! $template) {
            return [
                'success' => false,
                'error' => 'Library template not found',
            ];
        }

        // Build full template from library definition
        $fullTemplate = $this->buildLibraryTemplate($libraryId, $template);
        $fullTemplate = array_merge($fullTemplate, $customizations);

        return $this->createTemplate($fullTemplate);
    }

    /**
     * Export template to JSON.
     */
    public function exportTemplate(string $templateId): array
    {
        $template = $this->getTemplate($templateId);

        if (! $template) {
            return [
                'success' => false,
                'error' => 'Template not found',
            ];
        }

        $export = [
            'export_version' => '1.0',
            'exported_at' => now()->toIso8601String(),
            'template' => $template,
        ];

        return [
            'success' => true,
            'data' => $export,
            'filename' => Str::slug($template['name']).'-template.json',
        ];
    }

    /**
     * Import template from JSON.
     */
    public function importTemplate(array $importData, array $options = []): array
    {
        if (! isset($importData['template'])) {
            return [
                'success' => false,
                'error' => 'Invalid import format',
            ];
        }

        $template = $importData['template'];

        // Generate new ID unless overwriting
        if (! ($options['overwrite'] ?? false)) {
            $template['id'] = Str::uuid()->toString();
            $template['version'] = 1;
        }

        // Add import metadata
        $template['metadata'] = array_merge($template['metadata'] ?? [], [
            'imported_at' => now()->toIso8601String(),
            'import_version' => $importData['export_version'] ?? 'unknown',
        ]);

        return $this->createTemplate($template);
    }

    /**
     * Validate template structure.
     */
    public function validateTemplate(array $template): array
    {
        $errors = [];
        $warnings = [];

        // Required fields
        if (empty($template['name'])) {
            $errors[] = 'Template name is required';
        }

        if (empty($template['sections'])) {
            $warnings[] = 'Template has no sections defined';
        }

        // Validate sections
        foreach ($template['sections'] ?? [] as $sectionIndex => $section) {
            if (empty($section['title'])) {
                $errors[] = "Section {$sectionIndex}: Title is required";
            }

            // Validate fields
            foreach ($section['fields'] ?? [] as $fieldIndex => $field) {
                if (empty($field['label'])) {
                    $errors[] = "Section {$sectionIndex}, Field {$fieldIndex}: Label is required";
                }

                if (empty($field['type'])) {
                    $errors[] = "Section {$sectionIndex}, Field {$fieldIndex}: Type is required";
                }

                // Validate options for select/radio types
                if (in_array($field['type'], [self::FIELD_SELECT, self::FIELD_RADIO, self::FIELD_MULTISELECT])) {
                    if (empty($field['options'])) {
                        $errors[] = "Section {$sectionIndex}, Field {$fieldIndex}: Options required for {$field['type']} field";
                    }
                }
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }

    /**
     * Generate form preview.
     */
    public function generatePreview(array $template): array
    {
        $preview = [
            'name' => $template['name'],
            'description' => $template['description'] ?? '',
            'type' => $template['type'] ?? self::TYPE_INSPECTION,
            'sections' => [],
            'estimated_completion_time' => $this->estimateCompletionTime($template),
            'total_fields' => 0,
            'required_fields' => 0,
        ];

        foreach ($template['sections'] ?? [] as $section) {
            $sectionPreview = [
                'title' => $section['title'],
                'description' => $section['description'] ?? '',
                'field_count' => count($section['fields'] ?? []),
                'is_repeatable' => $section['is_repeatable'] ?? false,
            ];

            $preview['sections'][] = $sectionPreview;
            $preview['total_fields'] += count($section['fields'] ?? []);

            foreach ($section['fields'] ?? [] as $field) {
                if ($field['is_required'] ?? false) {
                    $preview['required_fields']++;
                }
            }
        }

        return $preview;
    }

    /**
     * Get template usage statistics.
     */
    public function getUsageStatistics(string $templateId): array
    {
        // In production, query from RFI records
        return [
            'template_id' => $templateId,
            'total_submissions' => 0,
            'submissions_this_month' => 0,
            'average_completion_time' => null,
            'completion_rate' => 0,
            'last_used' => null,
            'users_count' => 0,
            'field_completion_rates' => [],
        ];
    }

    /**
     * Process sections data.
     */
    protected function processSections(array $sections): array
    {
        $processed = [];

        foreach ($sections as $index => $section) {
            $processed[] = [
                'id' => $section['id'] ?? Str::uuid()->toString(),
                'title' => $section['title'],
                'description' => $section['description'] ?? '',
                'order' => $section['order'] ?? $index,
                'is_required' => $section['is_required'] ?? false,
                'is_repeatable' => $section['is_repeatable'] ?? false,
                'max_repetitions' => $section['max_repetitions'] ?? null,
                'conditional_logic' => $section['conditional_logic'] ?? null,
                'fields' => $this->processFields($section['fields'] ?? []),
            ];
        }

        return $processed;
    }

    /**
     * Process fields data.
     */
    protected function processFields(array $fields): array
    {
        $processed = [];

        foreach ($fields as $index => $field) {
            $processed[] = $this->createField(array_merge($field, [
                'order' => $field['order'] ?? $index,
            ]));
        }

        return $processed;
    }

    /**
     * Process template settings.
     */
    protected function processSettings(array $settings): array
    {
        return array_merge([
            'allow_drafts' => true,
            'require_signature' => false,
            'require_gps' => false,
            'allow_offline' => true,
            'auto_save' => true,
            'show_progress' => true,
            'allow_attachments' => true,
            'max_attachments' => 10,
            'notification_recipients' => [],
            'due_date_required' => false,
            'scoring' => [
                'enabled' => false,
                'max_score' => 100,
                'passing_score' => 70,
            ],
        ], $settings);
    }

    /**
     * Process field validation rules.
     */
    protected function processValidation(array $validation, string $fieldType): array
    {
        $baseValidation = array_merge([
            'required' => false,
        ], $validation);

        // Add type-specific validation
        return match ($fieldType) {
            self::FIELD_NUMBER => array_merge($baseValidation, [
                'min' => $validation['min'] ?? null,
                'max' => $validation['max'] ?? null,
            ]),
            self::FIELD_TEXT, self::FIELD_TEXTAREA => array_merge($baseValidation, [
                'min_length' => $validation['min_length'] ?? null,
                'max_length' => $validation['max_length'] ?? null,
                'pattern' => $validation['pattern'] ?? null,
            ]),
            self::FIELD_DATE => array_merge($baseValidation, [
                'min_date' => $validation['min_date'] ?? null,
                'max_date' => $validation['max_date'] ?? null,
            ]),
            default => $baseValidation,
        };
    }

    /**
     * Estimate completion time for template.
     */
    protected function estimateCompletionTime(array $template): string
    {
        $totalFields = 0;

        foreach ($template['sections'] ?? [] as $section) {
            $totalFields += count($section['fields'] ?? []);
        }

        // Estimate 30 seconds per field
        $seconds = $totalFields * 30;
        $minutes = ceil($seconds / 60);

        return $minutes <= 1 ? '1 minute' : "{$minutes} minutes";
    }

    /**
     * Build full template from library definition.
     */
    protected function buildLibraryTemplate(string $libraryId, array $preview): array
    {
        // In production, load full template definitions from storage
        // This is a simplified example
        return [
            'name' => $preview['name'],
            'description' => $preview['description'],
            'type' => $preview['type'],
            'sections' => [],
            'settings' => [],
        ];
    }

    /**
     * Get template by ID (placeholder for database query).
     */
    protected function getTemplate(string $templateId): ?array
    {
        // In production, fetch from database
        return null;
    }
}
