<?php

namespace Tests\Feature\Platform;

use Tests\TestCase;

class SecurityPageTest extends TestCase
{
    public function test_security_page_is_accessible(): void
    {
        $response = $this->get('/legal/security');

        $response->assertOk();
        $response->assertInertia(
            fn ($assert) => $assert->component('Public/Legal/Security')
        );
    }
}
