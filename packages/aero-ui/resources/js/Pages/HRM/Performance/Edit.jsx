import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { Button, Input, Select, SelectItem, Textarea, Card, CardBody, CardHeader } from "@heroui/react";
import { 
    PencilIcon,
    ArrowLeftIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import axios from 'axios';

const EditPerformanceReview = ({ review, employees, reviewers, departments, templates }) => {
    const themeRadius = useThemeRadius();
    const { canUpdate, isSuperAdmin } = useHRMAC();
    const canUpdateReview = canUpdate('hrm.performance.reviews') || isSuperAdmin();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        employee_id: review?.employee_id?.toString() || '',
        reviewer_id: review?.reviewer_id?.toString() || '',
        template_id: review?.template_id?.toString() || '',
        review_period_start: review?.review_period_start || '',
        review_period_end: review?.review_period_end || '',
        review_date: review?.review_date || '',
        department_id: review?.department_id?.toString() || '',
        status: review?.status || 'scheduled',
        notes: review?.notes || ''
    });
    const [errors, setErrors] = useState({});

    // Responsive state management
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const handleInputChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: null }));
        }
    };

    const handleUpdate = async () => {
        // Basic validation
        if (!formData.employee_id) {
            setErrors({ employee_id: 'Employee is required' });
            showToast.error('Please select an employee');
            return;
        }
        if (!formData.reviewer_id) {
            setErrors({ reviewer_id: 'Reviewer is required' });
            showToast.error('Please select a reviewer');
            return;
        }
        if (!formData.department_id) {
            setErrors({ department_id: 'Department is required' });
            showToast.error('Please select a department');
            return;
        }
        
        setLoading(true);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.put(route('hrm.performance.update', review.id), formData);
                if (response.status === 200) {
                    resolve(['Performance review updated successfully']);
                    setTimeout(() => {
                        router.visit(route('hrm.performance.index'));
                    }, 1000);
                }
            } catch (error) {
                if (error.response?.status === 422) {
                    setErrors(error.response.data.errors || {});
                }
                reject([error.response?.data?.message || 'Failed to update performance review']);
            }
        });
        
        showToast.promise(promise, {
            loading: 'Updating performance review...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
        
        setLoading(false);
    };

    const handleCancel = () => {
        router.visit(route('hrm.performance.index'));
    };

    return (
        <>
            <Head title="Edit Performance Review" />
            
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Edit Performance Review">
                <div className="space-y-4">
                    <div className="w-full">
                        <Card className="transition-all duration-200">
                            <CardHeader className="border-b p-0" style={{ borderColor: `var(--theme-divider, #E4E4E7)` }}>
                                <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        {/* Title Section */}
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                style={{
                                                    background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            >
                                                <PencilIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                    style={{ color: 'var(--theme-primary)' }} />
                                            </div>
                                            <div>
                                                <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                    Edit Performance Review
                                                </h4>
                                                <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                    Update performance review details for {review?.employee?.name}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex gap-2 flex-wrap">
                                            <Button
                                                variant="flat"
                                                startContent={<ArrowLeftIcon className="w-4 h-4" />}
                                                onPress={handleCancel}
                                                size={isMobile ? "sm" : "md"}
                                            >
                                                Back
                                            </Button>
                                            {canUpdateReview && (
                                            <Button
                                                color="primary"
                                                variant="shadow"
                                                startContent={<PencilIcon className="w-4 h-4" />}
                                                onPress={handleUpdate}
                                                isLoading={loading}
                                                size={isMobile ? "sm" : "md"}
                                            >
                                                Update Review
                                            </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Employee Selection */}
                                    <Select
                                        label="Employee"
                                        placeholder="Select employee"
                                        selectedKeys={formData.employee_id ? [formData.employee_id] : []}
                                        onSelectionChange={(keys) => handleInputChange('employee_id', Array.from(keys)[0])}
                                        radius={themeRadius}
                                        isRequired
                                        isInvalid={!!errors.employee_id}
                                        errorMessage={errors.employee_id}
                                        classNames={{ trigger: "bg-default-100" }}
                                    >
                                        {employees?.map(emp => (
                                            <SelectItem key={String(emp.id)} value={String(emp.id)}>
                                                {emp.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                    
                                    {/* Reviewer Selection */}
                                    <Select
                                        label="Reviewer"
                                        placeholder="Select reviewer"
                                        selectedKeys={formData.reviewer_id ? [formData.reviewer_id] : []}
                                        onSelectionChange={(keys) => handleInputChange('reviewer_id', Array.from(keys)[0])}
                                        radius={themeRadius}
                                        isRequired
                                        isInvalid={!!errors.reviewer_id}
                                        errorMessage={errors.reviewer_id}
                                        classNames={{ trigger: "bg-default-100" }}
                                    >
                                        {reviewers?.map(reviewer => (
                                            <SelectItem key={String(reviewer.id)} value={String(reviewer.id)}>
                                                {reviewer.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                    
                                    {/* Department Selection */}
                                    <Select
                                        label="Department"
                                        placeholder="Select department"
                                        selectedKeys={formData.department_id ? [formData.department_id] : []}
                                        onSelectionChange={(keys) => handleInputChange('department_id', Array.from(keys)[0])}
                                        radius={themeRadius}
                                        isRequired
                                        isInvalid={!!errors.department_id}
                                        errorMessage={errors.department_id}
                                        classNames={{ trigger: "bg-default-100" }}
                                    >
                                        {departments?.map(dept => (
                                            <SelectItem key={String(dept.id)} value={String(dept.id)}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                    
                                    {/* Template Selection */}
                                    <Select
                                        label="Review Template"
                                        placeholder="Select template"
                                        selectedKeys={formData.template_id ? [formData.template_id] : []}
                                        onSelectionChange={(keys) => handleInputChange('template_id', Array.from(keys)[0])}
                                        radius={themeRadius}
                                        isInvalid={!!errors.template_id}
                                        errorMessage={errors.template_id}
                                        classNames={{ trigger: "bg-default-100" }}
                                    >
                                        {templates?.map(template => (
                                            <SelectItem key={String(template.id)} value={String(template.id)}>
                                                {template.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                    
                                    {/* Review Period Start */}
                                    <Input
                                        type="date"
                                        label="Review Period Start"
                                        value={formData.review_period_start}
                                        onValueChange={(value) => handleInputChange('review_period_start', value)}
                                        radius={themeRadius}
                                        isInvalid={!!errors.review_period_start}
                                        errorMessage={errors.review_period_start}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />
                                    
                                    {/* Review Period End */}
                                    <Input
                                        type="date"
                                        label="Review Period End"
                                        value={formData.review_period_end}
                                        onValueChange={(value) => handleInputChange('review_period_end', value)}
                                        radius={themeRadius}
                                        isInvalid={!!errors.review_period_end}
                                        errorMessage={errors.review_period_end}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />
                                    
                                    {/* Review Date */}
                                    <Input
                                        type="date"
                                        label="Review Date"
                                        value={formData.review_date}
                                        onValueChange={(value) => handleInputChange('review_date', value)}
                                        radius={themeRadius}
                                        isInvalid={!!errors.review_date}
                                        errorMessage={errors.review_date}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />
                                    
                                    {/* Status */}
                                    <Select
                                        label="Status"
                                        placeholder="Select status"
                                        selectedKeys={formData.status ? [formData.status] : []}
                                        onSelectionChange={(keys) => handleInputChange('status', Array.from(keys)[0])}
                                        radius={themeRadius}
                                        isInvalid={!!errors.status}
                                        errorMessage={errors.status}
                                        classNames={{ trigger: "bg-default-100" }}
                                    >
                                        <SelectItem key="scheduled" value="scheduled">Scheduled</SelectItem>
                                        <SelectItem key="in_progress" value="in_progress">In Progress</SelectItem>
                                        <SelectItem key="completed" value="completed">Completed</SelectItem>
                                        <SelectItem key="cancelled" value="cancelled">Cancelled</SelectItem>
                                    </Select>
                                </div>
                                
                                {/* Notes - Full Width */}
                                <div className="mt-6">
                                    <Textarea
                                        label="Notes"
                                        placeholder="Enter any additional notes..."
                                        value={formData.notes}
                                        onValueChange={(value) => handleInputChange('notes', value)}
                                        radius={themeRadius}
                                        minRows={3}
                                        isInvalid={!!errors.notes}
                                        errorMessage={errors.notes}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

EditPerformanceReview.layout = (page) => <App children={page} />;
export default EditPerformanceReview;