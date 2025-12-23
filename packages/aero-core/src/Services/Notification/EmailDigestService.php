<?php

namespace Aero\Core\Services\Notification;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Email Digest Service
 *
 * Aggregates and sends daily/weekly email digests to users.
 * Consolidates multiple notifications into organized summaries.
 */
class EmailDigestService
{
    /**
     * Digest frequencies.
     */
    public const FREQUENCY_IMMEDIATE = 'immediate';
    public const FREQUENCY_DAILY = 'daily';
    public const FREQUENCY_WEEKLY = 'weekly';
    public const FREQUENCY_DISABLED = 'disabled';

    /**
     * Content categories.
     */
    public const CATEGORY_TASKS = 'tasks';
    public const CATEGORY_APPROVALS = 'approvals';
    public const CATEGORY_MENTIONS = 'mentions';
    public const CATEGORY_UPDATES = 'updates';
    public const CATEGORY_REPORTS = 'reports';
    public const CATEGORY_ALERTS = 'alerts';
    public const CATEGORY_REMINDERS = 'reminders';

    /**
     * Generate daily digest for a user.
     */
    public function generateDailyDigest(int $userId, ?Carbon $date = null): array
    {
        $date = $date ?? now()->subDay();

        $digestContent = [
            'user_id' => $userId,
            'type' => self::FREQUENCY_DAILY,
            'period' => [
                'start' => $date->copy()->startOfDay()->toIso8601String(),
                'end' => $date->copy()->endOfDay()->toIso8601String(),
            ],
            'sections' => [],
            'summary' => [
                'total_items' => 0,
                'categories' => [],
            ],
            'generated_at' => now()->toIso8601String(),
        ];

        // Collect notifications by category
        $categories = $this->getCategoriesForUser($userId);

        foreach ($categories as $category) {
            $items = $this->getItemsForCategory($userId, $category, $date, $date);

            if (!empty($items)) {
                $digestContent['sections'][$category] = [
                    'title' => $this->getCategoryTitle($category),
                    'items' => $items,
                    'count' => count($items),
                ];
                $digestContent['summary']['total_items'] += count($items);
                $digestContent['summary']['categories'][$category] = count($items);
            }
        }

        // Add action items summary
        $digestContent['action_items'] = $this->getActionItems($userId);

        // Add quick stats
        $digestContent['quick_stats'] = $this->getQuickStats($userId, $date);

        return $digestContent;
    }

    /**
     * Generate weekly digest for a user.
     */
    public function generateWeeklyDigest(int $userId, ?Carbon $weekStart = null): array
    {
        $weekStart = $weekStart ?? now()->subWeek()->startOfWeek();
        $weekEnd = $weekStart->copy()->endOfWeek();

        $digestContent = [
            'user_id' => $userId,
            'type' => self::FREQUENCY_WEEKLY,
            'period' => [
                'start' => $weekStart->toIso8601String(),
                'end' => $weekEnd->toIso8601String(),
                'week_number' => $weekStart->weekOfYear,
            ],
            'sections' => [],
            'highlights' => [],
            'summary' => [
                'total_items' => 0,
                'categories' => [],
            ],
            'generated_at' => now()->toIso8601String(),
        ];

        // Collect weekly data
        $categories = $this->getCategoriesForUser($userId);

        foreach ($categories as $category) {
            $items = $this->getItemsForCategory($userId, $category, $weekStart, $weekEnd);

            if (!empty($items)) {
                $digestContent['sections'][$category] = [
                    'title' => $this->getCategoryTitle($category),
                    'items' => array_slice($items, 0, 10), // Limit per category
                    'count' => count($items),
                    'has_more' => count($items) > 10,
                ];
                $digestContent['summary']['total_items'] += count($items);
                $digestContent['summary']['categories'][$category] = count($items);
            }
        }

        // Add weekly highlights
        $digestContent['highlights'] = $this->getWeeklyHighlights($userId, $weekStart, $weekEnd);

        // Add weekly statistics comparison
        $digestContent['statistics'] = $this->getWeeklyStatistics($userId, $weekStart, $weekEnd);

        // Add upcoming week preview
        $digestContent['upcoming'] = $this->getUpcomingWeekPreview($userId);

        return $digestContent;
    }

    /**
     * Send digest email to user.
     */
    public function sendDigest(array $digest, array $userPreferences = []): array
    {
        $userId = $digest['user_id'];

        // Check if digest has content
        if ($digest['summary']['total_items'] === 0 && empty($digest['action_items'])) {
            return [
                'sent' => false,
                'reason' => 'no_content',
                'user_id' => $userId,
            ];
        }

        // Prepare email data
        $emailData = [
            'subject' => $this->generateSubject($digest),
            'preheader' => $this->generatePreheader($digest),
            'content' => $digest,
            'preferences_url' => $userPreferences['preferences_url'] ?? '/settings/notifications',
            'unsubscribe_url' => $userPreferences['unsubscribe_url'] ?? '/settings/notifications/unsubscribe',
        ];

        // In production, send via Laravel Mail
        Log::info('Sending digest email', [
            'user_id' => $userId,
            'type' => $digest['type'],
            'items_count' => $digest['summary']['total_items'],
        ]);

        return [
            'sent' => true,
            'user_id' => $userId,
            'type' => $digest['type'],
            'sent_at' => now()->toIso8601String(),
            'items_count' => $digest['summary']['total_items'],
        ];
    }

