import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';
import { 
    BriefcaseIcon, 
    PlusIcon,
    ChartBarIcon,
    DocumentArrowUpIcon,
    DocumentArrowDownIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CalendarIcon,
    FunnelIcon,
    AdjustmentsHorizontalIcon,
    UserIcon,
    MapPinIcon
} from "@heroicons/react/24/outline";
import { Head } from "@inertiajs/react";
import App from "@/Layouts/App.jsx";
import DailyWorksTable from '@/Tables/HRM/DailyWorksTable';
import { 
    Card, 
    CardHeader, 
    CardBody, 
    Input, 
    Button,
    Spinner,
    ScrollShadow,
    Skeleton,
    Select,
    SelectItem,
    ButtonGroup
} from "@heroui/react";
import StatsCards from "@/Components/StatsCards.jsx";
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import DailyWorkForm from "@/Forms/HRM/DailyWorkForm.jsx";
import DeleteDailyWorkForm from "@/Forms/HRM/DeleteDailyWorkForm.jsx";
import EnhancedDailyWorksExportForm from "@/Forms/HRM/EnhancedDailyWorksExportForm.jsx";
import DailyWorksUploadForm from "@/Forms/HRM/DailyWorksUploadForm.jsx";



const DailyWorks = ({ auth, title, allData, jurisdictions, users, reports, reports_with_daily_works, overallEndDate, overallStartDate }) => {
    const isLargeScreen = useMediaQuery('(min-width: 1025px)');
    const isMediumScreen = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
    const isMobile = useMediaQuery('(max-width: 640px)');

    // Helper function to convert theme borderRadius to HeroUI radius values
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [modeSwitch, setModeSwitch] = useState(false); // Track mode switching
    const [totalRows, setTotalRows] = useState(0);
    const [lastPage, setLastPage] = useState(0);
    const [filteredData, setFilteredData] = useState([]);
    const [currentRow, setCurrentRow] = useState();
    const [taskIdToDelete, setTaskIdToDelete] = useState(null);
    const [openModalType, setOpenModalType] = useState(null);
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState(30);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Date state management
    const [selectedDate, setSelectedDate] = useState(overallEndDate); // Set to last date
    const [dateRange, setDateRange] = useState({
        start: overallStartDate,
        end: overallEndDate
    });
    
    const renderSelectedBadges = useCallback((selectedIds, options, placeholder, labelKey = 'name') => {
        if (!selectedIds || selectedIds.length === 0) {
            return <span className="text-default-400 text-xs">{placeholder}</span>;
        }

        const normalized = selectedIds.map(String);
        const labels = options
            ?.filter((option) => normalized.includes(String(option.id)))
            .map((option) => option[labelKey]) ?? [];

        if (labels.length === 0) {
            return <span className="text-default-400 text-xs">{placeholder}</span>;
        }

        return (
            <div className="flex flex-wrap gap-1">
                {labels.map((label) => (
                    <span key={label} className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                        {label}
                    </span>
                ))}
            </div>
        );
    }, []);

    const inchargeOptions = useMemo(() => allData?.allInCharges ?? [], [allData?.allInCharges]);
    const jurisdictionOptions = useMemo(() => {
        return jurisdictions?.map((j) => ({
            ...j,
            displayLabel: `${j.start_chainage} - ${j.end_chainage}`,
        })) ?? [];
    }, [jurisdictions]);

    const [filterData, setFilterData] = useState({
        status: 'all',
        incharge: [],
        jurisdiction: [],
        startDate: overallStartDate,
        endDate: overallEndDate
    });

    // Show/Hide advanced filters panel
    const [showFilters, setShowFilters] = useState(false);
    
    // Mobile data fetching - fetch all data for selected date without pagination
    const fetchMobileData = async (showLoader = true) => {
        if (loading) return;
        
        if (showLoader && !modeSwitch) {
            setLoading(true);
        }
        
        try {
            const params = {
                search,
                ...buildFilterParams(),
                startDate: selectedDate,
                endDate: selectedDate,
            };

      
            
            // Use the /daily-works-all endpoint to get all data without pagination
            const response = await axios.get('/daily-works-all', { params });
            
            const dailyWorks = response.data.dailyWorks || [];
            setData(Array.isArray(dailyWorks) ? dailyWorks : []);
            setTotalRows(dailyWorks.length);
            setLastPage(1);
            
         
        } catch (error) {
            console.error('Error fetching mobile data:', error);
            setData([]);
            showToast.error('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    };

    // Desktop data fetching - use pagination for date range
    const fetchDesktopData = async (showLoader = true) => {
        if (loading) return;
        
        if (showLoader && !modeSwitch) {
            setLoading(true);
        }
        
        try {
            const params = {
                search,
                ...buildFilterParams(),
                startDate: dateRange.start,
                endDate: dateRange.end,
                page: currentPage,
                perPage,
            };

        
            
            const response = await axios.get('/daily-works-paginate', { params });
            
            setData(Array.isArray(response.data.data) ? response.data.data : []);
            setTotalRows(response.data.total || 0);
            setLastPage(response.data.last_page || 1);
            
        } catch (error) {
            console.error('Error fetching desktop data:', error);
            setData([]);
            showToast.error('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    };

    // Main fetch function that delegates to mobile or desktop
    const fetchData = async (showLoader = true) => {
        if (isMobile) {
            await fetchMobileData(showLoader);
        } else {
            await fetchDesktopData(showLoader);
        }
    };

    // Enhanced refresh function that handles mobile/desktop modes
    const refreshData = () => {
    
        setCurrentPage(1); // Reset to first page
        fetchData();
        fetchStatistics(); // Also refresh statistics
    };

    // Enhanced event handlers for mobile/desktop differences
    const handleSearch = (event) => {
        setSearch(event.target.value);
        setCurrentPage(1);
        // Will trigger via useEffect
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        // Will trigger via useEffect
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setCurrentPage(1);
        // Will trigger via useEffect
    };

    const handleDateRangeChange = (range) => {
        setDateRange(range);
        setCurrentPage(1);
        // Will trigger via useEffect
    };

    const buildFilterParams = () => {
        const filters = {
            status: filterData.status !== 'all' ? filterData.status : '',
        };

        if (filterData.incharge.length > 0) {
            filters.inCharge = filterData.incharge;
        }

        if (filterData.jurisdiction.length > 0) {
            filters.jurisdiction = filterData.jurisdiction;
        }

        return filters;
    };

    // Fetch additional items if needed after deletion
    const fetchAdditionalItemsIfNeeded = async () => {
        if (data && data.length < perPage && totalRows > data.length) {
            const itemsNeeded = Math.min(perPage - data.length, totalRows - data.length);
            if (itemsNeeded <= 0) return;
            
            setLoading(true);
            try {
                const params = {
                    search,
                    ...buildFilterParams(),
                    startDate: isMobile ? selectedDate : dateRange.start,
                    endDate: isMobile ? selectedDate : dateRange.end,
                    page: currentPage + 1,
                    perPage: itemsNeeded,
                };

                const response = await axios.get('/daily-works-paginate', { params });
                
                if (response.status === 200 && response.data.data) {
                    setData(prevData => {
                        const newItems = response.data.data;
                        return [...prevData, ...newItems];
                    });
                }
            } catch (error) {
                console.error('Error fetching additional items:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDelete = () => {
 
        
        if (!taskIdToDelete) {
            showToast.error('No task selected for deletion');
            return;
        }
        
        setDeleteLoading(true);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
            
                
                // Use axios for delete operation with automatic CSRF handling
                const response = await axios.delete('/delete-daily-work', {
                    data: {
                        id: taskIdToDelete,
                        page: currentPage,
                        perPage,
                    }
                });

                
                // Optimistic update - immediately remove from local state
                const newTotal = Math.max(0, totalRows - 1);
                const remainingOnCurrentPage = data.filter(item => item.id !== taskIdToDelete).length;

                if (remainingOnCurrentPage === 0 && newTotal > 0 && currentPage > 1) {
                    // Navigate to previous page if current page becomes empty
                    const targetPage = currentPage - 1;
                    setCurrentPage(targetPage);
                    // The useEffect will trigger fetchData for the new page
                } else {
                    // Optimistic update - remove item from local state immediately
                    setData(prevData => prevData.filter(item => item.id !== taskIdToDelete));
                    setTotalRows(newTotal);
                    
                    // Calculate new last page
                    const newLastPage = Math.ceil(newTotal / perPage);
                    setLastPage(newLastPage);
                    
                    // Fill page if needed
                    setTimeout(() => fetchAdditionalItemsIfNeeded(), 100);
                }
                
                // Close the modal and reset state
                handleClose();
                
                // Update statistics only
                fetchStatistics();
                
                resolve('Daily work deleted successfully!');
                
            } catch (error) {
                console.error('Delete error:', error);
                
                // On error, refresh data to restore correct state
                fetchData();
                
                if (error.response) {
                    const status = error.response.status;
                    const errorData = error.response.data;
                    
                    if (status === 403) {
                        reject('You do not have permission to delete daily works.');
                    } else if (status === 404) {
                        reject('Daily work not found.');
                    } else if (status === 422 && errorData.message) {
                        reject(errorData.message);
                    } else {
                        reject(`Failed to delete daily work. Status: ${status}`);
                    }
                } else if (error.request) {
                    reject('Network error. Please check your connection.');
                } else {
                    reject(`Failed to delete daily work: ${error.message}`);
                }
            } finally {
                setDeleteLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting daily work...',
            success: (data) => data,
            error: (data) => data,
        });
    };

    const handleClickOpen = (taskId, modalType) => {
        setTaskIdToDelete(taskId);
        setOpenModalType(modalType);
    };

    const handleClose = () => {
        setOpenModalType(null);
        setTaskIdToDelete(null);
    };

    const openModal = (modalType) => {
        setOpenModalType(modalType);
    };

    const closeModal = () => {
        setOpenModalType(null);
    };

    // Optimized success callbacks for forms
    const handleAddSuccess = (newItem) => {

        
        if (newItem) {
            // Optimistic update - add to local state immediately
            setData(prevData => [newItem, ...prevData]);
            setTotalRows(prev => prev + 1);
            
            // Update last page calculation
            const newLastPage = Math.ceil((totalRows + 1) / perPage);
            setLastPage(newLastPage);
            
            // Update statistics
            fetchStatistics();
        } else {
            // Fallback: refresh current page only
            fetchData();
        }
        closeModal();
    };

    const handleEditSuccess = (updatedItem) => {

        
        if (updatedItem) {
            // Optimistic update - update item in local state immediately
            setData(prevData => 
                prevData.map(item => 
                    item.id === updatedItem.id ? { ...item, ...updatedItem } : item
                )
            );
            
            // Update statistics only if status changed
            if (updatedItem.status) {
                fetchStatistics();
            }
        } else {
            // Fallback: refresh current page only
            fetchData();
        }
        closeModal();
    };

    const handleImportSuccess = (importResults) => {
   
        
        // Close the modal first
        closeModal();
        
        // Extract the latest date from import results
        if (importResults && Array.isArray(importResults) && importResults.length > 0) {
            // Find the latest date from all imported sheets
            const importedDates = importResults
                .filter(result => result.date)
                .map(result => result.date);
            
            if (importedDates.length > 0) {
                // Sort dates to find the latest one
                const sortedDates = importedDates.sort((a, b) => new Date(b) - new Date(a));
                const latestImportDate = sortedDates[0];
                
             
                
                // Update date range to include the imported date
                if (isMobile) {
                    // For mobile: set selectedDate to the latest imported date
                    setSelectedDate(latestImportDate);
                } else {
                    // For desktop: update dateRange end if imported date is newer
                    const currentEnd = new Date(dateRange.end);
                    const importDate = new Date(latestImportDate);
                    
                    if (importDate > currentEnd) {
                        setDateRange(prev => ({
                            ...prev,
                            end: latestImportDate
                        }));
                    } else {
                        // If within range, just set end to the imported date to show new data
                        setDateRange(prev => ({
                            ...prev,
                            end: latestImportDate
                        }));
                    }
                }
            }
        }
        
        // Reset to first page and refresh data
        setCurrentPage(1);
        
        // Use setTimeout to ensure state updates have propagated
        setTimeout(() => {
            fetchData(true);
            fetchStatistics();
        }, 100);
    };

    // Simple statistics
    const [apiStats, setApiStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    const fetchStatistics = async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get('/daily-works/statistics');
            setApiStats(response.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            showToast.error('Failed to load statistics');
        } finally {
            setStatsLoading(false);
        }
    };

    // Simple statistics calculation
    const stats = apiStats ? [
        {
            title: 'Total Works',
            value: apiStats.overview?.totalWorks || 0,
            icon: <ChartBarIcon className="w-5 h-5" />,
            color: 'text-blue-600',
            description: `All daily works`
        },
        {
            title: 'Completed',
            value: apiStats.overview?.completedWorks || 0,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: 'text-green-600',
            description: `${apiStats.performanceIndicators?.completionRate || 0}% completion rate`
        },
        {
            title: 'In Progress',
            value: apiStats.overview?.inProgressWorks || 0,
            icon: <ClockIcon className="w-5 h-5" />,
            color: 'text-orange-600',
            description: 'Currently active'
        },
        {
            title: 'Quality Rate',
            value: `${apiStats.performanceIndicators?.qualityRate || 0}%`,
            icon: <DocumentArrowUpIcon className="w-5 h-5" />,
            color: 'text-purple-600',
            description: `${apiStats.qualityMetrics?.passedInspections || 0} passed inspections`
        }
    ] : [
        {
            title: 'Total',
            value: data.length || totalRows,
            icon: <ChartBarIcon className="w-5 h-5" />,
            color: 'text-blue-600',
            description: 'All work logs'
        },
        {
            title: 'Completed',
            value: data.filter(work => work.status === 'completed').length,
            icon: <CheckCircleIcon className="w-5 h-5" />,
            color: 'text-green-600',
            description: 'Finished tasks'
        },
        {
            title: 'Pending',
            value: data.filter(work => work.status === 'new' || work.status === 'resubmission').length,
            icon: <ClockIcon className="w-5 h-5" />,
            color: 'text-orange-600',
            description: 'In progress'
        },
        {
            title: 'Emergency',
            value: data.filter(work => work.status === 'emergency').length,
            icon: <ExclamationTriangleIcon className="w-5 h-5" />,
            color: 'text-red-600',
            description: 'Urgent tasks'
        }
    ];

    // Action buttons configuration
    const actionButtons = [
        {
            label: 'Add Work',
            icon: <PlusIcon className="w-4 h-4" />,
            color: 'primary',
            variant: 'solid',
            onPress: () => openModal('addDailyWork')
        },
        {
            label: 'Import',
            icon: <DocumentArrowUpIcon className="w-4 h-4" />,
            color: 'secondary',
            variant: 'flat',
            onPress: () => openModal('importDailyWorks')
        },
        {
            label: 'Export',
            icon: <DocumentArrowDownIcon className="w-4 h-4" />,
            color: 'success',
            variant: 'flat',
            onPress: () => openModal('exportDailyWorks')
        }
    ];

    // Enhanced useEffect for mobile/desktop mode switching
    useEffect(() => {
   
        
        // When switching to mobile, ensure selectedDate is set (default to end date if not already set)
        if (isMobile && !selectedDate) {
       
            setSelectedDate(overallEndDate);
        }
        
        setModeSwitch(true);
        setCurrentPage(1);
        fetchData(true).finally(() => setModeSwitch(false));
    }, [isMobile]);

    // Debounced data fetching effect for search, filter, pagination
    useEffect(() => {
        // Skip if mode is switching
        if (modeSwitch) return;
        
        // Debounce search, instant for others
        const timeoutId = search ? setTimeout(() => {
            fetchData(false); // No loader for filter/search/pagination
        }, 300) : null;
        
        if (!search) {
            fetchData(false); // Instant for pagination/filter changes
        }
        
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [currentPage, perPage, search, filterData, selectedDate, dateRange, isMobile]);

    // Load statistics on mount
    useEffect(() => {
        fetchStatistics();
    }, []);

    return (
        <>
            <Head title={title} />

            {/* Modals */}
            {openModalType === 'addDailyWork' && (
                <DailyWorkForm
                    modalType="add"
                    open={openModalType === 'addDailyWork'}
                    setData={setData}
                    closeModal={closeModal}
                    onSuccess={handleAddSuccess}
                />
            )}
            {openModalType === 'editDailyWork' && (
                <DailyWorkForm
                    modalType="update"
                    open={openModalType === 'editDailyWork'}
                    currentRow={currentRow}
                    setData={setData}
                    closeModal={closeModal}
                    onSuccess={handleEditSuccess}
                />
            )}
            {openModalType === 'deleteDailyWork' && (
                <DeleteDailyWorkForm
                    open={openModalType === 'deleteDailyWork'}
                    handleClose={handleClose}
                    handleDelete={handleDelete}
                    isLoading={deleteLoading}
                    setData={setData}
                />
            )}
            {openModalType === 'importDailyWorks' && (
                <DailyWorksUploadForm
                    open={openModalType === 'importDailyWorks'}
                    closeModal={closeModal}
                    setData={setData}
                    setTotalRows={setTotalRows}
                    refreshData={refreshData}
                    onSuccess={handleImportSuccess}
                />
            )}
            {openModalType === 'exportDailyWorks' && (
                <EnhancedDailyWorksExportForm
                    open={openModalType === 'exportDailyWorks'}
                    closeModal={closeModal}
                    filterData={filterData}
                    users={users}
                    inCharges={allData.allInCharges}
                />
            )}

            <div className="flex justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-[2000px]"
                >
                    <Card 
                        className="transition-all duration-200"
                        style={{
                            border: `var(--borderWidth, 2px) solid transparent`,
                            borderRadius: `var(--borderRadius, 12px)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                            transform: `scale(var(--scale, 1))`,
                            background: `linear-gradient(135deg, 
                                var(--theme-content1, #FAFAFA) 20%, 
                                var(--theme-content2, #F4F4F5) 10%, 
                                var(--theme-content3, #F1F3F4) 20%)`,
                        }}
                    >
                        {/* Main Card Content */}
                        <CardHeader 
                            className="border-b p-0"
                            style={{
                                borderColor: `var(--theme-divider, #E4E4E7)`,
                                background: `linear-gradient(135deg, 
                                    color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                    color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                            }}
                        >
                            <div className={`${isLargeScreen ? 'p-6' : isMediumScreen ? 'p-4' : 'p-3'} w-full`}>
                                <div className="flex flex-col space-y-4">
                                    {/* Main Header Content */}
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        {/* Title Section */}
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div 
                                                className={`
                                                    ${isLargeScreen ? 'p-3' : isMediumScreen ? 'p-2.5' : 'p-2'} 
                                                    rounded-xl flex items-center justify-center
                                                `}
                                                style={{
                                                    background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                    borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                    borderWidth: `var(--borderWidth, 2px)`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            >
                                                <BriefcaseIcon 
                                                    className={`
                                                        ${isLargeScreen ? 'w-8 h-8' : isMediumScreen ? 'w-6 h-6' : 'w-5 h-5'}
                                                    `}
                                                    style={{ color: 'var(--theme-primary)' }}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 
                                                    className={`
                                                        ${isLargeScreen ? 'text-2xl' : isMediumScreen ? 'text-xl' : 'text-lg'}
                                                        font-bold text-foreground
                                                        ${!isLargeScreen ? 'truncate' : ''}
                                                    `}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                >
                                                    Project Work Management
                                                </h4>
                                                <p 
                                                    className={`
                                                        ${isLargeScreen ? 'text-sm' : 'text-xs'} 
                                                        text-default-500
                                                        ${!isLargeScreen ? 'truncate' : ''}
                                                    `}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                >
                                                    Track daily work progress and project activities
                                                </p>
                                            </div>
                                        </div>
                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                {actionButtons.map((button, index) => (
                                                    <Button
                                                        key={index}
                                                        size={isLargeScreen ? "md" : "sm"}
                                                        variant={button.variant || "flat"}
                                                        color={button.color || "primary"}
                                                        startContent={button.icon}
                                                        onPress={button.onPress}
                                                        className={`${button.className || ''} font-medium`}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                        }}
                                                    >
                                                        {button.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        
                        <CardBody className="pt-6">
                            {/* Quick Stats */}
                            <div className="relative">
                                <StatsCards 
                                    stats={stats} 
                                    onRefresh={fetchStatistics}
                                    isLoading={statsLoading}
                                />
                            </div>
                            
                            {/* Search and Filters Section */}
                            <div className="mb-6">
                                <div className="flex flex-col gap-4">
                                    {/* Search and Filter Toggle Row */}
                                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                        <div className="w-full sm:w-auto sm:min-w-[300px]">
                                            <Input
                                                type="text"
                                                placeholder="Search by description, location, or notes..."
                                                value={search}
                                                onChange={(e) => handleSearch(e)}
                                                variant="bordered"
                                                size={isMobile ? "sm" : "md"}
                                                radius={getThemeRadius()}
                                                startContent={
                                                    <MagnifyingGlassIcon className="w-4 h-4 text-default-400" />
                                                }
                                                classNames={{
                                                    input: "text-foreground",
                                                    inputWrapper: `bg-content2/50 hover:bg-content2/70 
                                                                 focus-within:bg-content2/90 border-divider/50 
                                                                 hover:border-divider data-[focus]:border-primary`,
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            />
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <ButtonGroup 
                                                variant="bordered" 
                                                radius={getThemeRadius()}
                                                className="bg-white/5"
                                            >
                                                <Button
                                                    isIconOnly={isMobile}
                                                    color={showFilters ? 'primary' : 'default'}
                                                    onPress={() => setShowFilters(!showFilters)}
                                                    className={showFilters ? 'bg-primary/20' : 'bg-white/5'}
                                                    aria-label={showFilters ? 'Hide advanced filters' : 'Show advanced filters'}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                >
                                                    <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                                    {!isMobile && <span className="ml-1">Filters</span>}
                                                </Button>
                                            </ButtonGroup>
                                        </div>
                                    </div>
                                    
                                    {/* Advanced Filters Panel */}
                                    <AnimatePresence>
                                        {showFilters && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/10">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        {/* Status Filter */}
                                                        <Select
                                                            label="Status"
                                                            placeholder="Filter by status..."
                                                            selectedKeys={filterData.status ? [filterData.status] : ["all"]}
                                                            onSelectionChange={(keys) => {
                                                                const value = Array.from(keys)[0];
                                                                setFilterData(prev => ({
                                                                    ...prev,
                                                                    status: value
                                                                }));
                                                                setCurrentPage(1);
                                                            }}
                                                            variant="bordered"
                                                            size="sm"
                                                            radius={getThemeRadius()}
                                                            classNames={{
                                                                trigger: "text-sm",
                                                                value: "text-foreground",
                                                            }}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                            aria-label="Filter by status"
                                                        >
                                                            <SelectItem key="all" value="all">All Status</SelectItem>
                                                            <SelectItem key="new" value="new">New</SelectItem>
                                                            <SelectItem key="completed" value="completed">Completed</SelectItem>
                                                            <SelectItem key="resubmission" value="resubmission">Resubmission</SelectItem>
                                                            <SelectItem key="emergency" value="emergency">Emergency</SelectItem>
                                                        </Select>

                                                        {/* In Charge Filter - Only for Admin/Super Admin */}
                                                        {(auth.roles.includes('Administrator') || auth.roles.includes('Super Administrator')) && (
                                                            <Select
                                                                label="In Charge"
                                                                placeholder="Filter by in charge..."
                                                                selectionMode="multiple"
                                                                selectedKeys={new Set(filterData.incharge || [])}
                                                                onSelectionChange={(keys) => {
                                                                    const values = Array.from(keys).filter(key => key !== 'all');
                                                                    setFilterData(prev => ({
                                                                        ...prev,
                                                                        incharge: values,
                                                                        // Reset jurisdiction when incharge changes
                                                                        jurisdiction: values.length ? [] : prev.jurisdiction
                                                                    }));
                                                                    setCurrentPage(1);
                                                                }}
                                                                variant="bordered"
                                                                size="sm"
                                                                radius={getThemeRadius()}
                                                                startContent={<UserIcon className="w-4 h-4 text-default-400" />}
                                                                classNames={{
                                                                    trigger: "text-sm",
                                                                    value: "text-foreground",
                                                                }}
                                                                renderValue={() => renderSelectedBadges(filterData.incharge, inchargeOptions, 'Filter by in charge...')}
                                                                style={{
                                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                                }}
                                                                aria-label="Filter by in charge"
                                                            >
                                                                {inchargeOptions?.map(inCharge => (
                                                                    <SelectItem key={String(inCharge.id)} value={String(inCharge.id)}>
                                                                        {inCharge.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </Select>
                                                        )}

                                                        {/* Jurisdiction Filter - Only for Admin/Super Admin */}
                                                        {(auth.roles.includes('Administrator') || auth.roles.includes('Super Administrator')) && (
                                                            <Select
                                                                label="Jurisdiction"
                                                                placeholder="Filter by jurisdiction..."
                                                                selectionMode="multiple"
                                                                selectedKeys={new Set(filterData.jurisdiction || [])}
                                                                onSelectionChange={(keys) => {
                                                                    const values = Array.from(keys).filter(key => key !== 'all');
                                                                    setFilterData(prev => ({
                                                                        ...prev,
                                                                        jurisdiction: values,
                                                                        // Reset incharge when jurisdiction is selected
                                                                        incharge: values.length ? [] : prev.incharge
                                                                    }));
                                                                    setCurrentPage(1);
                                                                }}
                                                                variant="bordered"
                                                                size="sm"
                                                                radius={getThemeRadius()}
                                                                startContent={<MapPinIcon className="w-4 h-4 text-default-400" />}
                                                                classNames={{
                                                                    trigger: "text-sm",
                                                                    value: "text-foreground",
                                                                }}
                                                                renderValue={() => renderSelectedBadges(filterData.jurisdiction, jurisdictionOptions, 'Filter by jurisdiction...', 'displayLabel')}
                                                                style={{
                                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                                }}
                                                                aria-label="Filter by jurisdiction"
                                                            >
                                                                {jurisdictionOptions?.map(jurisdiction => (
                                                                    <SelectItem key={String(jurisdiction.id)} value={String(jurisdiction.id)}>
                                                                        {jurisdiction.displayLabel}
                                                                    </SelectItem>
                                                                ))}
                                                            </Select>
                                                        )}

                                                        {/* Clear Filters Button */}
                                                        <div className="flex items-end">
                                                            <Button
                                                                size="sm"
                                                                variant="flat"
                                                                color="danger"
                                                                onPress={() => {
                                                                    setFilterData({
                                                                        status: 'all',
                                                                        incharge: [],
                                                                        jurisdiction: [],
                                                                        startDate: overallStartDate,
                                                                        endDate: overallEndDate
                                                                    });
                                                                    setCurrentPage(1);
                                                                }}
                                                                style={{
                                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                                }}
                                                            >
                                                                Clear Filters
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Date Selector Section */}
                            <div className="mb-6">
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="w-5 h-5 text-default-500" />
                                            <span className="text-sm font-medium text-foreground">
                                                {isMobile ? 'Select Date:' : 'Date Range:'}
                                            </span>
                                        </div>
                                        
                                        {isMobile ? (
                                            // Mobile: Single date picker for current date
                                            <div className="w-full sm:w-auto">
                                                <Input
                                                    type="date"
                                                    value={selectedDate}
                                                    onChange={(e) => handleDateChange(e.target.value)}
                                                    variant="bordered"
                                                    size="sm"
                                                    radius={getThemeRadius()}
                                                    min={overallStartDate}
                                                    max={overallEndDate}
                                                    classNames={{
                                                        input: "text-foreground",
                                                        inputWrapper: `bg-content2/50 hover:bg-content2/70 
                                                                     focus-within:bg-content2/90 border-divider/50 
                                                                     hover:border-divider data-[focus]:border-primary`,
                                                    }}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                            />
                                        </div>
                                    ) : (
                                        // Desktop: Date range picker
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                type="date"
                                                label="Start Date"
                                                value={dateRange.start}
                                                onChange={(e) => handleDateRangeChange({
                                                    ...dateRange,
                                                    start: e.target.value
                                                })}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                min={overallStartDate}
                                                max={overallEndDate}
                                                classNames={{
                                                    input: "text-foreground",
                                                    inputWrapper: `bg-content2/50 hover:bg-content2/70 
                                                                 focus-within:bg-content2/90 border-divider/50 
                                                                 hover:border-divider data-[focus]:border-primary`,
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            />
                                            <span className="text-default-500">to</span>
                                            <Input
                                                type="date"
                                                label="End Date"
                                                value={dateRange.end}
                                                onChange={(e) => handleDateRangeChange({
                                                    ...dateRange,
                                                    end: e.target.value
                                                })}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                min={overallStartDate}
                                                max={overallEndDate}
                                                classNames={{
                                                    input: "text-foreground",
                                                    inputWrapper: `bg-content2/50 hover:bg-content2/70 
                                                                 focus-within:bg-content2/90 border-divider/50 
                                                                 hover:border-divider data-[focus]:border-primary`,
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Daily Works Table */}
                            <Card 
                                radius={getThemeRadius()}
                                className="bg-content2/50 backdrop-blur-md border border-divider/30"
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    backgroundColor: 'var(--theme-content2)',
                                    borderColor: 'var(--theme-divider)',
                                }}
                            >
                                <CardBody className="p-4">
                                    <DailyWorksTable
                                        setData={setData}
                                        filteredData={filteredData}
                                        setFilteredData={setFilteredData}
                                        reports={reports}
                                        setCurrentRow={setCurrentRow}
                                        currentPage={currentPage}
                                        setCurrentPage={setCurrentPage}
                                        onPageChange={handlePageChange}
                                        setLoading={setLoading}
                                        refreshStatistics={fetchStatistics}
                                        handleClickOpen={handleClickOpen}
                                        openModal={openModal}
                                        juniors={allData.juniors}
                                        totalRows={totalRows}
                                        lastPage={lastPage}
                                        loading={loading || modeSwitch}
                                        allData={data}
                                        allInCharges={allData.allInCharges}
                                        jurisdictions={jurisdictions}
                                        users={users}
                                        reports_with_daily_works={reports_with_daily_works}
                                        isMobile={isMobile}
                                    />
                                </CardBody>
                            </Card>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

DailyWorks.layout = (page) => <App>{page}</App>;

export default DailyWorks;
