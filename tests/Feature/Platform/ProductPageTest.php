<?php

namespace Tests\Feature\Platform;

use Tests\TestCase;

class ProductPageTest extends TestCase
{
    public function test_product_page_is_accessible(): void
    {
        $response = $this->get('/product');

        $response->assertOk();
        $response->assertInertia(
            fn ($assert) => $assert->component('Public/Product')
        );
    }
}
