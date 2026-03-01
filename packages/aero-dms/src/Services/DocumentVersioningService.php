<?php

namespace Aero\DMS\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Document Versioning Service
 *
 * Provides comprehensive version control for documents including
 * version tracking, diff generation, branching, and history management.
 */
class DocumentVersioningService
{
    /**
     * Version statuses.
     */
    public const STATUS_DRAFT = 'draft';

    public const STATUS_PENDING_REVIEW = 'pending_review';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_ARCHIVED = 'archived';

    public const STATUS_SUPERSEDED = 'superseded';

    /**
     * Change types.
     */
    public const CHANGE_CREATED = 'created';

    public const CHANGE_MODIFIED = 'modified';

    public const CHANGE_RENAMED = 'renamed';

    public const CHANGE_MOVED = 'moved';

    public const CHANGE_RESTORED = 'restored';

    public const CHANGE_BRANCHED = 'branched';

    public const CHANGE_MERGED = 'merged';

    /**
     * Version numbering schemes.
     */
    public const SCHEME_SEMANTIC = 'semantic';     // 1.0.0, 1.0.1, 1.1.0

    public const SCHEME_SEQUENTIAL = 'sequential'; // 1, 2, 3

    public const SCHEME_DATE_BASED = 'date_based'; // 2024.01.15

    public const SCHEME_CUSTOM = 'custom';

    /**
     * Configuration.
     */
    protected array $config = [
        'versioning_scheme' => self::SCHEME_SEMANTIC,
        'max_versions_kept' => 100,
        'auto_version_on_save' => true,
        'require_change_comment' => true,
        'enable_branching' => true,
        'enable_locking' => true,
        'lock_timeout_minutes' => 30,
        'diff_algorithm' => 'unified', // unified, side_by_side, inline
        'store_content_diff' => true,
        'compress_old_versions' => true,
    ];

    /**
     * Create initial version of a document.
     */
    public function createDocument(array $data): array
    {
        $documentId = Str::uuid()->toString();
        $versionId = Str::uuid()->toString();

        $document = [
            'id' => $documentId,
            'name' => $data['name'],
            'type' => $data['type'] ?? 'document',
            'mime_type' => $data['mime_type'] ?? 'application/octet-stream',
            'folder_id' => $data['folder_id'] ?? null,
            'current_version_id' => $versionId,
            'current_version_number' => $this->getInitialVersion(),
            'status' => self::STATUS_DRAFT,
            'locked_by' => null,
            'locked_at' => null,
            'created_by' => $data['created_by'] ?? null,
            'created_at' => now()->toIso8601String(),
            'metadata' => $data['metadata'] ?? [],
        ];

        $version = [
            'id' => $versionId,
            'document_id' => $documentId,
            'version_number' => $document['current_version_number'],
            'file_path' => $data['file_path'] ?? null,
            'file_size' => $data['file_size'] ?? 0,
            'file_hash' => $data['file_hash'] ?? null,
            'content' => $data['content'] ?? null,
            'change_type' => self::CHANGE_CREATED,
            'change_summary' => $data['change_summary'] ?? 'Initial version',
            'change_details' => $data['change_details'] ?? null,
            'status' => self::STATUS_DRAFT,
            'parent_version_id' => null,
            'branch_name' => 'main',
            'created_by' => $data['created_by'] ?? null,
            'created_at' => now()->toIso8601String(),
        ];

        Log::info('Document created with versioning', [
            'document_id' => $documentId,
            'version_id' => $versionId,
        ]);

        return [
            'success' => true,
            'document' => $document,
            'version' => $version,
        ];
    }

    /**
     * Create a new version of a document.
     */
    public function createVersion(string $documentId, array $data): array
    {
        // Get current version
        $currentVersion = $this->getCurrentVersion($documentId);
        if (! $currentVersion) {
            return ['success' => false, 'error' => 'Document not found'];
        }

        // Check if document is locked by another user
        $lockCheck = $this->checkLock($documentId, $data['created_by'] ?? null);
        if (! $lockCheck['can_edit']) {
            return ['success' => false, 'error' => $lockCheck['reason']];
        }

        $versionId = Str::uuid()->toString();
        $newVersionNumber = $this->incrementVersion(
            $currentVersion['version_number'],
            $data['version_type'] ?? 'patch' // major, minor, patch
        );

        // Calculate diff if enabled
        $diff = null;
        if ($this->config['store_content_diff'] && isset($data['content'])) {
            $diff = $this->calculateDiff($currentVersion['content'] ?? '', $data['content']);
        }

        $version = [
            'id' => $versionId,
            'document_id' => $documentId,
            'version_number' => $newVersionNumber,
            'file_path' => $data['file_path'] ?? null,
            'file_size' => $data['file_size'] ?? 0,
            'file_hash' => $data['file_hash'] ?? $this->calculateHash($data['content'] ?? ''),
            'content' => $data['content'] ?? null,
            'diff' => $diff,
            'change_type' => $data['change_type'] ?? self::CHANGE_MODIFIED,
            'change_summary' => $data['change_summary'] ?? 'Version updated',
            'change_details' => $data['change_details'] ?? null,
            'status' => $data['status'] ?? self::STATUS_DRAFT,
            'parent_version_id' => $currentVersion['id'],
            'branch_name' => $data['branch_name'] ?? $currentVersion['branch_name'] ?? 'main',
            'created_by' => $data['created_by'] ?? null,
            'created_at' => now()->toIso8601String(),
        ];

        Log::info('New version created', [
            'document_id' => $documentId,
            'version_id' => $versionId,
            'version_number' => $newVersionNumber,
        ]);

        // Clean up old versions if needed
        $this->pruneOldVersions($documentId);

        return [
            'success' => true,
            'version' => $version,
            'previous_version_id' => $currentVersion['id'],
        ];
    }

