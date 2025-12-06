<?php

use App\Http\Controllers\Finance\AccountsPayableController;
use App\Http\Controllers\Finance\AccountsReceivableController;
use App\Http\Controllers\Finance\ChartOfAccountsController;
use App\Http\Controllers\Finance\FinanceDashboardController;
use App\Http\Controllers\Finance\GeneralLedgerController;
use App\Http\Controllers\Finance\JournalEntryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Finance Module Routes
|--------------------------------------------------------------------------
|
| Routes for the Finance & Accounting module including:
| - Chart of Accounts (COA)
| - Journal Entries
| - General Ledger
| - Accounts Payable
| - Accounts Receivable
| - Financial Dashboard
|
*/

Route::middleware(['auth', 'verified'])->prefix('finance')->name('finance.')->group(function () {

    // Dashboard
    Route::middleware(['module:finance'])->group(function () {
        Route::get('/', [FinanceDashboardController::class, 'index'])->name('dashboard');
    });

    // Chart of Accounts
    Route::middleware(['module:finance,chart-of-accounts'])->group(function () {
        Route::get('/accounts', [ChartOfAccountsController::class, 'index'])->name('accounts.index');
        Route::post('/accounts', [ChartOfAccountsController::class, 'store'])->name('accounts.store');
        Route::put('/accounts/{id}', [ChartOfAccountsController::class, 'update'])->name('accounts.update');
        Route::delete('/accounts/{id}', [ChartOfAccountsController::class, 'destroy'])->name('accounts.destroy');
    });

    // Journal Entries
    Route::middleware(['module:finance,journal-entries'])->group(function () {
        Route::get('/journal-entries', [JournalEntryController::class, 'index'])->name('journal-entries.index');
        Route::post('/journal-entries', [JournalEntryController::class, 'store'])->name('journal-entries.store');
        Route::put('/journal-entries/{id}', [JournalEntryController::class, 'update'])->name('journal-entries.update');
        Route::delete('/journal-entries/{id}', [JournalEntryController::class, 'destroy'])->name('journal-entries.destroy');
    });

    // General Ledger
    Route::middleware(['module:finance,general-ledger'])->group(function () {
        Route::get('/general-ledger', [GeneralLedgerController::class, 'index'])->name('general-ledger.index');
    });

    // Accounts Payable
    Route::middleware(['module:finance,accounts-payable'])->group(function () {
        Route::get('/accounts-payable', [AccountsPayableController::class, 'index'])->name('accounts-payable.index');
        Route::post('/accounts-payable', [AccountsPayableController::class, 'store'])->name('accounts-payable.store');
        Route::put('/accounts-payable/{id}', [AccountsPayableController::class, 'update'])->name('accounts-payable.update');
        Route::delete('/accounts-payable/{id}', [AccountsPayableController::class, 'destroy'])->name('accounts-payable.destroy');
    });

    // Accounts Receivable
    Route::middleware(['module:finance,accounts-receivable'])->group(function () {
        Route::get('/accounts-receivable', [AccountsReceivableController::class, 'index'])->name('accounts-receivable.index');
        Route::post('/accounts-receivable', [AccountsReceivableController::class, 'store'])->name('accounts-receivable.store');
        Route::put('/accounts-receivable/{id}', [AccountsReceivableController::class, 'update'])->name('accounts-receivable.update');
        Route::delete('/accounts-receivable/{id}', [AccountsReceivableController::class, 'destroy'])->name('accounts-receivable.destroy');
    });
});
