<?php

namespace Aero\Platform\Services\Billing;

use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Proration Service
 *
 * Handles plan upgrade/downgrade proration calculations for subscriptions.
 * Supports multiple proration strategies and billing models.
 */
class ProrationService
{
    /**
     * Proration strategies.
     */
    public const STRATEGY_FULL_CREDIT = 'full_credit';
    public const STRATEGY_PRORATED_CREDIT = 'prorated_credit';
    public const STRATEGY_NO_CREDIT = 'no_credit';
    public const STRATEGY_END_OF_PERIOD = 'end_of_period';

    /**
     * Billing models.
     */
    public const BILLING_MONTHLY = 'monthly';
    public const BILLING_YEARLY = 'yearly';
    public const BILLING_QUARTERLY = 'quarterly';

    /**
     * Calculate proration for plan change.
     *
     * @param array $currentPlan ['price' => float, 'billing_cycle' => string, 'name' => string]
     * @param array $newPlan ['price' => float, 'billing_cycle' => string, 'name' => string]
     * @param Carbon $changeDate
     * @param Carbon $periodStart
     * @param Carbon $periodEnd
     * @param string $strategy
     * @return array
     */
    public function calculatePlanChange(
        array $currentPlan,
        array $newPlan,
        Carbon $changeDate,
        Carbon $periodStart,
        Carbon $periodEnd,
        string $strategy = self::STRATEGY_PRORATED_CREDIT
    ): array {
        $totalDays = $periodStart->diffInDays($periodEnd);
        $daysRemaining = $changeDate->diffInDays($periodEnd);
        $daysUsed = $totalDays - $daysRemaining;

        // Calculate daily rates
        $currentDailyRate = $this->getDailyRate($currentPlan['price'], $currentPlan['billing_cycle']);
        $newDailyRate = $this->getDailyRate($newPlan['price'], $newPlan['billing_cycle']);

        $result = match ($strategy) {
            self::STRATEGY_FULL_CREDIT => $this->calculateFullCredit(
                $currentPlan,
                $newPlan,
                $daysRemaining,
                $totalDays,
                $currentDailyRate,
                $newDailyRate
            ),
            self::STRATEGY_PRORATED_CREDIT => $this->calculateProratedCredit(
                $currentPlan,
                $newPlan,
                $daysUsed,
                $daysRemaining,
                $totalDays,
                $currentDailyRate,
                $newDailyRate
            ),
            self::STRATEGY_NO_CREDIT => $this->calculateNoCredit(
                $newPlan,
                $daysRemaining,
                $newDailyRate
            ),
            self::STRATEGY_END_OF_PERIOD => $this->calculateEndOfPeriod(
                $currentPlan,
                $newPlan,
                $periodEnd
            ),
            default => throw new \InvalidArgumentException("Unknown proration strategy: {$strategy}"),
        };

        return array_merge($result, [
            'strategy' => $strategy,
            'change_date' => $changeDate->toIso8601String(),
            'period_start' => $periodStart->toIso8601String(),
            'period_end' => $periodEnd->toIso8601String(),
            'days_remaining' => $daysRemaining,
            'days_used' => $daysUsed,
            'total_days' => $totalDays,
            'is_upgrade' => $newPlan['price'] > $currentPlan['price'],
            'is_downgrade' => $newPlan['price'] < $currentPlan['price'],
        ]);
    }

    /**
     * Calculate proration for seat/quantity changes.
     */
    public function calculateSeatChange(
        int $currentSeats,
        int $newSeats,
        float $pricePerSeat,
        Carbon $changeDate,
        Carbon $periodStart,
        Carbon $periodEnd,
        string $billingCycle = self::BILLING_MONTHLY
    ): array {
        $totalDays = $periodStart->diffInDays($periodEnd);
        $daysRemaining = $changeDate->diffInDays($periodEnd);
        $seatDifference = $newSeats - $currentSeats;

        $dailyRatePerSeat = $this->getDailyRate($pricePerSeat, $billingCycle);
        $prorationAmount = $seatDifference * $dailyRatePerSeat * $daysRemaining;

        return [
            'current_seats' => $currentSeats,
            'new_seats' => $newSeats,
            'seat_difference' => $seatDifference,
            'price_per_seat' => $pricePerSeat,
            'daily_rate_per_seat' => round($dailyRatePerSeat, 4),
            'proration_amount' => round($prorationAmount, 2),
            'is_adding_seats' => $seatDifference > 0,
            'is_removing_seats' => $seatDifference < 0,
            'change_date' => $changeDate->toIso8601String(),
            'days_remaining' => $daysRemaining,
            'effective_immediately' => true,
            'breakdown' => [
                'seats_added' => max(0, $seatDifference),
                'seats_removed' => max(0, -$seatDifference),
                'per_seat_proration' => round($dailyRatePerSeat * $daysRemaining, 2),
            ],
        ];
    }

