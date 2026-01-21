<?php

namespace Aero\HRM\Http\Controllers\Disciplinary;

use App\Http\Controllers\Controller;
use Aero\HRM\Models\DisciplinaryActionType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActionTypeController extends Controller
{
    public function index()
    {
        return Inertia::render('HRM/Disciplinary/ActionTypesIndex', [
            'title' => 'Disciplinary Action Types',
        ]);
    }

    public function getData()
    {
        return response()->json(
            DisciplinaryActionType::orderBy('name')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:disciplinary_action_types,name',
            'description' => 'nullable|string',
            'severity_level' => 'required|integer|min:1|max:5',
            'is_active' => 'boolean',
        ]);

        $actionType = DisciplinaryActionType::create($validated);

        return response()->json([
            'message' => 'Action type created successfully',
            'data' => $actionType,
        ]);
    }

    public function update(Request $request, $id)
    {
        $actionType = DisciplinaryActionType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:disciplinary_action_types,name,' . $id,
            'description' => 'nullable|string',
            'severity_level' => 'sometimes|integer|min:1|max:5',
            'is_active' => 'boolean',
        ]);

        $actionType->update($validated);

        return response()->json([
            'message' => 'Action type updated successfully',
            'data' => $actionType,
        ]);
    }

    public function destroy($id)
    {
        $actionType = DisciplinaryActionType::findOrFail($id);
        $actionType->delete();

        return response()->json([
            'message' => 'Action type deleted successfully',
        ]);
    }
}
