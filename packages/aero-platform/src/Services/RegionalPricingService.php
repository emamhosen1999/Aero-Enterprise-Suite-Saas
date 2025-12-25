<?php

namespace Aero\Platform\Services;

class RegionalPricingService
{
    protected array $roundingRules = [
        'USD' => [
            9 => 9, 19 => 19, 29 => 29, 49 => 49, 99 => 99,
            199 => 199, 299 => 299, 499 => 499, 999 => 999,
        ],
        'EUR' => [
            9 => 8, 19 => 17, 29 => 26, 49 => 44, 99 => 89,
            199 => 179, 299 => 269, 499 => 449, 999 => 899,
        ],
        'GBP' => [
            9 => 7, 19 => 15, 29 => 23, 49 => 39, 99 => 79,
            199 => 159, 299 => 239, 499 => 399, 999 => 799,
        ],
        'CAD' => [
            9 => 12, 19 => 25, 29 => 39, 49 => 65, 99 => 129,
            199 => 259, 299 => 389, 499 => 649, 999 => 1299,
        ],
        'AUD' => [
            9 => 14, 19 => 29, 29 => 44, 49 => 74, 99 => 139,
            199 => 279, 299 => 419, 499 => 699, 999 => 1399,
        ],
        'JPY' => [
            9 => 1300, 19 => 2800, 29 => 4300, 49 => 7200, 99 => 11000,
            199 => 22000, 299 => 33000, 499 => 55000, 999 => 110000,
        ],
    ];

    public function __construct(protected CurrencyService $currencyService)
    {
    }

    /**
     * Calculate regional price with psychological pricing.
     */
    public function calculateRegionalPrice(float $usdPrice, string $targetCurrency): float
    {
        // If USD, return as-is
        if ($targetCurrency === 'USD') {
            return $usdPrice;
        }

        // Check if we have a rounding rule for this price point
        if (isset($this->roundingRules[$targetCurrency])) {
            foreach ($this->roundingRules[$targetCurrency] as $usdAmount => $regionalAmount) {
                if (abs($usdPrice - $usdAmount) < 0.01) {
                    return (float) $regionalAmount;
                }
            }
        }

        // No predefined rule, convert and apply psychological pricing
        $converted = $this->currencyService->convert($usdPrice, 'USD', $targetCurrency);
        return $this->applyRoundingLogic($converted, $targetCurrency);
    }

    /**
     * Apply psychological pricing rounding logic.
     */
    protected function applyRoundingLogic(float $amount, string $currency): float
    {
        return match($currency) {
            'JPY' => round($amount, -3), // Round to nearest 1000
            'EUR', 'GBP' => floor($amount) - 1, // €89 instead of €90
            'CAD', 'AUD' => ceil($amount / 10) * 10 - 1, // $129 instead of $130
            default => round($amount, -1), // Round to nearest 10
        };
    }

    /**
     * Calculate prices for all supported currencies.
     */
    public function calculateAllRegionalPrices(float $usdPrice): array
    {
        $prices = [];
        $currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

        foreach ($currencies as $currency) {
            $prices[$currency] = $this->calculateRegionalPrice($usdPrice, $currency);
        }

        return $prices;
    }

    /**
     * Get formatted price with currency symbol.
     */
    public function formatRegionalPrice(float $usdPrice, string $currency): string
    {
        $amount = $this->calculateRegionalPrice($usdPrice, $currency);
        return $this->currencyService->format($amount, $currency);
    }

    /**
     * Calculate discount price with regional pricing.
     */
    public function calculateDiscountedPrice(
        float $usdPrice,
        string $currency,
        float $discountPercentage
    ): float {
        $regionalPrice = $this->calculateRegionalPrice($usdPrice, $currency);
        $discounted = $regionalPrice * (1 - $discountPercentage / 100);
        
        // Apply rounding again for psychological pricing
        return $this->applyRoundingLogic($discounted, $currency);
    }

    /**
     * Batch calculate regional prices for multiple price points.
     */
    public function batchCalculate(array $usdPrices, string $targetCurrency): array
    {
        $results = [];

        foreach ($usdPrices as $key => $usdPrice) {
            $results[$key] = $this->calculateRegionalPrice($usdPrice, $targetCurrency);
        }

        return $results;
    }

    /**
     * Get the rounding rules for display/debugging.
     */
    public function getRoundingRules(): array
    {
        return $this->roundingRules;
    }

    /**
     * Add or update a custom rounding rule.
     */
    public function setRoundingRule(string $currency, float $usdPrice, float $regionalPrice): void
    {
        if (!isset($this->roundingRules[$currency])) {
            $this->roundingRules[$currency] = [];
        }

        $this->roundingRules[$currency][(int) $usdPrice] = $regionalPrice;
    }
}