    /**
     * Calculate addon proration.
     */
    public function calculateAddonChange(
        array $addonChanges, // [['addon_id' => 1, 'action' => 'add|remove', 'price' => 10.00], ...]
        Carbon $changeDate,
        Carbon $periodStart,
        Carbon $periodEnd,
        string $billingCycle = self::BILLING_MONTHLY
    ): array {
        $totalDays = $periodStart->diffInDays($periodEnd);
        $daysRemaining = $changeDate->diffInDays($periodEnd);

        $additions = [];
        $removals = [];
        $totalCharge = 0;
        $totalCredit = 0;

        foreach ($addonChanges as $change) {
            $dailyRate = $this->getDailyRate($change['price'], $billingCycle);
            $proratedAmount = round($dailyRate * $daysRemaining, 2);

            if ($change['action'] === 'add') {
                $additions[] = [
                    'addon_id' => $change['addon_id'],
                    'name' => $change['name'] ?? "Addon #{$change['addon_id']}",
                    'full_price' => $change['price'],
                    'prorated_price' => $proratedAmount,
                    'daily_rate' => round($dailyRate, 4),
                ];
                $totalCharge += $proratedAmount;
            } else {
                $removals[] = [
                    'addon_id' => $change['addon_id'],
                    'name' => $change['name'] ?? "Addon #{$change['addon_id']}",
                    'full_price' => $change['price'],
                    'credit_amount' => $proratedAmount,
                    'daily_rate' => round($dailyRate, 4),
                ];
                $totalCredit += $proratedAmount;
            }
        }

        return [
            'additions' => $additions,
            'removals' => $removals,
            'total_charge' => $totalCharge,
            'total_credit' => $totalCredit,
            'net_amount' => round($totalCharge - $totalCredit, 2),
            'change_date' => $changeDate->toIso8601String(),
            'days_remaining' => $daysRemaining,
            'total_days' => $totalDays,
        ];
    }

    /**
     * Calculate mid-cycle upgrade with immediate billing.
     */
    public function calculateImmediateUpgrade(
        array $currentPlan,
        array $newPlan,
        Carbon $upgradeDate,
        Carbon $currentPeriodEnd
    ): array {
        $daysRemaining = $upgradeDate->diffInDays($currentPeriodEnd);

        // Credit for unused portion of current plan
        $currentDailyRate = $this->getDailyRate($currentPlan['price'], $currentPlan['billing_cycle']);
        $unusedCredit = round($currentDailyRate * $daysRemaining, 2);

        // Charge for new plan's remaining period
        $newDailyRate = $this->getDailyRate($newPlan['price'], $newPlan['billing_cycle']);
        $newPlanCharge = round($newDailyRate * $daysRemaining, 2);

        $netCharge = round($newPlanCharge - $unusedCredit, 2);

        return [
            'current_plan' => [
                'name' => $currentPlan['name'],
                'price' => $currentPlan['price'],
                'daily_rate' => round($currentDailyRate, 4),
                'unused_credit' => $unusedCredit,
            ],
            'new_plan' => [
                'name' => $newPlan['name'],
                'price' => $newPlan['price'],
                'daily_rate' => round($newDailyRate, 4),
                'prorated_charge' => $newPlanCharge,
            ],
            'net_charge' => $netCharge,
            'upgrade_date' => $upgradeDate->toIso8601String(),
            'period_end' => $currentPeriodEnd->toIso8601String(),
            'days_remaining' => $daysRemaining,
            'billing_action' => $netCharge > 0 ? 'charge' : ($netCharge < 0 ? 'credit' : 'none'),
            'next_full_billing_date' => $currentPeriodEnd->toIso8601String(),
            'next_billing_amount' => $newPlan['price'],
        ];
    }

    /**
     * Calculate scheduled downgrade (effective at period end).
     */
    public function calculateScheduledDowngrade(
        array $currentPlan,
        array $newPlan,
        Carbon $currentPeriodEnd
    ): array {
        $savings = round($currentPlan['price'] - $newPlan['price'], 2);
        $annualSavings = $this->calculateAnnualSavings(
            $currentPlan['price'],
            $newPlan['price'],
            $newPlan['billing_cycle']
        );

        return [
            'current_plan' => [
                'name' => $currentPlan['name'],
                'price' => $currentPlan['price'],
                'continues_until' => $currentPeriodEnd->toIso8601String(),
            ],
            'new_plan' => [
                'name' => $newPlan['name'],
                'price' => $newPlan['price'],
                'effective_date' => $currentPeriodEnd->toIso8601String(),
            ],
            'immediate_charge' => 0,
            'savings_per_period' => $savings,
            'annual_savings' => $annualSavings,
            'scheduled' => true,
            'can_cancel_until' => $currentPeriodEnd->copy()->subDay()->toIso8601String(),
            'features_lost' => [], // Populate based on plan comparison
        ];
    }

