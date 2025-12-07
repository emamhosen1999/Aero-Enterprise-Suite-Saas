<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Benefit;
use App\Models\Checklist;
use App\Models\Competency;
use App\Models\DocumentCategory;
use App\Models\OnboardingStep;
use App\Models\SafetyIncident;
use App\Models\SafetyTraining;
use App\Models\Skill;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HrmSettingController extends Controller
{
    /**
     * Display the HRM settings page.
     *
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        // Determine which tab to activate based on the route
        $activeTab = 0;
        $routeName = $request->route()->getName();

        if ($routeName === 'settings.hr.skills') {
            $activeTab = 1;
        } elseif ($routeName === 'settings.hr.benefits') {
            $activeTab = 2;
        } elseif ($routeName === 'settings.hr.safety') {
            $activeTab = 3;
        } elseif ($routeName === 'settings.hr.documents') {
            $activeTab = 4;
        }

        // Load settings data for all tabs
        return Inertia::render('Settings/HRMSettings', [
            'title' => 'HR Module Settings',
            'activeTab' => $activeTab,
            'onboardingSettings' => [
                'steps' => OnboardingStep::all(),
                'checklists' => Checklist::where('type', 'onboarding')->get(),
            ],
            'skillsSettings' => [
                'skills' => Skill::all(),
                'competencies' => Competency::all(),
            ],
            'benefitsSettings' => [
                'benefits' => Benefit::all(),
            ],
            'safetySettings' => [
                'trainings' => SafetyTraining::all(),
                'incidentTypes' => SafetyIncident::select('type')->distinct()->get(),
            ],
            'documentSettings' => [
                'categories' => DocumentCategory::all(),
            ],
        ]);
    }

    /**
     * Update onboarding settings.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateOnboardingSettings(Request $request)
    {
        // Implementation for updating onboarding settings
        return redirect()->back()->with('success', 'Onboarding settings updated successfully.');
    }

    /**
     * Update skills settings.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateSkillsSettings(Request $request)
    {
        // Implementation for updating skills settings
        return redirect()->back()->with('success', 'Skills settings updated successfully.');
    }

    /**
     * Update benefits settings.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateBenefitsSettings(Request $request)
    {
        // Implementation for updating benefits settings
        return redirect()->back()->with('success', 'Benefits settings updated successfully.');
    }

    /**
     * Update safety settings.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateSafetySettings(Request $request)
    {
        // Implementation for updating safety settings
        return redirect()->back()->with('success', 'Safety settings updated successfully.');
    }

    /**
     * Update document settings.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateDocumentSettings(Request $request)
    {
        // Implementation for updating document settings
        return redirect()->back()->with('success', 'Document settings updated successfully.');
    }
}