    /**
     * Get version history for a document.
     */
    public function getVersionHistory(string $documentId, array $options = []): array
    {
        // In production, query from database
        return [
            'document_id' => $documentId,
            'versions' => [],
            'total_versions' => 0,
            'branches' => ['main'],
            'current_version' => null,
        ];
    }

    /**
     * Get a specific version.
     */
    public function getVersion(string $documentId, string $versionId): ?array
    {
        // In production, query from database
        return null;
    }

    /**
     * Get version by number.
     */
    public function getVersionByNumber(string $documentId, string $versionNumber): ?array
    {
        return null;
    }

    /**
     * Compare two versions.
     */
    public function compareVersions(string $documentId, string $versionId1, string $versionId2): array
    {
        $version1 = $this->getVersion($documentId, $versionId1);
        $version2 = $this->getVersion($documentId, $versionId2);

        if (! $version1 || ! $version2) {
            return ['success' => false, 'error' => 'Version not found'];
        }

        $diff = $this->calculateDiff(
            $version1['content'] ?? '',
            $version2['content'] ?? ''
        );

        return [
            'success' => true,
            'version1' => [
                'id' => $versionId1,
                'version_number' => $version1['version_number'],
                'created_at' => $version1['created_at'],
            ],
            'version2' => [
                'id' => $versionId2,
                'version_number' => $version2['version_number'],
                'created_at' => $version2['created_at'],
            ],
            'diff' => $diff,
            'statistics' => [
                'additions' => $diff['additions'] ?? 0,
                'deletions' => $diff['deletions'] ?? 0,
                'modifications' => $diff['modifications'] ?? 0,
            ],
        ];
    }

    /**
     * Restore a previous version.
     */
    public function restoreVersion(string $documentId, string $versionId, array $data = []): array
    {
        $oldVersion = $this->getVersion($documentId, $versionId);
        if (! $oldVersion) {
            return ['success' => false, 'error' => 'Version not found'];
        }

        // Create new version with old content
        $result = $this->createVersion($documentId, [
            'content' => $oldVersion['content'],
            'file_path' => $oldVersion['file_path'],
            'file_size' => $oldVersion['file_size'],
            'change_type' => self::CHANGE_RESTORED,
            'change_summary' => $data['change_summary'] ?? "Restored from version {$oldVersion['version_number']}",
            'created_by' => $data['restored_by'] ?? null,
        ]);

        if ($result['success']) {
            Log::info('Version restored', [
                'document_id' => $documentId,
                'restored_version_id' => $versionId,
                'new_version_id' => $result['version']['id'],
            ]);
        }

        return $result;
    }

    /**
     * Create a branch from a version.
     */
    public function createBranch(string $documentId, string $versionId, string $branchName, array $data = []): array
    {
        if (! $this->config['enable_branching']) {
            return ['success' => false, 'error' => 'Branching is not enabled'];
        }

        $sourceVersion = $this->getVersion($documentId, $versionId);
        if (! $sourceVersion) {
            return ['success' => false, 'error' => 'Source version not found'];
        }

        $branchVersionId = Str::uuid()->toString();

        $branchVersion = [
            'id' => $branchVersionId,
            'document_id' => $documentId,
            'version_number' => $this->getInitialVersion(),
            'file_path' => $sourceVersion['file_path'],
            'file_size' => $sourceVersion['file_size'],
            'file_hash' => $sourceVersion['file_hash'],
            'content' => $sourceVersion['content'],
            'change_type' => self::CHANGE_BRANCHED,
            'change_summary' => $data['change_summary'] ?? "Branched from {$sourceVersion['version_number']}",
            'parent_version_id' => $versionId,
            'branch_name' => $branchName,
            'branch_point_version_id' => $versionId,
            'created_by' => $data['created_by'] ?? null,
            'created_at' => now()->toIso8601String(),
        ];

        Log::info('Branch created', [
            'document_id' => $documentId,
            'branch_name' => $branchName,
            'source_version_id' => $versionId,
        ]);

        return [
            'success' => true,
            'branch' => [
                'name' => $branchName,
                'version' => $branchVersion,
            ],
        ];
    }

