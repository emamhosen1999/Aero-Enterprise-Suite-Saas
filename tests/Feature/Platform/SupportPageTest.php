<?php

namespace Tests\Feature\Platform;

use Tests\TestCase;

class SupportPageTest extends TestCase
{
    public function test_support_page_is_accessible(): void
    {
        $response = $this->get('/support');

        $response->assertOk();
        $response->assertInertia(
            fn ($assert) => $assert->component('Public/Support')
        );
    }
}
