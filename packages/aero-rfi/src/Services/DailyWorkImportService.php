<?php

namespace Aero\Rfi\Services;

use Aero\Core\Models\User;
use Aero\Rfi\Models\DailyWork;
use Aero\Rfi\Traits\WorkLocationMatcher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

/**
 * DailyWorkImportService
 *
 * Service for importing Daily Works from Excel/CSV files.
 */
class DailyWorkImportService
{
    use WorkLocationMatcher;

    protected DailyWorkValidationService $validationService;

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

        // Use a simple array import since we don't have a dedicated import class
        $importedSheets = Excel::toArray(new class implements \Maatwebsite\Excel\Concerns\ToArray {
            public function array(array $array): array
            {
                return $array;
            }
        }, $path);

        // First pass: Validate all sheets
        foreach ($importedSheets as $sheetIndex => $importedDailyWorks) {
            if (empty($importedDailyWorks)) {
                continue;
            }

            $this->validationService->validateImportedData($importedDailyWorks, $sheetIndex);
        }

        // Second pass: Process the data within a transaction
        return DB::transaction(function () use ($importedSheets) {
            $results = [];
            foreach ($importedSheets as $sheetIndex => $importedDailyWorks) {
                if (empty($importedDailyWorks)) {
                    continue;
                }

                $result = $this->processSheet($importedDailyWorks, $sheetIndex);
                $results[] = $result;
            }

            return $results;
        });
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
        // Extract chainages and find work location
        $workLocation = $this->findWorkLocationForLocation($importedDailyWork[4]);

        if (! $workLocation) {
            Log::warning('No work location found for location: '.$importedDailyWork[4]);

            return ['processed' => false, 'summary' => $inChargeSummary];
        }

        $inChargeId = $workLocation->incharge_user_id;
        $inChargeUser = User::find($inChargeId);
        $inChargeName = $inChargeUser ? $inChargeUser->name : 'unknown';

        // Initialize incharge summary if not exists
        if (! isset($inChargeSummary[$inChargeId])) {
            $inChargeSummary[$inChargeId] = [
                'totalDailyWorks' => 0,
                'resubmissions' => 0,
                'embankment' => 0,
                'structure' => 0,
                'pavement' => 0,
            ];
        }

        // Update summary counters
        $inChargeSummary[$inChargeId]['totalDailyWorks']++;
        $this->updateTypeCounter($inChargeSummary[$inChargeId], $importedDailyWork[2]);

        // Handle existing or new daily work
        $existingDailyWork = DailyWork::where('number', $importedDailyWork[1])->first();

        if ($existingDailyWork) {
            $this->handleResubmission($existingDailyWork, $importedDailyWork, $inChargeSummary[$inChargeId], $inChargeId, $workLocation->id);
        } else {
            $this->createNewDailyWork($importedDailyWork, $inChargeId, $workLocation->id);
        }

        return ['processed' => true, 'summary' => $inChargeSummary];
    }

    /**
     * Update type counter in summary
     */
    private function updateTypeCounter(array &$summary, string $type): void
    {
        switch ($type) {
            case DailyWork::TYPE_EMBANKMENT:
                $summary['embankment']++;
                break;
            case DailyWork::TYPE_STRUCTURE:
                $summary['structure']++;
                break;
            case DailyWork::TYPE_PAVEMENT:
                $summary['pavement']++;
                break;
        }
    }

    /**
     * Handle resubmission of existing daily work
     */
    private function handleResubmission(DailyWork $existingDailyWork, array $importedDailyWork, array &$summary, int $inChargeId, int $workLocationId): void
    {
        $summary['resubmissions']++;
        $resubmissionCount = $existingDailyWork->resubmission_count ?? 0;
        $resubmissionCount++;
        $resubmissionDate = $this->getResubmissionDate($existingDailyWork, $resubmissionCount);

        DailyWork::create([
            'date' => ($existingDailyWork->status === DailyWork::STATUS_COMPLETED ? $existingDailyWork->date : $importedDailyWork[0]),
            'number' => $importedDailyWork[1],
            'status' => ($existingDailyWork->status === DailyWork::STATUS_COMPLETED ? DailyWork::STATUS_COMPLETED : DailyWork::STATUS_NEW),
            'type' => $importedDailyWork[2],
            'description' => $importedDailyWork[3],
            'location' => $importedDailyWork[4],
            'side' => $importedDailyWork[5] ?? null,
            'qty_layer' => $importedDailyWork[6] ?? null,
            'planned_time' => $importedDailyWork[7] ?? null,
            'incharge_user_id' => $inChargeId,
            'assigned_user_id' => null,
            'work_location_id' => $workLocationId,
            'resubmission_count' => $resubmissionCount,
            'resubmission_date' => $resubmissionDate,
        ]);
    }

    /**
     * Create new daily work
     */
    private function createNewDailyWork(array $importedDailyWork, int $inChargeId, int $workLocationId): void
    {
        DailyWork::create([
            'date' => $importedDailyWork[0],
            'number' => $importedDailyWork[1],
            'status' => DailyWork::STATUS_NEW,
            'type' => $importedDailyWork[2],
            'description' => $importedDailyWork[3],
            'location' => $importedDailyWork[4],
            'side' => $importedDailyWork[5] ?? null,
            'qty_layer' => $importedDailyWork[6] ?? null,
            'planned_time' => $importedDailyWork[7] ?? null,
            'incharge_user_id' => $inChargeId,
            'assigned_user_id' => null,
            'work_location_id' => $workLocationId,
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
        Excel::store(new class($templateData) implements \Maatwebsite\Excel\Concerns\FromArray {
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