    /**
     * Process daily digests for all eligible users.
     */
    public function processDailyDigests(): array
    {
        $results = [
            'processed' => 0,
            'sent' => 0,
            'skipped' => 0,
            'errors' => 0,
            'started_at' => now()->toIso8601String(),
        ];

        // Get users with daily digest preference
        $users = $this->getUsersWithFrequency(self::FREQUENCY_DAILY);

        foreach ($users as $user) {
            try {
                $digest = $this->generateDailyDigest($user['id']);
                $result = $this->sendDigest($digest, $user['preferences'] ?? []);

                $results['processed']++;
                if ($result['sent']) {
                    $results['sent']++;
                } else {
                    $results['skipped']++;
                }
            } catch (\Exception $e) {
                $results['errors']++;
                Log::error('Failed to send daily digest', [
                    'user_id' => $user['id'],
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $results['completed_at'] = now()->toIso8601String();

        return $results;
    }

    /**
     * Process weekly digests for all eligible users.
     */
    public function processWeeklyDigests(): array
    {
        $results = [
            'processed' => 0,
            'sent' => 0,
            'skipped' => 0,
            'errors' => 0,
            'started_at' => now()->toIso8601String(),
        ];

        // Get users with weekly digest preference
        $users = $this->getUsersWithFrequency(self::FREQUENCY_WEEKLY);

        foreach ($users as $user) {
            try {
                $digest = $this->generateWeeklyDigest($user['id']);
                $result = $this->sendDigest($digest, $user['preferences'] ?? []);

                $results['processed']++;
                if ($result['sent']) {
                    $results['sent']++;
                } else {
                    $results['skipped']++;
                }
            } catch (\Exception $e) {
                $results['errors']++;
                Log::error('Failed to send weekly digest', [
                    'user_id' => $user['id'],
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $results['completed_at'] = now()->toIso8601String();

        return $results;
    }

    /**
     * Get user's digest preferences.
     */
    public function getUserPreferences(int $userId): array
    {
        // In production, fetch from database
        return [
            'frequency' => self::FREQUENCY_DAILY,
            'categories' => [
                self::CATEGORY_TASKS => true,
                self::CATEGORY_APPROVALS => true,
                self::CATEGORY_MENTIONS => true,
                self::CATEGORY_UPDATES => true,
                self::CATEGORY_REPORTS => false,
                self::CATEGORY_ALERTS => true,
                self::CATEGORY_REMINDERS => true,
            ],
            'delivery_time' => '08:00',
            'timezone' => 'UTC',
            'include_action_items' => true,
            'include_statistics' => true,
            'include_upcoming' => true,
        ];
    }

    /**
     * Update user's digest preferences.
     */
    public function updateUserPreferences(int $userId, array $preferences): array
    {
        $validFrequencies = [
            self::FREQUENCY_IMMEDIATE,
            self::FREQUENCY_DAILY,
            self::FREQUENCY_WEEKLY,
            self::FREQUENCY_DISABLED,
        ];

        if (isset($preferences['frequency']) && !in_array($preferences['frequency'], $validFrequencies)) {
            return [
                'success' => false,
                'error' => 'Invalid frequency',
            ];
        }

        // Validate categories
        if (isset($preferences['categories'])) {
            $validCategories = [
                self::CATEGORY_TASKS,
                self::CATEGORY_APPROVALS,
                self::CATEGORY_MENTIONS,
                self::CATEGORY_UPDATES,
                self::CATEGORY_REPORTS,
                self::CATEGORY_ALERTS,
                self::CATEGORY_REMINDERS,
            ];

            foreach (array_keys($preferences['categories']) as $category) {
                if (!in_array($category, $validCategories)) {
                    return [
                        'success' => false,
                        'error' => "Invalid category: {$category}",
                    ];
                }
            }
        }

        // In production, save to database
        Log::info('Updated digest preferences', [
            'user_id' => $userId,
            'preferences' => $preferences,
        ]);

        return [
            'success' => true,
            'user_id' => $userId,
            'preferences' => $preferences,
        ];
    }

    /**
     * Preview digest content without sending.
     */
    public function previewDigest(int $userId, string $type = self::FREQUENCY_DAILY): array
    {
        return match ($type) {
            self::FREQUENCY_DAILY => $this->generateDailyDigest($userId),
            self::FREQUENCY_WEEKLY => $this->generateWeeklyDigest($userId),
            default => throw new \InvalidArgumentException("Invalid digest type: {$type}"),
        };
    }

    /**
     * Get categories enabled for user.
     */
    protected function getCategoriesForUser(int $userId): array
    {
        $preferences = $this->getUserPreferences($userId);
        $enabledCategories = [];

        foreach ($preferences['categories'] as $category => $enabled) {
            if ($enabled) {
                $enabledCategories[] = $category;
            }
        }

        return $enabledCategories;
    }

    /**
     * Get items for a specific category.
     */
    protected function getItemsForCategory(int $userId, string $category, Carbon $startDate, Carbon $endDate): array
    {
        // In production, query notifications/activities from database
        // This is a placeholder structure

        return match ($category) {
            self::CATEGORY_TASKS => $this->getTaskItems($userId, $startDate, $endDate),
            self::CATEGORY_APPROVALS => $this->getApprovalItems($userId, $startDate, $endDate),
            self::CATEGORY_MENTIONS => $this->getMentionItems($userId, $startDate, $endDate),
            self::CATEGORY_UPDATES => $this->getUpdateItems($userId, $startDate, $endDate),
            self::CATEGORY_REPORTS => $this->getReportItems($userId, $startDate, $endDate),
            self::CATEGORY_ALERTS => $this->getAlertItems($userId, $startDate, $endDate),
            self::CATEGORY_REMINDERS => $this->getReminderItems($userId, $startDate, $endDate),
            default => [],
        };
    }

    /**
     * Get category title for display.
     */
    protected function getCategoryTitle(string $category): string
    {
        return match ($category) {
            self::CATEGORY_TASKS => '📋 Tasks',
            self::CATEGORY_APPROVALS => '✅ Pending Approvals',
            self::CATEGORY_MENTIONS => '@️ Mentions',
            self::CATEGORY_UPDATES => '📢 Updates',
            self::CATEGORY_REPORTS => '📊 Reports',
            self::CATEGORY_ALERTS => '⚠️ Alerts',
            self::CATEGORY_REMINDERS => '🔔 Reminders',
            default => ucfirst($category),
        };
    }

    /**
     * Get action items requiring attention.
     */
    protected function getActionItems(int $userId): array
    {
        // In production, query for items requiring user action
        return [
            'pending_approvals' => 0,
            'overdue_tasks' => 0,
            'unread_mentions' => 0,
            'expiring_items' => 0,
        ];
    }

    /**
     * Get quick stats for the period.
     */
    protected function getQuickStats(int $userId, Carbon $date): array
    {
        return [
            'tasks_completed' => 0,
            'approvals_processed' => 0,
            'messages_received' => 0,
            'documents_uploaded' => 0,
        ];
    }

    /**
     * Get weekly highlights.
     */
    protected function getWeeklyHighlights(int $userId, Carbon $startDate, Carbon $endDate): array
    {
        return [
            'top_achievements' => [],
            'key_updates' => [],
            'important_announcements' => [],
        ];
    }

    /**
     * Get weekly statistics comparison.
     */
    protected function getWeeklyStatistics(int $userId, Carbon $startDate, Carbon $endDate): array
    {
        return [
            'this_week' => [
                'tasks_completed' => 0,
                'approvals' => 0,
                'meetings' => 0,
            ],
            'last_week' => [
                'tasks_completed' => 0,
                'approvals' => 0,
                'meetings' => 0,
            ],
            'trends' => [
                'tasks_completed' => 0, // percentage change
                'approvals' => 0,
                'meetings' => 0,
            ],
        ];
    }

    /**
     * Get upcoming week preview.
     */
    protected function getUpcomingWeekPreview(int $userId): array
    {
        return [
            'scheduled_meetings' => [],
            'upcoming_deadlines' => [],
            'planned_events' => [],
        ];
    }

    /**
     * Generate email subject.
     */
    protected function generateSubject(array $digest): string
    {
        $itemCount = $digest['summary']['total_items'];

        if ($digest['type'] === self::FREQUENCY_DAILY) {
            $date = Carbon::parse($digest['period']['start'])->format('M j');
            return "Your Daily Digest - {$date} ({$itemCount} updates)";
        }

        $weekNumber = $digest['period']['week_number'] ?? '';
        return "Your Weekly Digest - Week {$weekNumber} ({$itemCount} updates)";
    }

    /**
     * Generate email preheader.
     */
    protected function generatePreheader(array $digest): string
    {
        $categories = array_keys($digest['summary']['categories']);
        $topCategories = array_slice($categories, 0, 3);

        return implode(', ', array_map(fn($c) => ucfirst($c), $topCategories)) . ' and more...';
    }

    /**
     * Get users with specific digest frequency.
     */
    protected function getUsersWithFrequency(string $frequency): array
    {
        // In production, query users with this preference
        return [];
    }

    // Placeholder methods for fetching category items
    protected function getTaskItems(int $userId, Carbon $startDate, Carbon $endDate): array { return []; }
    protected function getApprovalItems(int $userId, Carbon $startDate, Carbon $endDate): array { return []; }
    protected function getMentionItems(int $userId, Carbon $startDate, Carbon $endDate): array { return []; }
    protected function getUpdateItems(int $userId, Carbon $startDate, Carbon $endDate): array { return []; }
    protected function getReportItems(int $userId, Carbon $startDate, Carbon $endDate): array { return []; }
    protected function getAlertItems(int $userId, Carbon $startDate, Carbon $endDate): array { return []; }
    protected function getReminderItems(int $userId, Carbon $startDate, Carbon $endDate): array { return []; }
}
