<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Models\EmployeeSalaryStructure;
use Aero\HRM\Models\SalaryComponent;
use Aero\HRM\Http\Controllers\Controller;
use Aero\Core\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class SalaryStructureController extends Controller
{
    /**
     * Display a listing of salary components.
     */
    public function index()
    {
        $components = SalaryComponent::orderBy('type')
            ->orderBy('display_order')
            ->get();

        $stats = [
            'total_components' => SalaryComponent::count(),
            'active_components' => SalaryComponent::where('is_active', true)->count(),
            'earnings' => SalaryComponent::where('type', 'earning')->count(),
            'deductions' => SalaryComponent::where('type', 'deduction')->count(),
        ];

        return Inertia::render('Pages/HRM/SalaryStructure/Index', [
            'title' => 'Salary Structure Management',
            'components' => $components,
            'stats' => $stats,
        ]);
    }

    /**
     * Store a newly created salary component.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:salary_components,code',
            'type' => 'required|in:earning,deduction',
            'calculation_type' => 'required|in:fixed,percentage,formula,attendance,slab',
            'percentage_of' => 'nullable|in:basic,gross,ctc',
            'percentage_value' => 'nullable|numeric|min:0|max:100',
            'default_amount' => 'nullable|numeric|min:0',
            'formula' => 'nullable|string',
            'is_taxable' => 'boolean',
            'is_statutory' => 'boolean',
            'affects_gross' => 'boolean',
            'affects_ctc' => 'boolean',
            'affects_epf' => 'boolean',
            'affects_esi' => 'boolean',
            'is_active' => 'boolean',
            'show_in_payslip' => 'boolean',
            'show_if_zero' => 'boolean',
            'display_order' => 'nullable|integer',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $component = SalaryComponent::create($request->all());

            return redirect()->route('hr.salary-structure.index')
                ->with('success', 'Salary component created successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to create salary component: '.$e->getMessage());
        }
    }

    /**
     * Update the specified salary component.
     */
    public function update(Request $request, $id)
    {
        $component = SalaryComponent::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:salary_components,code,'.$id,
            'type' => 'required|in:earning,deduction',
            'calculation_type' => 'required|in:fixed,percentage,formula,attendance,slab',
            'percentage_of' => 'nullable|in:basic,gross,ctc',
            'percentage_value' => 'nullable|numeric|min:0|max:100',
            'default_amount' => 'nullable|numeric|min:0',
            'formula' => 'nullable|string',
            'is_taxable' => 'boolean',
            'is_statutory' => 'boolean',
            'affects_gross' => 'boolean',
            'affects_ctc' => 'boolean',
            'affects_epf' => 'boolean',
            'affects_esi' => 'boolean',
            'is_active' => 'boolean',
            'show_in_payslip' => 'boolean',
            'show_if_zero' => 'boolean',
            'display_order' => 'nullable|integer',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $component->update($request->all());

            return redirect()->route('hr.salary-structure.index')
                ->with('success', 'Salary component updated successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to update salary component: '.$e->getMessage());
        }
    }

    /**
     * Remove the specified salary component.
     */
    public function destroy($id)
    {
        try {
            $component = SalaryComponent::findOrFail($id);
            $component->delete();

            return redirect()->route('hr.salary-structure.index')
                ->with('success', 'Salary component deleted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete salary component: '.$e->getMessage());
        }
    }

    /**
     * Display salary structure for a specific employee.
     */
    public function employeeSalary(Request $request, $employeeId)
    {
        $employee = User::with(['department', 'designation'])->findOrFail($employeeId);

        $salaryStructures = EmployeeSalaryStructure::with('salaryComponent')
            ->where('user_id', $employeeId)
            ->where('is_active', true)
            ->orderBy('created_at')
            ->get();

        $allComponents = SalaryComponent::where('is_active', true)
            ->orderBy('type')
            ->orderBy('display_order')
            ->get();

        // Calculate totals
        $earnings = $salaryStructures->filter(function ($structure) {
            return $structure->salaryComponent->type === 'earning';
        });

        $deductions = $salaryStructures->filter(function ($structure) {
            return $structure->salaryComponent->type === 'deduction';
        });

        $totalEarnings = $earnings->sum(function ($structure) {
            return $structure->calculateAmount(collect($salaryStructures));
        });

        $totalDeductions = $deductions->sum(function ($structure) {
            return $structure->calculateAmount(collect($salaryStructures));
        });

        $data = [
            'title' => 'Employee Salary Structure',
            'employee' => $employee,
            'salaryStructures' => $salaryStructures,
            'allComponents' => $allComponents,
            'summary' => [
                'total_earnings' => $totalEarnings,
                'total_deductions' => $totalDeductions,
                'net_salary' => $totalEarnings - $totalDeductions,
            ],
        ];

        // Return JSON for AJAX requests, Inertia for regular page loads
        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json($data);
        }

        return Inertia::render('Pages/HRM/SalaryStructure/EmployeeSalary', $data);
    }

    /**
     * Assign salary components to an employee.
     */
    public function assignToEmployee(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'components' => 'required|array',
            'components.*.salary_component_id' => 'required|exists:salary_components,id',
            'components.*.amount' => 'nullable|numeric|min:0',
            'components.*.percentage_value' => 'nullable|numeric|min:0|max:100',
            'components.*.calculation_type' => 'nullable|in:fixed,percentage,formula,attendance,slab',
            'components.*.effective_from' => 'required|date',
            'components.*.is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        DB::beginTransaction();
        try {
            $userId = $request->user_id;

            // Deactivate existing active components
            EmployeeSalaryStructure::where('user_id', $userId)
                ->where('is_active', true)
                ->update(['is_active' => false, 'effective_to' => now()]);

            // Create new salary structures
            foreach ($request->components as $component) {
                EmployeeSalaryStructure::create([
                    'user_id' => $userId,
                    'salary_component_id' => $component['salary_component_id'],
                    'amount' => $component['amount'] ?? null,
                    'percentage_value' => $component['percentage_value'] ?? null,
                    'calculation_type' => $component['calculation_type'] ?? null,
                    'effective_from' => $component['effective_from'],
                    'is_active' => $component['is_active'] ?? true,
                ]);
            }

            DB::commit();

            return back()->with('success', 'Salary components assigned successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to assign salary components: '.$e->getMessage());
        }
    }

    /**
     * Calculate salary preview for an employee.
     */
    public function calculatePreview(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'components' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $userId = $request->user_id;
            $components = collect($request->components);

            $earnings = [];
            $deductions = [];
            $totalEarnings = 0;
            $totalDeductions = 0;

            foreach ($components as $comp) {
                $salaryComponent = SalaryComponent::find($comp['salary_component_id']);
                if (! $salaryComponent) {
                    continue;
                }

                // Mock calculation (simplified)
                $amount = $comp['amount'] ?? $salaryComponent->default_amount ?? 0;

                $item = [
                    'name' => $salaryComponent->name,
                    'code' => $salaryComponent->code,
                    'amount' => $amount,
                    'calculation_type' => $comp['calculation_type'] ?? $salaryComponent->calculation_type,
                ];

                if ($salaryComponent->type === 'earning') {
                    $earnings[] = $item;
                    $totalEarnings += $amount;
                } else {
                    $deductions[] = $item;
                    $totalDeductions += $amount;
                }
            }

            return response()->json([
                'earnings' => $earnings,
                'deductions' => $deductions,
                'total_earnings' => $totalEarnings,
                'total_deductions' => $totalDeductions,
                'net_salary' => $totalEarnings - $totalDeductions,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
