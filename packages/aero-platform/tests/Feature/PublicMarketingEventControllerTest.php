<?php

declare(strict_types=1);

namespace Aero\Platform\Tests\Feature;

use Tests\TestCase;

class PublicMarketingEventControllerTest extends TestCase
{
    public function test_marketing_event_endpoint_accepts_valid_payload(): void
    {
        $response = $this->postJson(route('api.platform.v1.marketing-events.store'), [
            'event_name' => 'public_cta_click',
            'cta_name' => 'start_free_trial',
            'page' => '/pricing',
            'location' => 'pricing_final_cta',
            'destination' => 'platform.register.index',
            'experiment_key' => 'pricing_final_cta',
            'experiment_variant' => 'control',
            'session_id' => 'session_abc123',
            'occurred_at' => now()->getTimestampMs(),
            'metadata' => [
                'source' => 'automated_test',
            ],
        ]);

        $response->assertAccepted()->assertJson([
            'success' => true,
            'message' => 'Marketing event received.',
        ]);
    }

    public function test_marketing_event_endpoint_validates_required_fields(): void
    {
        $response = $this->postJson(route('api.platform.v1.marketing-events.store'), []);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'event_name',
                'cta_name',
            ]);
    }
}