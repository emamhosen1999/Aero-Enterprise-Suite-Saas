<?php

namespace App\Services\DailyWork;

use App\Imports\DailyWorkImport;
use App\Models\DailyWork;
use App\Models\DailyWorkSummary;
use App\Models\Jurisdiction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

class DailyWorkImportService
{
    private DailyWorkValidationService $validationService;

    public function __construct(DailyWorkValidationService $validationService)
    {
        $this->validationService = $validationService;
    }

    /**
     * Process Excel/CSV import
     */
    public function processImport(Request $request): array
    {
        $this->validationService->validateImportFile($request);

        $path = $request->file('file')->store('temp');
        $importedSheets = Excel::toArray(new DailyWorkImport, $path);

        // First pass: Validate all sheets
        foreach ($importedSheets as $sheetIndex => $importedDailyWorks) {
            if (empty($importedDailyWorks)) {
                continue;
            }

            $this->validationService->validateImportedData($importedDailyWorks, $sheetIndex);
        }

        // Second pass: Process the data
        $results = [];
        foreach ($importedSheets as $sheetIndex => $importedDailyWorks) {
            if (empty($importedDailyWorks)) {
                continue;
            }

            $result = $this->processSheet($importedDailyWorks, $sheetIndex);
            $results[] = $result;
        }

        return $results;
    }

    /**
     * Process a single sheet of daily works
     */
    private function processSheet(array $importedDailyWorks, int $sheetIndex): array
    {
        $date = $importedDailyWorks[0][0];
        $inChargeSummary = [];

        foreach ($importedDailyWorks as $importedDailyWork) {
            $result = $this->processDailyWorkRow($importedDailyWork, $date, $inChargeSummary);

            if ($result['processed']) {
                $inChargeSummary = $result['summary'];
            }
        }

        // Create or update daily summaries
        $this->createDailySummaries($inChargeSummary, $date);

        return [
            'sheet' => $sheetIndex + 1,
            'date' => $date,
            'summaries' => $inChargeSummary,
            'processed_count' => count($importedDailyWorks),
        ];
    }

    /**
     * Process a single daily work row
     */
    private function processDailyWorkRow(array $importedDailyWork, string $date, array &$inChargeSummary): array
    {
        // Extract chainages and find jurisdiction
        $jurisdiction = $this->findJurisdictionForLocation($importedDailyWork[4]);

        if (! $jurisdiction) {
            Log::warning('No jurisdiction found for location: '.$importedDailyWork[4]);

            return ['processed' => false, 'summary' => $inChargeSummary];
        }

        $inCharge = $jurisdiction->incharge;
        $inChargeUser = User::find($inCharge);
        $inChargeName = $inChargeUser ? $inChargeUser->user_name : 'unknown';

        // Initialize incharge summary if not exists
        if (! isset($inChargeSummary[$inCharge])) {
            $inChargeSummary[$inCharge] = [
                'totalDailyWorks' => 0,
                'resubmissions' => 0,
                'embankment' => 0,
                'structure' => 0,
                'pavement' => 0,
            ];
        }

        // Update summary counters
        $inChargeSummary[$inCharge]['totalDailyWorks']++;
        $this->updateTypeCounter($inChargeSummary[$inCharge], $importedDailyWork[2]);

        // Handle existing or new daily work
        $existingDailyWork = DailyWork::where('number', $importedDailyWork[1])->first();

        if ($existingDailyWork) {
            $this->handleResubmission($existingDailyWork, $importedDailyWork, $inChargeSummary[$inCharge], $inCharge);
        } else {
            $this->createNewDailyWork($importedDailyWork, $inCharge);
        }

        return ['processed' => true, 'summary' => $inChargeSummary];
    }

