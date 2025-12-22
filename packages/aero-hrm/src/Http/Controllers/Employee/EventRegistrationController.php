<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Models\Event;
use Aero\HRM\Models\EventActivityLog;
use Aero\HRM\Models\EventRegistration;
use Aero\HRM\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EventRegistrationController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'permission:event.registration.manage']);
    }

    public function index(Event $event)
    {
        $registrations = $event->registrations()
            ->with('subEvents')
            ->latest()
            ->paginate(20);

        return Inertia::render('Pages/HRM/Events/Registrations/Index', [
            'event' => $event,
            'registrations' => $registrations,
        ]);
    }

    public function show(Event $event, EventRegistration $registration)
    {
        if ($registration->event_id !== $event->id) {
            abort(403, 'Registration does not belong to this event.');
        }

        $registration->load('subEvents');

        return Inertia::render('Pages/HRM/Events/Registrations/Show', [
            'event' => $event,
            'registration' => $registration,
        ]);
    }

    public function approve(Event $event, EventRegistration $registration)
    {
        if ($registration->event_id !== $event->id) {
            abort(403, 'Registration does not belong to this event.');
        }

        DB::beginTransaction();
        try {
            $registration->approve();

            // Generate QR code if not exists
            if (! $registration->qr_code) {
                $registration->generateQrCode();
            }

            // Log activity
            $this->logActivity($event, $registration, 'registration_approved');

            DB::commit();

            // TODO: Send approval email/SMS notification

            return back()->with('success', 'Registration approved successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to approve registration: '.$e->getMessage()]);
        }
    }

    public function reject(Event $event, EventRegistration $registration, Request $request)
    {
        if ($registration->event_id !== $event->id) {
            abort(403, 'Registration does not belong to this event.');
        }

        $validated = $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            $registration->reject();

            // Store rejection reason if provided
            if (! empty($validated['rejection_reason'])) {
                $registration->update(['rejection_reason' => $validated['rejection_reason']]);
            }

            // Log activity
            $this->logActivity($event, $registration, 'registration_rejected');

            DB::commit();

            // TODO: Send rejection email/SMS notification

            return back()->with('success', 'Registration rejected.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to reject registration: '.$e->getMessage()]);
        }
    }

    public function cancel(Event $event, EventRegistration $registration)
    {
        if ($registration->event_id !== $event->id) {
            abort(403, 'Registration does not belong to this event.');
        }

        DB::beginTransaction();
        try {
            $registration->cancel();

            // Log activity
            $this->logActivity($event, $registration, 'registration_cancelled');

            DB::commit();

            return back()->with('success', 'Registration cancelled.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to cancel registration: '.$e->getMessage()]);
        }
    }

    public function verifyPayment(Event $event, EventRegistration $registration)
    {
        if ($registration->event_id !== $event->id) {
            abort(403, 'Registration does not belong to this event.');
        }

        DB::beginTransaction();
        try {
            $registration->update(['payment_verified' => true]);

            // Log activity
            $this->logActivity($event, $registration, 'payment_verified');

            DB::commit();

            return back()->with('success', 'Payment verified successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to verify payment: '.$e->getMessage()]);
        }
    }

    public function exportCsv(Event $event)
    {
        $registrations = $event->registrations()
            ->with('subEvents')
            ->get();

        $filename = 'event-'.$event->slug.'-registrations-'.now()->format('Y-m-d').'.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($registrations) {
            $file = fopen('php://output', 'w');

            // Header row
            fputcsv($file, [
                'Token',
                'Name',
                'Email',
                'Phone',
                'Address',
                'Organization/Department',
                'Gender',
                'Status',
                'Payment Verified',
                'Sub-Events',
                'Total Fee',
                'Registration Date',
            ]);

            // Data rows
            foreach ($registrations as $registration) {
                fputcsv($file, [
                    $registration->token,
                    $registration->name,
                    $registration->email,
                    $registration->phone,
                    $registration->address,
                    $registration->organization_or_department,
                    $registration->gender,
                    $registration->status,
                    $registration->payment_verified ? 'Yes' : 'No',
                    $registration->subEvents->pluck('title')->join(', '),
                    $registration->getTotalFee(),
                    $registration->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function exportPdf(Event $event)
    {
        // TODO: Implement PDF export using dompdf or similar
        return back()->with('info', 'PDF export coming soon.');
    }

    public function bulkApprove(Request $request, Event $event)
    {
        $validated = $request->validate([
            'registration_ids' => 'required|array',
            'registration_ids.*' => 'required|exists:event_registrations,id',
        ]);

        DB::beginTransaction();
        try {
            $count = 0;
            foreach ($validated['registration_ids'] as $registrationId) {
                $registration = EventRegistration::find($registrationId);

                if ($registration->event_id !== $event->id) {
                    continue;
                }

                if ($registration->status === 'pending') {
                    $registration->approve();

                    if (! $registration->qr_code) {
                        $registration->generateQrCode();
                    }

                    $this->logActivity($event, $registration, 'registration_approved');
                    $count++;
                }
            }

            DB::commit();

            return back()->with('success', "{$count} registration(s) approved successfully.");
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to approve registrations: '.$e->getMessage()]);
        }
    }

    public function bulkReject(Request $request, Event $event)
    {
        $validated = $request->validate([
            'registration_ids' => 'required|array',
            'registration_ids.*' => 'required|exists:event_registrations,id',
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            $count = 0;
            foreach ($validated['registration_ids'] as $registrationId) {
                $registration = EventRegistration::find($registrationId);

                if ($registration->event_id !== $event->id) {
                    continue;
                }

                if ($registration->status === 'pending') {
                    $registration->reject();

                    if (! empty($validated['rejection_reason'])) {
                        $registration->update(['rejection_reason' => $validated['rejection_reason']]);
                    }

                    $this->logActivity($event, $registration, 'registration_rejected');
                    $count++;
                }
            }

            DB::commit();

            return back()->with('success', "{$count} registration(s) rejected.");
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to reject registrations: '.$e->getMessage()]);
        }
    }

    public function printToken(Event $event, EventRegistration $registration)
    {
        if ($registration->event_id !== $event->id) {
            abort(403, 'Registration does not belong to this event.');
        }

        $registration->load(['subEvents', 'event']);

        return Inertia::render('Pages/HRM/Events/Registrations/PrintToken', [
            'event' => $event,
            'registration' => $registration,
        ]);
    }

    protected function logActivity(Event $event, EventRegistration $registration, string $action): void
    {
        EventActivityLog::create([
            'event_id' => $event->id,
            'user_id' => Auth::id(),
            'action' => $action,
            'model_type' => EventRegistration::class,
            'model_id' => $registration->id,
            'old_values' => null,
            'new_values' => ['token' => $registration->token, 'status' => $registration->status],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
