<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\Compliance\CompliancePolicy;
use App\Models\Compliance\CompliancePolicyAcknowledgment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CompliancePolicyController extends Controller
{
    /**
     * Display a listing of compliance policies
     */
    public function index(Request $request)
    {
        $query = CompliancePolicy::with(['owner', 'approver']);

        // Apply filters
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%'.$request->search.'%')
                    ->orWhere('description', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('due_for_review')) {
            $query->dueForReview();
        }

        $policies = $query->orderBy('created_at', 'desc')->paginate(15);

        return Inertia::render('Compliance/Policies/Index', [
            'policies' => $policies,
            'filters' => $request->only(['search', 'category', 'status', 'due_for_review']),
            'categories' => $this->getCategories(),
            'statuses' => $this->getStatuses(),
        ]);
    }

    /**
     * Show the form for creating a new policy
     */
    public function create()
    {
        return Inertia::render('Compliance/Policies/Create', [
            'categories' => $this->getCategories(),
            'types' => $this->getTypes(),
            'users' => User::select('id', 'name', 'email')->get(),
        ]);
    }

    /**
     * Store a newly created policy
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string|in:'.implode(',', array_keys($this->getCategories())),
            'type' => 'required|string|in:'.implode(',', array_keys($this->getTypes())),
            'content' => 'required|string',
            'effective_date' => 'required|date',
            'review_frequency_months' => 'required|integer|min:1|max:60',
            'owner_id' => 'required|exists:users,id',
            'approver_id' => 'nullable|exists:users,id',
            'requires_acknowledgment' => 'boolean',
            'applicable_roles' => 'nullable|array',
            'tags' => 'nullable|array',
        ]);

        $policy = CompliancePolicy::create([
            'policy_id' => 'POL-'.strtoupper(substr(md5(uniqid()), 0, 8)),
            'title' => $request->title,
            'description' => $request->description,
            'category' => $request->category,
            'type' => $request->type,
            'content' => $request->content,
            'status' => CompliancePolicy::STATUS_DRAFT,
            'version' => '1.0',
            'effective_date' => $request->effective_date,
            'review_frequency_months' => $request->review_frequency_months,
            'next_review_date' => now()->addMonths($request->review_frequency_months),
            'owner_id' => $request->owner_id,
            'approver_id' => $request->approver_id,
            'requires_acknowledgment' => $request->requires_acknowledgment ?? false,
            'applicable_roles' => $request->applicable_roles,
            'tags' => $request->tags,
            'created_by' => auth()->id(),
        ]);

        return redirect()->route('compliance.policies.show', $policy)
            ->with('success', 'Policy created successfully.');
    }

    /**
     * Display the specified policy
     */
    public function show(CompliancePolicy $policy)
    {
        $policy->load(['owner', 'approver', 'createdBy', 'updatedBy']);

        $acknowledgments = [];
        if ($policy->requires_acknowledgment) {
            $acknowledgments = CompliancePolicyAcknowledgment::with('user')
                ->where('compliance_policy_id', $policy->id)
                ->latest('acknowledged_at')
                ->paginate(10);
        }

        return Inertia::render('Compliance/Policies/Show', [
            'policy' => $policy,
            'acknowledgments' => $acknowledgments,
            'userHasAcknowledged' => $this->userHasAcknowledged($policy),
            'acknowledgmentStats' => $this->getAcknowledmentStats($policy),
        ]);
    }

    /**
     * Show the form for editing the policy
     */
    public function edit(CompliancePolicy $policy)
    {
        return Inertia::render('Compliance/Policies/Edit', [
            'policy' => $policy,
            'categories' => $this->getCategories(),
            'types' => $this->getTypes(),
            'users' => User::select('id', 'name', 'email')->get(),
        ]);
    }

    /**
     * Update the specified policy
     */
    public function update(Request $request, CompliancePolicy $policy)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string|in:'.implode(',', array_keys($this->getCategories())),
            'type' => 'required|string|in:'.implode(',', array_keys($this->getTypes())),
            'content' => 'required|string',
            'effective_date' => 'required|date',
            'review_frequency_months' => 'required|integer|min:1|max:60',
            'owner_id' => 'required|exists:users,id',
            'approver_id' => 'nullable|exists:users,id',
            'requires_acknowledgment' => 'boolean',
            'applicable_roles' => 'nullable|array',
            'tags' => 'nullable|array',
        ]);

        // Increment version if content has changed
        $versionChanged = $policy->content !== $request->content;

        $policy->update([
            'title' => $request->title,
            'description' => $request->description,
            'category' => $request->category,
            'type' => $request->type,
            'content' => $request->content,
            'effective_date' => $request->effective_date,
            'review_frequency_months' => $request->review_frequency_months,
            'next_review_date' => now()->addMonths($request->review_frequency_months),
            'owner_id' => $request->owner_id,
            'approver_id' => $request->approver_id,
            'requires_acknowledgment' => $request->requires_acknowledgment ?? false,
            'applicable_roles' => $request->applicable_roles,
            'tags' => $request->tags,
            'updated_by' => auth()->id(),
            'version' => $versionChanged ? $this->incrementVersion($policy->version) : $policy->version,
        ]);

        return redirect()->route('compliance.policies.show', $policy)
            ->with('success', 'Policy updated successfully.');
    }

    /**
     * Remove the specified policy
     */
    public function destroy(CompliancePolicy $policy)
    {
        $policy->delete();

        return redirect()->route('compliance.policies.index')
            ->with('success', 'Policy deleted successfully.');
    }

    /**
     * Approve a policy
     */
    public function approve(CompliancePolicy $policy)
    {
        if ($policy->status !== CompliancePolicy::STATUS_PENDING_APPROVAL) {
            return back()->with('error', 'Policy cannot be approved in its current status.');
        }

        $policy->update([
            'status' => CompliancePolicy::STATUS_APPROVED,
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return back()->with('success', 'Policy approved successfully.');
    }

    /**
     * Publish a policy
     */
    public function publish(CompliancePolicy $policy)
    {
        if ($policy->status !== CompliancePolicy::STATUS_APPROVED) {
            return back()->with('error', 'Policy must be approved before publishing.');
        }

        $policy->update([
            'status' => CompliancePolicy::STATUS_ACTIVE,
            'published_at' => now(),
            'published_by' => auth()->id(),
        ]);

        return back()->with('success', 'Policy published successfully.');
    }

    /**
     * Archive a policy
     */
    public function archive(CompliancePolicy $policy)
    {
        $policy->update([
            'status' => CompliancePolicy::STATUS_ARCHIVED,
            'archived_at' => now(),
            'archived_by' => auth()->id(),
        ]);

        return back()->with('success', 'Policy archived successfully.');
    }

    /**
     * Acknowledge a policy
     */
    public function acknowledge(CompliancePolicy $policy)
    {
        if (! $policy->requires_acknowledgment) {
            return back()->with('error', 'This policy does not require acknowledgment.');
        }

        $existingAck = CompliancePolicyAcknowledgment::where([
            'compliance_policy_id' => $policy->id,
            'user_id' => auth()->id(),
        ])->first();

        if ($existingAck) {
            return back()->with('info', 'You have already acknowledged this policy.');
        }

        CompliancePolicyAcknowledgment::create([
            'compliance_policy_id' => $policy->id,
            'user_id' => auth()->id(),
            'acknowledged_at' => now(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return back()->with('success', 'Policy acknowledged successfully.');
    }

    /**
     * Get available categories
     */
    private function getCategories(): array
    {
        return [
            CompliancePolicy::CATEGORY_HR => 'Human Resources',
            CompliancePolicy::CATEGORY_SAFETY => 'Safety',
            CompliancePolicy::CATEGORY_SECURITY => 'Security',
            CompliancePolicy::CATEGORY_QUALITY => 'Quality',
            CompliancePolicy::CATEGORY_FINANCIAL => 'Financial',
            CompliancePolicy::CATEGORY_OPERATIONAL => 'Operational',
            CompliancePolicy::CATEGORY_REGULATORY => 'Regulatory',
            CompliancePolicy::CATEGORY_ENVIRONMENTAL => 'Environmental',
        ];
    }

    /**
     * Get available types
     */
    private function getTypes(): array
    {
        return [
            CompliancePolicy::TYPE_POLICY => 'Policy',
            CompliancePolicy::TYPE_PROCEDURE => 'Procedure',
            CompliancePolicy::TYPE_GUIDELINE => 'Guideline',
            CompliancePolicy::TYPE_STANDARD => 'Standard',
        ];
    }

    /**
     * Get available statuses
     */
    private function getStatuses(): array
    {
        return [
            CompliancePolicy::STATUS_DRAFT => 'Draft',
            CompliancePolicy::STATUS_UNDER_REVIEW => 'Under Review',
            CompliancePolicy::STATUS_PENDING_APPROVAL => 'Pending Approval',
            CompliancePolicy::STATUS_APPROVED => 'Approved',
            CompliancePolicy::STATUS_ACTIVE => 'Active',
            CompliancePolicy::STATUS_ARCHIVED => 'Archived',
        ];
    }

    /**
     * Check if current user has acknowledged the policy
     */
    private function userHasAcknowledged(CompliancePolicy $policy): bool
    {
        if (! $policy->requires_acknowledgment) {
            return true;
        }

        return CompliancePolicyAcknowledgment::where([
            'compliance_policy_id' => $policy->id,
            'user_id' => auth()->id(),
        ])->exists();
    }

    /**
     * Get acknowledgment statistics
     */
    private function getAcknowledmentStats(CompliancePolicy $policy): array
    {
        if (! $policy->requires_acknowledgment) {
            return [];
        }

        $totalUsers = User::active()->count();
        $acknowledgedCount = CompliancePolicyAcknowledgment::where('compliance_policy_id', $policy->id)
            ->distinct('user_id')
            ->count();

        return [
            'total_users' => $totalUsers,
            'acknowledged_count' => $acknowledgedCount,
            'pending_count' => $totalUsers - $acknowledgedCount,
            'acknowledgment_rate' => $totalUsers > 0 ? round(($acknowledgedCount / $totalUsers) * 100, 2) : 0,
        ];
    }

    /**
     * Increment version number
     */
    private function incrementVersion(string $version): string
    {
        $parts = explode('.', $version);
        $parts[count($parts) - 1]++;

        return implode('.', $parts);
    }
}
