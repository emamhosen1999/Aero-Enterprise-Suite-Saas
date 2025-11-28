<?php

namespace App\Http\Controllers;

use App\Models\Jurisdiction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class JurisdictionController extends Controller
{
    public function index(): \Inertia\Response
    {
        return Inertia::render('WorkLocations/WorkLocations', [
            'title' => 'Work Locations',
            'jurisdictions' => Jurisdiction::with('inchargeUser')->get(),
            'users' => User::all(),
        ]);
    }

    public function showWorkLocations(): \Inertia\Response
    {
        return Inertia::render('WorkLocations/WorkLocations', [
            'title' => 'Work Locations Management',
            'jurisdictions' => Jurisdiction::with('inchargeUser')->get(),
            'users' => User::all(),
        ]);
    }

    public function allWorkLocations(Request $request)
    {
        try {
            // Attempt to retrieve all work locations with their incharge users
            $workLocations = Jurisdiction::with('inchargeUser')->get();

            // Return a successful response with the work locations
            return response()->json([
                'work_locations' => $workLocations,
            ], 200);
        } catch (\Exception $e) {
            // Catch any exceptions that occur and return an error response
            return response()->json([
                'error' => 'Failed to retrieve work locations',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function addWorkLocation(Request $request)
    {
        try {
            // Validate incoming request data
            $validatedData = $request->validate([
                'location' => 'required|string|unique:jurisdictions,location',
                'start_chainage' => 'required|string',
                'end_chainage' => 'required|string',
                'incharge' => 'required|exists:users,id',
            ], [
                'location.required' => 'Work location name is required.',
                'location.unique' => 'A work location with this name already exists.',
                'start_chainage.required' => 'Start Chainage is required.',
                'end_chainage.required' => 'End Chainage is required.',
                'incharge.required' => 'Location incharge is required.',
                'incharge.exists' => 'Selected incharge user does not exist.',
            ]);

            // Create a new Jurisdiction instance
            $workLocation = Jurisdiction::create([
                'location' => $validatedData['location'],
                'start_chainage' => $validatedData['start_chainage'],
                'end_chainage' => $validatedData['end_chainage'],
                'incharge' => $validatedData['incharge'],
            ]);

            // Retrieve updated list of work locations with relationships
            $workLocations = Jurisdiction::with('inchargeUser')->get();

            // Return a success response
            return response()->json([
                'message' => 'Work location added successfully',
                'work_locations' => $workLocations,
            ], 201);
        } catch (ValidationException $e) {
            // Validation failed, return error response
            return response()->json(['error' => $e->errors()], 422);
        } catch (\Exception $e) {
            // Other exceptions occurred, return error response
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateWorkLocation(Request $request)
    {
        try {
            // Validate incoming request data
            $validatedData = $request->validate([
                'id' => 'required|exists:jurisdictions,id',
                'location' => 'required|string|unique:jurisdictions,location,'.$request->id,
                'start_chainage' => 'required|string',
                'end_chainage' => 'required|string',
                'incharge' => 'required|exists:users,id',
            ], [
                'location.required' => 'Work location name is required.',
                'location.unique' => 'A work location with this name already exists.',
                'start_chainage.required' => 'Start Chainage is required.',
                'end_chainage.required' => 'End Chainage is required.',
                'incharge.required' => 'Location incharge is required.',
                'incharge.exists' => 'Selected incharge user does not exist.',
            ]);

            // Find and update the work location
            $workLocation = Jurisdiction::findOrFail($validatedData['id']);
            $workLocation->update([
                'location' => $validatedData['location'],
                'start_chainage' => $validatedData['start_chainage'],
                'end_chainage' => $validatedData['end_chainage'],
                'incharge' => $validatedData['incharge'],
            ]);

            // Retrieve updated list of work locations with relationships
            $workLocations = Jurisdiction::with('inchargeUser')->get();

            // Return a success response
            return response()->json([
                'message' => 'Work location updated successfully',
                'work_locations' => $workLocations,
            ], 200);
        } catch (ValidationException $e) {
            // Validation failed, return error response
            return response()->json(['error' => $e->errors()], 422);
        } catch (\Exception $e) {
            // Other exceptions occurred, return error response
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function deleteWorkLocation(Request $request)
    {
        try {
            // Validate incoming request data
            $validatedData = $request->validate([
                'id' => 'required|exists:jurisdictions,id',
            ], [
                'id.required' => 'Work location ID is required.',
                'id.exists' => 'Work location not found.',
            ]);

            // Find and delete the work location
            $workLocation = Jurisdiction::findOrFail($validatedData['id']);
            $workLocation->delete();

            // Retrieve updated list of work locations with relationships
            $workLocations = Jurisdiction::with('inchargeUser')->get();

            // Return a success response
            return response()->json([
                'message' => 'Work location deleted successfully',
                'work_locations' => $workLocations,
            ], 200);
        } catch (ValidationException $e) {
            // Validation failed, return error response
            return response()->json(['error' => $e->errors()], 422);
        } catch (\Exception $e) {
            // Other exceptions occurred, return error response
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
