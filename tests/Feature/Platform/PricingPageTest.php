<?php

namespace Tests\Feature\Platform;

use Tests\TestCase;

class PricingPageTest extends TestCase
{
    public function test_pricing_page_is_accessible(): void
    {
        $response = $this->get('/pricing');

        $response->assertOk();
        $response->assertInertia(
            fn ($assert) => $assert->component('Public/Pricing')
        );
    }
}
