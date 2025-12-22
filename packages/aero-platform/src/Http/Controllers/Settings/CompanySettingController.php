<?php

namespace Aero\Platform\Http\Controllers\Settings;

use Aero\Core\Models\CompanySetting;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CompanySettingController extends Controller
{
    public function index()
    {
        $companySettings = CompanySetting::first() ? CompanySetting::first() : [];

        return Inertia::render('Pages/Core/Settings/CompanySettings', [
            'title' => 'Company Settings',
            'companySettings' => $companySettings,
        ]);
    }

    public function update(Request $request)
    {
        // Validate the incoming request data
        $validatedData = $request->validate([
            'companyName' => 'required|string|max:255',
            'contactPerson' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'country' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'state' => 'required|string|max:255',
            'postalCode' => 'required|string|max:10',
            'email' => 'required|email|max:255',
            'phoneNumber' => 'nullable|string|max:20',
            'mobileNumber' => 'nullable|string|max:20',
            'fax' => 'nullable|string|max:20',
            'websiteUrl' => 'nullable|url|max:255',
        ]);

        try {
            $companySettings = CompanySetting::first();
            $companySettings ? $companySettings->update(
                $validatedData
            ) : $companySettings = CompanySetting::create(
                $validatedData
            );

            // Return success response
            return response()->json([
                'message' => 'Company settings updated successfully.',
                'companySettings' => $companySettings,
            ], 200);

        } catch (\Exception $e) {
            // Return error response in case of an exception
            return response()->json([
                'message' => 'An error occurred while updating company settings.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
