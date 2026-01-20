<?php

namespace Aero\Cms\Tests\Unit;

use Aero\Cms\Blocks\BlockRegistry;
use Aero\Cms\Blocks\BlockSchema;
use Tests\TestCase;

class BlockRegistryTest extends TestCase
{
    protected BlockRegistry $registry;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->registry = new BlockRegistry();
    }

    /** @test */
    public function it_can_register_a_block()
    {
        $schema = BlockSchema::make('test_block', 'Test Block')
            ->description('A test block')
            ->category('content')
            ->addField('title', 'string', 'Title')
            ->defaults(['title' => 'Default Title']);

        $this->registry->register('test_block', $schema);

        $this->assertTrue($this->registry->has('test_block'));
    }

    /** @test */
    public function it_can_retrieve_registered_block()
    {
        $schema = BlockSchema::make('hero', 'Hero Section')
            ->description('Full-width hero section')
            ->category('hero')
            ->addField('title', 'string', 'Title')
            ->addField('subtitle', 'string', 'Subtitle');

        $this->registry->register('hero', $schema);

        $retrieved = $this->registry->get('hero');

        $this->assertEquals('hero', $retrieved['type']);
        $this->assertEquals('Hero Section', $retrieved['label']);
    }

    /** @test */
    public function it_returns_null_for_unregistered_block()
    {
        $result = $this->registry->get('nonexistent_block');

        $this->assertNull($result);
    }

    /** @test */
    public function it_can_list_all_registered_blocks()
    {
        $this->registry->register('block_1', BlockSchema::make('block_1', 'Block 1'));
        $this->registry->register('block_2', BlockSchema::make('block_2', 'Block 2'));
        $this->registry->register('block_3', BlockSchema::make('block_3', 'Block 3'));

        $all = $this->registry->all();

        $this->assertCount(3, $all);
    }

    /** @test */
    public function it_can_list_blocks_by_category()
    {
        $this->registry->register('hero_1', 
            BlockSchema::make('hero_1', 'Hero 1')->category('hero')
        );
        $this->registry->register('hero_2', 
            BlockSchema::make('hero_2', 'Hero 2')->category('hero')
        );
        $this->registry->register('content_1', 
            BlockSchema::make('content_1', 'Content 1')->category('content')
        );

        $heroBlocks = $this->registry->byCategory('hero');
        $contentBlocks = $this->registry->byCategory('content');

        $this->assertCount(2, $heroBlocks);
        $this->assertCount(1, $contentBlocks);
    }

    /** @test */
    public function it_can_unregister_a_block()
    {
        $this->registry->register('removable', 
            BlockSchema::make('removable', 'Removable Block')
        );

        $this->assertTrue($this->registry->has('removable'));

        $this->registry->unregister('removable');

        $this->assertFalse($this->registry->has('removable'));
    }

    /** @test */
    public function it_can_get_block_types()
    {
        $this->registry->register('block_a', BlockSchema::make('block_a', 'Block A'));
        $this->registry->register('block_b', BlockSchema::make('block_b', 'Block B'));

        $types = $this->registry->types();

        $this->assertContains('block_a', $types);
        $this->assertContains('block_b', $types);
    }

    /** @test */
    public function it_validates_block_type()
    {
        $this->registry->register('valid_block', 
            BlockSchema::make('valid_block', 'Valid Block')
        );

        $this->assertTrue($this->registry->isValidType('valid_block'));
        $this->assertFalse($this->registry->isValidType('invalid_block'));
    }

    /** @test */
    public function it_can_get_block_defaults()
    {
        $schema = BlockSchema::make('with_defaults', 'Block With Defaults')
            ->defaults([
                'title' => 'Default Title',
                'color' => '#000000',
                'enabled' => true,
            ]);

        $this->registry->register('with_defaults', $schema);

        $defaults = $this->registry->getDefaults('with_defaults');

        $this->assertEquals('Default Title', $defaults['title']);
        $this->assertEquals('#000000', $defaults['color']);
        $this->assertTrue($defaults['enabled']);
    }

    /** @test */
    public function it_can_get_block_schema()
    {
        $schema = BlockSchema::make('schema_test', 'Schema Test')
            ->addField('title', 'string', 'Title', ['maxLength' => 100])
            ->addField('count', 'number', 'Count', ['minimum' => 0, 'maximum' => 100])
            ->addField('enabled', 'boolean', 'Enabled');

        $this->registry->register('schema_test', $schema);

        $retrievedSchema = $this->registry->getSchema('schema_test');

        $this->assertArrayHasKey('properties', $retrievedSchema);
        $this->assertArrayHasKey('title', $retrievedSchema['properties']);
        $this->assertArrayHasKey('count', $retrievedSchema['properties']);
        $this->assertArrayHasKey('enabled', $retrievedSchema['properties']);
    }

    /** @test */
    public function it_can_register_from_config_array()
    {
        $config = [
            'categories' => [
                ['id' => 'hero', 'label' => 'Hero Sections'],
                ['id' => 'content', 'label' => 'Content'],
            ],
            'blocks' => [
                [
                    'type' => 'hero_standard',
                    'label' => 'Hero Standard',
                    'description' => 'Standard hero section',
                    'category' => 'hero',
                    'icon' => 'photo',
                    'schema' => [
                        'properties' => [
                            'title' => ['type' => 'string', 'title' => 'Title'],
                        ],
                    ],
                    'defaults' => ['title' => 'Welcome'],
                ],
                [
                    'type' => 'text_block',
                    'label' => 'Text Block',
                    'description' => 'Rich text content',
                    'category' => 'content',
                    'icon' => 'document-text',
                    'schema' => [
                        'properties' => [
                            'text' => ['type' => 'string', 'title' => 'Text'],
                        ],
                    ],
                    'defaults' => ['text' => ''],
                ],
            ],
        ];

        $this->registry->registerFromConfig($config);

        $this->assertTrue($this->registry->has('hero_standard'));
        $this->assertTrue($this->registry->has('text_block'));
    }

    /** @test */
    public function it_can_get_categories()
    {
        $config = [
            'categories' => [
                ['id' => 'hero', 'label' => 'Hero Sections'],
                ['id' => 'content', 'label' => 'Content'],
                ['id' => 'forms', 'label' => 'Forms'],
            ],
            'blocks' => [],
        ];

        $this->registry->registerFromConfig($config);

        $categories = $this->registry->getCategories();

        $this->assertCount(3, $categories);
        $this->assertEquals('hero', $categories[0]['id']);
    }

    /** @test */
    public function it_provides_json_serializable_output()
    {
        $schema = BlockSchema::make('json_test', 'JSON Test')
            ->description('Test description')
            ->category('content')
            ->icon('star')
            ->addField('title', 'string', 'Title')
            ->defaults(['title' => 'Default']);

        $this->registry->register('json_test', $schema);

        $output = $this->registry->toJson();

        $this->assertJson($output);
        
        $decoded = json_decode($output, true);
        $this->assertArrayHasKey('blocks', $decoded);
    }
}
