import React, {useMemo} from 'react';
import {Head} from '@inertiajs/react';
import {Button, Chip, Divider} from '@heroui/react';
import {
    ArrowDownTrayIcon,
    BanknotesIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    IdentificationIcon,
    PrinterIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';

/**
 * Payslip Component
 * 
 * A printable A4-style payslip view component that displays employee salary details.
 * 
 * @param {Object} props
 * @param {Object} props.payroll - Payroll object containing employee, items, net_salary, etc.
 * @param {Object} props.company - Company object with name, address, logo
 * @param {Object} props.employee - Employee info from controller
 * @param {Object} props.payPeriod - Pay period start/end
 * @param {Object} props.attendance - Attendance summary
 * @param {Array} props.earnings - List of earnings
 * @param {Array} props.deductions - List of deductions
 * @param {Object} props.summary - Salary summary (gross, deductions, net)
 */
const Payslip = ({ 
    payroll, 
    company, 
    employee: employeeData, 
    payPeriod: payPeriodData, 
    attendance: attendanceData,
    earnings: earningsData,
    deductions: deductionsData,
    summary: summaryData,
    // Fallback for when used without controller data
    organization 
}) => {
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

    // Use company data or fallback to organization
    const org = company || organization || {};

    // Use employee data or fallback to payroll.employee
    const employee = employeeData || payroll?.employee || payroll?.user || {};
    const bankDetails = employee.bank_details || employee.employeeBankDetail || {};

    // Get pay period display
    const payPeriod = useMemo(() => {
        // Use controller-passed payPeriod data first
        if (payPeriodData?.start) {
            return dayjs(payPeriodData.start).format('MMMM YYYY');
        }
        if (payroll?.month && payroll?.year) {
            return dayjs().month(payroll.month - 1).year(payroll.year).format('MMMM YYYY');
        }
        if (payroll?.pay_period_start) {
            return dayjs(payroll.pay_period_start).format('MMMM YYYY');
        }
        return 'N/A';
    }, [payroll, payPeriodData]);

    // Use controller-passed data or fallback to payroll items
    const { earnings, deductions, totalEarnings, totalDeductions, netSalary } = useMemo(() => {
        // If controller passed data, use it
        if (earningsData && deductionsData) {
            return {
                earnings: earningsData,
                deductions: deductionsData,
                totalEarnings: summaryData?.gross_salary || 0,
                totalDeductions: summaryData?.total_deductions || 0,
                netSalary: summaryData?.net_salary || 0,
            };
        }

        // Fallback to payroll items
        const items = payroll?.items || payroll?.payroll_items || [];
        
        const earningItems = items.filter(item => item.type === 'earning');
        const deductionItems = items.filter(item => item.type === 'deduction');
        
        // Calculate totals
        const earnTotal = earningItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        const dedTotal = deductionItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        
        return {
            earnings: earningItems,
            deductions: deductionItems,
            totalEarnings: payroll?.total_earnings || payroll?.gross_salary || earnTotal,
            totalDeductions: payroll?.total_deductions || dedTotal,
            netSalary: payroll?.net_salary || (earnTotal - dedTotal),
        };
    }, [payroll, earningsData, deductionsData, summaryData]);

    // Use attendance data from controller or payroll
    const attendance = attendanceData || {
        working_days: payroll?.working_days || 0,
        present_days: payroll?.present_days || 0,
        absent_days: payroll?.absent_days || 0,
        leave_days: payroll?.leave_days || 0,
        overtime_hours: payroll?.overtime_hours || 0,
        late_days: payroll?.late_days || 0,
    };

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Head title={`Payslip - ${payPeriod}`} />

            {/* Print Styles */}
            <style>{`
                @media print {
                    body { 
                        margin: 0; 
                        padding: 0;
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    .payslip-container {
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 20mm !important;
                        max-width: none !important;
                    }
                    @page { 
                        size: A4; 
                        margin: 0;
                    }
                }
                @media screen {
                    .print-only { display: none; }
                }
            `}</style>

            <div className="min-h-screen bg-default-100 dark:bg-default-50 p-4 md:p-8">
                {/* Action Buttons - Hidden when printing */}
                <div className="max-w-4xl mx-auto mb-6 no-print">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-foreground">Payslip</h1>
                        <div className="flex gap-3">
                            <Button
                                color="primary"
                                variant="flat"
                                startContent={<ArrowDownTrayIcon className="w-5 h-5" />}
                                onPress={handlePrint}
                            >
                                Download PDF
                            </Button>
                            <Button
                                color="primary"
                                startContent={<PrinterIcon className="w-5 h-5" />}
                                onPress={handlePrint}
                            >
                                Print
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Payslip Container - A4 Paper Style */}
                <div className="payslip-container max-w-4xl mx-auto bg-white dark:bg-content1 shadow-xl rounded-lg overflow-hidden">
                    <div className="p-8 md:p-12">
                        {/* ===== HEADER ===== */}
                        <div className="flex items-start justify-between mb-8">
                            {/* Company Logo & Info */}
                            <div className="flex items-start gap-4">
                                {org?.logo ? (
                                    <img 
                                        src={org.logo} 
                                        alt={org.name || 'Company'} 
                                        className="h-16 w-auto object-contain"
                                    />
                                ) : (
                                    <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <BuildingOfficeIcon className="w-8 h-8 text-primary" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">
                                        {org?.name || org?.company_name || 'Company Name'}
                                    </h2>
                                    {org?.address && (
                                        <p className="text-sm text-default-500 mt-1">
                                            {org.address}
                                        </p>
                                    )}
                                    {(org?.phone || org?.email) && (
                                        <p className="text-sm text-default-500">
                                            {[org.phone, org.email]
                                                .filter(Boolean)
                                                .join(' | ')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Payslip Title & Period */}
                            <div className="text-right">
                                <h1 className="text-2xl font-bold text-primary">PAYSLIP</h1>
                                <p className="text-lg font-semibold text-foreground mt-1">
                                    {payPeriod}
                                </p>
                                <Chip 
                                    size="sm" 
                                    variant="flat" 
                                    color={payroll.status === 'paid' ? 'success' : payroll.status === 'processed' ? 'primary' : 'warning'}
                                    className="mt-2"
                                >
                                    {payroll.status?.toUpperCase() || 'DRAFT'}
                                </Chip>
                            </div>
                        </div>

                        <Divider className="my-6" />

                        {/* ===== EMPLOYEE SUMMARY ===== */}
                        <div className="mb-8">
                            <h3 className="text-sm font-semibold text-default-500 uppercase tracking-wider mb-4">
                                Employee Information
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {/* Employee Name */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-default-400">
                                        <UserIcon className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wide">Employee Name</span>
                                    </div>
                                    <p className="font-semibold text-foreground">{employee.name || 'N/A'}</p>
                                </div>

                                {/* Employee ID */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-default-400">
                                        <IdentificationIcon className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wide">Employee ID</span>
                                    </div>
                                    <p className="font-semibold text-foreground">{employee.employee_id || 'N/A'}</p>
                                </div>

                                {/* Designation */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-default-400">
                                        <BriefcaseIcon className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wide">Designation</span>
                                    </div>
                                    <p className="font-semibold text-foreground">
                                        {employee.designation?.name || employee.designation || 'N/A'}
                                    </p>
                                </div>

                                {/* Department */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-default-400">
                                        <BuildingOfficeIcon className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wide">Department</span>
                                    </div>
                                    <p className="font-semibold text-foreground">
                                        {employee.department?.name || employee.department || 'N/A'}
                                    </p>
                                </div>

                                {/* Bank Account */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-default-400">
                                        <BanknotesIcon className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wide">Bank Account</span>
                                    </div>
                                    <p className="font-semibold text-foreground font-mono">
                                        {maskAccountNumber(bankDetails.account_number || employee.account_number || employee.bank_account_no)}
                                    </p>
                                    {(bankDetails.bank_name || employee.bank_name) && (
                                        <p className="text-xs text-default-400">{bankDetails.bank_name || employee.bank_name}</p>
                                    )}
                                </div>

                                {/* PAN/Tax ID */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-default-400">
                                        <IdentificationIcon className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wide">PAN/Tax ID</span>
                                    </div>
                                    <p className="font-semibold text-foreground font-mono">
                                        {bankDetails.tax_id || employee.pan_no || 'N/A'}
                                    </p>
                                </div>

                                {/* Pay Period */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-default-400">
                                        <CalendarIcon className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wide">Pay Period</span>
                                    </div>
                                    <p className="font-semibold text-foreground">
                                        {(payPeriodData?.start && payPeriodData?.end)
                                            ? `${dayjs(payPeriodData.start).format('DD MMM')} - ${dayjs(payPeriodData.end).format('DD MMM YYYY')}`
                                            : (payroll?.pay_period_start && payroll?.pay_period_end 
                                                ? `${dayjs(payroll.pay_period_start).format('DD MMM')} - ${dayjs(payroll.pay_period_end).format('DD MMM YYYY')}`
                                                : payPeriod)
                                        }
                                    </p>
                                </div>

                                {/* Payment Date */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-default-400">
                                        <CalendarIcon className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wide">Payment Date</span>
                                    </div>
                                    <p className="font-semibold text-foreground">
                                        {payroll.payment_date 
                                            ? dayjs(payroll.payment_date).format('DD MMM YYYY')
                                            : 'Pending'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ===== ATTENDANCE SUMMARY ===== */}
                        {(attendance.working_days || attendance.present_days) && (
                            <div className="mb-8 p-4 bg-default-50 dark:bg-default-100 rounded-lg">
                                <h3 className="text-sm font-semibold text-default-500 uppercase tracking-wider mb-3">
                                    Attendance Summary
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{attendance.working_days || 0}</p>
                                        <p className="text-xs text-default-500">Working Days</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-success">{attendance.present_days || 0}</p>
                                        <p className="text-xs text-default-500">Present Days</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-danger">{attendance.absent_days || 0}</p>
                                        <p className="text-xs text-default-500">Absent Days</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-warning">{attendance.leave_days || 0}</p>
                                        <p className="text-xs text-default-500">Leave Days</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-primary">{attendance.overtime_hours || 0}</p>
                                        <p className="text-xs text-default-500">Overtime Hours</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ===== EARNINGS & DEDUCTIONS TABLE ===== */}
                        <div className="mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Earnings Column */}
                                <div>
                                    <div className="bg-success-50 dark:bg-success-900/20 rounded-t-lg px-4 py-3">
                                        <h3 className="font-semibold text-success-700 dark:text-success-400">
                                            Earnings
                                        </h3>
                                    </div>
                                    <div className="border border-t-0 border-default-200 rounded-b-lg">
                                        <table className="w-full">
                                            <tbody>
                                                {/* Earning Items */}
                                                {earnings.map((item, index) => (
                                                    <tr key={item.id || index} className="border-b border-default-100 last:border-b-0">
                                                        <td className="px-4 py-3 text-sm text-foreground">
                                                            {item.name}
                                                            {item.is_taxable === false && (
                                                                <span className="ml-2 text-xs text-default-400">(Non-taxable)</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-semibold text-right text-foreground">
                                                            {formatCurrency(item.amount)}
                                                        </td>
                                                    </tr>
                                                ))}

                                                {/* Overtime */}
                                                {payroll.overtime_amount > 0 && (
                                                    <tr className="border-b border-default-100">
                                                        <td className="px-4 py-3 text-sm text-foreground">Overtime</td>
                                                        <td className="px-4 py-3 text-sm font-semibold text-right text-foreground">
                                                            {formatCurrency(payroll.overtime_amount)}
                                                        </td>
                                                    </tr>
                                                )}

                                                {/* Empty rows for balance if deductions are more */}
                                                {earnings.length < deductions.length && 
                                                    Array(deductions.length - earnings.length).fill(0).map((_, i) => (
                                                        <tr key={`empty-earn-${i}`} className="border-b border-default-100 last:border-b-0">
                                                            <td className="px-4 py-3">&nbsp;</td>
                                                            <td className="px-4 py-3">&nbsp;</td>
                                                        </tr>
                                                    ))
                                                }
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-success-50 dark:bg-success-900/30">
                                                    <td className="px-4 py-3 font-bold text-success-700 dark:text-success-400">
                                                        Total Earnings
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-right text-success-700 dark:text-success-400">
                                                        {formatCurrency(totalEarnings)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Deductions Column */}
                                <div>
                                    <div className="bg-danger-50 dark:bg-danger-900/20 rounded-t-lg px-4 py-3">
                                        <h3 className="font-semibold text-danger-700 dark:text-danger-400">
                                            Deductions
                                        </h3>
                                    </div>
                                    <div className="border border-t-0 border-default-200 rounded-b-lg">
                                        <table className="w-full">
                                            <tbody>
                                                {/* Deduction Items */}
                                                {deductions.map((item, index) => (
                                                    <tr key={item.id || index} className="border-b border-default-100 last:border-b-0">
                                                        <td className="px-4 py-3 text-sm text-foreground">
                                                            {item.name}
                                                            {item.is_statutory && (
                                                                <span className="ml-2 text-xs text-default-400">(Statutory)</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-semibold text-right text-foreground">
                                                            {formatCurrency(item.amount)}
                                                        </td>
                                                    </tr>
                                                ))}

                                                {/* Tax Amount if separate */}
                                                {payroll?.tax_amount > 0 && !deductions.some(d => d.code === 'TDS') && (
                                                    <tr className="border-b border-default-100">
                                                        <td className="px-4 py-3 text-sm text-foreground">Income Tax (TDS)</td>
                                                        <td className="px-4 py-3 text-sm font-semibold text-right text-foreground">
                                                            {formatCurrency(payroll.tax_amount)}
                                                        </td>
                                                    </tr>
                                                )}

                                                {/* No deductions message */}
                                                {deductions.length === 0 && !payroll?.tax_amount && (
                                                    <tr className="border-b border-default-100">
                                                        <td colSpan="2" className="px-4 py-3 text-sm text-default-400 text-center italic">
                                                            No deductions
                                                        </td>
                                                    </tr>
                                                )}

                                                {/* Empty rows for balance if earnings are more */}
                                                {deductions.length < earnings.length && 
                                                    Array(earnings.length - deductions.length).fill(0).map((_, i) => (
                                                        <tr key={`empty-ded-${i}`} className="border-b border-default-100 last:border-b-0">
                                                            <td className="px-4 py-3">&nbsp;</td>
                                                            <td className="px-4 py-3">&nbsp;</td>
                                                        </tr>
                                                    ))
                                                }
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-danger-50 dark:bg-danger-900/30">
                                                    <td className="px-4 py-3 font-bold text-danger-700 dark:text-danger-400">
                                                        Total Deductions
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-right text-danger-700 dark:text-danger-400">
                                                        {formatCurrency(totalDeductions)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===== NET PAY SECTION ===== */}
                        <div className="bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-default-500 uppercase tracking-wider">
                                        Net Pay
                                    </h3>
                                    <p className="text-xs text-default-400 mt-1">
                                        Gross Earnings - Total Deductions
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-4xl font-bold text-primary">
                                        {formatCurrency(netSalary)}
                                    </p>
                                    {payroll?.payment_method && (
                                        <p className="text-sm text-default-500 mt-1">
                                            via {payroll.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ===== REMARKS ===== */}
                        {payroll.remarks && (
                            <div className="mt-6 p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                                <h4 className="text-sm font-semibold text-warning-700 dark:text-warning-400 mb-2">Remarks</h4>
                                <p className="text-sm text-warning-600 dark:text-warning-300">{payroll.remarks}</p>
                            </div>
                        )}

                        <Divider className="my-8" />

                        {/* ===== FOOTER ===== */}
                        <div className="text-center text-xs text-default-400">
                            <p>This is a computer-generated payslip and does not require a signature.</p>
                            <p className="mt-1">
                                Generated on {dayjs().format('DD MMMM YYYY, hh:mm A')}
                            </p>
                            {organization?.support_email && (
                                <p className="mt-2">
                                    For queries, contact: {organization.support_email}
                                    {organization.support_phone && ` | ${organization.support_phone}`}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Back to List - Hidden when printing */}
                <div className="max-w-4xl mx-auto mt-6 text-center no-print">
                    <Button
                        variant="light"
                        color="default"
                        onPress={() => window.history.back()}
                    >
                        ← Back to Payroll
                    </Button>
                </div>
            </div>
        </>
    );
};

export default Payslip;
