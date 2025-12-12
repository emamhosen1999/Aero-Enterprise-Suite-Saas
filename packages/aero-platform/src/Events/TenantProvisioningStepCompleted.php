<?php

namespace Aero\Platform\Events;

use Aero\Platform\Models\Tenant;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * TenantProvisioningStepCompleted Event
 *
 * Broadcast when a provisioning step is completed.
 * Can be used with Laravel Echo for real-time progress updates.
 */
class TenantProvisioningStepCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Tenant $tenant;

    public string $step;

    public string $message;

    /**
     * Create a new event instance.
     */
    public function __construct(Tenant $tenant, string $step, string $message)
    {
        $this->tenant = $tenant;
        $this->step = $step;
        $this->message = $message;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('tenant.provisioning.'.$this->tenant->id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'provisioning.step.completed';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'tenant_id' => $this->tenant->id,
            'step' => $this->step,
            'message' => $this->message,
            'status' => $this->tenant->status,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
