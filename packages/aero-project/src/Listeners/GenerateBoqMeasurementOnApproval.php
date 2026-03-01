<?php

namespace Aero\Project\Listeners;

use Aero\Project\Services\AutoMeasurementService;
use Aero\Rfi\Events\RfiApproved;

/**
 * GenerateBoqMeasurementOnApproval Listener
 *
 * Listens for RfiApproved events and triggers automatic measurement generation.
 * This is the decoupled bridge between RFI module and Quantity Survey.
 */
class GenerateBoqMeasurementOnApproval
{
    public function __construct(
        protected AutoMeasurementService $measurementService
    ) {}

    public function handle(RfiApproved $event): void
    {
        $this->measurementService->handleRfiApproval($event);
    }
}
