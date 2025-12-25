<?php

namespace Aero\Platform\Services;

use Aero\Platform\Models\ExchangeRate;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CurrencyService
{
    /**
     * Get exchange rate for a currency pair.
     */
    public function getRate(string $from, string $to, ?Carbon $date = null): float
    {
        // If same currency, return 1
        if ($from === $to) {
            return 1.0;
        }

        // Try to get from database
        $rate = ExchangeRate::getRate($from, $to, $date);

        if ($rate !== null) {
            return $rate;
        }

        // If not found and no specific date requested, try to fetch from API
        if ($date === null || $date->isToday()) {
            $rate = $this->fetchFromApi($from, $to);
            
            if ($rate !== null) {
                ExchangeRate::storeRate($from, $to, $rate, now(), 'api');
                return $rate;
            }
        }

        // Fallback: return 1.0
        Log::warning("Exchange rate not found for {$from}/{$to}, using 1.0");
        return 1.0;
    }

    /**
     * Convert amount from one currency to another.
     */
    public function convert(float $amount, string $from, string $to, ?Carbon $date = null): float
    {
        $rate = $this->getRate($from, $to, $date);
        return round($amount * $rate, 2);
    }

    /**
     * Convert to base currency (USD).
     */
    public function convertToBaseCurrency(float $amount, string $fromCurrency): float
    {
        return $this->convert($amount, $fromCurrency, 'USD');
    }

    /**
     * Fetch exchange rate from external API.
     */
    protected function fetchFromApi(string $from, string $to): ?float
    {
        $apiKey = config('services.exchangerate_api.key');

        if (!$apiKey) {
            return null;
        }

        try {
            $response = Http::timeout(5)
                ->get("https://v6.exchangerate-api.com/v6/{$apiKey}/pair/{$from}/{$to}");

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['conversion_rate'])) {
                    return (float) $data['conversion_rate'];
                }
            }
        } catch (\Exception $e) {
            Log::error("Failed to fetch exchange rate from API: {$e->getMessage()}");
        }

        return null;
    }

    /**
     * Sync all rates from API for supported currencies.
     */
    public function syncRatesFromApi(): int
    {
        $currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
        $synced = 0;

        foreach ($currencies as $from) {
            foreach ($currencies as $to) {
                if ($from === $to) {
                    continue;
                }

                $rate = $this->fetchFromApi($from, $to);
                
                if ($rate !== null) {
                    ExchangeRate::storeRate($from, $to, $rate, now(), 'api');
                    $synced++;
                }

                // Rate limiting - wait 200ms between API calls
                usleep(200000);
            }
        }

        return $synced;
    }

    /**
     * Get all supported currencies.
     */
    public function getSupportedCurrencies(): array
    {
        return [
            'USD' => ['symbol' => '$', 'name' => 'US Dollar'],
            'EUR' => ['symbol' => '€', 'name' => 'Euro'],
            'GBP' => ['symbol' => '£', 'name' => 'British Pound'],
            'CAD' => ['symbol' => 'C$', 'name' => 'Canadian Dollar'],
            'AUD' => ['symbol' => 'A$', 'name' => 'Australian Dollar'],
            'JPY' => ['symbol' => '¥', 'name' => 'Japanese Yen'],
        ];
    }

    /**
     * Get currency symbol.
     */
    public function getSymbol(string $currency): string
    {
        $currencies = $this->getSupportedCurrencies();
        return $currencies[$currency]['symbol'] ?? $currency;
    }

    /**
     * Format amount with currency symbol.
     */
    public function format(float $amount, string $currency): string
    {
        $symbol = $this->getSymbol($currency);
        
        // Special formatting for JPY (no decimals)
        if ($currency === 'JPY') {
            return $symbol . number_format($amount, 0);
        }

        return $symbol . number_format($amount, 2);
    }
}
