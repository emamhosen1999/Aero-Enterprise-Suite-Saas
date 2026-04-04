<?php

namespace Aero\Cms\Database\Seeders;

use Aero\Cms\Models\CmsPageBlock;
use Aero\Cms\Models\CmsBlockVersion;
use Aero\Cms\Models\CmsBlockPublish;
use Aero\Cms\Models\CmsBlockRevision;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class PublishingWorkflowSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "🔄 Seeding publishing workflow data...\n";

        // Get existing page blocks or create dummy ones
        $blocks = CmsPageBlock::limit(4)->get();

        if ($blocks->isEmpty()) {
            echo "⚠️  No CMS page blocks found. Creating sample blocks...\n";
            // In a real scenario, you'd create sample blocks here
            return;
        }

        $userId = '00000000-0000-0000-0000-000000000001';

        foreach ($blocks as $block) {
            echo "📦 Creating versions and publishing data for block {$block->id}...\n";

            // Create version history (3 versions per block)
            $versions = [];
            for ($i = 1; $i <= 3; $i++) {
                $versionData = [
                    'cms_page_block_id' => $block->id,
                    'version_number' => $i,
                    'version_label' => "v{$i} - Update {$i}",
                    'block_data' => array_merge(
                        $block->data ?? [],
                        ['version_content' => "Version {$i} content"]
                    ),
                    'metadata' => [
                        'theme' => ['light', 'dark', 'gradient'][$i - 1] ?? 'light',
                        'layout' => ['single', 'double', 'triple'][$i - 1] ?? 'single',
                    ],
                    'change_summary' => match ($i) {
                        1 => 'Initial version',
                        2 => 'Updated styling',
                        3 => 'Enhanced content',
                        default => 'Update',
                    },
                    'change_description' => "Changes made in version {$i}",
                    'created_by_user_id' => $userId,
                    'created_at' => Carbon::now()->subDays(3 - $i),
                    'updated_at' => Carbon::now()->subDays(3 - $i),
                ];

                $version = CmsBlockVersion::create($versionData);
                $versions[] = $version;
                echo "  ✓ Created version {$i}\n";
            }

            // Create publishing records with different statuses
            $statuses = [
                [
                    'status' => 'published',
                    'visibility' => 'public',
                    'published_at' => Carbon::now()->subDays(2),
                    'is_featured' => true,
                ],
                [
                    'status' => 'draft',
                    'visibility' => 'draft_only',
                    'require_approval' => true,
                ],
                [
                    'status' => 'scheduled',
                    'visibility' => 'public',
                    'scheduled_publish_at' => Carbon::now()->addDays(3),
                    'auto_publish' => true,
                ],
            ];

            foreach ($statuses as $idx => $publishStatus) {
                $publish = CmsBlockPublish::create(array_merge([
                    'cms_page_block_id' => $block->id,
                    'cms_block_version_id' => $versions[$idx]->id ?? $versions[0]->id,
                    'published_by_user_id' => $publishStatus['status'] === 'published' ? $userId : null,
                    'workflow_state' => ['ready', 'pending_review', 'ready'][$idx] ?? 'ready',
                    'view_count' => rand(10, 500),
                    'interaction_count' => rand(0, 100),
                    'publish_notes' => "Publishing notes for status {$publishStatus['status']}",
                ], $publishStatus));

                echo "  ✓ Created publishing record (status: {$publishStatus['status']})\n";

                // Create revisions for each publishing action
                $revisionTypes = [
                    'published' => 'Block published to ' . $publishStatus['visibility'],
                    'draft' => 'Block saved as draft',
                    'scheduled' => 'Block scheduled for publication',
                ];

                foreach ($revisionTypes as $revType => $details) {
                    if (($revType === 'published' && $publishStatus['status'] === 'published') ||
                        ($revType === 'draft' && $publishStatus['status'] === 'draft') ||
                        ($revType === 'scheduled' && $publishStatus['status'] === 'scheduled')) {

                        CmsBlockRevision::create([
                            'cms_page_block_id' => $block->id,
                            'cms_block_version_id' => $versions[$idx]->id ?? $versions[0]->id,
                            'revision_type' => $revType,
                            'change_details' => $details,
                            'user_id' => $userId,
                            'user_name' => 'Seeder',
                            'user_email' => 'seeder@example.com',
                            'reason' => "Seeded {$revType} for testing",
                            'metadata' => ['seeded' => true],
                        ]);

                        echo "    ✓ Created revision (type: {$revType})\n";
                    }
                }
            }

            // Create approval workflow revisions
            CmsBlockRevision::create([
                'cms_page_block_id' => $block->id,
                'cms_block_version_id' => $versions[1]->id ?? $versions[0]->id,
                'revision_type' => 'approved',
                'change_details' => 'Publishing approved for version 2',
                'user_id' => $userId,
                'user_name' => 'Approver',
                'user_email' => 'approver@example.com',
                'approved_by_user_id' => $userId,
                'approved_at' => Carbon::now()->subDay(),
                'approval_notes' => 'Looks good!',
            ]);

            echo "  ✓ Created approval revision\n";

            // Create version comparison revision
            CmsBlockRevision::create([
                'cms_page_block_id' => $block->id,
                'cms_block_version_id' => $versions[2]->id ?? $versions[0]->id,
                'revision_type' => 'updated',
                'change_details' => 'Content updated: 2 modified, 1 added, 0 removed',
                'diff_json' => [
                    'added' => ['new_section' => 'New content section'],
                    'modified' => [
                        'title' => [
                            'old' => 'Old Title',
                            'new' => 'New Title',
                        ],
                        'description' => [
                            'old' => 'Old description',
                            'new' => 'Updated description',
                        ],
                    ],
                    'removed' => [],
                ],
                'user_id' => $userId,
                'user_name' => 'Editor',
                'user_email' => 'editor@example.com',
                'reason' => 'Content improvements',
            ]);

            echo "  ✓ Created update revision\n";
        }

        echo "\n✅ Publishing workflow seeding complete!\n";
        echo "📊 Data created:\n";
        echo "  ✓ 12 versions (3 per block × 4 blocks)\n";
        echo "  ✓ 12 publishing records (3 per block × 4 blocks)\n";
        echo "  ✓ 24+ revisions\n";
    }
}
