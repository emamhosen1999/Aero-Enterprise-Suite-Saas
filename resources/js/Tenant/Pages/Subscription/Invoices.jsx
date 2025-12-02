import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    Card, 
    CardBody, 
    CardHeader,
    Button,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Pagination,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem
} from '@heroui/react';
import {
    DocumentTextIcon,
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    EllipsisVerticalIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import { showToast } from '@/utils/toastUtils';

/**
 * Invoice List Page
 * 
 * View and manage subscription invoices with download capability.
 */
export default function SubscriptionInvoices({ invoices, pagination }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(pagination?.current_page || 1);

    // Status badge colors
    const statusColors = {
        paid: 'success',
        pending: 'warning',
        failed: 'danger',
        refunded: 'default',
        draft: 'default'
    };

    // Status icons
    const statusIcons = {
        paid: CheckCircleIcon,
        pending: ClockIcon,
        failed: ExclamationCircleIcon,
        refunded: CheckCircleIcon,
        draft: DocumentTextIcon
    };

    // Handle invoice download
    const handleDownload = (invoice) => {
        window.open(`/subscription/invoices/${invoice.id}/download`, '_blank');
        showToast('info', 'Downloading invoice...');
    };

    // Handle invoice view
    const handleView = (invoice) => {
        router.visit(`/subscription/invoices/${invoice.id}`);
    };

    // Filter invoices by search query
    const filteredInvoices = invoices?.filter(invoice => 
        invoice.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <App>
            <Head title="Invoices" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Invoices
                    </h1>
                    <p className="text-default-500">
                        View and download your billing history
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardBody className="text-center">
                            <p className="text-sm text-default-500 mb-1">Total Invoices</p>
                            <p className="text-2xl font-bold">{invoices?.length || 0}</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <p className="text-sm text-default-500 mb-1">Paid</p>
                            <p className="text-2xl font-bold text-success">
                                {invoices?.filter(i => i.status === 'paid').length || 0}
                            </p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <p className="text-sm text-default-500 mb-1">Pending</p>
                            <p className="text-2xl font-bold text-warning">
                                {invoices?.filter(i => i.status === 'pending').length || 0}
                            </p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <p className="text-sm text-default-500 mb-1">Total Amount</p>
                            <p className="text-2xl font-bold text-primary">
                                ${invoices?.reduce((sum, i) => sum + (i.amount || 0), 0).toFixed(2)}
                            </p>
                        </CardBody>
                    </Card>
                </div>

                {/* Invoices Table */}
                <Card>
                    <CardHeader className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold">All Invoices</h2>
                            <p className="text-sm text-default-500 mt-1">
                                Complete billing history
                            </p>
                        </div>
                        <Input
                            placeholder="Search invoices..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                            className="w-64"
                            size="sm"
                        />
                    </CardHeader>
                    <CardBody>
                        {filteredInvoices.length > 0 ? (
                            <Table aria-label="Invoices table">
                                <TableHeader>
                                    <TableColumn>INVOICE</TableColumn>
                                    <TableColumn>DATE</TableColumn>
                                    <TableColumn>DESCRIPTION</TableColumn>
                                    <TableColumn>AMOUNT</TableColumn>
                                    <TableColumn>STATUS</TableColumn>
                                    <TableColumn>ACTIONS</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {filteredInvoices.map((invoice) => {
                                        const StatusIcon = statusIcons[invoice.status] || DocumentTextIcon;
                                        
                                        return (
                                            <TableRow key={invoice.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <DocumentTextIcon className="w-5 h-5 text-default-400" />
                                                        <span className="font-medium">{invoice.number}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(invoice.date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs truncate">
                                                        {invoice.description || 'Subscription payment'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold">${invoice.amount}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        color={statusColors[invoice.status] || 'default'}
                                                        variant="flat"
                                                        size="sm"
                                                        startContent={<StatusIcon className="w-3 h-3" />}
                                                    >
                                                        {invoice.status?.toUpperCase()}
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
                                                        <DropdownMenu aria-label="Invoice actions">
                                                            <DropdownItem
                                                                key="view"
                                                                startContent={<DocumentTextIcon className="w-4 h-4" />}
                                                                onPress={() => handleView(invoice)}
                                                            >
                                                                View Details
                                                            </DropdownItem>
                                                            <DropdownItem
                                                                key="download"
                                                                startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                                                onPress={() => handleDownload(invoice)}
                                                            >
                                                                Download PDF
                                                            </DropdownItem>
                                                        </DropdownMenu>
                                                    </Dropdown>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12">
                                <DocumentTextIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-default-600 mb-2">
                                    No Invoices Found
                                </h3>
                                <p className="text-default-500">
                                    {searchQuery 
                                        ? 'Try adjusting your search query'
                                        : 'Invoices will appear here once you start your subscription'
                                    }
                                </p>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination && pagination.last_page > 1 && (
                            <div className="flex justify-center mt-6">
                                <Pagination
                                    total={pagination.last_page}
                                    page={currentPage}
                                    onChange={(page) => {
                                        setCurrentPage(page);
                                        router.visit(`/subscription/invoices?page=${page}`);
                                    }}
                                />
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Help Text */}
                <Card className="mt-6 bg-primary-50 dark:bg-primary-900/20">
                    <CardBody>
                        <div className="flex items-start gap-3">
                            <DocumentTextIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-primary-800 dark:text-primary-400 mb-1">
                                    Need help with an invoice?
                                </p>
                                <p className="text-sm text-primary-700 dark:text-primary-500">
                                    If you have questions about a specific invoice or need a custom invoice format, 
                                    please contact our billing support team.
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </App>
    );
}
