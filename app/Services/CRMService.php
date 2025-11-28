<?php

namespace App\Services;

use App\Models\CRM\Customer;
use App\Models\CRM\Lead;
use App\Models\CRM\LeadSource;
use App\Models\CRM\Opportunity;
use App\Models\CRM\SalesStage;
use Illuminate\Support\Facades\DB;

class CRMService
{
    /**
     * Get dashboard statistics
     */
    public function getDashboardStats()
    {
        return [
            'total_leads' => Lead::count(),
            'qualified_leads' => Lead::where('status', 'qualified')->count(),
            'total_customers' => Customer::count(),
            'active_opportunities' => Opportunity::where('status', 'active')->count(),
            'total_revenue' => Opportunity::where('status', 'won')->sum('value'),
            'conversion_rate' => $this->calculateConversionRate(),
        ];
    }

    /**
     * Get recent leads
     */
    public function getRecentLeads($limit = 10)
    {
        return Lead::with(['source', 'assignedTo'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get upcoming tasks
     */
    public function getUpcomingTasks($limit = 10)
    {
        // Placeholder for task management integration
        return collect([]);
    }

    /**
     * Get leads with filters and pagination
     */
    public function getLeads(array $filters = [])
    {
        $query = Lead::with(['source', 'assignedTo', 'customer']);

        // Apply filters
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['source'])) {
            $query->where('source_id', $filters['source']);
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%'.$filters['search'].'%')
                    ->orWhere('email', 'like', '%'.$filters['search'].'%')
                    ->orWhere('company', 'like', '%'.$filters['search'].'%');
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate(20);
    }

    /**
     * Create a new lead
     */
    public function createLead(array $data)
    {
        return Lead::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'company' => $data['company'] ?? null,
            'source_id' => $data['source'],
            'status' => $data['status'],
            'assigned_to' => auth()->id(),
            'created_by' => auth()->id(),
        ]);
    }

    /**
     * Get customers with filters and pagination
     */
    public function getCustomers(array $filters = [])
    {
        $query = Customer::with(['assignedTo']);

        // Apply filters
        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%'.$filters['search'].'%')
                    ->orWhere('email', 'like', '%'.$filters['search'].'%')
                    ->orWhere('company', 'like', '%'.$filters['search'].'%');
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate(20);
    }

    /**
     * Get opportunities with filters and pagination
     */
    public function getOpportunities(array $filters = [])
    {
        $query = Opportunity::with(['customer', 'stage', 'assignedTo']);

        // Apply filters
        if (! empty($filters['stage'])) {
            $query->where('stage_id', $filters['stage']);
        }

        if (! empty($filters['assigned_to'])) {
            $query->where('assigned_to', $filters['assigned_to']);
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%'.$filters['search'].'%')
                    ->orWhere('description', 'like', '%'.$filters['search'].'%');
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate(20);
    }

    /**
     * Get sales pipeline data
     */
    public function getSalesPipeline()
    {
        $stages = SalesStage::with(['opportunities' => function ($query) {
            $query->where('status', 'active');
        }])->orderBy('order')->get();

        return $stages->map(function ($stage) {
            return [
                'id' => $stage->id,
                'name' => $stage->name,
                'opportunities' => $stage->opportunities,
                'total_value' => $stage->opportunities->sum('value'),
                'count' => $stage->opportunities->count(),
            ];
        });
    }

    /**
     * Get sales stages
     */
    public function getSalesStages()
    {
        return SalesStage::orderBy('order')->get();
    }

    /**
     * Get lead sources
     */
    public function getLeadSources()
    {
        return LeadSource::orderBy('name')->get();
    }

    /**
     * Get customer types
     */
    public function getCustomerTypes()
    {
        return [
            'individual' => 'Individual',
            'business' => 'Business',
            'enterprise' => 'Enterprise',
        ];
    }

    /**
     * Get CRM reports
     */
    public function getReports(array $filters = [])
    {
        $period = $filters['period'] ?? 'month';
        $type = $filters['type'] ?? 'overview';

        switch ($type) {
            case 'leads':
                return $this->getLeadReports($period);
            case 'sales':
                return $this->getSalesReports($period);
            case 'conversion':
                return $this->getConversionReports($period);
            default:
                return $this->getOverviewReports($period);
        }
    }

    /**
     * Calculate conversion rate
     */
    private function calculateConversionRate()
    {
        $totalLeads = Lead::count();
        $convertedLeads = Lead::whereHas('customer')->count();

        return $totalLeads > 0 ? round(($convertedLeads / $totalLeads) * 100, 2) : 0;
    }

    /**
     * Get lead reports
     */
    private function getLeadReports($period)
    {
        // Implementation for lead-specific reports
        return [
            'total_leads' => Lead::count(),
            'qualified_leads' => Lead::where('status', 'qualified')->count(),
            'sources_breakdown' => Lead::join('lead_sources', 'leads.source_id', '=', 'lead_sources.id')
                ->select('lead_sources.name', DB::raw('count(*) as count'))
                ->groupBy('lead_sources.name')
                ->get(),
        ];
    }

    /**
     * Get sales reports
     */
    private function getSalesReports($period)
    {
        // Implementation for sales-specific reports
        return [
            'total_revenue' => Opportunity::where('status', 'won')->sum('value'),
            'active_opportunities' => Opportunity::where('status', 'active')->count(),
            'average_deal_size' => Opportunity::where('status', 'won')->avg('value'),
        ];
    }

    /**
     * Get conversion reports
     */
    private function getConversionReports($period)
    {
        // Implementation for conversion-specific reports
        return [
            'conversion_rate' => $this->calculateConversionRate(),
            'lead_to_customer' => Lead::whereHas('customer')->count(),
            'opportunity_win_rate' => $this->calculateWinRate(),
        ];
    }

    /**
     * Get overview reports
     */
    private function getOverviewReports($period)
    {
        return [
            'leads' => $this->getLeadReports($period),
            'sales' => $this->getSalesReports($period),
            'conversion' => $this->getConversionReports($period),
        ];
    }

    /**
     * Calculate opportunity win rate
     */
    private function calculateWinRate()
    {
        $totalOpportunities = Opportunity::whereIn('status', ['won', 'lost'])->count();
        $wonOpportunities = Opportunity::where('status', 'won')->count();

        return $totalOpportunities > 0 ? round(($wonOpportunities / $totalOpportunities) * 100, 2) : 0;
    }
}
