<?php

namespace Aero\Core\Installation\Steps;

use Illuminate\Support\Facades\Log;

/**
 * Base Installation Step
 *
 * All installation steps should extend this class.
 * Each step is self-contained and can be executed, validated, and rolled back independently.
 *
 * Installation steps run in order and can have dependencies on previous steps.
 * If a step fails and is non-retriable, installation stops.
 */
abstract class BaseInstallationStep
{
    /**
     * Unique step identifier (e.g., 'config', 'database', 'migration')
     */
    abstract public function name(): string;

    /**
     * Human-readable step description
     */
    abstract public function description(): string;

    /**
     * Execution order (1-9)
     */
    abstract public function order(): int;

    /**
     * Array of step names this step depends on (must complete before this runs)
     */
    public function dependencies(): array
    {
        return [];
    }

    /**
     * Whether this step can be skipped
     */
    public function canSkip(): bool
    {
        return false;
    }

    /**
     * Whether this step is retriable if it fails
     */
    public function isRetriable(): bool
    {
        return false;
    }

    /**
     * Maximum attempts for this step
     */
    public function maxAttempts(): int
    {
        return $this->isRetriable() ? 3 : 1;
    }

    /**
     * Timeout in seconds
     */
    public function timeout(): int
    {
        return config('installation-migration-order.timeouts.per_step', 300);
    }

    /**
     * Execute this step
     * Should throw an exception if step fails
     *
     * @return array Result with status and metadata
     *
     * @throws \Exception
     */
    abstract public function execute(): array;

    /**
     * Validate that this step completed successfully
     *
     * @return bool True if validation passes
     */
    public function validate(): bool
    {
        return true;
    }

    /**
     * Rollback this step (undo its changes)
     * Only called if this step fails and a rollback is triggered
     */
    public function rollback(): void
    {
        // Override in subclass if rollback is needed
    }

    /**
     * Handle cleanup on failure (don't throw, just log)
     */
    public function onFailure(\Exception $exception): void
    {
        Log::error("Installation step '{$this->name()}' failed: ".$exception->getMessage(), [
            'exception' => $exception,
            'step' => $this->name(),
        ]);
    }

    /**
     * Handle post-execution tasks (even if failed)
     */
    public function onComplete(): void
    {
        // Override in subclass if needed
    }

    /**
     * Log step progress
     */
    protected function log(string $message, array $context = []): void
    {
        Log::info("[Installation::{$this->name()}] {$message}", $context);
    }

    /**
     * Log step warning
     */
    protected function warn(string $message, array $context = []): void
    {
        Log::warning("[Installation::{$this->name()}] {$message}", $context);
    }

    /**
     * Log step error
     */
    protected function error(string $message, array $context = []): void
    {
        Log::error("[Installation::{$this->name()}] {$message}", $context);
    }
}
