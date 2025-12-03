<?php

use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\PhoneVerificationController;
use App\Http\Controllers\Auth\SamlController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\Settings\InvoiceBrandingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
|
| Used by admin.platform.com and tenant.platform.com
| NO registration - only login, logout, password reset
|
*/

Route::middleware('guest')->group(function () {
    // Login Routes
    Route::get('login', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store']);

    // Password Reset Routes
    Route::get('forgot-password', [PasswordResetController::class, 'create'])->name('password.request');
    Route::post('forgot-password', [PasswordResetController::class, 'store'])->name('password.email');
    Route::get('reset-password/{token}', [PasswordResetController::class, 'edit'])->name('password.reset');
    Route::post('reset-password', [PasswordResetController::class, 'update'])->name('password.update');

    // OAuth / Social Login Routes
    Route::get('auth/{provider}/redirect', [SocialAuthController::class, 'redirect'])
        ->name('auth.social.redirect');
    Route::get('auth/{provider}/callback', [SocialAuthController::class, 'callback'])
        ->name('auth.social.callback');

    // SAML SSO Routes
    Route::get('saml/providers', [SamlController::class, 'providers'])->name('saml.providers');
    Route::get('saml/{idp?}/login', [SamlController::class, 'login'])->name('saml.login');
    Route::post('saml/{idp?}/acs', [SamlController::class, 'acs'])->name('saml.acs');
    Route::get('saml/{idp?}/sls', [SamlController::class, 'sls'])->name('saml.sls');
    Route::get('saml/{idp?}/metadata', [SamlController::class, 'metadata'])->name('saml.metadata');
});

Route::middleware('auth')->group(function () {
    // Email Verification Routes
    Route::get('verify-email', [EmailVerificationController::class, 'prompt'])->name('verification.notice');
    Route::get('verify-email/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('email/verification-notification', [EmailVerificationController::class, 'send'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    // Phone Verification Routes
    Route::post('phone/send-verification', [PhoneVerificationController::class, 'send'])
        ->middleware('throttle:3,1')
        ->name('phone.verification.send');
    Route::post('phone/verify', [PhoneVerificationController::class, 'verify'])
        ->middleware('throttle:5,1')
        ->name('phone.verification.verify');

    // Logout Route
    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');

    // SAML SSO Admin Routes
    Route::get('saml/{idp?}/logout', [SamlController::class, 'logout'])->name('saml.logout');
});

// SAML SSO Settings (requires auth + admin permission)
Route::middleware(['auth', 'verified'])
    ->prefix('settings')
    ->group(function () {
        Route::get('saml', [SamlController::class, 'settings'])->name('settings.saml');
        Route::post('saml', [SamlController::class, 'saveSettings'])->name('settings.saml.save');
        Route::post('saml/test', [SamlController::class, 'testConnection'])->name('settings.saml.test');

        // Invoice Branding Settings
        Route::get('invoice-branding', [InvoiceBrandingController::class, 'index'])
            ->name('settings.invoice-branding');
        Route::post('invoice-branding', [InvoiceBrandingController::class, 'save'])
            ->name('settings.invoice-branding.save');
        Route::get('invoice-branding/preview', [InvoiceBrandingController::class, 'preview'])
            ->name('settings.invoice-branding.preview');
    });
