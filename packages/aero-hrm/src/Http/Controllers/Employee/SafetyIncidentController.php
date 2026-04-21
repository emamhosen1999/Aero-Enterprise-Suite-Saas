<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\Core\Models\User;
use Aero\HRM\Events\Safety\SafetyIncidentReported;
use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Http\Requests\StoreSafetyIncidentRequest;
use Aero\HRM\Http\Requests\UpdateSafetyIncidentRequest;
use Aero\HRM\Models\Department;
use Aero\HRM\Models\SafetyIncident;
use Aero\HRM\Models\SafetyIncidentParticipant;
use Aero\HRM\Services\SafetyComplianceService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SafetyIncidentController extends Controller
{
    public function __construct(private SafetyComplianceService $safetyService) {}

    /**
     * Display a listing of safety incidents.
     */
    public function index()
    {
        $this->authorize('viewAny', SafetyIncident::class);

        $incidents = SafetyIncident::with(['department', 'reportedBy'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('HRM/Safety/Incidents/Index', [
            'title' => 'Safety Incidents',
            'incidents' => $incidents,
        ]);
    }

    /**
     * Show the form for creating a new safety incident.
     */
    public function create()
    {
        $this->authorize('create', SafetyIncident::class);

        $employees = User::select('id', 'name')
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        $departments = Department::select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('HRM/Safety/Incidents/Create', [
            'title' => 'Report Safety Incident',
            'employees' => $employees,
            'departments' => $departments,
        ]);
    }

    /**
     * Store a newly created safety incident.
     */
    public function store(StoreSafetyIncidentRequest $request)
    {
        $this->authorize('create', SafetyIncident::class);

        $validated = $request->validated();

        DB::beginTransaction();

        try {
            $incident = SafetyIncident::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'incident_date' => $validated['incident_date'],
                'incident_time' => $validated['incident_time'],
                'location' => $validated['location'],
                'department_id' => $validated['department_id'],
                'severity' => $validated['severity'],
                'type' => $validated['type'],
                'immediate_actions' => $validated['immediate_actions'] ?? null,
                'root_cause' => $validated['root_cause'] ?? null,
                'corrective_actions' => $validated['corrective_actions'] ?? null,
                'status' => $validated['status'],
                'reported_by' => Auth::id(),
            ]);

            if (isset($validated['participants']) && count($validated['participants']) > 0) {
                foreach ($validated['participants'] as $participant) {
                    SafetyIncidentParticipant::create([
                        'safety_incident_id' => $incident->id,
                        'user_id' => $participant['user_id'],
                        'role' => $participant['role'],
                        'description' => $participant['description'] ?? null,
                    ]);
                }
            }

            // Dispatch SafetyIncidentReported event
            $requiresImmediateAction = in_array($validated['severity'], ['high', 'critical']);
            event(new SafetyIncidentReported($incident, $requiresImmediateAction));

            DB::commit();

            return redirect()->route('hr.safety.incidents.show', $incident->id)
                ->with('success', 'Safety incident reported successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to report safety incident: '.$e->getMessage());

            return redirect()->back()
                ->with('error', 'Failed to report safety incident. Please try again.')
                ->withInput();
        }
    }

    /**
     * Display the specified safety incident.
     */
    public function show($id)
    {
        $incident = SafetyIncident::with(['department', 'reportedBy', 'participants.user'])
            ->findOrFail($id);

        $this->authorize('view', $incident);

        return Inertia::render('HRM/Safety/Incidents/Show', [
            'title' => 'Safety Incident Details',
            'incident' => $incident,
        ]);
    }

    /**
     * Show the form for editing the specified safety incident.
     */
    public function edit($id)
    {
        $incident = SafetyIncident::with(['department', 'participants'])
            ->findOrFail($id);

        $this->authorize('update', $incident);

        $employees = User::select('id', 'name')
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        $departments = Department::select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('HRM/Safety/Incidents/Edit', [
            'title' => 'Edit Safety Incident',
            'incident' => $incident,
            'employees' => $employees,
            'departments' => $departments,
        ]);
    }

    /**
     * Update the specified safety incident.
     */
    public function update(UpdateSafetyIncidentRequest $request, $id)
    {
        $incident = SafetyIncident::findOrFail($id);

        $this->authorize('update', $incident);

        $validated = $request->validated();

        DB::beginTransaction();

        try {
            $incident->update([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'incident_date' => $validated['incident_date'],
                'incident_time' => $validated['incident_time'],
                'location' => $validated['location'],
                'department_id' => $validated['department_id'],
                'severity' => $validated['severity'],
                'type' => $validated['type'],
                'immediate_actions' => $validated['immediate_actions'] ?? null,
                'root_cause' => $validated['root_cause'] ?? null,
                'corrective_actions' => $validated['corrective_actions'] ?? null,
                'status' => $validated['status'],
                'updated_by' => Auth::id(),
            ]);

            // Track existing participant IDs to determine which ones to delete
            $existingParticipantIds = $incident->participants->pluck('id')->toArray();
            $updatedParticipantIds = [];

            if (isset($validated['participants']) && count($validated['participants']) > 0) {
                foreach ($validated['participants'] as $participantData) {
                    if (isset($participantData['id'])) {
                        // Update existing participant
                        $participant = SafetyIncidentParticipant::findOrFail($participantData['id']);
                        $participant->update([
                            'user_id' => $participantData['user_id'],
                            'role' => $participantData['role'],
                            'description' => $participantData['description'] ?? null,
                        ]);
                        $updatedParticipantIds[] = $participant->id;
                    } else {
                        // Create new participant
                        $participant = SafetyIncidentParticipant::create([
                            'safety_incident_id' => $incident->id,
                            'user_id' => $participantData['user_id'],
                            'role' => $participantData['role'],
                            'description' => $participantData['description'] ?? null,
                        ]);
                        $updatedParticipantIds[] = $participant->id;
                    }
                }
            }

            // Delete participants that weren't updated
            $participantsToDelete = array_diff($existingParticipantIds, $updatedParticipantIds);
            if (! empty($participantsToDelete)) {
                SafetyIncidentParticipant::whereIn('id', $participantsToDelete)->delete();
            }

            DB::commit();

            return redirect()->route('hr.safety.incidents.show', $incident->id)
                ->with('success', 'Safety incident updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update safety incident: '.$e->getMessage());

            return redirect()->back()
                ->with('error', 'Failed to update safety incident. Please try again.')
                ->withInput();
        }
    }

    /**
     * Remove the specified safety incident.
     */
    public function destroy($id)
    {
        $incident = SafetyIncident::findOrFail($id);

        $this->authorize('delete', $incident);

        try {
            $incident->delete();

            return redirect()->route('hr.safety.incidents.index')
                ->with('success', 'Safety incident deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to delete safety incident: '.$e->getMessage());

            return redirect()->back()
                ->with('error', 'Failed to delete safety incident.');
        }
    }
}
