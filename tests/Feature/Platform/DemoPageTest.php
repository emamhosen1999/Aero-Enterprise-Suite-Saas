<?php

namespace Tests\Feature\Platform;

use Tests\TestCase;

class DemoPageTest extends TestCase
{
    public function test_demo_page_is_accessible(): void
    {
        $response = $this->get('/demo');

        $response->assertOk();
        $response->assertInertia(
            fn ($assert) => $assert->component('Public/Demo')
        );
    }
}
