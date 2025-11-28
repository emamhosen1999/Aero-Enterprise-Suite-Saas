<?php

namespace Tests\Feature\Platform;

use Tests\TestCase;

class CookiesPageTest extends TestCase
{
    public function test_cookies_page_is_accessible(): void
    {
        $response = $this->get('/legal/cookies');

        $response->assertOk();
        $response->assertInertia(
            fn ($assert) => $assert->component('Public/Legal/Cookies')
        );
    }
}
