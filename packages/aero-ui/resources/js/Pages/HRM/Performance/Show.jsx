import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";
import { 
    EyeIcon,
    ArrowLeftIcon,
    PencilIcon,
    CalendarDaysIcon,
    UserIcon,
    DocumentTextIcon,
    BriefcaseIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const ShowPerformanceReview = ({ review }) => {
    const themeRadius = useThemeRadius();

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

    const handleBack = () => {
        window.history.back();
    };

    const handleEdit = () => {
        window.location.href = route('hrm.performance.edit', review.id);
    };

    const getStatusColor = (status) => {
        const statusColors = {
            scheduled: 'warning',
            in_progress: 'primary', 
            completed: 'success',
            cancelled: 'danger'
        };
        return statusColors[status] || 'default';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
        });
    };

    const formatStatus = (status) => {
        return status?.replace('_', ' ').split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ') || 'N/A';
    };

    return (
        <>
            <Head title={`Performance Review - ${review?.employee?.name || 'Details'}`} />
            
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Performance Review Details">
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
                                                <EyeIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                    style={{ color: 'var(--theme-primary)' }} />
                                            </div>
                                            <div>
                                                <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                    Performance Review Details
                                                </h4>
                                                <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                    Review information for {review?.employee?.name || 'Unknown Employee'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex gap-2 flex-wrap">
                                            <Button
                                                variant="flat"
                                                startContent={<ArrowLeftIcon className="w-4 h-4" />}
                                                onPress={handleBack}
                                                size={isMobile ? "sm" : "md"}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                color="primary"
                                                variant="shadow"
                                                startContent={<PencilIcon className="w-4 h-4" />}
                                                onPress={handleEdit}
                                                size={isMobile ? "sm" : "md"}
                                            >
                                                Edit Review
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6">
                                <div className="space-y-8">
                                    {/* Basic Information Section */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <UserIcon className="w-5 h-5 text-primary" />
                                            <h5 className="text-lg font-semibold">Basic Information</h5>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div>
                                                <label className="text-sm font-medium text-default-600 mb-1 block">
                                                    Employee
                                                </label>
                                                <div className="text-base font-medium">
                                                    {review?.employee?.name || 'N/A'}
                                                </div>
                                                <div className="text-sm text-default-500">
                                                    {review?.employee?.email || ''}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="text-sm font-medium text-default-600 mb-1 block">
                                                    Department
                                                </label>
                                                <div className="text-base">
                                                    {review?.department?.name || 'N/A'}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-default-600 mb-1 block">
                                                    Reviewer
                                                </label>
                                                <div className="text-base">
                                                    {review?.reviewer?.name || 'N/A'}
                                                </div>
                                                <div className="text-sm text-default-500">
                                                    {review?.reviewer?.email || ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Divider />

                                    {/* Review Details Section */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <BriefcaseIcon className="w-5 h-5 text-primary" />
                                            <h5 className="text-lg font-semibold">Review Details</h5>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div>
                                                <label className="text-sm font-medium text-default-600 mb-1 block">
                                                    Review Template
                                                </label>
                                                <div className="text-base">
                                                    {review?.template?.name || 'N/A'}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-default-600 mb-1 block">
                                                    Status
                                                </label>
                                                <Chip 
                                                    color={getStatusColor(review?.status)}
                                                    variant="flat"
                                                    size="sm"
                                                >
                                                    {formatStatus(review?.status)}
                                                </Chip>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-default-600 mb-1 block">
                                                    Overall Score
                                                </label>
                                                <div className="text-base">
                                                    {review?.overall_score || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Divider />

                                    {/* Timeline Section */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <CalendarDaysIcon className="w-5 h-5 text-primary" />
                                            <h5 className="text-lg font-semibold">Timeline</h5>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="text-sm font-medium text-default-600 mb-1 block">
                                                    Review Period Start
                                                </label>
                                                <div className="text-base">
                                                    {formatDate(review?.review_period_start)}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-default-600 mb-1 block">
                                                    Review Period End
                                                </label>
                                                <div className="text-base">
                                                    {formatDate(review?.review_period_end)}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-default-600 mb-1 block">
                                                    Review Date
                                                </label>
                                                <div className="text-base">
                                                    {formatDate(review?.review_date)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes Section */}
                                    {review?.notes && (
                                        <>
                                            <Divider />
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <DocumentTextIcon className="w-5 h-5 text-primary" />
                                                    <h5 className="text-lg font-semibold">Notes</h5>
                                                </div>
                                                <Card className="bg-default-50 border-none">
                                                    <CardBody className="p-4">
                                                        <p className="text-sm whitespace-pre-wrap">
                                                            {review.notes}
                                                        </p>
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        </>
                                    )}

                                    {/* Timestamps */}
                                    <Divider />
                                    <div className="flex flex-col sm:flex-row justify-between gap-4 text-xs text-default-400">
                                        <div>
                                            Created: {formatDate(review?.created_at)}
                                        </div>
                                        <div>
                                            Last Updated: {formatDate(review?.updated_at)}
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

ShowPerformanceReview.layout = (page) => <App children={page} />;
export default ShowPerformanceReview;