    /**
     * Generate invoice line items for proration.
     */
    public function generateProrationLineItems(array $proration): array
    {
        $lineItems = [];

        if (isset($proration['current_plan']) && isset($proration['current_plan']['unused_credit'])) {
            $lineItems[] = [
                'type' => 'credit',
                'description' => "Unused time on {$proration['current_plan']['name']}",
                'quantity' => $proration['days_remaining'],
                'unit' => 'days',
                'unit_price' => -$proration['current_plan']['daily_rate'],
                'amount' => -$proration['current_plan']['unused_credit'],
            ];
        }

        if (isset($proration['new_plan']) && isset($proration['new_plan']['prorated_charge'])) {
            $lineItems[] = [
                'type' => 'charge',
                'description' => "Prorated charge for {$proration['new_plan']['name']}",
                'quantity' => $proration['days_remaining'],
                'unit' => 'days',
                'unit_price' => $proration['new_plan']['daily_rate'],
                'amount' => $proration['new_plan']['prorated_charge'],
            ];
        }

        // Add seat changes
        if (isset($proration['seat_difference']) && $proration['seat_difference'] !== 0) {
            $action = $proration['seat_difference'] > 0 ? 'Additional' : 'Removed';
            $lineItems[] = [
                'type' => $proration['seat_difference'] > 0 ? 'charge' : 'credit',
                'description' => "{$action} seats ({$proration['seat_difference']} × {$proration['days_remaining']} days)",
                'quantity' => abs($proration['seat_difference']),
                'unit' => 'seats',
                'unit_price' => $proration['daily_rate_per_seat'] * $proration['days_remaining'],
                'amount' => $proration['proration_amount'],
            ];
        }

        // Add addon changes
        if (isset($proration['additions'])) {
            foreach ($proration['additions'] as $addon) {
                $lineItems[] = [
                    'type' => 'charge',
                    'description' => "Add-on: {$addon['name']} (prorated)",
                    'quantity' => 1,
                    'unit' => 'addon',
                    'unit_price' => $addon['prorated_price'],
                    'amount' => $addon['prorated_price'],
                ];
            }
        }

        if (isset($proration['removals'])) {
            foreach ($proration['removals'] as $addon) {
                $lineItems[] = [
                    'type' => 'credit',
                    'description' => "Remove Add-on: {$addon['name']} (credit)",
                    'quantity' => 1,
                    'unit' => 'addon',
                    'unit_price' => -$addon['credit_amount'],
                    'amount' => -$addon['credit_amount'],
                ];
            }
        }

        return $lineItems;
    }

    /**
     * Preview what the customer will be charged/credited.
     */
    public function previewChange(
        array $currentSubscription,
        array $changes,
        Carbon $changeDate
    ): array {
        $periodStart = Carbon::parse($currentSubscription['period_start']);
        $periodEnd = Carbon::parse($currentSubscription['period_end']);

        $prorations = [];
        $totalCharge = 0;
        $totalCredit = 0;

        // Plan change
        if (isset($changes['plan'])) {
            $planProration = $this->calculateImmediateUpgrade(
                $currentSubscription['plan'],
                $changes['plan'],
                $changeDate,
                $periodEnd
            );
            $prorations['plan_change'] = $planProration;

            if ($planProration['net_charge'] > 0) {
                $totalCharge += $planProration['net_charge'];
            } else {
                $totalCredit += abs($planProration['net_charge']);
            }
        }

        // Seat change
        if (isset($changes['seats'])) {
            $seatProration = $this->calculateSeatChange(
                $currentSubscription['seats'],
                $changes['seats'],
                $currentSubscription['plan']['price_per_seat'] ?? 0,
                $changeDate,
                $periodStart,
                $periodEnd
            );
            $prorations['seat_change'] = $seatProration;

            if ($seatProration['proration_amount'] > 0) {
                $totalCharge += $seatProration['proration_amount'];
            } else {
                $totalCredit += abs($seatProration['proration_amount']);
            }
        }

        // Addon changes
        if (isset($changes['addons'])) {
            $addonProration = $this->calculateAddonChange(
                $changes['addons'],
                $changeDate,
                $periodStart,
                $periodEnd
            );
            $prorations['addon_changes'] = $addonProration;
            $totalCharge += $addonProration['total_charge'];
            $totalCredit += $addonProration['total_credit'];
        }

        $netAmount = round($totalCharge - $totalCredit, 2);

        return [
            'prorations' => $prorations,
            'summary' => [
                'total_charges' => round($totalCharge, 2),
                'total_credits' => round($totalCredit, 2),
                'net_amount' => $netAmount,
                'billing_action' => $netAmount > 0 ? 'charge' : ($netAmount < 0 ? 'credit' : 'none'),
            ],
            'line_items' => $this->generateProrationLineItems(array_merge(...array_values($prorations))),
            'effective_date' => $changeDate->toIso8601String(),
            'next_billing' => [
                'date' => $periodEnd->toIso8601String(),
                'estimated_amount' => $this->estimateNextBilling($currentSubscription, $changes),
            ],
        ];
    }

