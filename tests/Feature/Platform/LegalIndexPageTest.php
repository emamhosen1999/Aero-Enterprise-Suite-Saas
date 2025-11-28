<?php

namespace Tests\Feature\Platform;

use Tests\TestCase;

class LegalIndexPageTest extends TestCase
{
    public function test_legal_index_page_is_accessible(): void
    {
        $response = $this->get('/legal');

        $response->assertOk();
        $response->assertInertia(
            fn ($assert) => $assert->component('Public/Legal/Index')
        );
    }
}
