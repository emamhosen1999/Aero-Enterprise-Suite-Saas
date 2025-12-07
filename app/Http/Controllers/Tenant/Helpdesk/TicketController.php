<?php

namespace App\Http\Controllers\Helpdesk;

use App\Http\Controllers\Controller;
use App\Models\HelpDeskTicket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TicketController extends Controller
{
    public function index()
    {
        return Inertia::render('Helpdesk/Tickets/Index', [
            'tickets' => HelpDeskTicket::with(['requester', 'assignee', 'department'])
                ->when(request('status'), function ($query, $status) {
                    $query->where('status', $status);
                })
                ->when(request('priority'), function ($query, $priority) {
                    $query->where('priority', $priority);
                })
                ->when(! Auth::user()->hasRole('admin') && ! Auth::user()->hasPermissionTo('view_all_tickets'), function ($query) {
                    $query->where(function ($q) {
                        $q->where('requester_id', Auth::id())
                            ->orWhere('assignee_id', Auth::id());
                    });
                })
                ->latest()
                ->paginate(10)
                ->withQueryString(),
            'filters' => request()->only(['status', 'priority']),
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('Helpdesk/Tickets/Create', [
            'users' => User::select('id', 'name')->orderBy('name')->get(),
            'departments' => \App\Models\HRM\Department::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'required|string|in:low,medium,high,critical',
            'status' => 'required|string|in:open,in_progress,on_hold,resolved,closed',
            'department_id' => 'nullable|exists:departments,id',
            'assignee_id' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date|after_or_equal:today',
            'category' => 'nullable|string|max:100',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240',
        ]);

        $validated['requester_id'] = Auth::id();

        $ticket = HelpDeskTicket::create($validated);

        // Handle attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $ticket->addMedia($file)->toMediaCollection('ticket_attachments');
            }
        }

        return redirect()->route('helpdesk.tickets.index')->with('status', 'Ticket created successfully');
    }

    public function show(HelpDeskTicket $ticket)
    {
        if (
            ! Auth::user()->hasPermissionTo('view_all_tickets') &&
            Auth::id() !== $ticket->requester_id &&
            Auth::id() !== $ticket->assignee_id
        ) {
            abort(403, 'Unauthorized action.');
        }

        return Inertia::render('Helpdesk/Tickets/Show', [
            'ticket' => $ticket->load(['requester', 'assignee', 'department', 'comments.user']),
            'activities' => $ticket->activities()->with('causer')->latest()->get(),
            'attachments' => $ticket->getMedia('ticket_attachments'),
        ]);
    }

    public function edit(HelpDeskTicket $ticket)
    {
        if (
            ! Auth::user()->hasPermissionTo('edit_tickets') &&
            Auth::id() !== $ticket->assignee_id
        ) {
            abort(403, 'Unauthorized action.');
        }

        return Inertia::render('Helpdesk/Tickets/Edit', [
            'ticket' => $ticket,
            'users' => User::select('id', 'name')->orderBy('name')->get(),
            'departments' => \App\Models\HRM\Department::select('id', 'name')->orderBy('name')->get(),
            'attachments' => $ticket->getMedia('ticket_attachments'),
        ]);
    }

    public function update(Request $request, HelpDeskTicket $ticket)
    {
        if (
            ! Auth::user()->hasPermissionTo('edit_tickets') &&
            Auth::id() !== $ticket->assignee_id
        ) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'required|string|in:low,medium,high,critical',
            'status' => 'required|string|in:open,in_progress,on_hold,resolved,closed',
            'department_id' => 'nullable|exists:departments,id',
            'assignee_id' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
            'category' => 'nullable|string|max:100',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240',
        ]);

        $oldStatus = $ticket->status;
        $oldAssignee = $ticket->assignee_id;

        $ticket->update($validated);

        // Handle status change logging
        if ($oldStatus !== $validated['status']) {
            activity()
                ->performedOn($ticket)
                ->causedBy(Auth::user())
                ->withProperties(['status_change' => [
                    'from' => $oldStatus,
                    'to' => $validated['status'],
                ]])
                ->log('changed_status');
        }

        // Handle assignee change logging
        if ($oldAssignee !== $validated['assignee_id']) {
            activity()
                ->performedOn($ticket)
                ->causedBy(Auth::user())
                ->withProperties(['assignee_change' => [
                    'from' => $oldAssignee,
                    'to' => $validated['assignee_id'],
                ]])
                ->log('changed_assignee');
        }

        // Handle attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $ticket->addMedia($file)->toMediaCollection('ticket_attachments');
            }
        }

        return redirect()->route('helpdesk.tickets.show', $ticket)->with('status', 'Ticket updated successfully');
    }

    public function destroy(HelpDeskTicket $ticket)
    {
        if (! Auth::user()->hasPermissionTo('delete_tickets')) {
            abort(403, 'Unauthorized action.');
        }

        $ticket->delete();

        return redirect()->route('helpdesk.tickets.index')->with('status', 'Ticket deleted successfully');
    }

    public function addComment(Request $request, HelpDeskTicket $ticket)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'is_internal' => 'boolean',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240',
        ]);

        $comment = $ticket->comments()->create([
            'content' => $validated['content'],
            'user_id' => Auth::id(),
            'is_internal' => $validated['is_internal'] ?? false,
        ]);

        // Handle attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $comment->addMedia($file)->toMediaCollection('comment_attachments');
            }
        }

        // Log activity
        activity()
            ->performedOn($ticket)
            ->causedBy(Auth::user())
            ->withProperties(['comment_id' => $comment->id])
            ->log('added_comment');

        return back()->with('status', 'Comment added successfully');
    }
}
