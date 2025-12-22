<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Http\Requests\HR\StoreEmployeeDocumentRequest;
use Aero\HRM\Models\EmployeePersonalDocument;
use Aero\HRM\Http\Controllers\Controller;
use Aero\Core\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Employee Document Controller
 *
 * Handles document upload, retrieval, and deletion for employee profiles.
 * Uses tenant-aware storage with path: tenants/{tenant_id}/employees/{user_id}/{filename}
 *
 * @see \Aero\HRM\Models\EmployeePersonalDocument
 */
class EmployeeDocumentController extends Controller
{
    /**
     * Display all documents for an employee.
     */
    public function index(User $user): Response
    {
        $documents = $user->personalDocuments()
            ->with('verifier:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Pages/HRM/Documents/EmployeeDocuments', [
            'title' => 'Employee Documents',
            'employee' => $user->only(['id', 'name', 'email', 'employee_id', 'profile_image_url']),
            'documents' => $documents,
            'documentTypes' => $this->getDocumentTypes(),
        ]);
    }

    /**
     * Store a newly uploaded document.
     *
     * Storage Strategy:
     * - Files are stored in tenant-isolated paths
     * - Path format: employees/{user_id}/{document_type}/{uuid}_{original_filename}
     * - The FilesystemTenancyBootstrapper automatically prefixes with tenant storage path
     */
    public function store(StoreEmployeeDocumentRequest $request, User $user): JsonResponse
    {
        DB::beginTransaction();

        try {
            $file = $request->file('document');

            // Generate unique filename preserving extension
            $extension = $file->getClientOriginalExtension();
            $originalName = $file->getClientOriginalName();
            $uniqueFilename = Str::uuid().'_'.Str::slug(pathinfo($originalName, PATHINFO_FILENAME)).'.'.$extension;

            // Build tenant-aware path
            // With FilesystemTenancyBootstrapper, Storage::disk('local') is already tenant-scoped
            // But we add explicit employee folder structure for organization
            $storagePath = 'employees/'.$user->id.'/'.$request->validated('document_type');

            // Store the file
            $filePath = $file->storeAs($storagePath, $uniqueFilename, 'local');

            if (! $filePath) {
                throw new \Exception('Failed to store file');
            }

            // Create document record
            $document = EmployeePersonalDocument::create([
                'user_id' => $user->id,
                'name' => $request->validated('name'),
                'document_type' => $request->validated('document_type'),
                'document_number' => $request->validated('document_number'),
                'file_path' => $filePath,
                'file_name' => $originalName,
                'mime_type' => $file->getMimeType(),
                'file_size_kb' => (int) ceil($file->getSize() / 1024),
                'issue_date' => $request->validated('issue_date'),
                'expiry_date' => $request->validated('expiry_date'),
                'issued_by' => $request->validated('issued_by'),
                'issued_country' => $request->validated('issued_country'),
                'notes' => $request->validated('notes'),
                'is_confidential' => $request->validated('is_confidential', false),
                'status' => 'pending', // Documents start as pending until verified
            ]);

            DB::commit();

            Log::info('Employee document uploaded', [
                'document_id' => $document->id,
                'user_id' => $user->id,
                'document_type' => $document->document_type,
                'file_path' => $filePath,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully.',
                'document' => $document->load('verifier:id,name'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            // Clean up file if it was stored
            if (isset($filePath) && Storage::disk('local')->exists($filePath)) {
                Storage::disk('local')->delete($filePath);
            }

            Log::error('Failed to upload employee document', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload document. Please try again.',
            ], 500);
        }
    }

    /**
     * Display a specific document.
     */
    public function show(User $user, EmployeePersonalDocument $document): JsonResponse
    {
        // Ensure document belongs to the user
        if ($document->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'document' => $document->load('verifier:id,name'),
        ]);
    }

    /**
     * Download a document.
     */
    public function download(User $user, EmployeePersonalDocument $document)
    {
        // Ensure document belongs to the user
        if ($document->user_id !== $user->id) {
            abort(404, 'Document not found.');
        }

        // Check if file exists
        if (! Storage::disk('local')->exists($document->file_path)) {
            abort(404, 'Document file not found.');
        }

        return Storage::disk('local')->download(
            $document->file_path,
            $document->file_name,
            ['Content-Type' => $document->mime_type]
        );
    }

    /**
     * Update document metadata (not the file itself).
     */
    public function update(Request $request, User $user, EmployeePersonalDocument $document): JsonResponse
    {
        // Ensure document belongs to the user
        if ($document->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'document_number' => ['nullable', 'string', 'max:100'],
            'issue_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date', 'after:issue_date'],
            'issued_by' => ['nullable', 'string', 'max:255'],
            'issued_country' => ['nullable', 'string', 'size:3'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'is_confidential' => ['nullable', 'boolean'],
        ]);

        $document->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Document updated successfully.',
            'document' => $document->fresh()->load('verifier:id,name'),
        ]);
    }

    /**
     * Delete a document.
     */
    public function destroy(User $user, EmployeePersonalDocument $document): JsonResponse
    {
        // Ensure document belongs to the user
        if ($document->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        DB::beginTransaction();

        try {
            $filePath = $document->file_path;

            // Soft delete the document record
            $document->delete();

            // Note: We keep the file for audit purposes
            // If you want to hard delete files, uncomment below:
            // Storage::disk('local')->delete($filePath);

            DB::commit();

            Log::info('Employee document deleted', [
                'document_id' => $document->id,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully.',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to delete employee document', [
                'document_id' => $document->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete document.',
            ], 500);
        }
    }

    /**
     * Verify a document (HR/Admin action).
     */
    public function verify(Request $request, User $user, EmployeePersonalDocument $document): JsonResponse
    {
        // Ensure document belongs to the user
        if ($document->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:verified,rejected'],
            'rejection_reason' => ['required_if:status,rejected', 'nullable', 'string', 'max:500'],
        ]);

        if ($validated['status'] === 'verified') {
            $document->markAsVerified(auth()->id());
        } else {
            $document->reject($validated['rejection_reason']);
        }

        return response()->json([
            'success' => true,
            'message' => $validated['status'] === 'verified'
                ? 'Document verified successfully.'
                : 'Document rejected.',
            'document' => $document->fresh()->load('verifier:id,name'),
        ]);
    }

    /**
     * Get documents expiring soon.
     */
    public function expiring(Request $request): JsonResponse
    {
        $days = $request->get('days', 30);

        $documents = EmployeePersonalDocument::with(['user:id,name,email,employee_id'])
            ->expiringSoon($days)
            ->verified()
            ->orderBy('expiry_date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'documents' => $documents,
            'count' => $documents->count(),
        ]);
    }

    /**
     * Get available document types.
     */
    private function getDocumentTypes(): array
    {
        return [
            ['value' => 'identity', 'label' => 'Identity Document (NID/ID Card)'],
            ['value' => 'passport', 'label' => 'Passport'],
            ['value' => 'contract', 'label' => 'Employment Contract'],
            ['value' => 'certificate', 'label' => 'Certificate'],
            ['value' => 'license', 'label' => 'Professional License'],
            ['value' => 'visa', 'label' => 'Visa'],
            ['value' => 'work_permit', 'label' => 'Work Permit'],
            ['value' => 'tax_document', 'label' => 'Tax Document'],
            ['value' => 'other', 'label' => 'Other'],
        ];
    }
}
