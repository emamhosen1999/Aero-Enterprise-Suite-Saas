import React from 'react';
import { Card, CardBody, CardHeader, Progress, Chip, Button, Skeleton } from '@heroui/react';
import { 
    BanknotesIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

/**
 * Payroll Summary Widget
 * Shows current month payroll overview for HR managers.
 */
export default function PayrollSummaryWidget({ 
    total_payroll = 0,
    total_employees = 0,
    processed_count = 0,
    pending_count = 0,
    current_month = '',
    status = 'pending',
    loading = false,
    manage_url = '/hrm/payroll',
    title = 'Payroll Summary'
}) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const statusConfig = {
        pending: { color: 'warning', label: 'Pending', icon: ClockIcon },
        processing: { color: 'primary', label: 'Processing', icon: DocumentTextIcon },
        completed: { color: 'success', label: 'Completed', icon: CheckCircleIcon },
    };

    const currentStatus = statusConfig[status] || statusConfig.pending;
    const progress = total_employees > 0 ? Math.round((processed_count / total_employees) * 100) : 0;

    if (loading) {
        return (
            <Card className="aero-card">
                <CardHeader className="border-b border-divider p-4">
                    <Skeleton className="h-5 w-36 rounded" />
                </CardHeader>
                <CardBody className="p-4 space-y-4">
                    <div className="text-center">
                        <Skeleton className="h-8 w-32 mx-auto rounded" />
                        <Skeleton className="h-4 w-24 mt-2 mx-auto rounded" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-16 rounded-lg" />
                        <Skeleton className="h-16 rounded-lg" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="aero-card">
            <CardHeader className="border-b border-divider p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <BanknotesIcon className="w-5 h-5 text-success" />
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    <Chip 
                        color={currentStatus.color} 
                        variant="flat" 
                        size="sm"
                        startContent={<currentStatus.icon className="w-3 h-3" />}
                    >
                        {currentStatus.label}
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                {/* Month & Total */}
                <div className="text-center mb-4">
                    <p className="text-xs text-default-500 uppercase tracking-wider">
                        {current_month}
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                        {formatCurrency(total_payroll)}
                    </p>
                    <p className="text-sm text-default-500">
                        Total Payroll
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-success-50 dark:bg-success-900/20 rounded-lg text-center">
                        <p className="text-2xl font-bold text-success">{processed_count}</p>
                        <p className="text-xs text-success-600 dark:text-success-400">Processed</p>
                    </div>
                    <div className="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg text-center">
                        <p className="text-2xl font-bold text-warning">{pending_count}</p>
                        <p className="text-xs text-warning-600 dark:text-warning-400">Pending</p>
                    </div>
                </div>

                {/* Progress */}
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-default-500">Processing Progress</span>
                        <span className="font-semibold">{progress}%</span>
                    </div>
                    <Progress 
                        value={progress}
                        color={status === 'completed' ? 'success' : 'primary'}
                        aria-label="Processing progress"
                    />
                </div>

                <Button
                    as={Link}
                    href={manage_url}
                    variant="flat"
                    color="primary"
                    fullWidth
                    size="sm"
                >
                    Manage Payroll
                </Button>
            </CardBody>
        </Card>
    );
}
