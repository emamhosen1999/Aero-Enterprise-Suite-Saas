<?php

namespace Aero\HRM\Http\Controllers\Disciplinary;

use Aero\HRM\Models\Warning;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WarningController extends Controller
{
    public function index()
    {
        return Inertia::render('HRM/Disciplinary/WarningsIndex', [
            'title' => 'Warnings',
        ]);
    }

    public function getData()
    {
        $warnings = Warning::with(['employee'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $warnings,
            'stats' => [
                'total' => Warning::count(),
                'verbal' => Warning::where('type', 'verbal')->count(),
                'written' => Warning::where('type', 'written')->count(),
                'final' => Warning::where('type', 'final')->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'type' => 'required|in:verbal,written,final',
            'reason' => 'required|string',
            'issued_date' => 'required|date',
            'expires_at' => 'nullable|date|after:issued_date',
            'notes' => 'nullable|string',
        ]);

        $validated['issued_by'] = auth()->id();

        $warning = Warning::create($validated);

        return response()->json([
            'message' => 'Warning created successfully',
            'data' => $warning,
        ]);
    }

    public function update(Request $request, $id)
    {
        $warning = Warning::findOrFail($id);

        $validated = $request->validate([
            'type' => 'sometimes|in:verbal,written,final',
            'reason' => 'sometimes|string',
            'issued_date' => 'sometimes|date',
            'expires_at' => 'nullable|date|after:issued_date',
            'notes' => 'nullable|string',
        ]);

        $warning->update($validated);

        return response()->json([
            'message' => 'Warning updated successfully',
            'data' => $warning,
        ]);
    }

    public function destroy($id)
    {
        $warning = Warning::findOrFail($id);
        $warning->delete();

        return response()->json([
            'message' => 'Warning deleted successfully',
        ]);
    }
}
