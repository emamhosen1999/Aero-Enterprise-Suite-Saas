import React, { useMemo, useRef } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Divider,
    Chip,
} from '@heroui/react';
import {
    PrinterIcon,
    ArrowDownTrayIcon,
    XMarkIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    BanknotesIcon,
    IdentificationIcon,
    UserIcon,
    BriefcaseIcon,
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';

/**
 * Payslip Modal Component
 * 
 * A modal component that displays payslip in a printable format.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.payroll - Payroll object
 * @param {Object} props.organization - Organization object
 */
const PayslipModal = ({ isOpen, onClose, payroll, organization }) => {
    const printRef = useRef(null);

    // Format currency helper
    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount || 0);
    };

    // Mask bank account number
    const maskAccountNumber = (accountNo) => {
        if (!accountNo) return 'N/A';
        const str = String(accountNo);
        if (str.length <= 4) return str;
        return '****' + str.slice(-4);
    };

    // Get pay period display
    const payPeriod = useMemo(() => {
        if (!payroll) return 'N/A';
        if (payroll.month && payroll.year) {
            return dayjs().month(payroll.month - 1).year(payroll.year).format('MMMM YYYY');
        }
        if (payroll.pay_period_start) {
            return dayjs(payroll.pay_period_start).format('MMMM YYYY');
        }
        return 'N/A';
    }, [payroll]);

    // Separate earnings and deductions
    const { earnings, deductions, totalEarnings, totalDeductions } = useMemo(() => {
        if (!payroll) return { earnings: [], deductions: [], totalEarnings: 0, totalDeductions: 0 };
        
        const items = payroll.items || payroll.payroll_items || [];
        
        const earningItems = items.filter(item => item.type === 'earning');
        const deductionItems = items.filter(item => item.type === 'deduction');
        
        const earnTotal = earningItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        const dedTotal = deductionItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        
        return {
            earnings: earningItems,
            deductions: deductionItems,
            totalEarnings: payroll.total_earnings || payroll.gross_salary || earnTotal,
            totalDeductions: payroll.total_deductions || dedTotal,
        };
    }, [payroll]);

    // Handle print
    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payslip - ${payPeriod}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        padding: 20mm;
                        background: white;
                        color: #1a1a1a;
                    }
                    .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
                    .company-info { display: flex; gap: 16px; align-items: flex-start; }
                    .company-logo { width: 64px; height: 64px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
                    .company-name { font-size: 20px; font-weight: bold; }
                    .company-address { font-size: 12px; color: #666; margin-top: 4px; }
                    .payslip-title { text-align: right; }
                    .payslip-title h1 { font-size: 24px; color: #0066cc; margin-bottom: 4px; }
                    .payslip-title .period { font-size: 16px; font-weight: 600; }
                    .payslip-title .status { display: inline-block; padding: 4px 12px; background: #e0f2fe; color: #0369a1; border-radius: 12px; font-size: 11px; font-weight: 600; margin-top: 8px; }
                    .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
                    .section-title { font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
                    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
                    .info-item { }
                    .info-label { font-size: 10px; color: #888; text-transform: uppercase; margin-bottom: 4px; }
                    .info-value { font-size: 13px; font-weight: 600; }
                    .attendance-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
                    .attendance-value { font-size: 24px; font-weight: bold; }
                    .attendance-label { font-size: 10px; color: #666; }
                    .tables-container { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
                    .table-section { }
                    .table-header { padding: 10px 16px; font-weight: 600; border-radius: 8px 8px 0 0; }
                    .table-header.earnings { background: #dcfce7; color: #166534; }
                    .table-header.deductions { background: #fee2e2; color: #991b1b; }
                    .table-body { border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
                    .table-row { display: flex; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
                    .table-row:last-child { border-bottom: none; }
                    .table-row.total { font-weight: bold; }
                    .table-row.total.earnings { background: #dcfce7; color: #166534; }
                    .table-row.total.deductions { background: #fee2e2; color: #991b1b; }
                    .net-pay { background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                    .net-pay-label { font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; }
                    .net-pay-sublabel { font-size: 11px; color: #888; margin-top: 4px; }
                    .net-pay-value { font-size: 32px; font-weight: bold; color: #0066cc; }
                    .footer { text-align: center; font-size: 11px; color: #888; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
                    @page { size: A4; margin: 0; }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    if (!payroll) return null;

    const employee = payroll.employee || payroll.user || {};
    const bankDetails = employee.bank_details || employee.employeeBankDetail || {};

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            size="4xl"
            scrollBehavior="inside"
            classNames={{
                base: "max-h-[90vh]",
                body: "p-0",
            }}
        >
            <ModalContent>
                <ModalHeader className="flex justify-between items-center border-b border-default-200 px-6">
                    <div className="flex items-center gap-3">
                        <BanknotesIcon className="w-6 h-6 text-primary" />
                        <span>Payslip for {payPeriod}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            startContent={<PrinterIcon className="w-4 h-4" />}
                            onPress={handlePrint}
                        >
                            Print
                        </Button>
                    </div>
                </ModalHeader>
                
                <ModalBody>
                    {/* Printable Content */}
                    <div ref={printRef} className="p-6 bg-white dark:bg-content1">
                        {/* Header */}
                        <div className="header flex items-start justify-between mb-6">
                            <div className="company-info flex items-start gap-4">
                                {organization?.logo ? (
                                    <img 
                                        src={organization.logo} 
                                        alt={organization.company_name} 
                                        className="h-16 w-auto object-contain"
                                    />
                                ) : (
                                    <div className="company-logo h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <BuildingOfficeIcon className="w-8 h-8 text-primary" />
                                    </div>
                                )}
                                <div>
                                    <div className="company-name text-xl font-bold">
                                        {organization?.company_name || 'Company Name'}
                                    </div>
                                    {organization?.address_line1 && (
                                        <div className="company-address text-sm text-default-500">
                                            {organization.address_line1}
                                            {organization.city && `, ${organization.city}`}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="payslip-title text-right">
                                <h1 className="text-2xl font-bold text-primary">PAYSLIP</h1>
                                <p className="period text-lg font-semibold">{payPeriod}</p>
                                <Chip 
                                    size="sm" 
                                    variant="flat" 
                                    color={payroll.status === 'paid' ? 'success' : 'primary'}
                                    className="status mt-2"
                                >
                                    {payroll.status?.toUpperCase() || 'DRAFT'}
                                </Chip>
                            </div>
                        </div>

                        <Divider className="divider my-5" />

                        {/* Employee Info Grid */}
                        <div className="section-title text-xs font-semibold text-default-500 uppercase tracking-wider mb-3">
                            Employee Information
                        </div>
                        <div className="info-grid grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="info-item">
                                <div className="info-label text-xs text-default-400 uppercase">Name</div>
                                <div className="info-value font-semibold">{employee.name || 'N/A'}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label text-xs text-default-400 uppercase">Employee ID</div>
                                <div className="info-value font-semibold">{employee.employee_id || 'N/A'}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label text-xs text-default-400 uppercase">Designation</div>
                                <div className="info-value font-semibold">{employee.designation?.name || employee.designation || 'N/A'}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label text-xs text-default-400 uppercase">Department</div>
                                <div className="info-value font-semibold">{employee.department?.name || employee.department || 'N/A'}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label text-xs text-default-400 uppercase">Bank Account</div>
                                <div className="info-value font-semibold font-mono">
                                    {maskAccountNumber(bankDetails.account_number || employee.bank_account_no)}
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-label text-xs text-default-400 uppercase">PAN/Tax ID</div>
                                <div className="info-value font-semibold font-mono">{bankDetails.tax_id || employee.pan_no || 'N/A'}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label text-xs text-default-400 uppercase">Pay Period</div>
                                <div className="info-value font-semibold">
                                    {payroll.pay_period_start && payroll.pay_period_end 
                                        ? `${dayjs(payroll.pay_period_start).format('DD MMM')} - ${dayjs(payroll.pay_period_end).format('DD MMM')}`
                                        : payPeriod
                                    }
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-label text-xs text-default-400 uppercase">Payment Date</div>
                                <div className="info-value font-semibold">
                                    {payroll.payment_date ? dayjs(payroll.payment_date).format('DD MMM YYYY') : 'Pending'}
                                </div>
                            </div>
                        </div>

                        {/* Attendance Summary */}
                        {(payroll.working_days || payroll.present_days) && (
                            <div className="attendance-grid bg-default-50 dark:bg-default-100 rounded-lg p-4 mb-6 grid grid-cols-5 gap-4 text-center">
                                <div>
                                    <div className="attendance-value text-2xl font-bold">{payroll.working_days || 0}</div>
                                    <div className="attendance-label text-xs text-default-500">Working Days</div>
                                </div>
                                <div>
                                    <div className="attendance-value text-2xl font-bold text-success">{payroll.present_days || 0}</div>
                                    <div className="attendance-label text-xs text-default-500">Present</div>
                                </div>
                                <div>
                                    <div className="attendance-value text-2xl font-bold text-danger">{payroll.absent_days || 0}</div>
                                    <div className="attendance-label text-xs text-default-500">Absent</div>
                                </div>
                                <div>
                                    <div className="attendance-value text-2xl font-bold text-warning">{payroll.leave_days || 0}</div>
                                    <div className="attendance-label text-xs text-default-500">Leave</div>
                                </div>
                                <div>
                                    <div className="attendance-value text-2xl font-bold text-primary">{payroll.overtime_hours || 0}</div>
                                    <div className="attendance-label text-xs text-default-500">OT Hours</div>
                                </div>
                            </div>
                        )}

                        {/* Earnings & Deductions Tables */}
                        <div className="tables-container grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Earnings */}
                            <div className="table-section">
                                <div className="table-header earnings bg-success-50 dark:bg-success-900/20 px-4 py-3 rounded-t-lg font-semibold text-success-700 dark:text-success-400">
                                    Earnings
                                </div>
                                <div className="table-body border border-t-0 border-default-200 rounded-b-lg">
                                    <div className="table-row flex justify-between px-4 py-3 border-b border-default-100 text-sm">
                                        <span>Basic Salary</span>
                                        <span className="font-semibold">{formatCurrency(payroll.basic_salary)}</span>
                                    </div>
                                    {earnings.map((item, idx) => (
                                        <div key={idx} className="table-row flex justify-between px-4 py-3 border-b border-default-100 text-sm">
                                            <span>{item.name}</span>
                                            <span className="font-semibold">{formatCurrency(item.amount)}</span>
                                        </div>
                                    ))}
                                    {payroll.overtime_amount > 0 && (
                                        <div className="table-row flex justify-between px-4 py-3 border-b border-default-100 text-sm">
                                            <span>Overtime</span>
                                            <span className="font-semibold">{formatCurrency(payroll.overtime_amount)}</span>
                                        </div>
                                    )}
                                    <div className="table-row total earnings flex justify-between px-4 py-3 bg-success-50 dark:bg-success-900/30 font-bold text-success-700 dark:text-success-400">
                                        <span>Total Earnings</span>
                                        <span>{formatCurrency(totalEarnings)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Deductions */}
                            <div className="table-section">
                                <div className="table-header deductions bg-danger-50 dark:bg-danger-900/20 px-4 py-3 rounded-t-lg font-semibold text-danger-700 dark:text-danger-400">
                                    Deductions
                                </div>
                                <div className="table-body border border-t-0 border-default-200 rounded-b-lg">
                                    {deductions.length > 0 ? (
                                        deductions.map((item, idx) => (
                                            <div key={idx} className="table-row flex justify-between px-4 py-3 border-b border-default-100 text-sm">
                                                <span>{item.name}</span>
                                                <span className="font-semibold">{formatCurrency(item.amount)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="table-row flex justify-center px-4 py-3 text-sm text-default-400 italic">
                                            No deductions
                                        </div>
                                    )}
                                    {payroll.tax_amount > 0 && !deductions.some(d => d.code === 'TDS') && (
                                        <div className="table-row flex justify-between px-4 py-3 border-b border-default-100 text-sm">
                                            <span>Income Tax (TDS)</span>
                                            <span className="font-semibold">{formatCurrency(payroll.tax_amount)}</span>
                                        </div>
                                    )}
                                    <div className="table-row total deductions flex justify-between px-4 py-3 bg-danger-50 dark:bg-danger-900/30 font-bold text-danger-700 dark:text-danger-400">
                                        <span>Total Deductions</span>
                                        <span>{formatCurrency(totalDeductions)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Net Pay */}
                        <div className="net-pay bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 rounded-xl p-5 flex justify-between items-center mb-6">
                            <div>
                                <div className="net-pay-label text-xs font-semibold text-default-500 uppercase">Net Pay</div>
                                <div className="net-pay-sublabel text-xs text-default-400">Gross - Deductions</div>
                            </div>
                            <div className="net-pay-value text-3xl font-bold text-primary">
                                {formatCurrency(payroll.net_salary)}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="footer text-center text-xs text-default-400 pt-4 border-t border-default-200">
                            <p>This is a computer-generated payslip and does not require a signature.</p>
                            <p className="mt-1">Generated on {dayjs().format('DD MMMM YYYY')}</p>
                        </div>
                    </div>
                </ModalBody>

                <ModalFooter className="border-t border-default-200">
                    <Button variant="light" onPress={onClose}>
                        Close
                    </Button>
                    <Button 
                        color="primary" 
                        startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                        onPress={handlePrint}
                    >
                        Download PDF
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default PayslipModal;
