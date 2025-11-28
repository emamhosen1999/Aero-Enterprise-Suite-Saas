<?php

namespace Tests\Feature\Platform;

use Tests\TestCase;

class AboutPageTest extends TestCase
{
    public function test_about_page_is_accessible(): void
    {
        $response = $this->get('/about');

        $response->assertOk();
        $response->assertInertia(
            fn ($assert) => $assert->component('Public/About')
        );
    }
}
