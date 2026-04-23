import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Select,
    SelectItem,
    Textarea,
    DatePicker,
    Chip
} from "@heroui/react";
import {
    PlusIcon,
    CurrencyDollarIcon,
    CalendarDaysIcon,
    DocumentTextIcon,
    ArrowLeftIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { showToast } from '@/utils/ui/toastUtils';
import { router } from '@inertiajs/react';

const CreatePayroll = ({ title, employees, allowanceTypes, deductionTypes }) => {
    const themeRadius = useThemeRadius();
    const { auth } = usePage().props;
    const { canCreate, isSuperAdmin } = useHRMAC();
    const canCreatePayroll = canCreate('hrm.payroll') || isSuperAdmin();
    
    // Form state
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
        pay_period_start: '',
        pay_period_end: '',
        basic_salary: '',
        working_days: 30,
        present_days: 30,
        absent_days: 0,
        leave_days: 0,
        overtime_hours: 0,
        allowances: [],
        deductions: [],
        remarks: ''
    });
    
    // Responsive breakpoints
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);
    
    // Calculate days automatically
    useEffect(() => {
        if (data.pay_period_start && data.pay_period_end) {
            const startDate = new Date(data.pay_period_start);
            const endDate = new Date(data.pay_period_end);
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            setData(prev => ({
                ...prev,
                working_days: Math.min(diffDays, 31),
                present_days: Math.min(diffDays, 31),
                absent_days: 0,
                leave_days: 0
            }));
        }
    }, [data.pay_period_start, data.pay_period_end]);
    
    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        const promise = new Promise((resolve, reject) => {
            post(route('hrm.payroll.store'), {
                onSuccess: (page) => {
                    resolve([page.props.flash?.message || 'Payroll created successfully']);
                    // Redirect to payroll index
                    router.visit(route('hrm.payroll.index'));
                },
                onError: (errors) => {
                    reject(Object.values(errors).flat());
                }
            });
        });
        
        showToast.promise(promise, {
            loading: 'Creating payroll...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };
    
    return (
        <>
            <Head title={title || 'Create Payroll'} />
            
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Create Payroll">
                <div className="space-y-4">
                    <div className="w-full">
                        {/* Page Header */}
                        <Card className="mb-6">
                            <CardHeader className="border-b border-divider p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-primary/20">
                                            <CurrencyDollarIcon className="w-8 h-8 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-bold">Create Payroll</h4>
                                            <p className="text-sm text-default-500">Generate new payroll for employee</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="flat"
                                        startContent={<ArrowLeftIcon className="w-4 h-4" />}
                                        onPress={() => router.visit(route('hrm.payroll.index'))}
                                    >
                                        Back to Payroll
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>
                        
                        {/* Create Form */}
                        <Card>
                            <CardBody className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Employee Selection */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select
                                            label="Employee"
                                            placeholder="Select employee"
                                            selectedKeys={data.user_id ? [String(data.user_id)] : []}
                                            onSelectionChange={(keys) => setData('user_id', Array.from(keys)[0])}
                                            isInvalid={!!errors.user_id}
                                            errorMessage={errors.user_id}
                                            isRequired
                                            radius={themeRadius}
                                        >
                                            {employees?.map(emp => (
                                                <SelectItem key={String(emp.id)} textValue={emp.name}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{emp.name}</span>
                                                        <span className="text-xs text-default-500">{emp.email}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </Select>
                                        
                                        <Input
                                            type="number"
                                            label="Basic Salary"
                                            placeholder="Enter basic salary"
                                            value={data.basic_salary}
                                            onValueChange={(value) => setData('basic_salary', value)}
                                            isInvalid={!!errors.basic_salary}
                                            errorMessage={errors.basic_salary}
                                            isRequired
                                            radius={themeRadius}
                                            startContent={<span className="text-default-400">$</span>}
                                        />
                                    </div>
                                    
                                    {/* Pay Period */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            type="date"
                                            label="Pay Period Start"
                                            value={data.pay_period_start}
                                            onChange={(e) => setData('pay_period_start', e.target.value)}
                                            isInvalid={!!errors.pay_period_start}
                                            errorMessage={errors.pay_period_start}
                                            isRequired
                                            radius={themeRadius}
                                        />
                                        
                                        <Input
                                            type="date"
                                            label="Pay Period End"
                                            value={data.pay_period_end}
                                            onChange={(e) => setData('pay_period_end', e.target.value)}
                                            isInvalid={!!errors.pay_period_end}
                                            errorMessage={errors.pay_period_end}
                                            isRequired
                                            radius={themeRadius}
                                        />
                                    </div>
                                    
                                    {/* Attendance */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <Input
                                            type="number"
                                            label="Working Days"
                                            value={String(data.working_days)}
                                            onValueChange={(value) => setData('working_days', parseInt(value) || 0)}
                                            isInvalid={!!errors.working_days}
                                            errorMessage={errors.working_days}
                                            radius={themeRadius}
                                        />
                                        
                                        <Input
                                            type="number"
                                            label="Present Days"
                                            value={String(data.present_days)}
                                            onValueChange={(value) => setData('present_days', parseInt(value) || 0)}
                                            isInvalid={!!errors.present_days}
                                            errorMessage={errors.present_days}
                                            radius={themeRadius}
                                        />
                                        
                                        <Input
                                            type="number"
                                            label="Absent Days"
                                            value={String(data.absent_days)}
                                            onValueChange={(value) => setData('absent_days', parseInt(value) || 0)}
                                            isInvalid={!!errors.absent_days}
                                            errorMessage={errors.absent_days}
                                            radius={themeRadius}
                                        />
                                        
                                        <Input
                                            type="number"
                                            label="Leave Days"
                                            value={String(data.leave_days)}
                                            onValueChange={(value) => setData('leave_days', parseInt(value) || 0)}
                                            isInvalid={!!errors.leave_days}
                                            errorMessage={errors.leave_days}
                                            radius={themeRadius}
                                        />
                                    </div>
                                    
                                    {/* Overtime */}
                                    <Input
                                        type="number"
                                        step="0.5"
                                        label="Overtime Hours"
                                        placeholder="Enter overtime hours"
                                        value={String(data.overtime_hours)}
                                        onValueChange={(value) => setData('overtime_hours', parseFloat(value) || 0)}
                                        isInvalid={!!errors.overtime_hours}
                                        errorMessage={errors.overtime_hours}
                                        radius={themeRadius}
                                        className="max-w-sm"
                                    />
                                    
                                    {/* Remarks */}
                                    <Textarea
                                        label="Remarks"
                                        placeholder="Add any remarks or notes..."
                                        value={data.remarks}
                                        onValueChange={(value) => setData('remarks', value)}
                                        isInvalid={!!errors.remarks}
                                        errorMessage={errors.remarks}
                                        radius={themeRadius}
                                        rows={3}
                                    />
                                    
                                    {/* Submit Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            type="button"
                                            variant="flat"
                                            onPress={() => router.visit(route('hrm.payroll.index'))}
                                            isDisabled={processing}
                                        >
                                            Cancel
                                        </Button>
                                        {canCreatePayroll && (
                                        <Button
                                            type="submit"
                                            color="primary"
                                            variant="shadow"
                                            startContent={<DocumentTextIcon className="w-4 h-4" />}
                                            isLoading={processing}
                                        >
                                            Create Payroll
                                        </Button>
                                        )}
                                    </div>
                                </form>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

CreatePayroll.layout = (page) => <App children={page} />;
export default CreatePayroll;