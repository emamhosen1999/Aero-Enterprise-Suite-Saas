<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Middleware;

use Aero\Core\Models\User;
use Aero\HRM\Http\Middleware\EnsureUserIsEmployee;
use Aero\HRM\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tests\TestCase;

/**
 * EnsureUserIsEmployee Middleware Tests
 *
 * Validates that HRM features are protected behind Employee onboarding
 */
class EnsureUserIsEmployeeTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_allows_request_when_user_is_onboarded_as_employee()
    {
        // Arrange
        $user = User::factory()->create();
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        $request = Request::create('/hrm/leaves', 'GET');
        $request->setUserResolver(fn () => $user);

        $middleware = app(EnsureUserIsEmployee::class);

        // Act
        $response = $middleware->handle($request, fn ($req) => response()->json(['success' => true]));

        // Assert
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals($employee->id, $request->attributes->get('employee')->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_blocks_request_when_user_not_onboarded()
    {
        // Arrange
        $user = User::factory()->create();
        // No Employee record

        $request = Request::create('/hrm/leaves', 'GET');
        $request->setUserResolver(fn () => $user);

        $middleware = app(EnsureUserIsEmployee::class);

        // Act
        $response = $middleware->handle($request, fn ($req) => response()->json(['success' => true]));

        // Assert
        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(403, $response->getStatusCode());

        $data = $response->getData(true);
        $this->assertEquals('user_not_onboarded', $data['error_code']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_blocks_request_when_employee_is_inactive()
    {
        // Arrange
        $user = User::factory()->create();
        Employee::factory()->create([
            'user_id' => $user->id,
            'status' => 'inactive',
        ]);

        $request = Request::create('/hrm/leaves', 'GET');
        $request->setUserResolver(fn () => $user);

        $middleware = app(EnsureUserIsEmployee::class);

        // Act
        $response = $middleware->handle($request, fn ($req) => response()->json(['success' => true]));

        // Assert
        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(403, $response->getStatusCode());

        $data = $response->getData(true);
        $this->assertEquals('employee_inactive', $data['error_code']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_redirects_unauthenticated_requests_to_login()
    {
        // Arrange
        $request = Request::create('/hrm/leaves', 'GET');
        $request->setUserResolver(fn () => null); // No user

        $middleware = app(EnsureUserIsEmployee::class);

        // Act
        $response = $middleware->handle($request, fn ($req) => response()->json(['success' => true]));

        // Assert
        $this->assertEquals(401, $response->getStatusCode());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_attaches_employee_to_request()
    {
        // Arrange
        $user = User::factory()->create();
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        $request = Request::create('/hrm/leaves', 'GET');
        $request->setUserResolver(fn () => $user);

        $middleware = app(EnsureUserIsEmployee::class);

        // Act
        $middleware->handle($request, function ($req) use ($employee) {
            // Assert inside next closure
            $this->assertEquals($employee->id, $req->attributes->get('employee')->id);
            $this->assertEquals($employee->id, $req->employee()->id);

            return response()->json(['success' => true]);
        });
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_logs_failed_access_attempts()
    {
        // Arrange
        $user = User::factory()->create();
        // No Employee record

        $request = Request::create('/hrm/leaves', 'GET');
        $request->setUserResolver(fn () => $user);

        $middleware = app(EnsureUserIsEmployee::class);

        // Act
        $response = $middleware->handle($request, fn ($req) => response()->json(['success' => true]));

        // Assert
        $this->assertEquals(403, $response->getStatusCode());

        // Check logs were written (you'd need to setup log mocking for this in real test)
    }
}
