<?php

declare(strict_types=1);

namespace Aero\Platform\Jobs;

use Aero\Platform\Models\ExchangeRate;
use Aero\Platform\Services\CurrencyService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Sync Exchange Rates Job
 *
 * Scheduled job to synchronize exchange rates from external API:
 * - Runs daily at midnight
 * - Fetches rates from exchangerate-api.com
 * - Updates database with current rates
 * - Maintains historical rate data
 * - Supports: USD, EUR, GBP, CAD, AUD, JPY
 */
class SyncExchangeRatesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected array $currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

    /**
     * Execute the job.
     */
    public function handle(CurrencyService $currencyService): void
    {
        Log::info('Starting exchange rate synchronization');

        $ratesUpdated = 0;
        $ratesFailed = 0;

        // Sync rates for each currency pair
        foreach ($this->currencies as $fromCurrency) {
            foreach ($this->currencies as $toCurrency) {
                if ($fromCurrency === $toCurrency) {
                    continue; // Skip same currency
                }

                try {
                    // Fetch rate from API
                    $rate = $currencyService->getRate($fromCurrency, $toCurrency, true); // Force fresh from API

                    if ($rate) {
                        // Store in database
                        ExchangeRate::create([
                            'from_currency' => $fromCurrency,
                            'to_currency' => $toCurrency,
                            'rate' => $rate,
                            'source' => 'exchangerate-api',
                            'synced_at' => now(),
                        ]);

                        $ratesUpdated++;
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to sync rate {$fromCurrency}->{$toCurrency}: {$e->getMessage()}");
                    $ratesFailed++;
                }
            }
        }

        // Clean up old rates (keep last 90 days)
        $deleted = ExchangeRate::where('synced_at', '<', now()->subDays(90))->delete();

        Log::info("Exchange rate sync complete: {$ratesUpdated} updated, {$ratesFailed} failed, {$deleted} old rates deleted");
    }
}
