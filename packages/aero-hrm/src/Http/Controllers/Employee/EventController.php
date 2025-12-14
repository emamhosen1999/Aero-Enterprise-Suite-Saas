<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Models\Event;
use Aero\HRM\Models\EventActivityLog;
use Aero\HRM\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class EventController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'permission:event.view'])->only(['index', 'show']);
        $this->middleware(['auth', 'permission:event.create'])->only(['create', 'store']);
        $this->middleware(['auth', 'permission:event.update'])->only(['edit', 'update', 'togglePublish']);
        $this->middleware(['auth', 'permission:event.delete'])->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = Event::with(['creator', 'subEvents', 'registrations'])
            ->withCount(['registrations', 'approvedRegistrations']);

        // Filters
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                    ->orWhere('description', 'like', "%{$request->search}%")
                    ->orWhere('venue', 'like', "%{$request->search}%");
            });
        }

        if ($request->status === 'published') {
            $query->published();
        } elseif ($request->status === 'draft') {
            $query->where('is_published', false);
        }

        if ($request->registration === 'open') {
            $query->where('is_registration_open', true);
        } elseif ($request->registration === 'closed') {
            $query->where('is_registration_open', false);
        }

        if ($request->timeline === 'upcoming') {
            $query->upcoming();
        } elseif ($request->timeline === 'past') {
            $query->past();
        }

        // Sort
        $sortBy = $request->get('sort_by', 'event_date');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $events = $query->paginate(15);

        return Inertia::render('Pages/HRM/Events/Index', [
            'events' => $events,
            'filters' => $request->only(['search', 'status', 'registration', 'timeline']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Pages/HRM/Events/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:events,slug',
            'description' => 'required|string',
            'venue' => 'required|string|max:255',
            'event_date' => 'required|date',
            'event_time' => 'required|string',
            'registration_deadline' => 'nullable|date',
            'max_participants' => 'nullable|integer|min:1',
            'banner_image' => 'nullable|image|max:5120',
            'food_details' => 'nullable|string',
            'rules' => 'nullable|string',
            'organizer_name' => 'nullable|string|max:255',
            'organizer_phone' => 'nullable|string|max:20',
            'organizer_email' => 'nullable|email|max:255',
            'is_published' => 'boolean',
            'is_registration_open' => 'boolean',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string|max:500',
            'custom_fields' => 'nullable|array',
            'custom_fields.*.field_name' => 'required|string',
            'custom_fields.*.field_label' => 'required|string',
            'custom_fields.*.field_type' => 'required|in:text,textarea,number,email,phone,select,radio,checkbox,date,file',
            'custom_fields.*.field_options' => 'nullable|array',
            'custom_fields.*.is_required' => 'boolean',
            'custom_fields.*.placeholder' => 'nullable|string',
            'custom_fields.*.help_text' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Generate slug if not provided
            if (empty($validated['slug'])) {
                $validated['slug'] = Str::slug($validated['title']);

                // Ensure uniqueness
                $originalSlug = $validated['slug'];
                $count = 1;
                while (Event::where('slug', $validated['slug'])->exists()) {
                    $validated['slug'] = $originalSlug.'-'.$count;
                    $count++;
                }
            }

            // Handle banner upload
            if ($request->hasFile('banner_image')) {
                $validated['banner_image'] = $request->file('banner_image')->store('events/banners', 'public');
            }

            // Create event
            $validated['created_by'] = Auth::id();
            $event = Event::create($validated);

            // Create custom fields
            if (! empty($validated['custom_fields'])) {
                foreach ($validated['custom_fields'] as $index => $field) {
                    $event->customFields()->create([
                        'field_name' => $field['field_name'],
                        'field_label' => $field['field_label'],
                        'field_type' => $field['field_type'],
                        'field_options' => $field['field_options'] ?? null,
                        'is_required' => $field['is_required'] ?? false,
                        'placeholder' => $field['placeholder'] ?? null,
                        'help_text' => $field['help_text'] ?? null,
                        'display_order' => $index + 1,
                    ]);
                }
            }

            // Log activity
            $this->logActivity($event, 'created', null, $event->toArray());

            DB::commit();

            return redirect()->route('events.index')->with('success', 'Event created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to create event: '.$e->getMessage()]);
        }
    }

    public function show(Event $event)
    {
        $event->load([
            'subEvents' => function ($query) {
                $query->active()->orderBy('display_order');
            },
            'customFields' => function ($query) {
                $query->orderBy('display_order');
            },
            'creator',
            'updater',
        ]);

        $analytics = $event->getAnalytics();

        return Inertia::render('Pages/HRM/Events/Show', [
            'event' => $event,
            'analytics' => $analytics,
        ]);
    }

    public function edit(Event $event)
    {
        $event->load([
            'subEvents' => function ($query) {
                $query->orderBy('display_order');
            },
            'customFields' => function ($query) {
                $query->orderBy('display_order');
            },
        ]);

        return Inertia::render('Pages/HRM/Events/Edit', [
            'event' => $event,
        ]);
    }

    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:events,slug,'.$event->id,
            'description' => 'required|string',
            'venue' => 'required|string|max:255',
            'event_date' => 'required|date',
            'event_time' => 'required|string',
            'registration_deadline' => 'nullable|date',
            'max_participants' => 'nullable|integer|min:1',
            'banner_image' => 'nullable|image|max:5120',
            'food_details' => 'nullable|string',
            'rules' => 'nullable|string',
            'organizer_name' => 'nullable|string|max:255',
            'organizer_phone' => 'nullable|string|max:20',
            'organizer_email' => 'nullable|email|max:255',
            'is_published' => 'boolean',
            'is_registration_open' => 'boolean',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string|max:500',
            'custom_fields' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $oldValues = $event->toArray();

            // Handle banner upload
            if ($request->hasFile('banner_image')) {
                // Delete old banner
                if ($event->banner_image) {
                    Storage::disk('public')->delete($event->banner_image);
                }
                $validated['banner_image'] = $request->file('banner_image')->store('events/banners', 'public');
            }

            $validated['updated_by'] = Auth::id();
            $event->update($validated);

            // Update custom fields
            if (isset($validated['custom_fields'])) {
                $event->customFields()->delete();
                foreach ($validated['custom_fields'] as $index => $field) {
                    $event->customFields()->create([
                        'field_name' => $field['field_name'],
                        'field_label' => $field['field_label'],
                        'field_type' => $field['field_type'],
                        'field_options' => $field['field_options'] ?? null,
                        'is_required' => $field['is_required'] ?? false,
                        'placeholder' => $field['placeholder'] ?? null,
                        'help_text' => $field['help_text'] ?? null,
                        'display_order' => $index + 1,
                    ]);
                }
            }

            // Log activity
            $this->logActivity($event, 'updated', $oldValues, $event->fresh()->toArray());

            DB::commit();

            return redirect()->route('events.show', $event)->with('success', 'Event updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to update event: '.$e->getMessage()]);
        }
    }

    public function destroy(Event $event)
    {
        DB::beginTransaction();
        try {
            $oldValues = $event->toArray();

            // Delete banner
            if ($event->banner_image) {
                Storage::disk('public')->delete($event->banner_image);
            }

            // Log activity before deleting
            $this->logActivity($event, 'deleted', $oldValues, null);

            $event->delete();

            DB::commit();

            return redirect()->route('events.index')->with('success', 'Event deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to delete event: '.$e->getMessage()]);
        }
    }

    public function togglePublish(Event $event)
    {
        $event->update([
            'is_published' => ! $event->is_published,
            'updated_by' => Auth::id(),
        ]);

        $action = $event->is_published ? 'published' : 'unpublished';
        $this->logActivity($event, $action, ['is_published' => ! $event->is_published], ['is_published' => $event->is_published]);

        return back()->with('success', 'Event '.$action.' successfully.');
    }

    public function duplicate(Event $event)
    {
        DB::beginTransaction();
        try {
            $newEvent = $event->replicate();
            $newEvent->title = $event->title.' (Copy)';
            $newEvent->slug = Str::slug($newEvent->title);

            // Ensure unique slug
            $originalSlug = $newEvent->slug;
            $count = 1;
            while (Event::where('slug', $newEvent->slug)->exists()) {
                $newEvent->slug = $originalSlug.'-'.$count;
                $count++;
            }

            $newEvent->is_published = false;
            $newEvent->created_by = Auth::id();
            $newEvent->updated_by = null;
            $newEvent->save();

            // Duplicate sub-events
            foreach ($event->subEvents as $subEvent) {
                $newSubEvent = $subEvent->replicate();
                $newSubEvent->event_id = $newEvent->id;
                $newSubEvent->save();
            }

            // Duplicate custom fields
            foreach ($event->customFields as $field) {
                $newField = $field->replicate();
                $newField->event_id = $newEvent->id;
                $newField->save();
            }

            $this->logActivity($newEvent, 'duplicated', null, $newEvent->toArray());

            DB::commit();

            return redirect()->route('events.edit', $newEvent)->with('success', 'Event duplicated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to duplicate event: '.$e->getMessage()]);
        }
    }

    public function analytics(Event $event)
    {
        $analytics = $event->getAnalytics();

        // Additional analytics
        $registrationsByDate = $event->registrations()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $registrationsBySubEvent = DB::table('event_registration_sub_events')
            ->join('sub_events', 'event_registration_sub_events.sub_event_id', '=', 'sub_events.id')
            ->where('sub_events.event_id', $event->id)
            ->select('sub_events.title', DB::raw('COUNT(*) as count'))
            ->groupBy('sub_events.id', 'sub_events.title')
            ->get();

        return Inertia::render('Pages/HRM/Events/Analytics', [
            'event' => $event,
            'analytics' => $analytics,
            'registrationsByDate' => $registrationsByDate,
            'registrationsBySubEvent' => $registrationsBySubEvent,
        ]);
    }

    protected function logActivity(Event $event, string $action, ?array $oldValues, ?array $newValues): void
    {
        EventActivityLog::create([
            'event_id' => $event->id,
            'user_id' => Auth::id(),
            'action' => $action,
            'model_type' => Event::class,
            'model_id' => $event->id,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