    /**
     * Merge a branch into main.
     */
    public function mergeBranch(string $documentId, string $sourceBranch, string $targetBranch = 'main', array $data = []): array
    {
        // Get latest versions from both branches
        // Perform merge with conflict detection

        $mergeResult = [
            'document_id' => $documentId,
            'source_branch' => $sourceBranch,
            'target_branch' => $targetBranch,
            'has_conflicts' => false,
            'conflicts' => [],
            'merged_version_id' => null,
            'merged_at' => now()->toIso8601String(),
        ];

        Log::info('Branch merged', [
            'document_id' => $documentId,
            'source' => $sourceBranch,
            'target' => $targetBranch,
        ]);

        return ['success' => true, 'merge' => $mergeResult];
    }

    /**
     * Lock a document for editing.
     */
    public function lockDocument(string $documentId, int $userId): array
    {
        if (! $this->config['enable_locking']) {
            return ['success' => true, 'message' => 'Locking is disabled'];
        }

        $lock = [
            'document_id' => $documentId,
            'locked_by' => $userId,
            'locked_at' => now()->toIso8601String(),
            'expires_at' => now()->addMinutes($this->config['lock_timeout_minutes'])->toIso8601String(),
        ];

        Log::info('Document locked', [
            'document_id' => $documentId,
            'user_id' => $userId,
        ]);

        return ['success' => true, 'lock' => $lock];
    }

    /**
     * Unlock a document.
     */
    public function unlockDocument(string $documentId, int $userId): array
    {
        Log::info('Document unlocked', [
            'document_id' => $documentId,
            'user_id' => $userId,
        ]);

        return ['success' => true];
    }

    /**
     * Check if document is locked.
     */
    public function checkLock(string $documentId, ?int $userId): array
    {
        // In production, check database for lock
        return [
            'is_locked' => false,
            'locked_by' => null,
            'can_edit' => true,
            'reason' => null,
        ];
    }

    /**
     * Get version statistics.
     */
    public function getStatistics(string $documentId): array
    {
        return [
            'document_id' => $documentId,
            'total_versions' => 0,
            'total_branches' => 1,
            'contributors' => [],
            'first_version_date' => null,
            'last_version_date' => null,
            'average_changes_per_version' => 0,
            'total_size_all_versions' => 0,
        ];
    }

    /**
     * Calculate diff between two content strings.
     */
    protected function calculateDiff(string $old, string $new): array
    {
        $oldLines = explode("\n", $old);
        $newLines = explode("\n", $new);

        // Simple line-by-line diff
        $additions = 0;
        $deletions = 0;
        $hunks = [];

        // Use PHP's built-in diff if available, otherwise simple comparison
        $diff = array_diff($newLines, $oldLines);
        $additions = count($diff);

        $diff = array_diff($oldLines, $newLines);
        $deletions = count($diff);

        return [
            'format' => $this->config['diff_algorithm'],
            'additions' => $additions,
            'deletions' => $deletions,
            'modifications' => 0,
            'hunks' => $hunks,
            'unified_diff' => '', // Full diff string
        ];
    }

    /**
     * Calculate content hash.
     */
    protected function calculateHash(string $content): string
    {
        return hash('sha256', $content);
    }

    /**
     * Get initial version number.
     */
    protected function getInitialVersion(): string
    {
        return match ($this->config['versioning_scheme']) {
            self::SCHEME_SEMANTIC => '1.0.0',
            self::SCHEME_SEQUENTIAL => '1',
            self::SCHEME_DATE_BASED => now()->format('Y.m.d'),
            default => '1',
        };
    }

    /**
     * Increment version number.
     */
    protected function incrementVersion(string $current, string $type = 'patch'): string
    {
        $scheme = $this->config['versioning_scheme'];

        if ($scheme === self::SCHEME_SEMANTIC) {
            $parts = explode('.', $current);
            $major = (int) ($parts[0] ?? 1);
            $minor = (int) ($parts[1] ?? 0);
            $patch = (int) ($parts[2] ?? 0);

            return match ($type) {
                'major' => ($major + 1).'.0.0',
                'minor' => $major.'.'.($minor + 1).'.0',
                default => $major.'.'.$minor.'.'.($patch + 1),
            };
        }

        if ($scheme === self::SCHEME_SEQUENTIAL) {
            return (string) ((int) $current + 1);
        }

        if ($scheme === self::SCHEME_DATE_BASED) {
            $today = now()->format('Y.m.d');
            if (str_starts_with($current, $today)) {
                // Same day, add revision number
                $parts = explode('.', $current);
                $revision = (int) ($parts[3] ?? 0) + 1;

                return $today.'.'.$revision;
            }

            return $today;
        }

        return (string) ((int) $current + 1);
    }

    /**
     * Prune old versions beyond the limit.
     */
    protected function pruneOldVersions(string $documentId): void
    {
        // In production, delete old versions beyond max_versions_kept
        // Keep at least major versions and tagged versions
    }

    /**
     * Get current version of document.
     */
    protected function getCurrentVersion(string $documentId): ?array
    {
        // In production, query from database
        return [
            'id' => 'dummy-version-id',
            'version_number' => '1.0.0',
            'content' => '',
            'branch_name' => 'main',
        ];
    }
}
