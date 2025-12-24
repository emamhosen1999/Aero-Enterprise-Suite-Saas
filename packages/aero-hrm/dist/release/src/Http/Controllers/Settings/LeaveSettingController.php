<?php

namespace Aero\HRM\Http\Controllers\Settings;

use Aero\HRM\Models\LeaveSetting;
use Aero\HRM\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveSettingController extends Controller
{
    public function index(): \Inertia\Response
    {
        $leaveSettings = LeaveSetting::all();

        return Inertia::render('Pages/HRM/Settings/LeaveSettings', [
            'title' => 'Leave Settings',
            'leaveTypes' => $leaveSettings,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|string|max:255',
            'days' => 'required|integer',
            'eligibility' => 'nullable|string',
            'carry_forward' => 'required|boolean',
            'earned_leave' => 'required|boolean',
            'requires_approval' => 'nullable|boolean',
            'auto_approve' => 'nullable|boolean',
            'special_conditions' => 'nullable|string',
        ]);

        try {
            $leaveType = LeaveSetting::create([
                'type' => $request->input('type'),
                'days' => $request->input('days'),
                'eligibility' => $request->input('eligibility'),
                'carry_forward' => $request->input('carry_forward'),
                'earned_leave' => $request->input('earned_leave'),
                'requires_approval' => $request->input('requires_approval', true),
                'auto_approve' => $request->input('auto_approve', false),
                'special_conditions' => $request->input('special_conditions'),
            ]);

            return response()->json([
                'id' => $leaveType->id,
                'message' => 'Leave type added successfully.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to add leave type. Please try again.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'type' => 'required|string|max:255',
            'days' => 'required|integer',
            'eligibility' => 'nullable|string',
            'carry_forward' => 'required|boolean',
            'earned_leave' => 'required|boolean',
            'requires_approval' => 'nullable|boolean',
            'auto_approve' => 'nullable|boolean',
            'special_conditions' => 'nullable|string',
        ]);

        try {
            $leaveType = LeaveSetting::findOrFail($id);
            $leaveType->update([
                'type' => $request->input('type'),
                'days' => $request->input('days'),
                'eligibility' => $request->input('eligibility'),
                'carry_forward' => $request->input('carry_forward'),
                'earned_leave' => $request->input('earned_leave'),
                'requires_approval' => $request->input('requires_approval', true),
                'auto_approve' => $request->input('auto_approve', false),
                'special_conditions' => $request->input('special_conditions'),
            ]);

            return response()->json([
                'id' => $leaveType->id,
                'message' => 'Leave type updated successfully.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update leave type. Please try again.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            // Find the leave type by ID
            $leaveType = LeaveSetting::findOrFail($id);

            // Delete the leave type
            $leaveType->delete();

            return response()->json(['message' => 'Leave type deleted successfully.'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete leave type.'], 500);
        }
    }
}
