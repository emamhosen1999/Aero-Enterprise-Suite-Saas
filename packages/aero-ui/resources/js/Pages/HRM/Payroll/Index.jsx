import React, {useState} from 'react';
import {Head, router} from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Input,
    Pagination,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from '@heroui/react';
import {
    ArrowDownTrayIcon,
    BanknotesIcon,
    CheckCircleIcon,
    ClockIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    EllipsisVerticalIcon,
    EnvelopeIcon,
    EyeIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import App from '@ui/Layouts/App';
import PageHeader from '@ui/Components/PageHeader';
import {showToast} from '@ui/utils/toastUtils';
import {format} from 'date-fns';

/**
 * Payroll Management Index Page
 * Lists all payroll records with filters, stats, and actions
 */
export default function PayrollIndex({ auth, title, payrolls, stats }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedPayrolls, setSelectedPayrolls] = useState([]);

    const handleSearch = () => {
        router.get(route('hrm.payroll.index'), {
            search,
            status: statusFilter !== 'all' ? statusFilter : undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this payroll record?')) {
            router.delete(route('hrm.payroll.destroy', id), {
                onSuccess: () => showToast('success', 'Payroll deleted successfully'),
                onError: () => showToast('error', 'Failed to delete payroll'),
            });
        }
    };

    const handleProcess = (id) => {
        if (confirm('Are you sure you want to process this payroll? This action cannot be undone.')) {
            router.post(route('hrm.payroll.process', id), {}, {
                onSuccess: () => showToast('success', 'Payroll processed successfully'),
                onError: () => showToast('error', 'Failed to process payroll'),
            });
        }
    };

    const handleBulkProcess = () => {
        if (selectedPayrolls.length === 0) {
            showToast('warning', 'Please select payrolls to process');
            return;
        }

        if (confirm(`Process ${selectedPayrolls.length} selected payroll(s)?`)) {
            router.post(route('hrm.payroll.bulk.process'), {
                payroll_ids: selectedPayrolls,
            }, {
                onSuccess: () => {
                    showToast('success', 'Bulk payrolls processed successfully');
                    setSelectedPayrolls([]);
                },
                onError: () => showToast('error', 'Failed to process payrolls'),
            });
        }
    };

    const handleGeneratePayslip = (id) => {
        router.post(route('hrm.payroll.payslip.generate', id), {}, {
            onSuccess: () => showToast('success', 'Payslip generated successfully'),
            onError: () => showToast('error', 'Failed to generate payslip'),
        });
    };

    const handleSendPayslipEmail = (id) => {
        router.post(route('hrm.payroll.payslip.email', id), {}, {
            onSuccess: () => showToast('success', 'Payslip email sent successfully'),
            onError: () => showToast('error', 'Failed to send payslip email'),
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            draft: 'warning',
            processed: 'success',
            paid: 'primary',
            cancelled: 'danger',
        };
        return colors[status] || 'default';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        return date ? format(new Date(date), 'MMM dd, yyyy') : 'N/A';
    };

    return (
        <App>
            <Head title={title} />

            <div className="space-y-6">
                {/* Page Header */}
                <PageHeader
                    title="Payroll Management"
                    description="Manage employee payroll, generate payslips, and process payments"
                    icon={BanknotesIcon}
                >
                    <Button
                        color="primary"
                        startContent={<PlusIcon className="w-4 h-4" />}
                        onPress={() => router.visit(route('hrm.payroll.create'))}
                    >
                        Generate Payroll
                    </Button>
                </PageHeader>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardBody>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <BanknotesIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-default-500">Total Payrolls</p>
                                    <p className="text-2xl font-bold">{stats?.total_payrolls || 0}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-success/10 rounded-lg">
                                    <CheckCircleIcon className="w-6 h-6 text-success" />
                                </div>
                                <div>
                                    <p className="text-sm text-default-500">Processed</p>
                                    <p className="text-2xl font-bold">{stats?.processed_payrolls || 0}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-warning/10 rounded-lg">
                                    <ClockIcon className="w-6 h-6 text-warning" />
                                </div>
                                <div>
                                    <p className="text-sm text-default-500">Pending</p>
                                    <p className="text-2xl font-bold">{stats?.pending_payrolls || 0}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-secondary/10 rounded-lg">
                                    <CurrencyDollarIcon className="w-6 h-6 text-secondary" />
                                </div>
                                <div>
                                    <p className="text-sm text-default-500">Total Payout</p>
                                    <p className="text-2xl font-bold">{formatCurrency(stats?.total_payout)}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Payroll Table */}
                <Card>
                    <CardHeader className="flex flex-col gap-3">
                        <div className="flex justify-between items-center w-full">
                            <h3 className="text-xl font-semibold">Payroll Records</h3>
                            {selectedPayrolls.length > 0 && (
                                <Button
                                    color="primary"
                                    size="sm"
                                    startContent={<CheckCircleIcon className="w-4 h-4" />}
                                    onPress={handleBulkProcess}
                                >
                                    Process Selected ({selectedPayrolls.length})
                                </Button>
                            )}
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-3 w-full">
                            <Input
                                placeholder="Search by employee name or ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                className="max-w-xs"
                            />

                            <Select
                                placeholder="Filter by status"
                                selectedKeys={[statusFilter]}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="max-w-xs"
                                startContent={<FunnelIcon className="w-4 h-4" />}
                            >
                                <SelectItem key="all" value="all">All Status</SelectItem>
                                <SelectItem key="draft" value="draft">Draft</SelectItem>
                                <SelectItem key="processed" value="processed">Processed</SelectItem>
                                <SelectItem key="paid" value="paid">Paid</SelectItem>
                                <SelectItem key="cancelled" value="cancelled">Cancelled</SelectItem>
                            </Select>

                            <Button
                                color="primary"
                                variant="flat"
                                onPress={handleSearch}
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody>
                        <Table aria-label="Payroll records table">
                            <TableHeader>
                                <TableColumn>EMPLOYEE</TableColumn>
                                <TableColumn>PERIOD</TableColumn>
                                <TableColumn>BASIC SALARY</TableColumn>
                                <TableColumn>GROSS SALARY</TableColumn>
                                <TableColumn>DEDUCTIONS</TableColumn>
                                <TableColumn>NET SALARY</TableColumn>
                                <TableColumn>STATUS</TableColumn>
                                <TableColumn>ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {payrolls?.data?.length > 0 ? (
                                    payrolls.data.map((payroll) => (
                                        <TableRow key={payroll.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{payroll.employee?.name}</p>
                                                    <p className="text-xs text-default-500">
                                                        {payroll.employee?.employee_id || 'N/A'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <p>{formatDate(payroll.pay_period_start)}</p>
                                                    <p className="text-xs text-default-500">
                                                        to {formatDate(payroll.pay_period_end)}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatCurrency(payroll.basic_salary)}</TableCell>
                                            <TableCell>{formatCurrency(payroll.gross_salary)}</TableCell>
                                            <TableCell>{formatCurrency(payroll.total_deductions)}</TableCell>
                                            <TableCell>
                                                <span className="font-semibold text-success">
                                                    {formatCurrency(payroll.net_salary)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    color={getStatusColor(payroll.status)}
                                                    size="sm"
                                                    variant="flat"
                                                >
                                                    {payroll.status?.toUpperCase()}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <Dropdown>
                                                    <DropdownTrigger>
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="light"
                                                        >
                                                            <EllipsisVerticalIcon className="w-5 h-5" />
                                                        </Button>
                                                    </DropdownTrigger>
                                                    <DropdownMenu aria-label="Payroll actions">
                                                        <DropdownItem
                                                            key="view"
                                                            startContent={<EyeIcon className="w-4 h-4" />}
                                                            onPress={() => router.visit(route('hrm.payroll.show', payroll.id))}
                                                        >
                                                            View Details
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key="payslip"
                                                            startContent={<DocumentTextIcon className="w-4 h-4" />}
                                                            onPress={() => router.visit(route('hrm.payroll.payslip.view', payroll.id))}
                                                        >
                                                            View Payslip
                                                        </DropdownItem>
                                                        {payroll.status === 'draft' && (
                                                            <>
                                                                <DropdownItem
                                                                    key="edit"
                                                                    startContent={<PencilIcon className="w-4 h-4" />}
                                                                    onPress={() => router.visit(route('hrm.payroll.edit', payroll.id))}
                                                                >
                                                                    Edit
                                                                </DropdownItem>
                                                                <DropdownItem
                                                                    key="process"
                                                                    startContent={<CheckCircleIcon className="w-4 h-4" />}
                                                                    onPress={() => handleProcess(payroll.id)}
                                                                    className="text-success"
                                                                >
                                                                    Process Payroll
                                                                </DropdownItem>
                                                            </>
                                                        )}
                                                        {payroll.status === 'processed' && (
                                                            <>
                                                                <DropdownItem
                                                                    key="generate"
                                                                    startContent={<DocumentTextIcon className="w-4 h-4" />}
                                                                    onPress={() => handleGeneratePayslip(payroll.id)}
                                                                >
                                                                    Generate Payslip
                                                                </DropdownItem>
                                                                <DropdownItem
                                                                    key="email"
                                                                    startContent={<EnvelopeIcon className="w-4 h-4" />}
                                                                    onPress={() => handleSendPayslipEmail(payroll.id)}
                                                                >
                                                                    Send Payslip Email
                                                                </DropdownItem>
                                                                <DropdownItem
                                                                    key="download"
                                                                    startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                                                    onPress={() => window.open(route('hrm.payroll.payslip.download', payroll.id))}
                                                                >
                                                                    Download Payslip
                                                                </DropdownItem>
                                                            </>
                                                        )}
                                                        {payroll.status === 'draft' && (
                                                            <DropdownItem
                                                                key="delete"
                                                                startContent={<TrashIcon className="w-4 h-4" />}
                                                                onPress={() => handleDelete(payroll.id)}
                                                                className="text-danger"
                                                            >
                                                                Delete
                                                            </DropdownItem>
                                                        )}
                                                    </DropdownMenu>
                                                </Dropdown>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8}>
                                            <div className="text-center py-8 text-default-500">
                                                <BanknotesIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p>No payroll records found</p>
                                                <Button
                                                    color="primary"
                                                    variant="flat"
                                                    className="mt-4"
                                                    onPress={() => router.visit(route('hrm.payroll.create'))}
                                                >
                                                    Generate First Payroll
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {payrolls?.last_page > 1 && (
                            <div className="flex justify-center mt-4">
                                <Pagination
                                    total={payrolls.last_page}
                                    initialPage={payrolls.current_page}
                                    onChange={(page) => {
                                        router.get(route('hrm.payroll.index'), {
                                            page,
                                            search,
                                            status: statusFilter !== 'all' ? statusFilter : undefined,
                                        }, {
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    }}
                                />
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </App>
    );
}