    /**
     * Find jurisdiction for a given location
     */
    private function findJurisdictionForLocation(string $location): ?Jurisdiction
    {
        // Regex for extracting start and end chainages
        $chainageRegex = '/(.*K[0-9]+(?:\+[0-9]+(?:\.[0-9]+)?)?)-(.*K[0-9]+(?:\+[0-9]+(?:\.[0-9]+)?)?)|(.*K[0-9]+)(.*)/';

        if (preg_match($chainageRegex, $location, $matches)) {
            $startChainage = $matches[1] === '' ? $matches[0] : $matches[1];
            $endChainage = $matches[2] === '' ? null : $matches[2];

            $startChainageFormatted = $this->formatChainage($startChainage);
            $endChainageFormatted = $endChainage ? $this->formatChainage($endChainage) : null;

            $jurisdictions = Jurisdiction::all();

            foreach ($jurisdictions as $jurisdiction) {
                $formattedStartJurisdiction = $this->formatChainage($jurisdiction->start_chainage);
                $formattedEndJurisdiction = $this->formatChainage($jurisdiction->end_chainage);

                // Check if the start chainage is within the jurisdiction's range
                if ($startChainageFormatted >= $formattedStartJurisdiction &&
                    $startChainageFormatted <= $formattedEndJurisdiction) {
                    Log::info('Jurisdiction Match Found: '.$formattedStartJurisdiction.'-'.$formattedEndJurisdiction);

                    return $jurisdiction;
                }

                // If an end chainage exists, check if it's within the jurisdiction's range
                if ($endChainageFormatted &&
                    $endChainageFormatted >= $formattedStartJurisdiction &&
                    $endChainageFormatted <= $formattedEndJurisdiction) {
                    Log::info('Jurisdiction Match Found for End Chainage: '.$formattedStartJurisdiction.'-'.$formattedEndJurisdiction);

                    return $jurisdiction;
                }
            }
        }

        return null;
    }

    /**
     * Format chainage for comparison
     */
    private function formatChainage(string $chainage): string
    {
        // Remove spaces and convert to uppercase
        $chainage = strtoupper(trim($chainage));

        // Extract K number and additional values
        if (preg_match('/K(\d+)(?:\+(\d+(?:\.\d+)?))?/', $chainage, $matches)) {
            $kNumber = (int) $matches[1];
            $additional = isset($matches[2]) ? (float) $matches[2] : 0;

            // Convert to a comparable format (e.g., K05+900 becomes 5.900)
            return sprintf('%d.%03d', $kNumber, $additional);
        }

        return $chainage;
    }

    /**
     * Update type counter in summary
     */
    private function updateTypeCounter(array &$summary, string $type): void
    {
        switch ($type) {
            case 'Embankment':
                $summary['embankment']++;
                break;
            case 'Structure':
                $summary['structure']++;
                break;
            case 'Pavement':
                $summary['pavement']++;
                break;
        }
    }

    /**
     * Handle resubmission of existing daily work
     */
    private function handleResubmission(DailyWork $existingDailyWork, array $importedDailyWork, array &$summary, int $inChargeId): void
    {
        $summary['resubmissions']++;
        $resubmissionCount = $existingDailyWork->resubmission_count ?? 0;
        $resubmissionCount++;
        $resubmissionDate = $this->getResubmissionDate($existingDailyWork, $resubmissionCount);

        DailyWork::create([
            'date' => ($existingDailyWork->status === 'completed' ? $existingDailyWork->date : $importedDailyWork[0]),
            'number' => $importedDailyWork[1],
            'status' => ($existingDailyWork->status === 'completed' ? 'completed' : 'new'),
            'type' => $importedDailyWork[2],
            'description' => $importedDailyWork[3],
            'location' => $importedDailyWork[4],
            'side' => $importedDailyWork[5] ?? null,
            'qty_layer' => $importedDailyWork[6] ?? null,
            'planned_time' => $importedDailyWork[7] ?? null,
            'incharge' => $inChargeId,
            'assigned' => null, // Don't auto-assign to incharge
            'resubmission_count' => $resubmissionCount,
            'resubmission_date' => $resubmissionDate,
        ]);
    }

    /**
     * Create new daily work
     */
    private function createNewDailyWork(array $importedDailyWork, int $inChargeId): void
    {
        DailyWork::create([
            'date' => $importedDailyWork[0],
            'number' => $importedDailyWork[1],
            'status' => 'new',
            'type' => $importedDailyWork[2],
            'description' => $importedDailyWork[3],
            'location' => $importedDailyWork[4],
            'side' => $importedDailyWork[5] ?? null,
            'qty_layer' => $importedDailyWork[6] ?? null,
            'planned_time' => $importedDailyWork[7] ?? null,
            'incharge' => $inChargeId,
            'assigned' => null, // Don't auto-assign to incharge
        ]);
    }

