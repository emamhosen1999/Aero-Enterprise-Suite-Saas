<?php

declare(strict_types=1);

namespace Aero\Cms\Blocks;

use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Validator;

class BlockSchema
{
    /**
     * Create a new block schema.
     */
    public function __construct(
        protected string $type,
        protected string $label,
        protected string $category,
        protected ?string $icon = null,
        protected ?string $description = null,
        protected array $fields = [],
        protected array $settings = [],
        protected array $defaults = [],
        protected array $presets = [],
    ) {
    }

    /**
     * Create a schema from config array.
     */
    public static function fromConfig(string $type, array $config): self
    {
        // Support both new 'schema' format and legacy 'fields' format
        $fields = $config['fields'] ?? [];

        // If schema.properties exists, convert to fields format
        if (isset($config['schema']['properties'])) {
            $fields = self::convertSchemaToFields($config['schema']['properties']);
        }

        return new self(
            type: $type,
            label: $config['label'] ?? $type,
            category: $config['category'] ?? 'content',
            icon: $config['icon'] ?? null,
            description: $config['description'] ?? null,
            fields: $fields,
            settings: $config['settings'] ?? [],
            defaults: $config['defaults'] ?? [],
            presets: $config['presets'] ?? [],
        );
    }

    /**
     * Convert JSON schema properties to fields format.
     */
    protected static function convertSchemaToFields(array $properties): array
    {
        $fields = [];

        foreach ($properties as $name => $property) {
            $field = [
                'label' => $property['title'] ?? ucfirst(str_replace('_', ' ', $name)),
                'type' => self::mapSchemaTypeToFieldType($property),
                'required' => $property['required'] ?? false,
            ];

            if (isset($property['description'])) {
                $field['description'] = $property['description'];
            }

            if (isset($property['default'])) {
                $field['default'] = $property['default'];
            }

            if (isset($property['enum'])) {
                $field['options'] = array_combine($property['enum'], $property['enumLabels'] ?? $property['enum']);
            }

            if (isset($property['minimum'])) {
                $field['min'] = $property['minimum'];
            }

            if (isset($property['maximum'])) {
                $field['max'] = $property['maximum'];
            }

            if (isset($property['maxLength'])) {
                $field['max'] = $property['maxLength'];
            }

            if (isset($property['items'])) {
                $field['items'] = $property['items'];
            }

            $fields[$name] = $field;
        }

        return $fields;
    }

    /**
     * Map JSON schema type to field type.
     */
    protected static function mapSchemaTypeToFieldType(array $property): string
    {
        $type = $property['type'] ?? 'string';
        $format = $property['format'] ?? null;
        $uiType = $property['ui_type'] ?? null;

        if ($uiType) {
            return $uiType;
        }

        if ($format === 'url') {
            return 'url';
        }

        if ($format === 'email') {
            return 'email';
        }

        if ($format === 'color') {
            return 'color';
        }

        if (isset($property['enum'])) {
            return 'select';
        }

        return match ($type) {
            'string' => 'text',
            'number', 'integer' => 'number',
            'boolean' => 'boolean',
            'array' => 'repeater',
            'object' => 'object',
            default => 'text',
        };
    }

    /**
     * Get the block type identifier.
     */
    public function getType(): string
    {
        return $this->type;
    }

    /**
     * Get the block display label.
     */
    public function getLabel(): string
    {
        return $this->label;
    }

    /**
     * Get the block category.
     */
    public function getCategory(): string
    {
        return $this->category;
    }

    /**
     * Get the block icon.
     */
    public function getIcon(): ?string
    {
        return $this->icon;
    }

    /**
     * Get the block description.
     */
    public function getDescription(): ?string
    {
        return $this->description;
    }

    /**
     * Get field definitions.
     */
    public function getFields(): array
    {
        return $this->fields;
    }

    /**
     * Get settings definitions.
     */
    public function getSettings(): array
    {
        return $this->settings;
    }

    /**
     * Get default values.
     */
    public function getDefaults(): array
    {
        return $this->defaults;
    }

    /**
     * Get presets.
     */
    public function getPresets(): array
    {
        return $this->presets;
    }

    /**
     * Validate content against this schema.
     *
     * @throws ValidationException
     */
    public function validate(array $content): array
    {
        $rules = $this->buildValidationRules();

        $validator = Validator::make($content, $rules);

        if ($validator->fails()) {
            throw ValidationException::withMessages($validator->errors()->toArray());
        }

        return $validator->validated();
    }

    /**
     * Build validation rules from field definitions.
     */
    protected function buildValidationRules(): array
    {
        $rules = [];

        foreach ($this->fields as $fieldName => $field) {
            $fieldRules = [];

            if ($field['required'] ?? false) {
                $fieldRules[] = 'required';
            } else {
                $fieldRules[] = 'nullable';
            }

            $type = $field['type'] ?? 'text';

            switch ($type) {
                case 'text':
                case 'textarea':
                case 'richtext':
                    $fieldRules[] = 'string';
                    if ($max = $field['max'] ?? null) {
                        $fieldRules[] = "max:{$max}";
                    }
                    break;

                case 'number':
                    $fieldRules[] = 'numeric';
                    if (isset($field['min'])) {
                        $fieldRules[] = "min:{$field['min']}";
                    }
                    if (isset($field['max'])) {
                        $fieldRules[] = "max:{$field['max']}";
                    }
                    break;

                case 'boolean':
                    $fieldRules[] = 'boolean';
                    break;

                case 'select':
                    $options = array_keys($field['options'] ?? []);
                    if (! empty($options)) {
                        $fieldRules[] = 'in:' . implode(',', $options);
                    }
                    break;

                case 'image':
                case 'file':
                    $fieldRules[] = 'string';
                    break;

                case 'color':
                    $fieldRules[] = 'string';
                    $fieldRules[] = 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/';
                    break;

                case 'url':
                    $fieldRules[] = 'url';
                    break;

                case 'email':
                    $fieldRules[] = 'email';
                    break;

                case 'array':
                case 'repeater':
                    $fieldRules[] = 'array';
                    break;
            }

            $rules[$fieldName] = $fieldRules;
        }

        return $rules;
    }

    /**
     * Merge content with defaults.
     */
    public function mergeWithDefaults(array $content): array
    {
        return array_replace_recursive($this->defaults, $content);
    }

    /**
     * Export schema as array for frontend.
     */
    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'label' => $this->label,
            'category' => $this->category,
            'icon' => $this->icon,
            'description' => $this->description,
            'fields' => $this->fields,
            'settings' => $this->settings,
            'defaults' => $this->defaults,
            'presets' => $this->presets,
        ];
    }
}
