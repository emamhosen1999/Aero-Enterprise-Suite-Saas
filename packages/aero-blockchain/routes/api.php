<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Aero\Blockchain\Http\Controllers\Api\BlockchainApiController;
use Aero\Blockchain\Http\Controllers\Api\WalletApiController;
use Aero\Blockchain\Http\Controllers\Api\TransactionApiController;
use Aero\Blockchain\Http\Controllers\Api\SmartContractApiController;
use Aero\Blockchain\Http\Controllers\Api\TokenApiController;
use Aero\Blockchain\Http\Controllers\Api\AnalyticsApiController;

/*
|--------------------------------------------------------------------------
| Blockchain API Routes
|--------------------------------------------------------------------------
|
| Here are the API routes for the Blockchain module. These routes are loaded
| by the Blockchain service provider and assigned the "api" middleware group.
|
*/

Route::middleware('api')->prefix('api/blockchain')->name('api.blockchain.')->group(function () {
    
    // Blockchain network endpoints
    Route::prefix('networks')->name('networks.')->group(function () {
        Route::get('/', [BlockchainApiController::class, 'index'])->name('index');
        Route::post('/', [BlockchainApiController::class, 'store'])->name('store');
        Route::get('/{blockchain}', [BlockchainApiController::class, 'show'])->name('show');
        Route::put('/{blockchain}', [BlockchainApiController::class, 'update'])->name('update');
        Route::delete('/{blockchain}', [BlockchainApiController::class, 'destroy'])->name('destroy');
        
        // Network status and stats
        Route::get('/{blockchain}/status', [BlockchainApiController::class, 'status'])->name('status');
        Route::get('/{blockchain}/stats', [BlockchainApiController::class, 'stats'])->name('stats');
        Route::get('/{blockchain}/latest-block', [BlockchainApiController::class, 'latestBlock'])->name('latest-block');
    });
    
    // Wallet endpoints
    Route::prefix('wallets')->name('wallets.')->group(function () {
        Route::get('/', [WalletApiController::class, 'index'])->name('index');
        Route::post('/', [WalletApiController::class, 'store'])->name('store');
        Route::get('/{wallet}', [WalletApiController::class, 'show'])->name('show');
        Route::put('/{wallet}', [WalletApiController::class, 'update'])->name('update');
        Route::delete('/{wallet}', [WalletApiController::class, 'destroy'])->name('destroy');
        
        // Wallet operations
        Route::get('/{wallet}/balance', [WalletApiController::class, 'balance'])->name('balance');
        Route::get('/{wallet}/transactions', [WalletApiController::class, 'transactions'])->name('transactions');
        Route::get('/{wallet}/tokens', [WalletApiController::class, 'tokens'])->name('tokens');
        Route::post('/{wallet}/transfer', [WalletApiController::class, 'transfer'])->name('transfer');
    });
    
    // Transaction endpoints
    Route::prefix('transactions')->name('transactions.')->group(function () {
        Route::get('/', [TransactionApiController::class, 'index'])->name('index');
        Route::post('/', [TransactionApiController::class, 'store'])->name('store');
        Route::get('/{transaction}', [TransactionApiController::class, 'show'])->name('show');
        Route::get('/hash/{hash}', [TransactionApiController::class, 'showByHash'])->name('show-by-hash');
        
        // Transaction operations
        Route::post('/{transaction}/confirm', [TransactionApiController::class, 'confirm'])->name('confirm');
        Route::post('/{transaction}/fail', [TransactionApiController::class, 'fail'])->name('fail');
        Route::post('/batch', [TransactionApiController::class, 'storeBatch'])->name('batch');
    });
    
    // Smart contract endpoints
    Route::prefix('contracts')->name('contracts.')->group(function () {
        Route::get('/', [SmartContractApiController::class, 'index'])->name('index');
        Route::post('/', [SmartContractApiController::class, 'store'])->name('store');
        Route::get('/{contract}', [SmartContractApiController::class, 'show'])->name('show');
        Route::put('/{contract}', [SmartContractApiController::class, 'update'])->name('update');
        Route::delete('/{contract}', [SmartContractApiController::class, 'destroy'])->name('destroy');
        
        // Contract operations
        Route::post('/{contract}/call', [SmartContractApiController::class, 'call'])->name('call');
        Route::get('/{contract}/events', [SmartContractApiController::class, 'events'])->name('events');
        Route::post('/{contract}/verify', [SmartContractApiController::class, 'verify'])->name('verify');
    });
    
    // Token endpoints
    Route::prefix('tokens')->name('tokens.')->group(function () {
        Route::get('/', [TokenApiController::class, 'index'])->name('index');
        Route::post('/', [TokenApiController::class, 'store'])->name('store');
        Route::get('/{token}', [TokenApiController::class, 'show'])->name('show');
        Route::put('/{token}', [TokenApiController::class, 'update'])->name('update');
        Route::delete('/{token}', [TokenApiController::class, 'destroy'])->name('destroy');
        
        // Token operations
        Route::get('/{token}/holders', [TokenApiController::class, 'holders'])->name('holders');
        Route::get('/{token}/transfers', [TokenApiController::class, 'transfers'])->name('transfers');
        Route::post('/{token}/transfer', [TokenApiController::class, 'transfer'])->name('transfer');
    });
    
    // Analytics endpoints
    Route::prefix('analytics')->name('analytics.')->group(function () {
        Route::get('/network/{blockchain}', [AnalyticsApiController::class, 'network'])->name('network');
        Route::get('/transactions/{blockchain}', [AnalyticsApiController::class, 'transactions'])->name('transactions');
        Route::get('/tokens/{blockchain}', [AnalyticsApiController::class, 'tokens'])->name('tokens');
        Route::get('/defi/{blockchain}', [AnalyticsApiController::class, 'defi'])->name('defi');
        Route::get('/market-data', [AnalyticsApiController::class, 'marketData'])->name('market-data');
    });
    
    // Block explorer API endpoints
    Route::prefix('explorer')->name('explorer.')->group(function () {
        Route::get('/search', [BlockchainApiController::class, 'search'])->name('search');
        Route::get('/block/{blockNumber}', [BlockchainApiController::class, 'getBlock'])->name('block');
        Route::get('/address/{address}', [WalletApiController::class, 'getAddress'])->name('address');
        Route::get('/contract/{address}', [SmartContractApiController::class, 'getContract'])->name('contract');
    });
});

// Webhook endpoints for external blockchain services
Route::middleware('api')->prefix('api/blockchain/webhooks')->name('api.blockchain.webhooks.')->group(function () {
    Route::post('/transaction-confirmed', [TransactionApiController::class, 'transactionConfirmed'])->name('transaction-confirmed');
    Route::post('/block-mined', [BlockchainApiController::class, 'blockMined'])->name('block-mined');
    Route::post('/contract-event', [SmartContractApiController::class, 'contractEvent'])->name('contract-event');
    Route::post('/token-transfer', [TokenApiController::class, 'tokenTransfer'])->name('token-transfer');
});

// Public API endpoints (no authentication required)
Route::middleware('api')->prefix('api/blockchain/public')->name('api.blockchain.public.')->group(function () {
    Route::get('/networks', [BlockchainApiController::class, 'publicNetworks'])->name('networks');
    Route::get('/network/{blockchain}/stats', [BlockchainApiController::class, 'publicStats'])->name('stats');
    Route::get('/prices', [TokenApiController::class, 'prices'])->name('prices');
    Route::get('/market-data', [AnalyticsApiController::class, 'publicMarketData'])->name('market-data');
});
