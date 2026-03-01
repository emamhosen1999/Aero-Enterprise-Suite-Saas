<?php

namespace Aero\Rfi\Services;

use Aero\Core\Models\User;
use Aero\Rfi\Models\Rfi;
use Aero\Rfi\Traits\WorkLocationMatcher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

/**
 * RfiImportService
 *
 * Service for importing RFIs from Excel/CSV files.
 */
class RfiImportService
{
    use WorkLocationMatcher;

    protected RfiValidationService $validationService;

    public function __construct(RfiValidationService $validationService)
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
        $importedSheets = Excel::toArray(new class implements \Maatwebsite\Excel\Concerns\ToArray
        {
            public function array(array $array): array
            {
                return $array;
            }
        }, $path);

        // First pass: Validate all sheets
        foreach ($importedSheets as $sheetIndex => $importedRfis) {
            if (empty($importedRfis)) {
                continue;
            }

            $this->validationService->validateImportedData($importedRfis, $sheetIndex);
        }

        // Second pass: Process the data within a transaction
        return DB::transaction(function () use ($importedSheets) {
            $results = [];
            foreach ($importedSheets as $sheetIndex => $importedRfis) {
                if (empty($importedRfis)) {
                    continue;
                }

                $result = $this->processSheet($importedRfis, $sheetIndex);
                $results[] = $result;
            }

            return $results;
        });
    }

    /**
     * Process a single sheet of RFIs
     */
    private function processSheet(array $importedRfis, int $sheetIndex): array
    {
        $date = $importedRfis[0][0];
        $inChargeSummary = [];

        foreach ($importedRfis as $importedRfi) {
            $result = $this->processRfiRow($importedRfi, $date, $inChargeSummary);

            if ($result['processed']) {
                $inChargeSummary = $result['summary'];
            }
        }

        return [
            'sheet' => $sheetIndex + 1,
            'date' => $date,
            'summaries' => $inChargeSummary,
            'processed_count' => count($importedRfis),
        ];
    }

    /**
     * Process a single RFI row
     */
    private function processRfiRow(array $importedRfi, string $date, array &$inChargeSummary): array
    {
        // Extract chainages and find work location
        $workLocation = $this->findWorkLocationForLocation($importedRfi[4]);

        if (! $workLocation) {
            Log::warning('No work location found for location: '.$importedRfi[4]);

            return ['processed' => false, 'summary' => $inChargeSummary];
        }

        $inChargeId = $workLocation->incharge_user_id;
        $inChargeUser = User::find($inChargeId);
        $inChargeName = $inChargeUser ? $inChargeUser->name : 'unknown';

        // Initialize incharge summary if not exists
        if (! isset($inChargeSummary[$inChargeId])) {
            $inChargeSummary[$inChargeId] = [
                'totalRfis' => 0,
                'resubmissions' => 0,
                'embankment' => 0,
                'structure' => 0,
                'pavement' => 0,
            ];
        }

        // Update summary counters
        $inChargeSummary[$inChargeId]['totalRfis']++;
        $this->updateTypeCounter($inChargeSummary[$inChargeId], $importedRfi[2]);

        // Handle existing or new RFI
        $existingRfi = Rfi::where('number', $importedRfi[1])->first();

        if ($existingRfi) {
            $this->handleResubmission($existingRfi, $importedRfi, $inChargeSummary[$inChargeId], $inChargeId, $workLocation->id);
        } else {
            $this->createNewRfi($importedRfi, $inChargeId, $workLocation->id);
        }

        return ['processed' => true, 'summary' => $inChargeSummary];
    }

    /**
     * Update type counter in summary
     */
    private function updateTypeCounter(array &$summary, string $type): void
    {
        switch ($type) {
            case Rfi::TYPE_EMBANKMENT:
                $summary['embankment']++;
                break;
            case Rfi::TYPE_STRUCTURE:
                $summary['structure']++;
                break;
            case Rfi::TYPE_PAVEMENT:
                $summary['pavement']++;
                break;
        }
    }

    /**
     * Handle resubmission of existing RFI
     */
    private function handleResubmission(Rfi $existingRfi, array $importedRfi, array &$summary, int $inChargeId, int $workLocationId): void
    {
        $summary['resubmissions']++;
        $resubmissionCount = $existingRfi->resubmission_count ?? 0;
        $resubmissionCount++;
        $resubmissionDate = $this->getResubmissionDate($existingRfi, $resubmissionCount);

        Rfi::create([
            'date' => ($existingRfi->status === Rfi::STATUS_COMPLETED ? $existingRfi->date : $importedRfi[0]),
            'number' => $importedRfi[1],
            'status' => ($existingRfi->status === Rfi::STATUS_COMPLETED ? Rfi::STATUS_COMPLETED : Rfi::STATUS_NEW),
            'type' => $importedRfi[2],
            'description' => $importedRfi[3],
            'location' => $importedRfi[4],
            'side' => $importedRfi[5] ?? null,
            'qty_layer' => $importedRfi[6] ?? null,
            'planned_time' => $importedRfi[7] ?? null,
            'incharge_user_id' => $inChargeId,
            'assigned_user_id' => null,
            'work_location_id' => $workLocationId,
            'resubmission_count' => $resubmissionCount,
            'resubmission_date' => $resubmissionDate,
        ]);
    }

    /**
     * Create new RFI
     */
    private function createNewRfi(array $importedRfi, int $inChargeId, int $workLocationId): void
    {
        Rfi::create([
            'date' => $importedRfi[0],
            'number' => $importedRfi[1],
            'status' => Rfi::STATUS_NEW,
            'type' => $importedRfi[2],
            'description' => $importedRfi[3],
            'location' => $importedRfi[4],
            'side' => $importedRfi[5] ?? null,
            'qty_layer' => $importedRfi[6] ?? null,
            'planned_time' => $importedRfi[7] ?? null,
            'incharge_user_id' => $inChargeId,
            'assigned_user_id' => null,
            'work_location_id' => $workLocationId,
        ]);
    }

    /**
     * Get resubmission date
     */
    private function getResubmissionDate(Rfi $existingRfi, int $resubmissionCount): string
    {
        if ($resubmissionCount === 1) {
            return $existingRfi->resubmission_date ?? $this->getOrdinalNumber($resubmissionCount).' Resubmission on '.Carbon::now()->format('jS F Y');
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
     * Download Excel template for RFI import
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
        $filename = 'rfi_import_template_'.date('Y-m-d_H-i-s').'.xlsx';
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
