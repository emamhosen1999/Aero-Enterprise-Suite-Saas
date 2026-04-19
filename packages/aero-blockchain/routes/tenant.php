<?php

use Aero\Blockchain\Http\Controllers\Tenant\TenantBlockchainController;
use Aero\Blockchain\Http\Controllers\Tenant\TenantTokenController;
use Aero\Blockchain\Http\Controllers\Tenant\TenantTransactionController;
use Aero\Blockchain\Http\Controllers\Tenant\TenantWalletController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Tenant Blockchain Routes
|--------------------------------------------------------------------------
|
| These routes are loaded for tenant-specific blockchain functionality.
| All routes are protected by HRMAC middleware using dot-notation paths
| matching config/module.php hierarchy.
|
*/

Route::middleware(['web', 'auth:web', 'tenant', 'hrmac:blockchain'])->prefix('blockchain')->name('tenant.blockchain.')->group(function () {

    // Tenant Blockchain Dashboard
    Route::get('/', function () {
        return inertia('Tenant/Blockchain/Dashboard');
    })->name('dashboard');

    // Tenant Wallets
    Route::prefix('wallets')->name('wallets.')->group(function () {
        Route::get('/', [TenantWalletController::class, 'index'])->name('index');
        Route::get('/create', [TenantWalletController::class, 'create'])->name('create');
        Route::post('/', [TenantWalletController::class, 'store'])->name('store');
        Route::get('/{wallet}', [TenantWalletController::class, 'show'])->name('show');
        Route::get('/{wallet}/edit', [TenantWalletController::class, 'edit'])->name('edit');
        Route::put('/{wallet}', [TenantWalletController::class, 'update'])->name('update');
        Route::delete('/{wallet}', [TenantWalletController::class, 'destroy'])->name('destroy');

        // Tenant wallet operations
        Route::get('/{wallet}/transactions', [TenantWalletController::class, 'transactions'])->name('transactions');
        Route::get('/{wallet}/tokens', [TenantWalletController::class, 'tokens'])->name('tokens');
        Route::post('/{wallet}/transfer', [TenantWalletController::class, 'transfer'])->name('transfer');
    });

    // Tenant Transactions
    Route::prefix('transactions')->name('transactions.')->group(function () {
        Route::get('/', [TenantTransactionController::class, 'index'])->name('index');
        Route::get('/create', [TenantTransactionController::class, 'create'])->name('create');
        Route::post('/', [TenantTransactionController::class, 'store'])->name('store');
        Route::get('/{transaction}', [TenantTransactionController::class, 'show'])->name('show');
    });

    // Tenant Tokens
    Route::prefix('tokens')->name('tokens.')->group(function () {
        Route::get('/', [TenantTokenController::class, 'index'])->name('index');
        Route::get('/{token}', [TenantTokenController::class, 'show'])->name('show');
        Route::get('/{token}/transfers', [TenantTokenController::class, 'transfers'])->name('transfers');
    });

    // Tenant Analytics
    Route::get('/analytics', [TenantBlockchainController::class, 'analytics'])->name('analytics');
    Route::get('/portfolio', [TenantBlockchainController::class, 'portfolio'])->name('portfolio');
});

// Tenant API Routes
Route::middleware(['api', 'tenant'])->prefix('api/tenant/blockchain')->name('api.tenant.blockchain.')->group(function () {
    Route::get('/wallets/{wallet}/balance', [TenantWalletController::class, 'apiBalance'])->name('wallet.balance');
    Route::get('/portfolio/summary', [TenantBlockchainController::class, 'apiPortfolioSummary'])->name('portfolio.summary');
    Route::get('/transactions/recent', [TenantTransactionController::class, 'apiRecent'])->name('transactions.recent');
    Route::get('/analytics/dashboard', [TenantBlockchainController::class, 'apiAnalytics'])->name('analytics.dashboard');
});
