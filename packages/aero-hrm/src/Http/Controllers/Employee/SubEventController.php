<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Models\Event;
use Aero\HRM\Models\EventActivityLog;
use Aero\HRM\Models\SubEvent;
use Aero\HRM\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SubEventController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'permission:event.update']);
    }

    public function store(Request $request, Event $event)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'schedule' => 'nullable|string',
            'prize_details' => 'nullable|string',
            'max_participants' => 'nullable|integer|min:1',
            'joining_fee' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            // Get the highest display order
            $maxOrder = $event->subEvents()->max('display_order') ?? 0;
            $validated['display_order'] = $maxOrder + 1;

            $subEvent = $event->subEvents()->create($validated);

            // Log activity
            $this->logActivity($event, $subEvent, 'sub_event_created', null, $subEvent->toArray());

            DB::commit();

            return back()->with('success', 'Sub-event created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to create sub-event: '.$e->getMessage()]);
        }
    }

    public function update(Request $request, Event $event, SubEvent $subEvent)
    {
        if ($subEvent->event_id !== $event->id) {
            abort(403, 'Sub-event does not belong to this event.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'schedule' => 'nullable|string',
            'prize_details' => 'nullable|string',
            'max_participants' => 'nullable|integer|min:1',
            'joining_fee' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            $oldValues = $subEvent->toArray();
            $subEvent->update($validated);

            // Log activity
            $this->logActivity($event, $subEvent, 'sub_event_updated', $oldValues, $subEvent->fresh()->toArray());

            DB::commit();

            return back()->with('success', 'Sub-event updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to update sub-event: '.$e->getMessage()]);
        }
    }

    public function destroy(Event $event, SubEvent $subEvent)
    {
        if ($subEvent->event_id !== $event->id) {
            abort(403, 'Sub-event does not belong to this event.');
        }

        DB::beginTransaction();
        try {
            $oldValues = $subEvent->toArray();

            // Check if there are registrations
            $registrationCount = $subEvent->registrations()->count();
            if ($registrationCount > 0) {
                return back()->withErrors(['error' => "Cannot delete sub-event with {$registrationCount} registration(s)."]);
            }

            // Log activity before deleting
            $this->logActivity($event, $subEvent, 'sub_event_deleted', $oldValues, null);

            $subEvent->delete();

            // Reorder remaining sub-events
            $this->reorderSubEvents($event);

            DB::commit();

            return back()->with('success', 'Sub-event deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to delete sub-event: '.$e->getMessage()]);
        }
    }

    public function reorder(Request $request, Event $event)
    {
        $validated = $request->validate([
            'sub_events' => 'required|array',
            'sub_events.*.id' => 'required|exists:sub_events,id',
            'sub_events.*.display_order' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['sub_events'] as $subEventData) {
                $subEvent = SubEvent::find($subEventData['id']);

                if ($subEvent->event_id !== $event->id) {
                    continue;
                }

                $subEvent->update(['display_order' => $subEventData['display_order']]);
            }

            // Log activity
            $this->logActivity($event, null, 'sub_events_reordered', null, $validated['sub_events']);

            DB::commit();

            return back()->with('success', 'Sub-events reordered successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to reorder sub-events: '.$e->getMessage()]);
        }
    }

    public function toggleActive(Event $event, SubEvent $subEvent)
    {
        if ($subEvent->event_id !== $event->id) {
            abort(403, 'Sub-event does not belong to this event.');
        }

        $subEvent->update(['is_active' => ! $subEvent->is_active]);

        $action = $subEvent->is_active ? 'sub_event_activated' : 'sub_event_deactivated';
        $this->logActivity($event, $subEvent, $action, ['is_active' => ! $subEvent->is_active], ['is_active' => $subEvent->is_active]);

        return back()->with('success', 'Sub-event status updated successfully.');
    }

    protected function reorderSubEvents(Event $event): void
    {
        $subEvents = $event->subEvents()->orderBy('display_order')->get();

        foreach ($subEvents as $index => $subEvent) {
            $subEvent->update(['display_order' => $index + 1]);
        }
    }

    protected function logActivity(Event $event, ?SubEvent $subEvent, string $action, ?array $oldValues, ?array $newValues): void
    {
        EventActivityLog::create([
            'event_id' => $event->id,
            'user_id' => Auth::id(),
            'action' => $action,
            'model_type' => $subEvent ? SubEvent::class : null,
            'model_id' => $subEvent ? $subEvent->id : null,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
