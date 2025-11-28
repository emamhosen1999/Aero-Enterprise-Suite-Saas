<?php

namespace App\Http\Controllers\SCM;

use App\Http\Controllers\Controller;
use App\Models\SCM\CustomsDeclaration;
use App\Models\SCM\TradeDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ImportExportController extends Controller
{
    public function index()
    {
        return Inertia::render('SCM/ImportExport/Index', [
            'tradeDocuments' => TradeDocument::with(['tradeTransaction'])
                ->latest()
                ->paginate(15),
            'customsDeclarations' => CustomsDeclaration::with(['declarable'])
                ->latest()
                ->take(10)
                ->get(),
            'stats' => [
                'total_documents' => TradeDocument::count(),
                'pending_documents' => TradeDocument::where('status', 'draft')->count(),
                'approved_documents' => TradeDocument::where('status', 'approved')->count(),
                'expired_documents' => TradeDocument::where('expiry_date', '<', now())->count(),
                'total_declarations' => CustomsDeclaration::count(),
                'pending_clearance' => CustomsDeclaration::whereIn('status', ['pending', 'submitted', 'under_review'])->count(),
            ],
            'status' => session('status'),
        ]);
    }

    // Trade Documents Management
    public function documents()
    {
        return Inertia::render('SCM/ImportExport/Documents/Index', [
            'documents' => TradeDocument::with(['tradeTransaction'])
                ->latest()
                ->paginate(15),
            'documentTypes' => [
                'invoice' => 'Commercial Invoice',
                'bill_of_lading' => 'Bill of Lading',
                'packing_list' => 'Packing List',
                'certificate_of_origin' => 'Certificate of Origin',
                'customs_declaration' => 'Customs Declaration',
                'other' => 'Other Document',
            ],
            'status' => session('status'),
        ]);
    }

    public function createDocument()
    {
        return Inertia::render('SCM/ImportExport/Documents/Create', [
            'nextDocumentNumber' => $this->generateDocumentNumber(),
            'documentTypes' => [
                'invoice' => 'Commercial Invoice',
                'bill_of_lading' => 'Bill of Lading',
                'packing_list' => 'Packing List',
                'certificate_of_origin' => 'Certificate of Origin',
                'customs_declaration' => 'Customs Declaration',
                'other' => 'Other Document',
            ],
        ]);
    }

    public function storeDocument(Request $request)
    {
        $validated = $request->validate([
            'document_number' => 'required|string|unique:trade_documents,document_number',
            'document_type' => 'required|string|in:invoice,bill_of_lading,packing_list,certificate_of_origin,customs_declaration,other',
            'trade_transaction_type' => 'required|string',
            'trade_transaction_id' => 'required|integer',
            'document_name' => 'required|string|max:255',
            'file' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'issue_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after:issue_date',
            'issued_by' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $filePath = null;
        $fileName = null;
        $fileSize = null;
        $mimeType = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $fileSize = $file->getSize();
            $mimeType = $file->getMimeType();
            $filePath = $file->store('trade-documents', 'public');
        }

        TradeDocument::create([
            'document_number' => $validated['document_number'],
            'document_type' => $validated['document_type'],
            'trade_transaction_type' => $validated['trade_transaction_type'],
            'trade_transaction_id' => $validated['trade_transaction_id'],
            'document_name' => $validated['document_name'],
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
            'issue_date' => $validated['issue_date'],
            'expiry_date' => $validated['expiry_date'],
            'issued_by' => $validated['issued_by'],
            'notes' => $validated['notes'],
            'status' => 'draft',
        ]);

        return Redirect::route('scm.import-export.documents')->with('status', 'Trade document created successfully.');
    }

    public function showDocument(TradeDocument $document)
    {
        $document->load(['tradeTransaction']);

        return Inertia::render('SCM/ImportExport/Documents/Show', [
            'document' => $document,
            'isExpired' => $document->isExpired(),
            'isExpiringSoon' => $document->isExpiringSoon(),
        ]);
    }

    public function downloadDocument(TradeDocument $document)
    {
        if (! $document->file_path || ! Storage::disk('public')->exists($document->file_path)) {
            return Redirect::back()->with('error', 'File not found.');
        }

        return response()->download(Storage::disk('public')->path($document->file_path), $document->file_name);
    }

    // Customs Declarations Management
    public function declarations()
    {
        return Inertia::render('SCM/ImportExport/Declarations/Index', [
            'declarations' => CustomsDeclaration::with(['declarable'])
                ->latest()
                ->paginate(15),
            'stats' => [
                'total_imports' => CustomsDeclaration::where('declaration_type', 'import')->count(),
                'total_exports' => CustomsDeclaration::where('declaration_type', 'export')->count(),
                'pending_clearance' => CustomsDeclaration::whereIn('status', ['pending', 'submitted', 'under_review'])->count(),
                'cleared_this_month' => CustomsDeclaration::where('status', 'cleared')->whereMonth('clearance_date', now()->month)->count(),
            ],
            'status' => session('status'),
        ]);
    }

    public function createDeclaration()
    {
        return Inertia::render('SCM/ImportExport/Declarations/Create', [
            'nextDeclarationNumber' => $this->generateDeclarationNumber(),
            'currencies' => ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'],
            'countries' => $this->getCountryCodes(),
        ]);
    }

    public function storeDeclaration(Request $request)
    {
        $validated = $request->validate([
            'declaration_number' => 'required|string|unique:customs_declarations,declaration_number',
            'declaration_type' => 'required|string|in:import,export',
            'declarable_type' => 'required|string',
            'declarable_id' => 'required|integer',
            'origin_country' => 'required|string|size:3',
            'destination_country' => 'required|string|size:3',
            'port_of_entry' => 'nullable|string|max:255',
            'port_of_exit' => 'nullable|string|max:255',
            'declared_value' => 'required|numeric|min:0',
            'currency' => 'required|string|size:3',
            'duties_amount' => 'nullable|numeric|min:0',
            'taxes_amount' => 'nullable|numeric|min:0',
            'hs_codes' => 'nullable|array',
            'hs_codes.*' => 'string',
            'declaration_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        CustomsDeclaration::create(array_merge($validated, [
            'duties_amount' => $validated['duties_amount'] ?? 0,
            'taxes_amount' => $validated['taxes_amount'] ?? 0,
            'status' => 'pending',
        ]));

        return Redirect::route('scm.import-export.declarations')->with('status', 'Customs declaration created successfully.');
    }

    public function showDeclaration(CustomsDeclaration $declaration)
    {
        $declaration->load(['declarable']);

        return Inertia::render('SCM/ImportExport/Declarations/Show', [
            'declaration' => $declaration,
            'isPending' => $declaration->isPending(),
            'isCleared' => $declaration->isCleared(),
        ]);
    }

    public function updateDeclarationStatus(Request $request, CustomsDeclaration $declaration)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,submitted,under_review,cleared,held,rejected',
            'clearance_date' => 'nullable|date',
            'customs_officer' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $declaration->update($validated);

        return Redirect::back()->with('status', 'Declaration status updated successfully.');
    }

    public function submitDeclaration(CustomsDeclaration $declaration)
    {
        if ($declaration->status !== 'pending') {
            return Redirect::back()->with('error', 'Only pending declarations can be submitted.');
        }

        $declaration->update(['status' => 'submitted']);

        return Redirect::back()->with('status', 'Declaration submitted to customs successfully.');
    }

    // Utility Methods
    private function generateDocumentNumber()
    {
        $lastDocument = TradeDocument::latest('id')->first();
        $nextNumber = $lastDocument ? (int) substr($lastDocument->document_number, 3) + 1 : 1;

        return 'TD-'.str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }

    private function generateDeclarationNumber()
    {
        $lastDeclaration = CustomsDeclaration::latest('id')->first();
        $nextNumber = $lastDeclaration ? (int) substr($lastDeclaration->declaration_number, 3) + 1 : 1;

        return 'CD-'.str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }

    private function getCountryCodes()
    {
        return [
            'USA' => 'United States',
            'CAN' => 'Canada',
            'MEX' => 'Mexico',
            'GBR' => 'United Kingdom',
            'DEU' => 'Germany',
            'FRA' => 'France',
            'ITA' => 'Italy',
            'ESP' => 'Spain',
            'CHN' => 'China',
            'JPN' => 'Japan',
            'KOR' => 'South Korea',
            'IND' => 'India',
            'AUS' => 'Australia',
            'BRA' => 'Brazil',
            'ARG' => 'Argentina',
            // Add more countries as needed
        ];
    }
}
