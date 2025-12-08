<?php

namespace Aero\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Cors
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle($request, Closure $next)
    {
        $response = $next($request);
        $origin = $request->headers->get('Origin') ?? '*';
        // Set allowed origins (replace with your domain in production)
        $allowedOrigins = [
            'http://127.0.0.1:8000', // Development environment
            'http://127.0.0.1:8000/', // Development environment

            'https://erp.dhakabypass.com',
            'https://erp.dhakabypass.com/',
            // Add more if needed
        ];
        if (in_array($origin, $allowedOrigins)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        }
        // Always set credentials and allowed headers
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN');

        return $response;
    }
}
