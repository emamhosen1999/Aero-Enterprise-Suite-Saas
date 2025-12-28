<?php

declare(strict_types=1);

namespace Aero\Platform\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Contracts\CoreWidgetCategory;
use Aero\Platform\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Billing Overview Widget for Admin Dashboard
 *
 * Displays financial metrics:
 * - Total revenue (MRR, ARR)
 * - Pending/Failed payments
 * - Invoice status
 * - Payment method distribution
 *
 * This is a FINANCIAL widget - shows revenue data.
 */
class BillingOverviewWidget extends AbstractDashboardWidget
{
    protected string $position = 'main_right';

    protected int $order = 5;

    protected int|string $span = 1;

    protected CoreWidgetCategory $category = CoreWidgetCategory::SUMMARY;

    /**
     * Sensitive financial data - require elevated permissions.
     */
    protected array $requiredPermissions = ['platform.view_billing'];

    public function getKey(): string
    {
        return 'platform.billing_overview';
    }

    public function getComponent(): string
    {
        return 'Widgets/Platform/BillingOverviewWidget';
    }

    public function getTitle(): string
    {
        return 'Billing Overview';
    }

    public function getDescription(): string
    {
        return 'Revenue and payment metrics';
    }

    public function getModuleCode(): string
    {
        return 'platform';
    }

    /**
     * Check if widget is enabled based on permissions.
     */
    public function isEnabled(): bool
    {
        // Always show for now - permission check in frontend
        return true;
    }

    /**
     * Get widget data for frontend.
     * Cached for 5 minutes.
     */
    public function getData(): array
    {
        return Cache::remember('platform.dashboard.billing_overview', 300, function () {
            return $this->calculateBillingMetrics();
        });
    }

    /**
     * Calculate billing metrics.
     */
    protected function calculateBillingMetrics(): array
    {
        $revenue = $this->getRevenueMetrics();
        $payments = $this->getPaymentMetrics();
        $invoices = $this->getInvoiceMetrics();
        $trends = $this->getRevenueTrends();

        return [
            'revenue' => $revenue,
            'payments' => $payments,
            'invoices' => $invoices,
            'trends' => $trends,
            'currency' => config('cashier.currency', 'usd'),
        ];
    }

    /**
     * Get revenue metrics (MRR, ARR, growth).
     */
    protected function getRevenueMetrics(): array
    {
        // Current MRR from active subscriptions
        $monthlyMrr = Subscription::query()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->where('billing_cycle', 'monthly')
            ->sum('amount');

        // Yearly subscriptions converted to monthly
        $yearlyMrr = Subscription::query()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->where('billing_cycle', 'yearly')
            ->selectRaw('SUM(amount / 12) as mrr')
            ->value('mrr') ?? 0;

        $currentMrr = (float) $monthlyMrr + (float) $yearlyMrr;
        $currentArr = $currentMrr * 12;

        // Last month's MRR for comparison
        $lastMonthEnd = Carbon::now()->subMonth()->endOfMonth();
        $lastMonthMrr = $this->getMrrAtDate($lastMonthEnd);

        // Calculate growth
        $mrrGrowth = $lastMonthMrr > 0
            ? round((($currentMrr - $lastMonthMrr) / $lastMonthMrr) * 100, 1)
            : 0;

        return [
            'mrr' => round($currentMrr, 2),
            'arr' => round($currentArr, 2),
            'mrrGrowth' => $mrrGrowth,
            'formatted' => [
                'mrr' => $this->formatCurrency($currentMrr),
                'arr' => $this->formatCurrency($currentArr),
            ],
        ];
    }

    /**
     * Get MRR at a specific date.
     */
    protected function getMrrAtDate(Carbon $date): float
    {
        $monthlyMrr = Subscription::query()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->where('billing_cycle', 'monthly')
            ->where('starts_at', '<=', $date)
            ->where(function ($q) use ($date) {
                $q->whereNull('ends_at')
                    ->orWhere('ends_at', '>', $date);
            })
            ->sum('amount');

        $yearlyMrr = Subscription::query()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->where('billing_cycle', 'yearly')
            ->where('starts_at', '<=', $date)
            ->where(function ($q) use ($date) {
                $q->whereNull('ends_at')
                    ->orWhere('ends_at', '>', $date);
            })
            ->selectRaw('SUM(amount / 12) as mrr')
            ->value('mrr') ?? 0;

        return (float) $monthlyMrr + (float) $yearlyMrr;
    }

    /**
     * Get payment status metrics.
     */
    protected function getPaymentMetrics(): array
    {
        // Past due subscriptions
        $pastDue = Subscription::where('status', Subscription::STATUS_PAST_DUE)->count();

        // Amount at risk (past due subscription amounts)
        $amountAtRisk = Subscription::where('status', Subscription::STATUS_PAST_DUE)
            ->sum('amount');

        // Successful payments this month (rough estimate from active subscriptions)
        $successfulThisMonth = Subscription::query()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->whereMonth('updated_at', now()->month)
            ->count();

        return [
            'pastDue' => $pastDue,
            'amountAtRisk' => round((float) $amountAtRisk, 2),
            'successfulThisMonth' => $successfulThisMonth,
            'formatted' => [
                'amountAtRisk' => $this->formatCurrency((float) $amountAtRisk),
            ],
        ];
    }

    /**
     * Get invoice metrics.
     */
    protected function getInvoiceMetrics(): array
    {
        // Check if we have a payments/invoices table
        try {
            if (\Schema::hasTable('payments')) {
                $pending = DB::table('payments')
                    ->where('status', 'pending')
                    ->count();

                $overdue = DB::table('payments')
                    ->where('status', 'pending')
                    ->where('due_date', '<', now())
                    ->count();

                return [
                    'pending' => $pending,
                    'overdue' => $overdue,
                    'hasInvoiceTable' => true,
                ];
            }
        } catch (\Exception $e) {
            // Table doesn't exist
        }

        // Fallback - estimate from subscriptions
        return [
            'pending' => Subscription::where('status', Subscription::STATUS_PAST_DUE)->count(),
            'overdue' => 0,
            'hasInvoiceTable' => false,
        ];
    }

    /**
     * Get revenue trends (last 6 months).
     */
    protected function getRevenueTrends(): array
    {
        $trends = [];

        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i)->endOfMonth();
            $mrr = $this->getMrrAtDate($date);

            $trends[] = [
                'month' => $date->format('M'),
                'year' => $date->format('Y'),
                'mrr' => round($mrr, 2),
            ];
        }

        return $trends;
    }

    /**
     * Format currency value.
     */
    protected function formatCurrency(float $amount): string
    {
        if ($amount >= 1000000) {
            return '$'.number_format($amount / 1000000, 2).'M';
        }
        if ($amount >= 1000) {
            return '$'.number_format($amount / 1000, 1).'K';
        }

        return '$'.number_format($amount, 2);
    }
}
