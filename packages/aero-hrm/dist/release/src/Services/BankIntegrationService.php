<?php

namespace Aero\HRM\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Bank Integration Service
 *
 * Manages direct deposit integration for payroll processing,
 * supporting multiple bank formats and payment methods.
 */
class BankIntegrationService
{
    /**
     * Supported bank file formats.
     */
    public const FORMAT_ACH = 'ach';           // US Automated Clearing House
    public const FORMAT_BACS = 'bacs';         // UK Bank Automated Clearing System
    public const FORMAT_SEPA = 'sepa';         // EU Single Euro Payments Area
    public const FORMAT_NEFT = 'neft';         // India National Electronic Funds Transfer
    public const FORMAT_RTGS = 'rtgs';         // India Real Time Gross Settlement
    public const FORMAT_SWIFT = 'swift';       // International Wire Transfer
    public const FORMAT_CSV = 'csv';           // Generic CSV format

    /**
     * Payment statuses.
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Account types.
     */
    public const ACCOUNT_SAVINGS = 'savings';
    public const ACCOUNT_CHECKING = 'checking';
    public const ACCOUNT_CURRENT = 'current';

    /**
     * Default configuration.
     */
    protected array $config = [
        'default_format' => self::FORMAT_ACH,
        'batch_size' => 500,
        'require_verification' => true,
        'allow_partial_batch' => false,
        'retry_failed_payments' => true,
        'max_retries' => 3,
        'processing_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        'cutoff_time' => '14:00',
        'notification_on_status_change' => true,
    ];

    /**
     * Register employee bank account.
     */
    public function registerBankAccount(int $employeeId, array $accountDetails): array
    {
        // Validate account details
        $validation = $this->validateAccountDetails($accountDetails);
        if (!$validation['valid']) {
            return [
                'success' => false,
                'errors' => $validation['errors'],
            ];
        }

        $accountId = Str::uuid()->toString();

        // Mask sensitive data for storage
        $maskedAccountNumber = $this->maskAccountNumber($accountDetails['account_number']);

        $account = [
            'id' => $accountId,
            'employee_id' => $employeeId,
            'bank_name' => $accountDetails['bank_name'],
            'bank_code' => $accountDetails['bank_code'] ?? null, // SWIFT/BIC, IFSC, etc.
            'branch_code' => $accountDetails['branch_code'] ?? null,
            'routing_number' => $accountDetails['routing_number'] ?? null,
            'account_number_masked' => $maskedAccountNumber,
            'account_number_hash' => hash('sha256', $accountDetails['account_number']),
            'account_type' => $accountDetails['account_type'] ?? self::ACCOUNT_SAVINGS,
            'account_holder_name' => $accountDetails['account_holder_name'],
            'currency' => $accountDetails['currency'] ?? 'USD',
            'is_primary' => $accountDetails['is_primary'] ?? false,
            'is_verified' => false,
            'verification_method' => null,
            'verified_at' => null,
            'split_percentage' => $accountDetails['split_percentage'] ?? 100,
            'status' => 'active',
            'created_at' => now()->toIso8601String(),
            'metadata' => $accountDetails['metadata'] ?? [],
        ];

        // Encrypt and store account number separately
        $encryptedData = [
            'account_id' => $accountId,
            'account_number_encrypted' => encrypt($accountDetails['account_number']),
        ];

        Log::info('Bank account registered', [
            'account_id' => $accountId,
            'employee_id' => $employeeId,
            'bank_name' => $accountDetails['bank_name'],
        ]);

        return [
            'success' => true,
            'account' => $account,
            'requires_verification' => $this->config['require_verification'],
        ];
    }

