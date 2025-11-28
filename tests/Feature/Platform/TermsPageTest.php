<?php

namespace Tests\Feature\Platform;

use Tests\TestCase;

class TermsPageTest extends TestCase
{
    public function test_terms_page_is_accessible(): void
    {
        $response = $this->get('/terms');

        $response->assertOk();
        $response->assertInertia(
            fn ($assert) => $assert->component('Public/Legal/Terms')
        );
    }
}
