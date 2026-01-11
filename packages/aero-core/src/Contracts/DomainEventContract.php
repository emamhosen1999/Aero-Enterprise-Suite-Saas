<?php

declare(strict_types=1);

namespace Aero\Core\Contracts;

/**
 * Domain Event Contract
 *
 * All domain events must implement this interface for:
 * - Consistent event structure
 * - Audit logging
 * - HRMAC-aware notification routing
 */
interface DomainEventContract
{
    /**
     * Get the module code this event belongs to.
     */
    public function getModuleCode(): string;

    /**
     * Get the sub-module code this event belongs to.
     */
    public function getSubModuleCode(): string;

    /**
     * Get the component code (optional).
     */
    public function getComponentCode(): ?string;

    /**
     * Get the action code that triggered this event.
     */
    public function getActionCode(): string;

    /**
     * Get the user ID who triggered this event.
     */
    public function getActorUserId(): ?int;

    /**
     * Get the primary entity ID affected by this event.
     */
    public function getEntityId(): int;

    /**
     * Get the entity type (e.g., 'employee', 'leave', 'attendance').
     */
    public function getEntityType(): string;

    /**
     * Get event metadata for audit logging.
     */
    public function getAuditMetadata(): array;

    /**
     * Get context for notification recipient resolution.
     * Should include relevant IDs for scope filtering (department_id, manager_id, etc.)
     */
    public function getNotificationContext(): array;

    /**
     * Check if this event should trigger notifications.
     */
    public function shouldNotify(): bool;

    /**
     * Get the event timestamp.
     */
    public function getTimestamp(): \DateTimeInterface;
}
