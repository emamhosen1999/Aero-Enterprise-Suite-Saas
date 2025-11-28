<?php

namespace App\Http\Controllers\Quality;

use App\Http\Controllers\Controller;
use App\Models\QualityCalibration;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CalibrationController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', QualityCalibration::class);

        $query = QualityCalibration::query()
            ->with(['performer']);

        // Filter by search term
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('equipment_name', 'like', "%{$search}%")
                    ->orWhere('equipment_id', 'like', "%{$search}%")
                    ->orWhere('equipment_serial_number', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by due date
        if ($request->filled('due_filter')) {
            $filter = $request->input('due_filter');
            if ($filter === 'overdue') {
                $query->where('next_calibration_date', '<', now())
                    ->where('status', '!=', 'calibrated');
            } elseif ($filter === 'due_soon') {
                $query->whereBetween('next_calibration_date', [now(), now()->addDays(30)]);
            }
        }

        // Filter by location
        if ($request->filled('location')) {
            $query->where('location', 'like', "%{$request->input('location')}%");
        }

        // Sort
        $sortField = $request->input('sort', 'next_calibration_date');
        $sortDirection = $request->input('direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        $calibrations = $query->paginate(15)->withQueryString();

        // Get filter options
        $locations = QualityCalibration::distinct()->pluck('location')->filter()->sort()->values();
        $statuses = ['calibrated', 'out_of_calibration', 'pending', 'removed_from_service'];

        return Inertia::render('Quality/Calibrations/Index', [
            'calibrations' => $calibrations,
            'filters' => $request->only(['search', 'status', 'due_filter', 'location', 'sort', 'direction']),
            'locations' => $locations,
            'statuses' => $statuses,
        ]);
    }

    public function create()
    {
        $this->authorize('create', QualityCalibration::class);

        return Inertia::render('Quality/Calibrations/Create', [
            'performers' => User::whereHas('roles', function ($query) {
                $query->where('name', 'Quality Inspector');
            })->orWhereHas('permissions', function ($query) {
                $query->where('name', 'quality.calibrations.perform');
            })->select('id', 'name', 'email')->get(),
            'statuses' => [
                ['id' => 'calibrated', 'name' => 'Calibrated'],
                ['id' => 'out_of_calibration', 'name' => 'Out of Calibration'],
                ['id' => 'pending', 'name' => 'Pending'],
                ['id' => 'removed_from_service', 'name' => 'Removed from Service'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', QualityCalibration::class);

        $validated = $request->validate([
            'equipment_id' => 'required|string|max:255',
            'equipment_name' => 'required|string|max:255',
            'equipment_serial_number' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'calibration_date' => 'required|date',
            'next_calibration_date' => 'required|date|after:calibration_date',
            'performed_by' => 'required|exists:users,id',
            'calibration_certificate_number' => 'nullable|string|max:255',
            'calibration_method' => 'nullable|string|max:255',
            'calibration_notes' => 'nullable|string',
            'status' => 'required|in:calibrated,out_of_calibration,pending,removed_from_service',
            'calibration_file' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        // Handle file upload
        if ($request->hasFile('calibration_file')) {
            $validated['file_path'] = $request->file('calibration_file')->store('quality/calibrations', 'public');
        }

        $calibration = QualityCalibration::create($validated);

        return redirect()->route('quality.calibrations.index')
            ->with('success', 'Calibration record created successfully.');
    }

    public function show(QualityCalibration $calibration)
    {
        $this->authorize('view', $calibration);

        $calibration->load(['performer']);

        return Inertia::render('Quality/Calibrations/Show', [
            'calibration' => $calibration,
        ]);
    }

    public function edit(QualityCalibration $calibration)
    {
        $this->authorize('update', $calibration);

        return Inertia::render('Quality/Calibrations/Edit', [
            'calibration' => $calibration,
            'performers' => User::whereHas('roles', function ($query) {
                $query->where('name', 'Quality Inspector');
            })->orWhereHas('permissions', function ($query) {
                $query->where('name', 'quality.calibrations.perform');
            })->select('id', 'name', 'email')->get(),
            'statuses' => [
                ['id' => 'calibrated', 'name' => 'Calibrated'],
                ['id' => 'out_of_calibration', 'name' => 'Out of Calibration'],
                ['id' => 'pending', 'name' => 'Pending'],
                ['id' => 'removed_from_service', 'name' => 'Removed from Service'],
            ],
        ]);
    }

    public function update(Request $request, QualityCalibration $calibration)
    {
        $this->authorize('update', $calibration);

        $validated = $request->validate([
            'equipment_id' => 'required|string|max:255',
            'equipment_name' => 'required|string|max:255',
            'equipment_serial_number' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'calibration_date' => 'required|date',
            'next_calibration_date' => 'required|date|after:calibration_date',
            'performed_by' => 'required|exists:users,id',
            'calibration_certificate_number' => 'nullable|string|max:255',
            'calibration_method' => 'nullable|string|max:255',
            'calibration_notes' => 'nullable|string',
            'status' => 'required|in:calibrated,out_of_calibration,pending,removed_from_service',
            'calibration_file' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        // Handle file upload
        if ($request->hasFile('calibration_file')) {
            // Delete old file if exists
            if ($calibration->file_path) {
                Storage::disk('public')->delete($calibration->file_path);
            }
            $validated['file_path'] = $request->file('calibration_file')->store('quality/calibrations', 'public');
        }

        $calibration->update($validated);

        return redirect()->route('quality.calibrations.index')
            ->with('success', 'Calibration record updated successfully.');
    }

    public function destroy(QualityCalibration $calibration)
    {
        $this->authorize('delete', $calibration);

        // Delete associated file
        if ($calibration->file_path) {
            Storage::disk('public')->delete($calibration->file_path);
        }

        $calibration->delete();

        return redirect()->route('quality.calibrations.index')
            ->with('success', 'Calibration record deleted successfully.');
    }
}
