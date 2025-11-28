<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Designation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create Super Administrator role
        Role::create(['name' => 'Super Administrator']);
        Role::create(['name' => 'Employee']);

        // Create admin user with permission
        $this->adminUser = User::factory()->create([
            'email' => 'admin@test.com',
        ]);
        $this->adminUser->assignRole('Super Administrator');

        $this->actingAs($this->adminUser);
    }

    /** @test */
    public function authorized_user_can_view_users_list(): void
    {
        $response = $this->get(route('users.index'));

        $response->assertStatus(200);
    }

    /** @test */
    public function authorized_user_can_create_user_with_valid_data(): void
    {
        $department = Department::factory()->create();
        $designation = Designation::factory()->create();

        $userData = [
            'name' => 'John Doe',
            'user_name' => 'johndoe',
            'email' => 'john@example.com',
            'phone' => '1234567890',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'department_id' => $department->id,
            'designation_id' => $designation->id,
            'gender' => 'male',
            'employee_id' => 'EMP001',
            'roles' => ['Employee'],
        ];

        $response = $this->post(route('users.store'), $userData);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'user_name' => 'johndoe',
        ]);
    }

    /** @test */
    public function precognitive_validation_works_for_email_uniqueness(): void
    {
        $existingUser = User::factory()->create([
            'email' => 'existing@example.com',
        ]);

        $response = $this->withPrecognition()
            ->post(route('users.store'), [
                'email' => 'existing@example.com',
            ]);

        $response->assertSuccessfulPrecognition(false);
        $response->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function precognitive_validation_passes_for_unique_email(): void
    {
        $response = $this->withPrecognition()
            ->post(route('users.store'), [
                'email' => 'unique@example.com',
            ]);

        $response->assertSuccessfulPrecognition();
    }

    /** @test */
    public function user_creation_requires_password_confirmation(): void
    {
        $response = $this->post(route('users.store'), [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'DifferentPassword123!',
        ]);

        $response->assertSessionHasErrors(['password']);
    }

    /** @test */
    public function authorized_user_can_update_existing_user(): void
    {
        $user = User::factory()->create([
            'email' => 'original@example.com',
        ]);

        $response = $this->put(route('users.update', $user->id), [
            'name' => 'Updated Name',
            'email' => 'original@example.com', // Same email should be allowed
            'user_name' => $user->user_name,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
        ]);
    }

    /** @test */
    public function user_update_validates_unique_email_except_current_user(): void
    {
        $user1 = User::factory()->create(['email' => 'user1@example.com']);
        $user2 = User::factory()->create(['email' => 'user2@example.com']);

        $response = $this->put(route('users.update', $user1->id), [
            'name' => $user1->name,
            'email' => 'user2@example.com', // Try to use another user's email
            'user_name' => $user1->user_name,
        ]);

        $response->assertSessionHasErrors(['email']);
    }

    /** @test */
    public function user_can_upload_profile_image(): void
    {
        Storage::fake('public');

        $userData = [
            'name' => 'John Doe',
            'user_name' => 'johndoe',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'profile_image' => UploadedFile::fake()->image('profile.jpg'),
        ];

        $response = $this->post(route('users.store'), $userData);

        $response->assertStatus(200);
        $user = User::where('email', 'john@example.com')->first();
        $this->assertNotNull($user->getFirstMedia('profile_image'));
    }

    /** @test */
    public function authorized_user_can_toggle_user_status(): void
    {
        $user = User::factory()->create(['active' => true]);

        $response = $this->put(route('users.toggleStatus', $user->id));

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'active' => false,
        ]);
    }

    /** @test */
    public function authorized_user_can_update_user_roles(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'Manager']);

        $response = $this->post(route('users.updateRole', $user->id), [
            'roles' => ['Manager'],
        ]);

        $response->assertStatus(200);
        $this->assertTrue($user->fresh()->hasRole('Manager'));
    }

    /** @test */
    public function user_cannot_modify_their_own_roles(): void
    {
        $response = $this->post(route('users.updateRole', $this->adminUser->id), [
            'roles' => ['Employee'],
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function authorized_user_can_delete_user(): void
    {
        $user = User::factory()->create();

        $response = $this->delete(route('users.destroy', $user->id));

        $response->assertStatus(200);
        $this->assertSoftDeleted('users', [
            'id' => $user->id,
        ]);
    }

    /** @test */
    public function user_cannot_delete_themselves(): void
    {
        $response = $this->delete(route('users.destroy', $this->adminUser->id));

        $response->assertStatus(403);
    }

    /** @test */
    public function validation_fails_for_invalid_email_format(): void
    {
        $response = $this->post(route('users.store'), [
            'name' => 'John Doe',
            'email' => 'invalid-email',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertSessionHasErrors(['email']);
    }

    /** @test */
    public function validation_fails_for_birthday_in_future(): void
    {
        $response = $this->post(route('users.store'), [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'birthday' => now()->addYear()->format('Y-m-d'),
        ]);

        $response->assertSessionHasErrors(['birthday']);
    }

    /** @test */
    public function user_list_returns_paginated_results(): void
    {
        User::factory()->count(15)->create();

        $response = $this->get(route('users.paginate'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'email'],
            ],
            'meta' => [
                'total',
                'per_page',
                'current_page',
            ],
        ]);
    }

    /** @test */
    public function user_list_can_be_filtered_by_search(): void
    {
        User::factory()->create(['name' => 'John Smith']);
        User::factory()->create(['name' => 'Jane Doe']);

        $response = $this->get(route('users.paginate', ['search' => 'John']));

        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'John Smith']);
        $response->assertJsonMissing(['name' => 'Jane Doe']);
    }

    /** @test */
    public function profile_image_must_be_valid_format(): void
    {
        $response = $this->post(route('users.store'), [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'profile_image' => UploadedFile::fake()->create('document.pdf'),
        ]);

        $response->assertSessionHasErrors(['profile_image']);
    }
}