    /**
     * Get resubmission date
     */
    private function getResubmissionDate(DailyWork $existingDailyWork, int $resubmissionCount): string
    {
        if ($resubmissionCount === 1) {
            return $existingDailyWork->resubmission_date ?? $this->getOrdinalNumber($resubmissionCount).' Resubmission on '.Carbon::now()->format('jS F Y');
        }

        return $this->getOrdinalNumber($resubmissionCount).' Resubmission on '.Carbon::now()->format('jS F Y');
    }

    /**
     * Get ordinal number (1st, 2nd, 3rd, etc.)
     */
    private function getOrdinalNumber(int $number): string
    {
        if (! in_array(($number % 100), [11, 12, 13])) {
            switch ($number % 10) {
                case 1: return $number.'st';
                case 2: return $number.'nd';
                case 3: return $number.'rd';
            }
        }

        return $number.'th';
    }

    /**
     * Create or update daily summaries
     */
    private function createDailySummaries(array $inChargeSummary, string $date): void
    {
        foreach ($inChargeSummary as $inChargeId => $summary) {
            DailyWorkSummary::updateOrCreate(
                ['date' => $date, 'incharge' => $inChargeId],
                [
                    'totalDailyWorks' => $summary['totalDailyWorks'],
                    'resubmissions' => $summary['resubmissions'],
                    'embankment' => $summary['embankment'],
                    'structure' => $summary['structure'],
                    'pavement' => $summary['pavement'],
                ]
            );
        }
    }

    /**
     * Download Excel template for daily works import
     */
    public function downloadTemplate()
    {
        // Create sample data for the template
        $templateData = [
            ['Date', 'RFI Number', 'Work Type', 'Description', 'Location/Chainage', 'Road Side', 'Layer/Quantity', 'Time'],
            ['2025-11-26', 'S2025-0527-10207', 'Structure', 'Retaining wall module: RE wall Block Installation Check', 'K38+060-K38+110', 'TR-R', '2:30 PM', '2:30 PM'],
            ['2025-11-26', 'DSW-060', 'Structure', 'Dismantling of Shoulder Wall and Cantilever retaining wall: RE-wall Dismantling Work Check', 'K24+395-K24+418', 'TR-L', '11:00 AM', '11:00 AM'],
            ['2025-11-26', 'E2025-1126-23676', 'Embankment', 'Embankment Stacking on site: Roadway Excavation in Suitable Soil (Re-Work) Before Level Check', 'K24+395-K24+418', 'TR-L', '1.4m1', '5:00 PM'],
            ['2025-11-26', 'E2025-1119-23562', 'Embankment', 'Roadway excavation in suitable soil including stocking on site: Roadway Excavation in Suitable Soil After Level', 'SCK0+220-SCK0+345.060', 'SR-L', '', '3:00 PM'],
            ['2025-11-26', 'E2025-1126-23677', 'Embankment', 'Embankment Fill from the source approved by Engineer: Embankment Sand Filling Level Check & Compaction Test (RE Wall Section)', 'SCK0+440-SCK0+450', 'SR-L', '17th', '10:00 AM'],
        ];

        // Create a temporary file
        $filename = 'daily_works_import_template_'.date('Y-m-d_H-i-s').'.xlsx';
        $tempPath = storage_path('app/temp/'.$filename);

        // Ensure temp directory exists
        if (! file_exists(dirname($tempPath))) {
            mkdir(dirname($tempPath), 0755, true);
        }

        // Create Excel file with template data
        Excel::store(new class($templateData) implements \Maatwebsite\Excel\Concerns\FromArray
        {
            private $data;

            public function __construct($data)
            {
                $this->data = $data;
            }

            public function array(): array
            {
                return $this->data;
            }
        }, 'temp/'.$filename);

        // Return download response
        return response()->download($tempPath, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }
}
