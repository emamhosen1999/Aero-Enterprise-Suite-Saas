<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Models\Experience;
use Aero\HRM\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ExperienceController extends Controller
{
    public function update(Request $request)
    {
        try {
            $validated = $request->validate([
                'experiences.*.id' => 'nullable|exists:experiences,id',
                'experiences.*.company_name' => 'required|string|max:255',
                'experiences.*.location' => 'required|string|max:255',
                'experiences.*.job_position' => 'required|string|max:255',
                'experiences.*.period_from' => 'required|date',
                'experiences.*.period_to' => 'required|date', // period_to can be null for ongoing positions
                'experiences.*.description' => 'required|string',
                'experiences.*.user_id' => 'required|exists:users,id',
            ], [
                'experiences.*.id.exists' => 'The specified experience ID does not exist.',
                'experiences.*.company_name.required' => 'Company name is required.',
                'experiences.*.location.required' => 'Location is required.',
                'experiences.*.job_position.required' => 'Job position is required.',
                'experiences.*.period_from.required' => 'Started from is required.',
                'experiences.*.period_from.date' => 'Started from must be a valid date.',
                'experiences.*.period_to.date' => 'Ended on must be a valid date.',
                'experiences.*.period_to.required' => 'Ended on is required.',
                'experiences.*.description.required' => 'Responsibilities are required.',
                'experiences.*.user_id.exists' => 'The specified user ID does not exist.',
            ]);

            $messages = [];

            foreach ($validated['experiences'] as $experienceData) {
                if (isset($experienceData['id'])) {
                    $experience = Experience::where('id', $experienceData['id'])
                        ->where('user_id', $experienceData['user_id'])
                        ->first();
                    if ($experience) {
                        $experience->update($experienceData);
                        $messages[] = 'Experience record updated: '.$experienceData['company_name'];
                    } else {
                        return response()->json(['error' => 'Experience record not found.'], 404);
                    }
                } else {
                    Experience::create($experienceData);
                    $messages[] = 'Experience record added: '.$experienceData['company_name'];
                }
            }

            // Retrieve the updated experience list for the user
            $updatedExperiences = Experience::where('user_id', $validated['experiences'][0]['user_id'])->get();

            return response()->json([
                'messages' => $messages,
                'experiences' => $updatedExperiences,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Update Experience Error: '.$e->getMessage()], 500);
        }
    }

    // Delete experience records
    public function delete(Request $request)
    {
        try {
            $validated = $request->validate([
                'id' => 'required|exists:experiences,id',
                'user_id' => 'required|exists:users,id',
            ], [
                'id.required' => 'Experience ID is required.',
                'id.exists' => 'The specified experience ID does not exist.',
                'user_id.required' => 'User ID is required.',
                'user_id.exists' => 'The specified user ID does not exist.',
            ]);

            $experience = Experience::where('id', $validated['id'])
                ->where('user_id', $validated['user_id'])
                ->first();

            if ($experience) {
                $experience->delete();

                // Retrieve the updated experience list for the user
                $updatedExperiences = Experience::where('user_id', $validated['user_id'])->get();

                return response()->json([
                    'message' => 'Experience record deleted successfully.',
                    'experiences' => $updatedExperiences,
                ]);
            } else {
                return response()->json(['error' => 'Experience record not found.'], 404);
            }
        } catch (ValidationException $e) {
            return response()->json([
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Delete Experience Error: '.$e->getMessage()], 500);
        }
    }
}
