<?php

declare(strict_types=1);

namespace Aero\Cms\Services;

use Aero\Cms\Blocks\BlockRegistry;

class BlockService
{
    public function __construct(
        protected BlockRegistry $registry
    ) {}

    /**
     * Get default data for a block type.
     */
    public function getBlockDefaults(string $type): ?array
    {
        $block = $this->registry->get($type);

        if ($block === null) {
            return null;
        }

        return $block['defaults'] ?? [];
    }

    /**
     * Validate block data against its schema.
     */
    public function validateBlockData(string $type, array $data): array
    {
        $block = $this->registry->get($type);

        if ($block === null) {
            return ['type' => "Block type '{$type}' not found"];
        }

        $errors = [];
        $schema = $block['schema'] ?? [];

        foreach ($schema as $field => $rules) {
            if (isset($rules['required']) && $rules['required'] && ! isset($data[$field])) {
                $errors[$field] = "The {$field} field is required.";
            }
        }

        return $errors;
    }

    /**
     * Get all registered block types.
     */
    public function getBlockTypes(): array
    {
        return $this->registry->all();
    }

    /**
     * Get block type by name.
     */
    public function getBlockType(string $type): ?array
    {
        return $this->registry->get($type);
    }
}
