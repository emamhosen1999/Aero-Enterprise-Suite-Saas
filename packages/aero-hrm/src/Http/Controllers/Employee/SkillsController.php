<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SkillsController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 30);
        $search = $request->input('search');
        $category = $request->input('category');

        $query = DB::table('skills');

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($category) {
            $query->where('category', $category);
        }

        $skills = $query->orderBy('name')->paginate($perPage);

        if ($request->wantsJson()) {
            return response()->json([
                'skills' => $skills,
            ]);
        }

        return Inertia::render('HRM/Skills/Index', [
            'title' => 'Skills Management',
            'skills' => $skills,
        ]);
    }

    /**
     * Get skills stats.
     */
    public function stats()
    {
        $totalSkills = DB::table('skills')->count();
        $totalCompetencies = DB::table('competencies')->count();
        $certifiedEmployees = DB::table('employee_skills')
            ->whereNotNull('certification_name')
            ->distinct('employee_id')
            ->count('employee_id');
        $skillGaps = DB::table('skills')
            ->where('is_required', true)
            ->leftJoin('employee_skills', 'skills.id', '=', 'employee_skills.skill_id')
            ->whereNull('employee_skills.id')
            ->count();

        return response()->json([
            'total_skills' => $totalSkills,
            'total_competencies' => $totalCompetencies,
            'certified_employees' => $certifiedEmployees,
            'skill_gaps' => $skillGaps,
        ]);
    }

    /**
     * Get employee skills list.
     */
    public function allEmployeeSkills(Request $request)
    {
        $perPage = $request->input('per_page', 30);
        $search = $request->input('search');
        $level = $request->input('level');

        $query = DB::table('employee_skills')
            ->join('employees', 'employee_skills.employee_id', '=', 'employees.id')
            ->join('skills', 'employee_skills.skill_id', '=', 'skills.id')
            ->select(
                'employee_skills.*',
                'employees.full_name as employee_name',
                'employees.employee_id as employee_code',
                'skills.name as skill_name',
                'skills.category as skill_category'
            );

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('employees.full_name', 'like', "%{$search}%")
                    ->orWhere('skills.name', 'like', "%{$search}%");
            });
        }

        if ($level) {
            $query->where('employee_skills.level', $level);
        }

        $employeeSkills = $query->orderBy('employees.full_name')->paginate($perPage);

        return response()->json([
            'employee_skills' => $employeeSkills,
        ]);
    }

    /**
     * Get skill matrix data.
     */
    public function matrix(Request $request)
    {
        $departmentId = $request->input('department_id');

        $query = DB::table('employees')
            ->leftJoin('employee_skills', 'employees.id', '=', 'employee_skills.employee_id')
            ->leftJoin('skills', 'employee_skills.skill_id', '=', 'skills.id')
            ->select(
                'employees.id as employee_id',
                'employees.full_name as employee_name',
                'skills.id as skill_id',
                'skills.name as skill_name',
                'employee_skills.level',
                'employee_skills.proficiency'
            );

        if ($departmentId) {
            $query->where('employees.department_id', $departmentId);
        }

        $data = $query->get();

        // Transform into matrix format
        $employees = $data->groupBy('employee_id')->map(function ($items, $employeeId) {
            return [
                'id' => $employeeId,
                'name' => $items->first()->employee_name,
                'skills' => $items->filter(fn ($i) => $i->skill_id)->mapWithKeys(fn ($i) => [
                    $i->skill_id => [
                        'level' => $i->level,
                        'proficiency' => $i->proficiency,
                    ],
                ])->toArray(),
            ];
        })->values();

        $skills = DB::table('skills')->select('id', 'name', 'category')->orderBy('name')->get();

        return response()->json([
            'employees' => $employees,
            'skills' => $skills,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'is_required' => 'boolean',
        ]);

        $id = DB::table('skills')->insertGetId([
            ...$validated,
            'is_required' => $validated['is_required'] ?? false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Skill created successfully',
            'id' => $id,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'is_required' => 'boolean',
        ]);

        DB::table('skills')->where('id', $id)->update([
            ...$validated,
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Skill updated successfully']);
    }

    public function destroy($id)
    {
        DB::table('skills')->where('id', $id)->delete();

        return response()->json(['message' => 'Skill deleted successfully']);
    }

    public function competencies(Request $request)
    {
        $perPage = $request->input('per_page', 30);
        $competencies = DB::table('competencies')->paginate($perPage);

        if ($request->wantsJson()) {
            return response()->json(['competencies' => $competencies]);
        }

        return Inertia::render('HRM/Skills/Competencies', [
            'title' => 'Competency Framework',
            'competencies' => $competencies,
        ]);
    }

    public function storeCompetency(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'level_definitions' => 'nullable|array',
        ]);

        $id = DB::table('competencies')->insertGetId([
            ...$validated,
            'level_definitions' => json_encode($validated['level_definitions'] ?? []),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Competency created successfully',
            'id' => $id,
        ]);
    }

    public function updateCompetency(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'level_definitions' => 'nullable|array',
        ]);

        $data = $validated;
        if (isset($data['level_definitions'])) {
            $data['level_definitions'] = json_encode($data['level_definitions']);
        }

        DB::table('competencies')->where('id', $id)->update([
            ...$data,
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Competency updated successfully']);
    }

    public function destroyCompetency($id)
    {
        DB::table('competencies')->where('id', $id)->delete();

        return response()->json(['message' => 'Competency deleted successfully']);
    }

    public function employeeSkills($employeeId)
    {
        $employee = Employee::findOrFail($employeeId);
        $skills = DB::table('employee_skills')
            ->join('skills', 'employee_skills.skill_id', '=', 'skills.id')
            ->where('employee_skills.employee_id', $employeeId)
            ->select('employee_skills.*', 'skills.name as skill_name', 'skills.category')
            ->get();

        return Inertia::render('HRM/Skills/EmployeeSkills', [
            'title' => 'Employee Skills',
            'employeeId' => $employeeId,
            'employee' => $employee,
            'skills' => $skills,
        ]);
    }

    public function storeEmployeeSkill(Request $request, $employeeId)
    {
        $validated = $request->validate([
            'skill_id' => 'required|exists:skills,id',
            'level' => 'required|in:beginner,intermediate,advanced,expert',
            'proficiency' => 'nullable|integer|min:0|max:100',
            'years_experience' => 'nullable|numeric|min:0',
            'certification_name' => 'nullable|string|max:255',
            'certification_date' => 'nullable|date',
            'certification_expiry' => 'nullable|date|after:certification_date',
            'is_verified' => 'boolean',
        ]);

        $id = DB::table('employee_skills')->insertGetId([
            'employee_id' => $employeeId,
            ...$validated,
            'is_verified' => $validated['is_verified'] ?? false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Skill assigned to employee successfully',
            'id' => $id,
        ]);
    }

    public function updateEmployeeSkill(Request $request, $employeeId, $skillId)
    {
        $validated = $request->validate([
            'level' => 'sometimes|in:beginner,intermediate,advanced,expert',
            'proficiency' => 'nullable|integer|min:0|max:100',
            'years_experience' => 'nullable|numeric|min:0',
            'certification_name' => 'nullable|string|max:255',
            'certification_date' => 'nullable|date',
            'certification_expiry' => 'nullable|date|after:certification_date',
            'is_verified' => 'boolean',
        ]);

        DB::table('employee_skills')
            ->where('id', $skillId)
            ->where('employee_id', $employeeId)
            ->update([
                ...$validated,
                'updated_at' => now(),
            ]);

        return response()->json(['message' => 'Employee skill updated successfully']);
    }

    public function verifyEmployeeSkill($employeeId, $skillId)
    {
        DB::table('employee_skills')
            ->where('id', $skillId)
            ->where('employee_id', $employeeId)
            ->update([
                'is_verified' => true,
                'verified_at' => now(),
                'updated_at' => now(),
            ]);

        return response()->json(['message' => 'Skill verified successfully']);
    }

    public function destroyEmployeeSkill($employeeId, $skillId)
    {
        DB::table('employee_skills')
            ->where('id', $skillId)
            ->where('employee_id', $employeeId)
            ->delete();

        return response()->json(['message' => 'Skill removed from employee successfully']);
    }
}
