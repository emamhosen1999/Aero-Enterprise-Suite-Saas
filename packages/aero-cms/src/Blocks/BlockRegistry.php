<?php

declare(strict_types=1);

namespace Aero\Cms\Blocks;

use Illuminate\Support\Collection;
use InvalidArgumentException;

class BlockRegistry
{
    /**
     * Registered block types.
     *
     * @var array<string, BlockSchema>
     */
    protected array $blocks = [];

    /**
     * Register a block schema.
     */
    public function register(BlockSchema $schema): self
    {
        $this->blocks[$schema->getType()] = $schema;

        return $this;
    }

    /**
     * Register multiple block schemas.
     *
     * @param  array<BlockSchema>  $schemas
     */
    public function registerMany(array $schemas): self
    {
        foreach ($schemas as $schema) {
            $this->register($schema);
        }

        return $this;
    }

    /**
     * Get a block schema by type.
     */
    public function get(string $type): ?BlockSchema
    {
        return $this->blocks[$type] ?? null;
    }

    /**
     * Check if a block type exists.
     */
    public function has(string $type): bool
    {
        return isset($this->blocks[$type]);
    }

    /**
     * Get all registered block schemas.
     *
     * @return Collection<string, BlockSchema>
     */
    public function all(): Collection
    {
        return collect($this->blocks);
    }

    /**
     * Get blocks by category.
     *
     * @return Collection<string, BlockSchema>
     */
    public function byCategory(string $category): Collection
    {
        return $this->all()->filter(
            fn (BlockSchema $schema) => $schema->getCategory() === $category
        );
    }

    /**
     * Get all categories.
     *
     * @return Collection<string>
     */
    public function categories(): Collection
    {
        return $this->all()
            ->map(fn (BlockSchema $schema) => $schema->getCategory())
            ->unique()
            ->values();
    }

    /**
     * Validate content against a block schema.
     *
     * @throws InvalidArgumentException
     */
    public function validateContent(string $type, array $content): array
    {
        $schema = $this->get($type);

        if (! $schema) {
            throw new InvalidArgumentException("Unknown block type: {$type}");
        }

        return $schema->validate($content);
    }

    /**
     * Get default content for a block type.
     */
    public function getDefaults(string $type): array
    {
        $schema = $this->get($type);

        if (! $schema) {
            throw new InvalidArgumentException("Unknown block type: {$type}");
        }

        return $schema->getDefaults();
    }

    /**
     * Export all schemas as an array for the frontend.
     */
    public function toArray(): array
    {
        return $this->all()
            ->map(fn (BlockSchema $schema) => $schema->toArray())
            ->toArray();
    }

    /**
     * Register blocks from config.
     */
    public function registerFromConfig(): self
    {
        $blocks = config('cms.blocks', []);

        foreach ($blocks as $type => $config) {
            $this->register(BlockSchema::fromConfig($type, $config));
        }

        return $this;
    }
}
