<?php

namespace Database\Seeders;

use App\Models\Tenant\Finance$1
use App\Models\Tenant\Finance$1
use App\Models\Tenant\Finance$1
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FinanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // Create Chart of Accounts
            $this->seedChartOfAccounts();
            
            // Create sample journal entries
            $this->seedJournalEntries();
        });
    }

    /**
     * Seed Chart of Accounts with standard account structure
     */
    private function seedChartOfAccounts(): void
    {
        // Assets
        $assets = Account::create([
            'code' => '1000',
            'name' => 'Assets',
            'type' => 'asset',
            'parent_id' => null,
            'description' => 'All asset accounts',
            'is_active' => true,
        ]);

        Account::create([
            'code' => '1100',
            'name' => 'Current Assets',
            'type' => 'asset',
            'parent_id' => $assets->id,
            'is_active' => true,
        ]);

        Account::create([
            'code' => '1110',
            'name' => 'Cash',
            'type' => 'asset',
            'parent_id' => $assets->id,
            'is_active' => true,
        ]);

        Account::create([
            'code' => '1120',
            'name' => 'Accounts Receivable',
            'type' => 'asset',
            'parent_id' => $assets->id,
            'is_active' => true,
        ]);

        // Liabilities
        $liabilities = Account::create([
            'code' => '2000',
            'name' => 'Liabilities',
            'type' => 'liability',
            'parent_id' => null,
            'description' => 'All liability accounts',
            'is_active' => true,
        ]);

        Account::create([
            'code' => '2100',
            'name' => 'Current Liabilities',
            'type' => 'liability',
            'parent_id' => $liabilities->id,
            'is_active' => true,
        ]);

        Account::create([
            'code' => '2110',
            'name' => 'Accounts Payable',
            'type' => 'liability',
            'parent_id' => $liabilities->id,
            'is_active' => true,
        ]);

        // Equity
        $equity = Account::create([
            'code' => '3000',
            'name' => 'Equity',
            'type' => 'equity',
            'parent_id' => null,
            'description' => 'All equity accounts',
            'is_active' => true,
        ]);

        Account::create([
            'code' => '3100',
            'name' => 'Retained Earnings',
            'type' => 'equity',
            'parent_id' => $equity->id,
            'is_active' => true,
        ]);

        // Revenue
        $revenue = Account::create([
            'code' => '4000',
            'name' => 'Revenue',
            'type' => 'revenue',
            'parent_id' => null,
            'description' => 'All revenue accounts',
            'is_active' => true,
        ]);

        Account::create([
            'code' => '4100',
            'name' => 'Sales Revenue',
            'type' => 'revenue',
            'parent_id' => $revenue->id,
            'is_active' => true,
        ]);

        Account::create([
            'code' => '4200',
            'name' => 'Service Revenue',
            'type' => 'revenue',
            'parent_id' => $revenue->id,
            'is_active' => true,
        ]);

        // Expenses
        $expenses = Account::create([
            'code' => '5000',
            'name' => 'Expenses',
            'type' => 'expense',
            'parent_id' => null,
            'description' => 'All expense accounts',
            'is_active' => true,
        ]);

        Account::create([
            'code' => '5100',
            'name' => 'Operating Expenses',
            'type' => 'expense',
            'parent_id' => $expenses->id,
            'is_active' => true,
        ]);

        Account::create([
            'code' => '5110',
            'name' => 'Salaries & Wages',
            'type' => 'expense',
            'parent_id' => $expenses->id,
            'is_active' => true,
        ]);

        Account::create([
            'code' => '5120',
            'name' => 'Rent Expense',
            'type' => 'expense',
            'parent_id' => $expenses->id,
            'is_active' => true,
        ]);

        Account::create([
            'code' => '5130',
            'name' => 'Utilities Expense',
            'type' => 'expense',
            'parent_id' => $expenses->id,
            'is_active' => true,
        ]);
    }

    /**
     * Seed sample journal entries
     */
    private function seedJournalEntries(): void
    {
        $cash = Account::where('code', '1110')->first();
        $salesRevenue = Account::where('code', '4100')->first();
        $salariesExpense = Account::where('code', '5110')->first();

        // Sample Entry 1: Cash Sale
        $entry1 = JournalEntry::create([
            'entry_number' => 'JE-2024-001',
            'entry_date' => now()->subDays(10),
            'type' => 'standard',
            'status' => 'posted',
            'description' => 'Cash sales for the day',
            'reference' => 'INV-001',
            'created_by' => 1,
            'approved_by' => 1,
            'approved_at' => now()->subDays(10),
        ]);

        // Debit Cash
        JournalEntryLine::create([
            'journal_entry_id' => $entry1->id,
            'account_id' => $cash->id,
            'debit' => 5000.00,
            'credit' => 0.00,
            'description' => 'Cash received from sales',
        ]);

        // Credit Sales Revenue
        JournalEntryLine::create([
            'journal_entry_id' => $entry1->id,
            'account_id' => $salesRevenue->id,
            'debit' => 0.00,
            'credit' => 5000.00,
            'description' => 'Sales revenue recognized',
        ]);

        // Sample Entry 2: Salary Payment
        $entry2 = JournalEntry::create([
            'entry_number' => 'JE-2024-002',
            'entry_date' => now()->subDays(5),
            'type' => 'standard',
            'status' => 'posted',
            'description' => 'Monthly salary payment',
            'reference' => 'PAY-001',
            'created_by' => 1,
            'approved_by' => 1,
            'approved_at' => now()->subDays(5),
        ]);

        // Debit Salaries Expense
        JournalEntryLine::create([
            'journal_entry_id' => $entry2->id,
            'account_id' => $salariesExpense->id,
            'debit' => 3000.00,
            'credit' => 0.00,
            'description' => 'Salary expense for December',
        ]);

        // Credit Cash
        JournalEntryLine::create([
            'journal_entry_id' => $entry2->id,
            'account_id' => $cash->id,
            'debit' => 0.00,
            'credit' => 3000.00,
            'description' => 'Cash paid for salaries',
        ]);

        // Sample Entry 3: Draft Entry (not yet posted)
        $entry3 = JournalEntry::create([
            'entry_number' => 'JE-2024-003',
            'entry_date' => now(),
            'type' => 'adjusting',
            'status' => 'draft',
            'description' => 'Adjusting entry for accrued expenses',
            'created_by' => 1,
        ]);

        $rentExpense = Account::where('code', '5120')->first();
        $accountsPayable = Account::where('code', '2110')->first();

        // Debit Rent Expense
        JournalEntryLine::create([
            'journal_entry_id' => $entry3->id,
            'account_id' => $rentExpense->id,
            'debit' => 1500.00,
            'credit' => 0.00,
            'description' => 'December rent expense',
        ]);

        // Credit Accounts Payable
        JournalEntryLine::create([
            'journal_entry_id' => $entry3->id,
            'account_id' => $accountsPayable->id,
            'debit' => 0.00,
            'credit' => 1500.00,
            'description' => 'Accrued rent payable',
        ]);
    }
}
