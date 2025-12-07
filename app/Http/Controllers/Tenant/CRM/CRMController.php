<?php

namespace App\Http\Controllers;

use App\Services\CRMService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CRMController extends Controller
{
    protected $crmService;

    public function __construct(CRMService $crmService)
    {
        $this->crmService = $crmService;
    }

    /**
     * Display CRM dashboard
     */
    public function index()
    {
        $this->authorize('view_crm');

        $data = [
            'stats' => $this->crmService->getDashboardStats(),
            'recentLeads' => $this->crmService->getRecentLeads(),
            'upcomingTasks' => $this->crmService->getUpcomingTasks(),
        ];

        return Inertia::render('CRM/Index', $data);
    }

    /**
     * Display leads management
     */
    public function leads(Request $request)
    {
        $this->authorize('view_crm');

        $leads = $this->crmService->getLeads($request->all());

        return Inertia::render('CRM/Leads/Index', [
            'leads' => $leads,
            'filters' => $request->only(['status', 'source', 'search']),
        ]);
    }

    /**
     * Store a new lead
     */
    public function storeLeads(Request $request)
    {
        $this->authorize('create_leads');

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:leads,email',
            'phone' => 'nullable|string|max:20',
            'company' => 'nullable|string|max:255',
            'source' => 'required|string',
            'status' => 'required|string',
        ]);

        $lead = $this->crmService->createLead($request->all());

        return redirect()->back()->with('success', 'Lead created successfully');
    }

    /**
     * Display customers management
     */
    public function customers(Request $request)
    {
        $this->authorize('view_customers');

        $customers = $this->crmService->getCustomers($request->all());

        return Inertia::render('CRM/Customers/Index', [
            'customers' => $customers,
            'filters' => $request->only(['type', 'status', 'search']),
        ]);
    }

    /**
     * Display opportunities management
     */
    public function opportunities(Request $request)
    {
        $this->authorize('view_opportunities');

        $opportunities = $this->crmService->getOpportunities($request->all());

        return Inertia::render('CRM/Opportunities/Index', [
            'opportunities' => $opportunities,
            'filters' => $request->only(['stage', 'assigned_to', 'search']),
        ]);
    }

    /**
     * Display sales pipeline
     */
    public function pipeline()
    {
        $this->authorize('view_sales_pipeline');

        $pipeline = $this->crmService->getSalesPipeline();

        return Inertia::render('CRM/Pipeline/Index', [
            'pipeline' => $pipeline,
            'stages' => $this->crmService->getSalesStages(),
        ]);
    }

    /**
     * Display reports
     */
    public function reports(Request $request)
    {
        $this->authorize('view_crm_reports');

        $reports = $this->crmService->getReports($request->all());

        return Inertia::render('CRM/Reports/Index', [
            'reports' => $reports,
            'filters' => $request->only(['period', 'type']),
        ]);
    }

    /**
     * Display CRM settings
     */
    public function settings()
    {
        $this->authorize('manage_crm_settings');

        return Inertia::render('CRM/Settings/Index', [
            'leadSources' => $this->crmService->getLeadSources(),
            'salesStages' => $this->crmService->getSalesStages(),
            'customerTypes' => $this->crmService->getCustomerTypes(),
        ]);
    }
}
