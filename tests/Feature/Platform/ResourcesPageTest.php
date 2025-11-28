<?php

namespace Tests\Feature\Platform;

use Tests\TestCase;

class ResourcesPageTest extends TestCase
{
    public function test_resources_page_is_accessible(): void
    {
        $response = $this->get('/resources');

        $response->assertOk();
        $response->assertInertia(
            fn ($assert) => $assert->component('Public/Resources')
        );
    }
}
