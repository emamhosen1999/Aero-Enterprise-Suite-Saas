<?php

namespace Aero\Core\Services\Profile;

use Aero\Core\Models\User;
use Illuminate\Support\Facades\Hash;

class ProfileCrudService
{
    /**
     * Create a new user
     */
    public function createUser(array $validatedData): User
    {
        return User::create([
            'name' => $validatedData['name'],
            'user_name' => $validatedData['user_name'],
            'gender' => $validatedData['gender'],
            'birthday' => $validatedData['birthday'],
            'date_of_joining' => $validatedData['date_of_joining'],
            'address' => $validatedData['address'],
            'employee_id' => $validatedData['employee_id'],
            'phone' => $validatedData['phone'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'department' => $validatedData['department'],
            'designation' => $validatedData['designation'],
            'report_to' => $validatedData['report_to'],
        ]);
    }

    /**
     * Find user by ID
     */
    public function findUser(int $userId): ?User
    {
        return User::find($userId);
    }

    /**
     * Get user with relationships for profile display
     */
    public function getUserWithDetails(int $userId): ?User
    {
        $user = User::with(['educations', 'experiences'])->where('id', $userId)->first();

        if ($user) {
            foreach ($user->educations as $education) {
                $education->starting_date = date('Y-m', strtotime($education->starting_date));
                $education->complete_date = date('Y-m', strtotime($education->complete_date));
            }
        }

        return $user;
    }

    /**
     * Delete a user
     */
    public function deleteUser(int $userId): bool
    {
        $user = $this->findUser($userId);

        if (! $user) {
            return false;
        }

        try {
            $user->delete();

            return true;
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Save user changes
     */
    public function saveUser(User $user): void
    {
        $user->save();
    }
}
