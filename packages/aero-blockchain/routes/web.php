<?php

use Aero\Blockchain\Http\Controllers\AnalyticsController;
use Aero\Blockchain\Http\Controllers\BlockchainController;
use Aero\Blockchain\Http\Controllers\ConsensusController;
use Aero\Blockchain\Http\Controllers\SmartContractController;
use Aero\Blockchain\Http\Controllers\TokenController;
use Aero\Blockchain\Http\Controllers\TransactionController;
use Aero\Blockchain\Http\Controllers\WalletController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Blockchain Web Routes
|--------------------------------------------------------------------------
|
| Here are the web routes for the Blockchain module. These routes are loaded
| by the Blockchain service provider and assigned the "web" middleware group.
|
*/

Route::middleware(['web', 'auth'])->prefix('blockchain')->name('blockchain.')->group(function () {

    // Dashboard
    Route::get('/', function () {
        return inertia('Blockchain/Dashboard');
    })->name('dashboard');

    // Blockchain Networks
    Route::prefix('networks')->name('networks.')->group(function () {
        Route::get('/', [BlockchainController::class, 'index'])->name('index');
        Route::get('/create', [BlockchainController::class, 'create'])->name('create');
        Route::post('/', [BlockchainController::class, 'store'])->name('store');
        Route::get('/{blockchain}', [BlockchainController::class, 'show'])->name('show');
        Route::get('/{blockchain}/edit', [BlockchainController::class, 'edit'])->name('edit');
        Route::put('/{blockchain}', [BlockchainController::class, 'update'])->name('update');
        Route::delete('/{blockchain}', [BlockchainController::class, 'destroy'])->name('destroy');

        // Network Actions
        Route::get('/{blockchain}/blocks', [BlockchainController::class, 'blocks'])->name('blocks');
        Route::get('/{blockchain}/transactions', [BlockchainController::class, 'transactions'])->name('transactions');
        Route::get('/{blockchain}/analytics', [BlockchainController::class, 'analytics'])->name('analytics');
        Route::post('/{blockchain}/sync', [BlockchainController::class, 'sync'])->name('sync');
    });

    // Wallets
    Route::prefix('wallets')->name('wallets.')->group(function () {
        Route::get('/', [WalletController::class, 'index'])->name('index');
        Route::get('/create', [WalletController::class, 'create'])->name('create');
        Route::post('/', [WalletController::class, 'store'])->name('store');
        Route::get('/{wallet}', [WalletController::class, 'show'])->name('show');
        Route::get('/{wallet}/edit', [WalletController::class, 'edit'])->name('edit');
        Route::put('/{wallet}', [WalletController::class, 'update'])->name('update');
        Route::delete('/{wallet}', [WalletController::class, 'destroy'])->name('destroy');

        // Wallet Actions
        Route::get('/{wallet}/transactions', [WalletController::class, 'transactions'])->name('transactions');
        Route::get('/{wallet}/tokens', [WalletController::class, 'tokens'])->name('tokens');
        Route::post('/{wallet}/transfer', [WalletController::class, 'transfer'])->name('transfer');
        Route::post('/{wallet}/sync-balance', [WalletController::class, 'syncBalance'])->name('sync-balance');
    });

    // Transactions
    Route::prefix('transactions')->name('transactions.')->group(function () {
        Route::get('/', [TransactionController::class, 'index'])->name('index');
        Route::get('/create', [TransactionController::class, 'create'])->name('create');
        Route::post('/', [TransactionController::class, 'store'])->name('store');
        Route::get('/{transaction}', [TransactionController::class, 'show'])->name('show');
        Route::post('/{transaction}/resend', [TransactionController::class, 'resend'])->name('resend');
        Route::post('/{transaction}/cancel', [TransactionController::class, 'cancel'])->name('cancel');
    });

    // Smart Contracts
    Route::prefix('contracts')->name('contracts.')->group(function () {
        Route::get('/', [SmartContractController::class, 'index'])->name('index');
        Route::get('/create', [SmartContractController::class, 'create'])->name('create');
        Route::post('/', [SmartContractController::class, 'store'])->name('store');
        Route::get('/{contract}', [SmartContractController::class, 'show'])->name('show');
        Route::get('/{contract}/edit', [SmartContractController::class, 'edit'])->name('edit');
        Route::put('/{contract}', [SmartContractController::class, 'update'])->name('update');
        Route::delete('/{contract}', [SmartContractController::class, 'destroy'])->name('destroy');

        // Contract Actions
        Route::post('/{contract}/deploy', [SmartContractController::class, 'deploy'])->name('deploy');
        Route::post('/{contract}/verify', [SmartContractController::class, 'verify'])->name('verify');
        Route::post('/{contract}/interact', [SmartContractController::class, 'interact'])->name('interact');
        Route::get('/{contract}/events', [SmartContractController::class, 'events'])->name('events');
        Route::get('/{contract}/transactions', [SmartContractController::class, 'transactions'])->name('transactions');
    });

    // Tokens
    Route::prefix('tokens')->name('tokens.')->group(function () {
        Route::get('/', [TokenController::class, 'index'])->name('index');
        Route::get('/create', [TokenController::class, 'create'])->name('create');
        Route::post('/', [TokenController::class, 'store'])->name('store');
        Route::get('/{token}', [TokenController::class, 'show'])->name('show');
        Route::get('/{token}/edit', [TokenController::class, 'edit'])->name('edit');
        Route::put('/{token}', [TokenController::class, 'update'])->name('update');
        Route::delete('/{token}', [TokenController::class, 'destroy'])->name('destroy');

        // Token Actions
        Route::get('/{token}/holders', [TokenController::class, 'holders'])->name('holders');
        Route::get('/{token}/transfers', [TokenController::class, 'transfers'])->name('transfers');
        Route::post('/{token}/sync-data', [TokenController::class, 'syncData'])->name('sync-data');
        Route::post('/{token}/update-price', [TokenController::class, 'updatePrice'])->name('update-price');
    });

    // Consensus Nodes
    Route::prefix('consensus')->name('consensus.')->group(function () {
        Route::get('/', [ConsensusController::class, 'index'])->name('index');
        Route::get('/create', [ConsensusController::class, 'create'])->name('create');
        Route::post('/', [ConsensusController::class, 'store'])->name('store');
        Route::get('/{node}', [ConsensusController::class, 'show'])->name('show');
        Route::get('/{node}/edit', [ConsensusController::class, 'edit'])->name('edit');
        Route::put('/{node}', [ConsensusController::class, 'update'])->name('update');
        Route::delete('/{node}', [ConsensusController::class, 'destroy'])->name('destroy');

        // Node Actions
        Route::post('/{node}/stake', [ConsensusController::class, 'stake'])->name('stake');
        Route::post('/{node}/unstake', [ConsensusController::class, 'unstake'])->name('unstake');
        Route::post('/{node}/jail', [ConsensusController::class, 'jail'])->name('jail');
        Route::post('/{node}/unjail', [ConsensusController::class, 'unjail'])->name('unjail');
        Route::post('/{node}/slash', [ConsensusController::class, 'slash'])->name('slash');
    });

    // Analytics
    Route::prefix('analytics')->name('analytics.')->group(function () {
        Route::get('/', [AnalyticsController::class, 'index'])->name('index');
        Route::get('/network', [AnalyticsController::class, 'network'])->name('network');
        Route::get('/transactions', [AnalyticsController::class, 'transactions'])->name('transactions');
        Route::get('/tokens', [AnalyticsController::class, 'tokens'])->name('tokens');
        Route::get('/defi', [AnalyticsController::class, 'defi'])->name('defi');
        Route::get('/nft', [AnalyticsController::class, 'nft'])->name('nft');
        Route::get('/export', [AnalyticsController::class, 'export'])->name('export');
    });

    // Block Explorer
    Route::prefix('explorer')->name('explorer.')->group(function () {
        Route::get('/', [BlockchainController::class, 'explorer'])->name('index');
        Route::get('/block/{block}', [BlockchainController::class, 'showBlock'])->name('block');
        Route::get('/transaction/{hash}', [TransactionController::class, 'showByHash'])->name('transaction');
        Route::get('/address/{address}', [WalletController::class, 'showByAddress'])->name('address');
        Route::get('/contract/{address}', [SmartContractController::class, 'showByAddress'])->name('contract');
        Route::get('/token/{address}', [TokenController::class, 'showByAddress'])->name('token');
    });

    // Settings
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [BlockchainController::class, 'settings'])->name('index');
        Route::post('/', [BlockchainController::class, 'updateSettings'])->name('update');
        Route::get('/security', [BlockchainController::class, 'security'])->name('security');
        Route::post('/security', [BlockchainController::class, 'updateSecurity'])->name('security.update');
    });
});
