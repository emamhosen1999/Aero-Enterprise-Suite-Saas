<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\HRM\Opportunity;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index()
    {
        return Inertia::render('CRM/Customers/Index', [
            'customers' => Customer::with('user')
                ->latest()
                ->paginate(10),
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('CRM/Customers/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
            'company' => 'nullable|string|max:255',
            'status' => 'required|string|in:active,inactive,lead,prospect',
            'notes' => 'nullable|string',
            'customer_type' => 'required|string|in:individual,company',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        Customer::create($validated);

        return redirect()->route('crm.customers.index')->with('status', 'Customer created successfully');
    }

    public function edit(Customer $customer)
    {
        return Inertia::render('CRM/Customers/Edit', [
            'customer' => $customer,
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
            'company' => 'nullable|string|max:255',
            'status' => 'required|string|in:active,inactive,lead,prospect',
            'notes' => 'nullable|string',
            'customer_type' => 'required|string|in:individual,company',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $customer->update($validated);

        return redirect()->route('crm.customers.index')->with('status', 'Customer updated successfully');
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return redirect()->route('crm.customers.index')->with('status', 'Customer deleted successfully');
    }

    public function dashboard()
    {
        return Inertia::render('CRM/Dashboard', [
            'customerStats' => [
                'total' => Customer::count(),
                'active' => Customer::where('status', 'active')->count(),
                'leads' => Customer::where('status', 'lead')->count(),
                'prospects' => Customer::where('status', 'prospect')->count(),
            ],
            'opportunityStats' => [
                'total' => Opportunity::count(),
                'open' => Opportunity::whereIn('status', ['open', 'in-progress'])->count(),
                'won' => Opportunity::where('status', 'won')->count(),
                'lost' => Opportunity::where('status', 'lost')->count(),
                'value' => Opportunity::where('status', 'won')->sum('value'),
            ],
            'recentCustomers' => Customer::latest()->take(5)->get(),
            'recentOpportunities' => Opportunity::with('customer')->latest()->take(5)->get(),
        ]);
    }
}
