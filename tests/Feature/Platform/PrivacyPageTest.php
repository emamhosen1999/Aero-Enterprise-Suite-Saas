<?php

namespace Tests\Feature\Platform;

use Tests\TestCase;

class PrivacyPageTest extends TestCase
{
    public function test_privacy_page_is_accessible(): void
    {
        $response = $this->get('/privacy');

        $response->assertOk();
        $response->assertInertia(
            fn ($assert) => $assert->component('Public/Legal/Privacy')
        );
    }
}
