<?php

use Illuminate\Support\Facades\Route;
use Aero\Finance\Http\Controllers\ChartOfAccountsController;
use Aero\Finance\Http\Controllers\GeneralLedgerController;
use Aero\Finance\Http\Controllers\JournalEntryController;
use Aero\Finance\Http\Controllers\AccountsPayableController;
use Aero\Finance\Http\Controllers\AccountsReceivableController;
use Aero\Finance\Http\Controllers\FinanceDashboardController;

/*
|--------------------------------------------------------------------------
| Finance Tenant Routes
|--------------------------------------------------------------------------
*/

Route::prefix('finance')->name('finance.')->middleware(['auth', 'tenant'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [FinanceDashboardController::class, 'index'])->name('dashboard');
    
    // Chart of Accounts
    Route::resource('chart-of-accounts', ChartOfAccountsController::class);
    
    // General Ledger
    Route::get('general-ledger', [GeneralLedgerController::class, 'index'])->name('general-ledger.index');
    Route::get('general-ledger/export', [GeneralLedgerController::class, 'export'])->name('general-ledger.export');
    
    // Journal Entries
    Route::resource('journal-entries', JournalEntryController::class);
    Route::post('journal-entries/{id}/post', [JournalEntryController::class, 'post'])->name('journal-entries.post');
    
    // Accounts Payable
    Route::resource('accounts-payable', AccountsPayableController::class);
    Route::post('accounts-payable/{id}/pay', [AccountsPayableController::class, 'pay'])->name('accounts-payable.pay');
    
    // Accounts Receivable
    Route::resource('accounts-receivable', AccountsReceivableController::class);
    Route::post('accounts-receivable/{id}/receive', [AccountsReceivableController::class, 'receive'])->name('accounts-receivable.receive');
});
