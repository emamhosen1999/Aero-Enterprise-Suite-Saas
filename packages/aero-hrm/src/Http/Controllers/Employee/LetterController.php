<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Models\Letter;
use Aero\HRM\Http\Controllers\Controller;
use App\Http\Controllers\Tenant\HRM\Employee\ValidationException;
use Aero\Core\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LetterController extends Controller
{
    public function index()
    {
        $users = User::with(['designation'])->get();

        return Inertia::render('Letters', [
            'users' => $users,
            'title' => 'Letters',
        ]);
    }

    public function paginate(Request $request)
    {
        $perPage = $request->get('perPage', 30); // Default to 10 items per page
        $page = $request->get('search') != '' ? 1 : $request->get('page', 1);
        $search = $request->get('search'); // Search query

        // Base query depending on user's role
        $query = Letter::query();

        // Apply search if provided
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('from', 'LIKE', "%{$search}%")
                    ->orWhere('received_date', 'LIKE', "%{$search}%")
                    ->orWhere('memo_number', 'LIKE', "%{$search}%")
                    ->orWhere('handling_memo', 'LIKE', "%{$search}%")
                    ->orWhere('subject', 'LIKE', "%{$search}%")
                    ->orWhere('action_taken', 'LIKE', "%{$search}%");
            });
        }

        // Order by 'date' in descending order
        $paginatedLetters = $query->orderBy('received_date', 'desc')->paginate($perPage, ['*'], 'page', $page);

        // Return the paginated response as JSON
        return response()->json($paginatedLetters);
    }

    public function update(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            // Find task by ID
            $letter = Letter::find($request->id);

            // If task not found, return 404 error response
            if (! $letter) {
                return response()->json(['error' => 'Letter not found'], 404);
            }

            $messages = [];  // Initialize an empty array to hold success messages

            // Check if the 'ruleSet' is 'details' and perform validation
            if ($request->has('ruleSet') && $request->input('ruleSet') === 'details') {
                $validatedData = $request->validate([
                    'date' => 'required|date',
                    'number' => 'required|string',
                    'type' => 'required|string',
                    'description' => 'nullable|string',
                    'location' => 'required|string',
                    'side' => 'nullable|string',
                    'qty_layer' => 'nullable|string',
                    'planned_time' => 'required|string',
                ]);

                // Update the Letter fields with the validated data
                $fields = [
                    'date' => 'Date',
                    'number' => 'Number',
                    'type' => 'Type',
                    'description' => 'Description',
                    'location' => 'Location',
                    'side' => 'Side',
                    'qty_layer' => 'Quantity Layer',
                    'planned_time' => 'Planned Time',
                ];

                foreach ($fields as $key => $label) {
                    if (array_key_exists($key, $validatedData) && $validatedData[$key] !== $letter->$key) {
                        $letter->$key = $validatedData[$key];
                        $messages[] = "{$label} updated successfully to '{$validatedData[$key]}'";
                    }
                }
            }

            // Additional fields update checks
            if ($request->has('status')) {
                $request->validate(['status' => 'required|string']);
                $letter->status = $request->status;
                $messages[] = 'Letter status updated to '.$letter->status;
            }
            if ($request->has('handling_status')) {
                $request->validate(['handling_status' => 'required|string']);
                $letter->handling_status = $request->handling_status;
                $messages[] = 'Letter handling status updated to '.$letter->handling_status;
            }
            if ($request->has('received_date')) {
                $request->validate(['received_date' => 'required|date']);
                $letter->received_date = $request->received_date;
                $messages[] = 'Letter received date updated to '.$letter->received_date;
            }
            if ($request->has('action_taken')) {
                $request->validate(['action_taken' => 'nullable|string']);
                $letter->action_taken = $request->action_taken;
                $messages[] = 'Letter action taken updated to '.$letter->action_taken;
            }
            if ($request->has('need_reply')) {
                $letter->need_reply = $request->need_reply;
                $messages[] = $letter->memo_number.' letter set to '.($request->need_reply ? 'needs reply' : 'does not need reply');
            }
            if ($request->has('forwarded_status')) {
                $letter->forwarded_status = $request->forwarded_status;
                $messages[] = $letter->memo_number.' letter set to '.($request->forwarded_status ? 'forwarded' : 'not forwarded');
            }
            if ($request->has('need_forward')) {
                $letter->need_forward = $request->need_forward;
                $messages[] = $letter->memo_number.' letter set to '.($request->need_forward ? 'needs forward' : 'does not need forward');
            }
            if ($request->has('replied_status')) {
                $letter->replied_status = $request->replied_status;
                $messages[] = $letter->memo_number.' letter set to '.($request->replied_status ? 'replied' : 'not replied');
            }

            if ($request->has('dealt_by')) {
                $letter->dealt_by = $request->dealt_by;
                $messages[] = $letter->memo_number.' letter dealt by '.(User::find($request->dealt_by)->name ?? 'Unknown');
            }
            if ($request->has('completion_time')) {
                $letter->completion_time = $request->completion_time;
                $messages[] = 'Completion date-time updated';
            }

            // Save the Letter with the updated fields
            $letter->save();

            // Return JSON response with the success messages
            return response()->json(['messages' => $messages]);

        } catch (ValidationException $e) {
            // Validation failed, return error response
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            if ($e instanceof \Illuminate\Session\TokenMismatchException) {
                return response()->json(['error' => 'CSRF token mismatch'], 419);
            }

            // Other exceptions occurred, return error response
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
