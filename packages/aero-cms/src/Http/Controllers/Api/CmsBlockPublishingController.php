<?php

namespace Aero\Cms\Http\Controllers\Api;

use Aero\Cms\Models\CmsPageBlock;
use Aero\Cms\Models\CmsBlockVersion;
use Aero\Cms\Models\CmsBlockPublish;
use Aero\Cms\Models\CmsBlockRevision;
use Aero\Cms\Http\Requests\PublishBlockRequest;
use Aero\Cms\Http\Requests\SchedulePublishRequest;
use Aero\Cms\Http\Requests\ArchiveBlockRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CmsBlockPublishingController
{
    /**
     * Get current publishing status of a block
     */
    public function show(CmsPageBlock $block): JsonResponse
    {
        try {
            $publish = $block->currentPublish()->first();
            $version = $block->getLatestPublishedVersion();

            return response()->json([
                'data' => [
                    'block_id' => $block->id,
                    'publishing_status' => $publish ? $publish->status : 'unpublished',
                    'is_published' => $block->isPublished(),
                    'current_publish' => $publish ? $this->formatPublish($publish) : null,
                    'latest_version' => $version ? $this->formatVersion($version) : null,
                    'version_count' => $block->versions()->count(),
                    'revision_count' => $block->revisions()->count(),
                ],
                'message' => 'Publishing status retrieved',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to retrieve publishing status',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Publish block immediately
     */
    public function publish(CmsPageBlock $block, PublishBlockRequest $request): JsonResponse
    {
        try {
            $userId = auth('landlord')->id();

            // Create version if needed
            $version = CmsBlockVersion::createFromBlock(
                $block,
                $request->input('version_summary', 'Published'),
                $request->input('version_description'),
                $userId
            );

            // Create or update publishing record
            $publish = $block->currentPublish()->first() ?? new CmsBlockPublish([
                'cms_page_block_id' => $block->id,
            ]);

            $publish->update([
                'cms_block_version_id' => $version->id,
                'visibility' => $request->input('visibility', 'public'),
                'is_featured' => $request->boolean('is_featured', false),
                'publish_notes' => $request->input('notes'),
            ]);

            // Publish
            $publish->publish($userId);

            // Record revision
            CmsBlockRevision::create([
                'cms_page_block_id' => $block->id,
                'cms_block_version_id' => $version->id,
                'revision_type' => 'published',
                'change_details' => 'Block published to ' . $publish->visibility,
                'user_id' => $userId,
                'reason' => $request->input('reason'),
            ]);

            return response()->json([
                'data' => $this->formatPublish($publish),
                'message' => 'Block published successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to publish block',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Schedule block for future publication
     */
    public function schedule(CmsPageBlock $block, SchedulePublishRequest $request): JsonResponse
    {
        try {
            $userId = auth('landlord')->id();
            $publishAt = \Carbon\Carbon::parse($request->input('scheduled_publish_at'));

            // Create version
            $version = CmsBlockVersion::createFromBlock(
                $block,
                $request->input('version_summary', 'Scheduled'),
                $request->input('version_description'),
                $userId
            );

            // Create or update publishing record
            $publish = $block->currentPublish()->first() ?? new CmsBlockPublish([
                'cms_page_block_id' => $block->id,
            ]);

            $publish->update([
                'cms_block_version_id' => $version->id,
                'visibility' => $request->input('visibility', 'public'),
                'is_featured' => $request->boolean('is_featured', false),
                'require_approval' => $request->boolean('require_approval', false),
            ]);

            $publish->schedulePublish($publishAt, $userId);

            // Update notes
            $publish->update([
                'publish_notes' => $request->input('notes'),
            ]);

            // Record revision
            CmsBlockRevision::create([
                'cms_page_block_id' => $block->id,
                'cms_block_version_id' => $version->id,
                'revision_type' => 'scheduled',
                'change_details' => 'Block scheduled for publication on ' . $publishAt->format('Y-m-d H:i:s'),
                'user_id' => $userId,
                'reason' => $request->input('reason'),
            ]);

            return response()->json([
                'data' => $this->formatPublish($publish),
                'message' => 'Block scheduled for publication',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to schedule publication',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Archive (unpublish) a block
     */
    public function archive(CmsPageBlock $block, ArchiveBlockRequest $request): JsonResponse
    {
        try {
            $userId = auth('landlord')->id();
            $publish = $block->currentPublish()->first();

            if (!$publish) {
                return response()->json([
                    'error' => 'Block is not published',
                ], 404);
            }

            $publish->archive($userId, $request->input('reason'));

            return response()->json([
                'data' => $this->formatPublish($publish),
                'message' => 'Block archived successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to archive block',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Restore archived block
     */
    public function restore(CmsPageBlock $block, Request $request): JsonResponse
    {
        try {
            $userId = auth('landlord')->id();
            $publish = $block->currentPublish()->first();

            if (!$publish || $publish->status !== 'archived') {
                return response()->json([
                    'error' => 'Block is not archived',
                ], 404);
            }

            $publish->restore(
                $userId,
                $request->input('visibility', 'public')
            );

            return response()->json([
                'data' => $this->formatPublish($publish),
                'message' => 'Block restored successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to restore block',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get version history
     */
    public function getVersions(CmsPageBlock $block, Request $request): JsonResponse
    {
        try {
            $perPage = $request->input('per_page', 10);

            $versions = $block->versions()
                ->orderByDesc('version_number')
                ->paginate($perPage);

            return response()->json([
                'data' => $versions->map(fn($v) => $this->formatVersion($v))->toArray(),
                'pagination' => [
                    'total' => $versions->total(),
                    'count' => $versions->count(),
                    'per_page' => $versions->perPage(),
                    'current_page' => $versions->currentPage(),
                    'last_page' => $versions->lastPage(),
                ],
                'message' => 'Versions retrieved',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to retrieve versions',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get revision history
     */
    public function getRevisions(CmsPageBlock $block, Request $request): JsonResponse
    {
        try {
            $perPage = $request->input('per_page', 20);
            $type = $request->input('type'); // Optional filter by revision type

            $query = $block->revisions();

            if ($type) {
                $query->where('revision_type', $type);
            }

            $revisions = $query->paginate($perPage);

            return response()->json([
                'data' => $revisions->map(fn($r) => $this->formatRevision($r))->toArray(),
                'pagination' => [
                    'total' => $revisions->total(),
                    'count' => $revisions->count(),
                    'per_page' => $revisions->perPage(),
                    'current_page' => $revisions->currentPage(),
                    'last_page' => $revisions->lastPage(),
                ],
                'message' => 'Revisions retrieved',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to retrieve revisions',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Compare two versions
     */
    public function compareVersions(CmsPageBlock $block, Request $request): JsonResponse
    {
        try {
            $versionId1 = $request->input('version_id_1');
            $versionId2 = $request->input('version_id_2');

            $v1 = CmsBlockVersion::findOrFail($versionId1);
            $v2 = CmsBlockVersion::findOrFail($versionId2);

            if ($v1->cms_page_block_id !== $block->id || $v2->cms_page_block_id !== $block->id) {
                return response()->json([
                    'error' => 'One or both versions do not belong to this block',
                ], 404);
            }

            return response()->json([
                'data' => [
                    'version_1' => $this->formatVersion($v1),
                    'version_2' => $this->formatVersion($v2),
                    'diff' => $v1->diffWith($v2),
                ],
                'message' => 'Version comparison retrieved',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to compare versions',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Revert to previous version
     */
    public function revertVersion(CmsPageBlock $block, Request $request): JsonResponse
    {
        try {
            $versionId = $request->input('version_id');
            $userId = auth('landlord')->id();

            $version = CmsBlockVersion::findOrFail($versionId);

            if ($version->cms_page_block_id !== $block->id) {
                return response()->json([
                    'error' => 'Version does not belong to this block',
                ], 404);
            }

            // Create new version from the reverted content
            $newVersion = CmsBlockVersion::create([
                'cms_page_block_id' => $block->id,
                'version_number' => CmsBlockVersion::getNextVersionNumber($block->id),
                'block_data' => $version->block_data,
                'metadata' => $version->metadata,
                'change_summary' => 'Reverted to v' . $version->version_number,
                'created_by_user_id' => $userId,
            ]);

            // Update block
            $block->update([
                'data' => $version->block_data,
                'metadata' => $version->metadata,
            ]);

            // Record revision
            CmsBlockRevision::create([
                'cms_page_block_id' => $block->id,
                'cms_block_version_id' => $newVersion->id,
                'revision_type' => 'reverted',
                'change_details' => 'Reverted to v' . $version->version_number,
                'user_id' => $userId,
                'reason' => $request->input('reason'),
            ]);

            return response()->json([
                'data' => $this->formatVersion($newVersion),
                'message' => 'Block reverted to previous version',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to revert version',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Format publishing record for response
     */
    private function formatPublish(CmsBlockPublish $publish): array
    {
        return [
            'id' => $publish->id,
            'block_id' => $publish->cms_page_block_id,
            'version_id' => $publish->cms_block_version_id,
            'status' => $publish->status,
            'visibility' => $publish->visibility,
            'workflow_state' => $publish->workflow_state,
            'is_featured' => $publish->is_featured,
            'scheduled_publish_at' => $publish->scheduled_publish_at,
            'published_at' => $publish->published_at,
            'archived_at' => $publish->archived_at,
            'scheduled_unpublish_at' => $publish->scheduled_unpublish_at,
            'status_label' => $publish->getStatusLabel(),
            'is_active' => $publish->isActive(),
            'ctr' => $publish->getClickThroughRate(),
            'views' => $publish->view_count,
            'interactions' => $publish->interaction_count,
            'created_at' => $publish->created_at,
            'updated_at' => $publish->updated_at,
        ];
    }

    /**
     * Format version for response
     */
    private function formatVersion(CmsBlockVersion $version): array
    {
        return [
            'id' => $version->id,
            'version_number' => $version->version_number,
            'version_label' => $version->version_label,
            'change_summary' => $version->change_summary,
            'change_description' => $version->change_description,
            'created_by_user_id' => $version->created_by_user_id,
            'edited_by_user_id' => $version->edited_by_user_id,
            'is_latest' => $version->isLatestVersion(),
            'created_at' => $version->created_at,
            'updated_at' => $version->updated_at,
        ];
    }

    /**
     * Format revision for response
     */
    private function formatRevision(CmsBlockRevision $revision): array
    {
        return [
            'id' => $revision->id,
            'revision_type' => $revision->revision_type,
            'type_label' => $revision->getTypeLabel(),
            'type_icon' => $revision->getTypeIcon(),
            'type_color' => $revision->getTypeColor(),
            'change_details' => $revision->change_details,
            'reason' => $revision->reason,
            'user_name' => $revision->getAuthorName(),
            'user_email' => $revision->user_email,
            'has_diff' => $revision->hasDiff(),
            'diff_summary' => $revision->getDiffSummary(),
            'is_approved' => $revision->isApproved(),
            'approved_at' => $revision->approved_at,
            'approved_by_user_id' => $revision->approved_by_user_id,
            'created_at' => $revision->created_at,
            'display_timestamp' => $revision->getDisplayTimestamp(),
        ];
    }
}