    /**
     * Verify bank account.
     */
    public function verifyBankAccount(string $accountId, string $method, array $data = []): array
    {
        // Verification methods: micro_deposit, plaid, instant_verification
        $validMethods = ['micro_deposit', 'plaid', 'instant_verification', 'manual'];

        if (!in_array($method, $validMethods)) {
            return [
                'success' => false,
                'error' => 'Invalid verification method',
            ];
        }

        $result = match ($method) {
            'micro_deposit' => $this->verifyByMicroDeposit($accountId, $data),
            'plaid' => $this->verifyByPlaid($accountId, $data),
            'instant_verification' => $this->verifyInstantly($accountId, $data),
            'manual' => $this->verifyManually($accountId, $data),
        };

        if ($result['verified']) {
            Log::info('Bank account verified', [
                'account_id' => $accountId,
                'method' => $method,
            ]);
        }

        return $result;
    }

    /**
     * Create payroll batch for bank transfer.
     */
    public function createPayrollBatch(int $payrollRunId, array $payments, array $options = []): array
    {
        if (empty($payments)) {
            return [
                'success' => false,
                'error' => 'No payments to process',
            ];
        }

        $format = $options['format'] ?? $this->config['default_format'];
        $batchId = Str::uuid()->toString();

        // Validate all payments
        $validPayments = [];
        $invalidPayments = [];

        foreach ($payments as $payment) {
            $validation = $this->validatePayment($payment);
            if ($validation['valid']) {
                $validPayments[] = $payment;
            } else {
                $invalidPayments[] = [
                    'payment' => $payment,
                    'errors' => $validation['errors'],
                ];
            }
        }

        if (empty($validPayments) || (!$this->config['allow_partial_batch'] && !empty($invalidPayments))) {
            return [
                'success' => false,
                'error' => 'Invalid payments in batch',
                'invalid_payments' => $invalidPayments,
            ];
        }

        // Calculate batch totals
        $totalAmount = array_sum(array_column($validPayments, 'amount'));
        $totalCount = count($validPayments);

        $batch = [
            'id' => $batchId,
            'payroll_run_id' => $payrollRunId,
            'format' => $format,
            'status' => self::STATUS_PENDING,
            'total_amount' => $totalAmount,
            'total_count' => $totalCount,
            'currency' => $options['currency'] ?? 'USD',
            'effective_date' => $options['effective_date'] ?? now()->addBusinessDays(1)->toDateString(),
            'payments' => array_map(function ($payment) use ($batchId) {
                return [
                    'id' => Str::uuid()->toString(),
                    'batch_id' => $batchId,
                    'employee_id' => $payment['employee_id'],
                    'account_id' => $payment['account_id'],
                    'amount' => $payment['amount'],
                    'reference' => $payment['reference'] ?? null,
                    'status' => self::STATUS_PENDING,
                ];
            }, $validPayments),
            'invalid_payments' => $invalidPayments,
            'created_at' => now()->toIso8601String(),
            'created_by' => $options['created_by'] ?? null,
        ];

        Log::info('Payroll batch created', [
            'batch_id' => $batchId,
            'total_amount' => $totalAmount,
            'total_count' => $totalCount,
        ]);

        return [
            'success' => true,
            'batch' => $batch,
        ];
    }

    /**
     * Generate bank file for batch.
     */
    public function generateBankFile(string $batchId, array $batch): array
    {
        $format = $batch['format'] ?? self::FORMAT_ACH;

        $content = match ($format) {
            self::FORMAT_ACH => $this->generateAchFile($batch),
            self::FORMAT_BACS => $this->generateBacsFile($batch),
            self::FORMAT_SEPA => $this->generateSepaFile($batch),
            self::FORMAT_NEFT => $this->generateNeftFile($batch),
            self::FORMAT_RTGS => $this->generateRtgsFile($batch),
            self::FORMAT_CSV => $this->generateCsvFile($batch),
            default => $this->generateCsvFile($batch),
        };

        $filename = sprintf(
            'payroll_%s_%s.%s',
            $batchId,
            now()->format('Ymd_His'),
            $this->getFileExtension($format)
        );

        Log::info('Bank file generated', [
            'batch_id' => $batchId,
            'format' => $format,
            'filename' => $filename,
        ]);

        return [
            'success' => true,
            'filename' => $filename,
            'content' => $content,
            'format' => $format,
            'mime_type' => $this->getMimeType($format),
        ];
    }

