<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Models\Event;
use Aero\HRM\Models\EventActivityLog;
use Aero\HRM\Models\EventRegistration;
use Aero\HRM\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PublicEventController extends Controller
{
    public function index()
    {
        $events = Event::published()
            ->upcoming()
            ->with(['subEvents' => function ($query) {
                $query->active()->orderBy('display_order');
            }])
            ->withCount('approvedRegistrations')
            ->orderBy('event_date')
            ->paginate(12);

        return Inertia::render('Pages/Shared/Public/Events/Index', [
            'events' => $events,
        ]);
    }

    public function show(string $slug)
    {
        $event = Event::where('slug', $slug)
            ->published()
            ->with([
                'subEvents' => function ($query) {
                    $query->active()->orderBy('display_order');
                },
                'customFields' => function ($query) {
                    $query->orderBy('display_order');
                },
            ])
            ->firstOrFail();

        // Check if registration is allowed
        $canRegister = $event->canRegister();
        $registrationStatus = $event->registration_status;
        $remainingSlots = $event->getRemainingSlots();

        return Inertia::render('Pages/Shared/Public/Events/Show', [
            'event' => $event,
            'canRegister' => $canRegister,
            'registrationStatus' => $registrationStatus,
            'remainingSlots' => $remainingSlots,
        ]);
    }

    public function register(Request $request, string $slug)
    {
        $event = Event::where('slug', $slug)
            ->published()
            ->with(['subEvents', 'customFields'])
            ->firstOrFail();

        // Check if registration is allowed
        if (! $event->canRegister()) {
            return back()->withErrors(['error' => 'Registration is not available for this event.']);
        }

        // Build validation rules
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'organization_or_department' => 'nullable|string|max:255',
            'gender' => 'required|in:male,female,other,prefer_not_to_say',
            'sub_event_ids' => 'required|array|min:1',
            'sub_event_ids.*' => 'required|exists:sub_events,id',
            'payment_proof' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ];

        // Add custom field validations
        foreach ($event->customFields as $field) {
            $fieldRules = [];

            if ($field->is_required) {
                $fieldRules[] = 'required';
            } else {
                $fieldRules[] = 'nullable';
            }

            switch ($field->field_type) {
                case 'email':
                    $fieldRules[] = 'email';
                    break;
                case 'phone':
                    $fieldRules[] = 'string|max:20';
                    break;
                case 'number':
                    $fieldRules[] = 'numeric';
                    break;
                case 'date':
                    $fieldRules[] = 'date';
                    break;
                case 'file':
                    $fieldRules[] = 'file|max:5120';
                    break;
                case 'checkbox':
                    $fieldRules[] = 'array';
                    break;
                default:
                    $fieldRules[] = 'string';
                    break;
            }

            $rules["custom_fields.{$field->field_name}"] = implode('|', $fieldRules);
        }

        $validated = $request->validate($rules);

        // Verify sub-events belong to this event
        $subEventIds = $validated['sub_event_ids'];
        $validSubEventIds = $event->subEvents()->whereIn('id', $subEventIds)->pluck('id')->toArray();

        if (count($validSubEventIds) !== count($subEventIds)) {
            return back()->withErrors(['error' => 'Invalid sub-event selection.']);
        }

        // Check if sub-events have available slots
        foreach ($validSubEventIds as $subEventId) {
            $subEvent = $event->subEvents()->find($subEventId);
            if (! $subEvent->hasAvailableSlots()) {
                return back()->withErrors(['error' => "Sub-event '{$subEvent->title}' is full."]);
            }
        }

        DB::beginTransaction();
        try {
            // Handle payment proof upload
            $paymentProofPath = null;
            if ($request->hasFile('payment_proof')) {
                $paymentProofPath = $request->file('payment_proof')->store('events/payment-proofs', 'public');
            }

            // Handle custom field file uploads
            $customFieldsData = $validated['custom_fields'] ?? [];
            foreach ($event->customFields as $field) {
                if ($field->field_type === 'file' && $request->hasFile("custom_fields.{$field->field_name}")) {
                    $file = $request->file("custom_fields.{$field->field_name}");
                    $customFieldsData[$field->field_name] = $file->store('events/custom-fields', 'public');
                }
            }

            // Create registration
            $registration = EventRegistration::create([
                'event_id' => $event->id,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'organization_or_department' => $validated['organization_or_department'] ?? null,
                'gender' => $validated['gender'],
                'payment_proof' => $paymentProofPath,
                'custom_fields' => $customFieldsData,
                'status' => 'pending',
            ]);

            // Attach sub-events
            $registration->subEvents()->attach($validSubEventIds);

            // Generate QR code
            $registration->generateQrCode();

            // Log activity
            $this->logActivity($event, $registration, 'registration_submitted');

            DB::commit();

            // TODO: Send registration confirmation email/SMS

            return redirect()->route('public.events.registration-success', ['slug' => $slug, 'token' => $registration->token])
                ->with('success', 'Registration submitted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to submit registration: '.$e->getMessage()]);
        }
    }

    public function registrationSuccess(string $slug, string $token)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $registration = EventRegistration::where('event_id', $event->id)
            ->where('token', $token)
            ->with('subEvents')
            ->firstOrFail();

        return Inertia::render('Pages/Shared/Public/Events/RegistrationSuccess', [
            'event' => $event,
            'registration' => $registration,
        ]);
    }

    public function checkRegistration(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string|exists:event_registrations,token',
        ]);

        $registration = EventRegistration::where('token', $validated['token'])
            ->with(['event', 'subEvents'])
            ->firstOrFail();

        return Inertia::render('Pages/Shared/Public/Events/CheckRegistration', [
            'registration' => $registration,
        ]);
    }

    public function downloadToken(string $token)
    {
        $registration = EventRegistration::where('token', $token)
            ->with(['event', 'subEvents'])
            ->firstOrFail();

        // Return printable token view
        return Inertia::render('Pages/Shared/Public/Events/PrintToken', [
            'registration' => $registration,
        ]);
    }

    protected function logActivity(Event $event, EventRegistration $registration, string $action): void
    {
        EventActivityLog::create([
            'event_id' => $event->id,
            'user_id' => null, // Public registration
            'action' => $action,
            'model_type' => EventRegistration::class,
            'model_id' => $registration->id,
            'old_values' => null,
            'new_values' => ['token' => $registration->token],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
