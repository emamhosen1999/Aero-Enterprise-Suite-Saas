<?php

namespace App\Providers;

use App\Models\Jurisdiction;
use App\Repositories\Contracts\AttendanceSettingRepositoryInterface;
use App\Repositories\Contracts\CompanySettingRepositoryInterface;
use App\Repositories\Eloquent\AttendanceSettingRepository;
use App\Repositories\Eloquent\CompanySettingRepository;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            CompanySettingRepositoryInterface::class,
            CompanySettingRepository::class
        );

        $this->app->bind(
            AttendanceSettingRepositoryInterface::class,
            AttendanceSettingRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        // Share application version with all Inertia responses
        Inertia::share([
            'app' => [
                'version' => config('app.version'),
                'name' => config('app.name'),
            ],
        ]);

        Validator::extend('custom_location', function ($attribute, $value, $parameters, $validator) {
            // Regex for validating chainage format with optional text afterwards
            $chainageRegex = '/([A-Z]*K[0-9]+(?:\+[0-9]+(?:\.[0-9]+)?)?)-([A-Z]*K[0-9]+(?:\+[0-9]+(?:\.[0-9]+)?)?)|([A-Z]*K[0-9]+)(.*)/';

            // Check if the location value matches the chainage format
            if (! preg_match($chainageRegex, $value, $matches)) {
                $validator->errors()->add($attribute, 'DailyWork has an invalid location format: '.$value);

                return false; // Invalid format
            } else {
                // Extract start and end chainages, if available
                $startChainage = $matches[1] === '' ? $matches[0] : $matches[1]; // e.g., K05+900 or K30
                $endChainage = $matches[2] === '' ? null : $matches[2]; // e.g., K06+400 (optional)

                // Convert chainages to a comparable string format for jurisdiction check
                $startChainageFormatted = $this->formatChainage($startChainage);
                $endChainageFormatted = $endChainage ? $this->formatChainage($endChainage) : null;
            }

            // Retrieve all jurisdictions
            $jurisdictions = Jurisdiction::all();

            // Check for jurisdiction based on the formatted chainages
            $jurisdictionFound = false;
            Log::info($matches);
            Log::info('Chainage: '.$startChainageFormatted.'-'.($endChainageFormatted ?? 'N/A'));

            foreach ($jurisdictions as $jurisdiction) {
                $formattedStartJurisdiction = $this->formatChainage($jurisdiction->start_chainage);
                $formattedEndJurisdiction = $this->formatChainage($jurisdiction->end_chainage);

                // Check if the start chainage is within the jurisdiction's range
                if ($startChainageFormatted >= $formattedStartJurisdiction && $startChainageFormatted <= $formattedEndJurisdiction) {
                    Log::info('Jurisdiction: '.$formattedStartJurisdiction.'-'.$formattedEndJurisdiction);
                    $jurisdictionFound = true;
                    break; // Stop checking once a match is found
                }

                // If an end chainage exists, check if it's within the jurisdiction's range
                if ($endChainageFormatted &&
                    $endChainageFormatted >= $formattedStartJurisdiction &&
                    $endChainageFormatted <= $formattedEndJurisdiction) {
                    Log::info('Jurisdiction: '.$formattedStartJurisdiction.'-'.$formattedEndJurisdiction);
                    $jurisdictionFound = true;
                    break; // Stop checking once a match is found
                }
            }

            // If no jurisdiction is found, add an error
            if (! $jurisdictionFound) {
                $validator->errors()->add($attribute, 'The location must have a valid jurisdiction for the specified chainage: '.$value);

                return false; // Invalid jurisdiction
            }

            return true; // Return true if valid and jurisdiction exists
        });
    }

    private function formatChainage($chainage)
    {
        // Check if the chainage includes a range or just a single chainage
        if (preg_match('/([A-Z]*K)([0-9]+)(?:\+([0-9]+(?:\.[0-9]+)?))?/', $chainage, $matches)) {
            $kilometers = $matches[2]; // e.g., '14' from 'K14'
            $meters = $matches[3] ?? '000'; // Default to '0' if no meters are provided

            // Return a numeric format: kilometers and meters (with decimal if present)
            return $kilometers.$meters; // Remove decimal for sorting
        }

        // If the chainage is just a single K and number (e.g., 'K30'), format accordingly
        if (preg_match('/([A-Z]*K)([0-9]+)/', $chainage, $matches)) {
            $kilometers = $matches[2]; // e.g., '30'

            return $kilometers.'000'; // Assume no meters are present
        }

        return $chainage; // Return the chainage unchanged if it doesn't match the expected format
    }
}