    /**
     * Submit batch to bank.
     */
    public function submitBatch(string $batchId, array $batch, array $credentials = []): array
    {
        // Validate batch is ready for submission
        if ($batch['status'] !== self::STATUS_PENDING) {
            return [
                'success' => false,
                'error' => 'Batch is not in pending status',
            ];
        }

        // In production, this would make API calls to the bank
        $submissionResult = [
            'submission_id' => Str::uuid()->toString(),
            'submitted_at' => now()->toIso8601String(),
            'bank_reference' => 'BANK-' . strtoupper(Str::random(10)),
            'estimated_settlement' => now()->addBusinessDays(2)->toDateString(),
        ];

        $batch['status'] = self::STATUS_SUBMITTED;
        $batch['submission'] = $submissionResult;

        Log::info('Batch submitted to bank', [
            'batch_id' => $batchId,
            'bank_reference' => $submissionResult['bank_reference'],
        ]);

        return [
            'success' => true,
            'batch' => $batch,
            'submission' => $submissionResult,
        ];
    }

    /**
     * Check batch status.
     */
    public function checkBatchStatus(string $batchId, array $batch): array
    {
        // In production, query bank API for status
        return [
            'batch_id' => $batchId,
            'status' => $batch['status'],
            'payment_statuses' => array_map(function ($payment) {
                return [
                    'payment_id' => $payment['id'],
                    'employee_id' => $payment['employee_id'],
                    'status' => $payment['status'],
                    'failure_reason' => $payment['failure_reason'] ?? null,
                ];
            }, $batch['payments'] ?? []),
            'checked_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Handle payment failure.
     */
    public function handlePaymentFailure(string $paymentId, string $reason, array $payment): array
    {
        $payment['status'] = self::STATUS_FAILED;
        $payment['failure_reason'] = $reason;
        $payment['failed_at'] = now()->toIso8601String();

        Log::warning('Payment failed', [
            'payment_id' => $paymentId,
            'employee_id' => $payment['employee_id'] ?? null,
            'reason' => $reason,
        ]);

        // Check if retry is possible
        $retryCount = $payment['retry_count'] ?? 0;
        $canRetry = $this->config['retry_failed_payments'] && $retryCount < $this->config['max_retries'];

        if ($canRetry) {
            $payment['retry_scheduled_at'] = now()->addBusinessDays(1)->toIso8601String();
        }

        return [
            'payment' => $payment,
            'can_retry' => $canRetry,
            'retry_scheduled' => $payment['retry_scheduled_at'] ?? null,
        ];
    }

    /**
     * Get payment history for employee.
     */
    public function getPaymentHistory(int $employeeId, array $filters = []): array
    {
        // This would query from database in production
        return [
            'employee_id' => $employeeId,
            'payments' => [],
            'total_paid' => 0,
            'last_payment' => null,
        ];
    }

    /**
     * Get bank reconciliation report.
     */
    public function getReconciliationReport(Carbon $startDate, Carbon $endDate): array
    {
        return [
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
            'summary' => [
                'total_batches' => 0,
                'total_payments' => 0,
                'total_amount' => 0,
                'completed' => 0,
                'failed' => 0,
                'pending' => 0,
            ],
            'by_status' => [],
            'failed_payments' => [],
            'generated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Validate account details.
     */
    protected function validateAccountDetails(array $details): array
    {
        $errors = [];

        if (empty($details['bank_name'])) {
            $errors[] = 'Bank name is required';
        }

        if (empty($details['account_number'])) {
            $errors[] = 'Account number is required';
        }

        if (empty($details['account_holder_name'])) {
            $errors[] = 'Account holder name is required';
        }

        // Validate account number format based on country/region
        if (!empty($details['account_number']) && !$this->isValidAccountNumber($details['account_number'])) {
            $errors[] = 'Invalid account number format';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Validate payment data.
     */
    protected function validatePayment(array $payment): array
    {
        $errors = [];

        if (empty($payment['employee_id'])) {
            $errors[] = 'Employee ID is required';
        }

        if (empty($payment['account_id'])) {
            $errors[] = 'Account ID is required';
        }

        if (!isset($payment['amount']) || $payment['amount'] <= 0) {
            $errors[] = 'Amount must be greater than 0';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Mask account number for display.
     */
    protected function maskAccountNumber(string $accountNumber): string
    {
        $length = strlen($accountNumber);
        if ($length <= 4) {
            return str_repeat('*', $length);
        }
        return str_repeat('*', $length - 4) . substr($accountNumber, -4);
    }

    /**
     * Check if account number format is valid.
     */
    protected function isValidAccountNumber(string $accountNumber): bool
    {
        // Basic validation - in production, implement country-specific validation
        return preg_match('/^[0-9]{6,20}$/', $accountNumber);
    }

    /**
     * Generate ACH NACHA format file.
     */
    protected function generateAchFile(array $batch): string
    {
        $lines = [];

        // File Header Record (1 record)
        $lines[] = sprintf(
            "101 %09d%09d%06d%04d%1s%03d%10s%23s%23s%8s",
            0, // Immediate Destination
            0, // Immediate Origin
            (int) now()->format('ymd'),
            (int) now()->format('Hi'),
            'A', // File ID Modifier
            94, // Record Size
            10, // Blocking Factor
            str_pad('', 23), // Immediate Destination Name
            str_pad('', 23), // Immediate Origin Name
            str_pad('', 8) // Reference Code
        );

        // Batch Header Record
        $lines[] = sprintf(
            "5%03d%-16s%-20s%010d %-16s%-6s%1s%08d%03d%1s",
            220, // Service Class Code (Credits Only)
            str_pad('PAYROLL', 16), // Company Name
            str_pad('', 20), // Company Discretionary Data
            0, // Company Identification
            str_pad('PPD', 10), // Standard Entry Class Code
            str_pad('PAYROLL', 10), // Company Entry Description
            now()->format('ymd'), // Company Descriptive Date
            now()->format('ymd'), // Effective Entry Date
            0, // Settlement Date
            1, // Originator Status Code
            0, // ODFI Identification
            1 // Batch Number
        );

        // Entry Detail Records
        $entryNumber = 0;
        foreach ($batch['payments'] ?? [] as $payment) {
            $entryNumber++;
            $lines[] = sprintf(
                "6%02d%09d%17s%010d%-15s  %1s%-22s%02d%015d",
                22, // Transaction Code (Checking Credit)
                0, // Receiving DFI Identification
                str_pad($payment['account_id'], 17), // DFI Account Number
                (int) ($payment['amount'] * 100), // Amount (in cents)
                str_pad((string) $payment['employee_id'], 15), // Individual ID
                ' ', // Discretionary Data
                str_pad('Employee ' . $payment['employee_id'], 22), // Individual Name
                0, // Addenda Record Indicator
                $entryNumber // Trace Number
            );
        }

        // Batch Control Record
        $lines[] = sprintf(
            "8%03d%06d%010d%010d%010d%-39s%08d%07d",
            220, // Service Class Code
            $entryNumber, // Entry/Addenda Count
            0, // Entry Hash
            (int) ($batch['total_amount'] * 100), // Total Debit Entry Dollar Amount
            0, // Total Credit Entry Dollar Amount
            0, // Company Identification
            0, // Message Authentication Code
            0, // Reserved
            0, // ODFI Identification
            1 // Batch Number
        );

        // File Control Record
        $lines[] = sprintf(
            "9%06d%06d%08d%010d%012d%012d%39s",
            1, // Batch Count
            ceil(count($lines) / 10), // Block Count
            $entryNumber, // Entry/Addenda Count
            0, // Entry Hash
            (int) ($batch['total_amount'] * 100), // Total Debit Entry Dollar Amount in File
            0, // Total Credit Entry Dollar Amount in File
            str_pad('', 39) // Reserved
        );

        return implode("\r\n", $lines);
    }

    /**
     * Generate BACS format file (UK).
     */
    protected function generateBacsFile(array $batch): string
    {
        $lines = [];

        // VOL1 header
        $lines[] = 'VOL1' . str_pad('', 76);

        // HDR1 header
        $lines[] = sprintf(
            'HDR1%-17sBACS%04d%05d%06d%06d%17s',
            'PAYROLL',
            1, // Volume Sequence Number
            1, // File Sequence Number
            (int) now()->format('ymd'),
            (int) now()->format('ymd'),
            '' // Reserved
        );

        // Data records
        foreach ($batch['payments'] ?? [] as $payment) {
            $lines[] = sprintf(
                '%-6s%-8s%-11s%011d%-18s%-6s%-8s%-11s',
                '000000', // Destination Sort Code
                '00000000', // Destination Account Number
                '0', // Transaction Code
                (int) ($payment['amount'] * 100), // Amount in pence
                str_pad('SALARY', 18), // Reference
                '000000', // Originating Sort Code
                '00000000', // Originating Account Number
                str_pad('EMP' . $payment['employee_id'], 11) // Name
            );
        }

        // EOF trailer
        $lines[] = 'EOF1' . str_pad('', 76);

        return implode("\r\n", $lines);
    }

    /**
     * Generate SEPA XML format file (EU).
     */
    protected function generateSepaFile(array $batch): string
    {
        $xml = new \SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03"></Document>');

        $cstmrCdtTrfInitn = $xml->addChild('CstmrCdtTrfInitn');

        // Group Header
        $grpHdr = $cstmrCdtTrfInitn->addChild('GrpHdr');
        $grpHdr->addChild('MsgId', $batch['id']);
        $grpHdr->addChild('CreDtTm', now()->format('Y-m-d\TH:i:s'));
        $grpHdr->addChild('NbOfTxs', count($batch['payments'] ?? []));
        $grpHdr->addChild('CtrlSum', number_format($batch['total_amount'], 2, '.', ''));

        $initgPty = $grpHdr->addChild('InitgPty');
        $initgPty->addChild('Nm', 'Company Name');

        // Payment Information
        $pmtInf = $cstmrCdtTrfInitn->addChild('PmtInf');
        $pmtInf->addChild('PmtInfId', 'PAYROLL-' . now()->format('Ymd'));
        $pmtInf->addChild('PmtMtd', 'TRF');
        $pmtInf->addChild('NbOfTxs', count($batch['payments'] ?? []));
        $pmtInf->addChild('CtrlSum', number_format($batch['total_amount'], 2, '.', ''));

        $pmtTpInf = $pmtInf->addChild('PmtTpInf');
        $svcLvl = $pmtTpInf->addChild('SvcLvl');
        $svcLvl->addChild('Cd', 'SEPA');

        $pmtInf->addChild('ReqdExctnDt', $batch['effective_date'] ?? now()->addDay()->format('Y-m-d'));

        // Credit Transfer Transactions
        foreach ($batch['payments'] ?? [] as $payment) {
            $cdtTrfTxInf = $pmtInf->addChild('CdtTrfTxInf');

            $pmtId = $cdtTrfTxInf->addChild('PmtId');
            $pmtId->addChild('EndToEndId', $payment['id']);

            $amt = $cdtTrfTxInf->addChild('Amt');
            $instdAmt = $amt->addChild('InstdAmt', number_format($payment['amount'], 2, '.', ''));
            $instdAmt->addAttribute('Ccy', $batch['currency'] ?? 'EUR');

            $cdtr = $cdtTrfTxInf->addChild('Cdtr');
            $cdtr->addChild('Nm', 'Employee ' . $payment['employee_id']);

            $cdtrAcct = $cdtTrfTxInf->addChild('CdtrAcct');
            $id = $cdtrAcct->addChild('Id');
            $id->addChild('IBAN', 'XX0000000000000000000');
        }

        return $xml->asXML();
    }

    /**
     * Generate NEFT format file (India).
     */
    protected function generateNeftFile(array $batch): string
    {
        $lines = [];

        // Header record
        $lines[] = sprintf(
            'H,NEFT,%s,%d,%.2f',
            now()->format('d-m-Y'),
            count($batch['payments'] ?? []),
            $batch['total_amount']
        );

        // Detail records
        foreach ($batch['payments'] ?? [] as $index => $payment) {
            $lines[] = sprintf(
                'D,%d,%s,%s,%.2f,%s,%s',
                $index + 1,
                $payment['account_id'],
                'Account Name',
                $payment['amount'],
                $payment['reference'] ?? 'SALARY',
                'SALARY PAYMENT'
            );
        }

        // Trailer record
        $lines[] = sprintf(
            'T,%d,%.2f',
            count($batch['payments'] ?? []),
            $batch['total_amount']
        );

        return implode("\r\n", $lines);
    }

    /**
     * Generate RTGS format file (India).
     */
    protected function generateRtgsFile(array $batch): string
    {
        // RTGS follows similar format to NEFT but for high-value transfers
        return $this->generateNeftFile($batch);
    }

    /**
     * Generate CSV format file.
     */
    protected function generateCsvFile(array $batch): string
    {
        $lines = [];

        // Header row
        $lines[] = 'Employee ID,Account ID,Amount,Reference,Currency,Effective Date';

        // Data rows
        foreach ($batch['payments'] ?? [] as $payment) {
            $lines[] = sprintf(
                '%s,%s,%.2f,%s,%s,%s',
                $payment['employee_id'],
                $payment['account_id'],
                $payment['amount'],
                $payment['reference'] ?? 'PAYROLL',
                $batch['currency'] ?? 'USD',
                $batch['effective_date'] ?? now()->format('Y-m-d')
            );
        }

        return implode("\n", $lines);
    }

    /**
     * Get file extension for format.
     */
    protected function getFileExtension(string $format): string
    {
        return match ($format) {
            self::FORMAT_ACH => 'ach',
            self::FORMAT_BACS => 'txt',
            self::FORMAT_SEPA => 'xml',
            self::FORMAT_NEFT, self::FORMAT_RTGS => 'txt',
            self::FORMAT_CSV => 'csv',
            default => 'txt',
        };
    }

    /**
     * Get MIME type for format.
     */
    protected function getMimeType(string $format): string
    {
        return match ($format) {
            self::FORMAT_SEPA => 'application/xml',
            self::FORMAT_CSV => 'text/csv',
            default => 'text/plain',
        };
    }

    // Verification method implementations
    protected function verifyByMicroDeposit(string $accountId, array $data): array
    {
        // Initiate or verify micro-deposits
        $amounts = $data['amounts'] ?? [];
        if (empty($amounts)) {
            // Initiate micro-deposits
            return [
                'verified' => false,
                'action' => 'deposits_initiated',
                'message' => 'Two small deposits will be made to your account within 1-2 business days',
            ];
        }

        // Verify amounts match
        $expectedAmounts = [0.32, 0.45]; // Example
        if ($amounts === $expectedAmounts) {
            return ['verified' => true];
        }

        return [
            'verified' => false,
            'error' => 'Amounts do not match',
        ];
    }

    protected function verifyByPlaid(string $accountId, array $data): array
    {
        // Plaid integration would go here
        return [
            'verified' => !empty($data['plaid_access_token']),
            'method' => 'plaid',
        ];
    }

    protected function verifyInstantly(string $accountId, array $data): array
    {
        // Instant verification via bank login
        return [
            'verified' => !empty($data['bank_login_verified']),
            'method' => 'instant',
        ];
    }

    protected function verifyManually(string $accountId, array $data): array
    {
        // Manual verification by admin
        return [
            'verified' => true,
            'verified_by' => $data['verified_by'] ?? null,
            'method' => 'manual',
        ];
    }
}