    /**
     * Get daily rate for a given price and billing cycle.
     */
    protected function getDailyRate(float $price, string $billingCycle): float
    {
        return match ($billingCycle) {
            self::BILLING_MONTHLY => $price / 30,
            self::BILLING_QUARTERLY => $price / 90,
            self::BILLING_YEARLY => $price / 365,
            default => $price / 30,
        };
    }

    /**
     * Calculate full credit proration.
     */
    protected function calculateFullCredit(
        array $currentPlan,
        array $newPlan,
        int $daysRemaining,
        int $totalDays,
        float $currentDailyRate,
        float $newDailyRate
    ): array {
        // Full credit for remaining days of current plan
        $credit = $currentPlan['price'] * ($daysRemaining / $totalDays);
        $newPlanCharge = $newPlan['price'] * ($daysRemaining / $totalDays);

        return [
            'credit_amount' => round($credit, 2),
            'new_plan_charge' => round($newPlanCharge, 2),
            'net_charge' => round($newPlanCharge - $credit, 2),
            'method' => 'full_credit',
        ];
    }

    /**
     * Calculate prorated credit proration.
     */
    protected function calculateProratedCredit(
        array $currentPlan,
        array $newPlan,
        int $daysUsed,
        int $daysRemaining,
        int $totalDays,
        float $currentDailyRate,
        float $newDailyRate
    ): array {
        $usedAmount = $currentDailyRate * $daysUsed;
        $credit = $currentPlan['price'] - $usedAmount;
        $newPlanCharge = $newDailyRate * $daysRemaining;

        return [
            'amount_used' => round($usedAmount, 2),
            'credit_amount' => round($credit, 2),
            'new_plan_charge' => round($newPlanCharge, 2),
            'net_charge' => round($newPlanCharge - $credit, 2),
            'method' => 'prorated_credit',
        ];
    }

    /**
     * Calculate no credit proration.
     */
    protected function calculateNoCredit(
        array $newPlan,
        int $daysRemaining,
        float $newDailyRate
    ): array {
        $newPlanCharge = $newDailyRate * $daysRemaining;

        return [
            'credit_amount' => 0,
            'new_plan_charge' => round($newPlanCharge, 2),
            'net_charge' => round($newPlanCharge, 2),
            'method' => 'no_credit',
        ];
    }

    /**
     * Calculate end of period proration (scheduled change).
     */
    protected function calculateEndOfPeriod(
        array $currentPlan,
        array $newPlan,
        Carbon $periodEnd
    ): array {
        return [
            'credit_amount' => 0,
            'new_plan_charge' => 0,
            'net_charge' => 0,
            'scheduled_for' => $periodEnd->toIso8601String(),
            'future_price' => $newPlan['price'],
            'method' => 'end_of_period',
        ];
    }

    /**
     * Calculate annual savings for downgrade.
     */
    protected function calculateAnnualSavings(
        float $currentPrice,
        float $newPrice,
        string $billingCycle
    ): float {
        $periodSavings = $currentPrice - $newPrice;

        return match ($billingCycle) {
            self::BILLING_MONTHLY => round($periodSavings * 12, 2),
            self::BILLING_QUARTERLY => round($periodSavings * 4, 2),
            self::BILLING_YEARLY => round($periodSavings, 2),
            default => round($periodSavings * 12, 2),
        };
    }

    /**
     * Estimate next billing amount after changes.
     */
    protected function estimateNextBilling(array $subscription, array $changes): float
    {
        $baseAmount = $changes['plan']['price'] ?? $subscription['plan']['price'];

        // Add seat costs
        $seats = $changes['seats'] ?? $subscription['seats'] ?? 1;
        $pricePerSeat = $subscription['plan']['price_per_seat'] ?? 0;
        $seatCost = ($seats - 1) * $pricePerSeat; // First seat included in base

        // Add addon costs
        $addonCost = 0;
        if (isset($changes['addons'])) {
            foreach ($changes['addons'] as $addon) {
                if ($addon['action'] === 'add') {
                    $addonCost += $addon['price'];
                }
            }
        }

        return round($baseAmount + $seatCost + $addonCost, 2);
    }
}
