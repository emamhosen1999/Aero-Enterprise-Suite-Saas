import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Head, usePage} from '@inertiajs/react';
import dayjs from 'dayjs';
import {useMediaQuery} from '@/Hooks/useMediaQuery.js';
import {Button, Card, CardBody, CardHeader, Divider, Select, SelectItem} from "@heroui/react";
import {
    ArrowPathIcon,
    CalendarIcon,
    ChartBarIcon,
    PlusIcon,
    PresentationChartLineIcon
} from "@heroicons/react/24/outline";
import {XCircleIcon as XCircleSolid} from '@heroicons/react/24/solid';
import {motion} from "framer-motion";
import App from '@/Layouts/App.jsx';

import LeaveEmployeeTable from '@/Tables/HRM/LeaveEmployeeTable.jsx';
import LeaveForm from '@/Forms/HRM/LeaveForm.jsx';
import DeleteLeaveForm from '@/Forms/HRM/DeleteLeaveForm.jsx';
import BulkLeaveModal from '@/Components/HRM/BulkLeave/BulkLeaveModal.jsx';
import BulkDeleteModal from '@/Components/HRM/BulkDelete/BulkDeleteModal.jsx';
import {showToast} from '@/utils/toastUtils.jsx';
import axios from 'axios';

const LeavesEmployee = ({ title, allUsers }) => {
  const { auth } = usePage().props;

  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
    const [totalRows, setTotalRows] = useState(0);
      const [lastPage, setLastPage] = useState(0);
  // State management
  const [loading, setLoading] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [leavesData, setLeavesData] = useState({ 
    leaveTypes: [], 
    leaveCountsByUser: {} 
  });
    // Table-level loading spinner
  const [tableLoading, setTableLoading] = useState(false);

  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ 
    page: 1, 
    perPage: 30, 
    total: 0, 
    lastPage: 0 
  });
  const [filters, setFilters] = useState({ 
    employee: '', 
    selectedMonth: dayjs().format('YYYY-MM'),
    year: new Date().getFullYear() 
  });

  const [isLargeScreen, setIsLargeScreen] = useState(false);
      const [isMediumScreen, setIsMediumScreen] = useState(false);
     
         
      
      useEffect(() => {
          const checkScreenSize = () => {
              
              setIsLargeScreen(window.innerWidth >= 1025);
              setIsMediumScreen(window.innerWidth >= 641 && window.innerWidth <= 1024);
          };
          
          checkScreenSize();
          window.addEventListener('resize', checkScreenSize);
          return () => window.removeEventListener('resize', checkScreenSize);
      }, []);
  // Function to update pagination metadata
  const updatePaginationMetadata = useCallback((metadata) => {
    if (metadata) {
      setTotalRows(metadata.total || 0);
      setLastPage(metadata.last_page || 1);
      setPagination(prev => ({
        ...prev,
        total: metadata.total || 0,
        lastPage: metadata.last_page || 1
      }));
    }
  }, []);
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

   // Fetch leaves data with error handling
  const fetchLeaves = useCallback(async () => {
 setTableLoading(true); // Use tableLoading for table refresh
    try {
      const { page, perPage } = pagination;
      const { year } = filters;
      
      
      const response = await axios.get(route('leaves.paginate'), {
        params: { 
          page, 
          perPage, 
          year,
          user_id: auth.user.id // Explicitly pass the current user ID
        },
        timeout: 10000, // 10 second timeout
      });

      if (response.status === 200) {
        const { leaves, leavesData } = response.data;

        if (leaves.data && Array.isArray(leaves.data)) {
                setLeaves(leaves.data);
                // Update pagination metadata
                updatePaginationMetadata({
                  total: leaves.total || leaves.data.length,
                  last_page: leaves.last_page || 1,
                  current_page: leaves.current_page || 1,
                  per_page: leaves.per_page || pagination.perPage
                });
            } else if (Array.isArray(leaves)) {
                // Handle direct array response
                setLeaves(leaves);
                updatePaginationMetadata({
                  total: leaves.length,
                  last_page: 1,
                  current_page: 1,
                  per_page: pagination.perPage
                });
            } else {
                console.error('Unexpected leaves data format:', leaves);
                setLeaves([]);
                updatePaginationMetadata({
                  total: 0,
                  last_page: 1,
                  current_page: 1,
                  per_page: pagination.perPage
                });
            }
            
            setLeavesData(leavesData);
            setError('');
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      if (error.response?.status === 404) {
        const { leavesData } = error.response.data;
        setLeavesData(leavesData);
        setError(error.response?.data?.message || 'No leaves found for the selected criteria.');
      } else {
        setError('Error retrieving leaves data. Please try again.');
        
        // Use toast promise pattern for safety
        const promise = Promise.reject('Failed to load leave data. Please try again.');
        showToast.promise(
          promise,
          {
            error: {
              render() {
                return <div>Failed to load leave data. Please try again.</div>;
              },
              icon: '❌'
            }
          }
        );
      }
      setLeaves([]);
      updatePaginationMetadata({
        total: 0,
        last_page: 1,
        current_page: 1,
        per_page: pagination.perPage
      });
    } finally {
 setTableLoading(false); // Reset tableLoading
    }
  }, [pagination.page, pagination.perPage, filters, auth.user.id, updatePaginationMetadata]);

  // Function to fetch additional items if needed after operations
  const fetchAdditionalItemsIfNeeded = useCallback((currentItems, totalItems, operation) => {
    const { page, perPage } = pagination;
    
    // If we're not on the last page, or we have exactly enough items to fill the current page,
    // we don't need to fetch more data
    if (currentItems.length >= perPage || page < lastPage) {
      return;
    }
    
    // If we're on the last page and have fewer items than perPage after an operation,
    // fetch new data to fill the gap
    fetchLeaves();
  }, [pagination, lastPage, fetchLeaves]);

  
 // Memoized year options
  // Memoized year options following ISO standard (1900-current year)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1900 + 1 }, (_, index) => {
      const year = 1900 + index;
      return { key: year.toString(), label: year.toString(), value: year };
    }).reverse();
  }, []);

  // Filter change handler with ISO-compliant validation
  const handleFilterChange = useCallback((filterKey, filterValue) => {
    // Validate year input according to ISO 8601
    if (filterKey === 'year') {
      const year = Number(filterValue);
      if (year < 1900 || year > new Date().getFullYear()) {
        console.warn('Invalid year selected. Must be between 1900 and current year.');
        return;
      }
    }

    setFilters(previousFilters => ({ 
      ...previousFilters, 
      [filterKey]: filterValue 
    }));

    // Reset pagination when year filter changes
    if (filterKey === 'year') {
      setPagination(previousPagination => ({ 
        ...previousPagination, 
        page: 1 
      }));
    }
  }, []);

  // Modal state
  const [modalStates, setModalStates] = useState({
    add_leave: false,
    edit_leave: false,
    delete_leave: false,
    bulk_leave: false,
    bulk_delete: false,
  });

  // Modal handlers
  const handleOpenModal = useCallback((modalType, itemId = null) => {
    setModalStates(prev => ({ ...prev, [modalType]: true }));
  }, []);

  const closeModal = useCallback(() => {
    setModalStates({ add_leave: false, edit_leave: false, delete_leave: false, bulk_leave: false, bulk_delete: false });
  }, []);

  const openModal = useCallback((modalType) => {
    setModalStates(prev => ({ ...prev, [modalType]: true }));
  }, []);

  const handleClickOpen = useCallback((leaveId, modalType) => {
    setCurrentLeave({ id: leaveId });
    setModalStates(prev => ({ ...prev, [modalType]: true }));
  }, []);

  const [currentLeave, setCurrentLeave] = useState(null);
  const [selectedLeavesForBulkDelete, setSelectedLeavesForBulkDelete] = useState([]);

  const handleSetCurrentLeave = useCallback((leave) => {
    setCurrentLeave(leave);
  }, []);

  // Handle bulk delete
  const handleBulkDelete = useCallback((selectedLeaves) => {
    setSelectedLeavesForBulkDelete(selectedLeaves);
    openModal('bulk_delete');
  }, [openModal]);

 

  // Fetch leave statistics
  const fetchLeavesStats = useCallback(async () => {
    try {
      const response = await axios.get(route('leaves.stats'), {
        params: {
          year: filters.year,
        },
      });

      if (response.status === 200) {
        // Update the leave counts data to reflect the changes
        const { stats, leaveCounts } = response.data;
        
        if (leaveCounts) {
          // Update the leave counts in the leavesData
          setLeavesData(prevData => ({
            ...prevData,
            leaveCountsByUser: {
              ...prevData.leaveCountsByUser,
              [auth.user.id]: leaveCounts
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching leaves stats:', error.response);
      // We don't want to disrupt the user experience if stats fail to load
      // so we just log the error and don't show an error message
    }
  }, [filters.year, auth.user.id]);

  // Handle pagination changes
  const handlePageChange = useCallback((newPage) => {
    // Only change page if it's different from the current page
    if (newPage !== pagination.page) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  }, [pagination.page]);

  // Effect for data fetching
  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);
  
  // Separate effect for fetching leave stats to avoid unnecessary refetches
  useEffect(() => {
    fetchLeavesStats();
  }, [fetchLeavesStats]);
  // Extract user-specific leave counts and calculate stats
  const userLeaveCounts = useMemo(() => {
    return leavesData.leaveCountsByUser[auth.user.id] || [];
  }, [leavesData.leaveCountsByUser, auth.user.id]);

  // Optimized data manipulation functions
  const sortLeavesByFromDate = useCallback((leavesArray) => {
    return [...leavesArray].sort((a, b) => new Date(a.from_date) - new Date(b.from_date));
  }, []);

  const leaveMatchesFilters = useCallback((leave) => {
    // Year filter
    const leaveYear = new Date(leave.from_date).getFullYear();
    if (filters.year && leaveYear !== filters.year) return false;
    // Employee filter (for future extensibility, currently always own)
    if (filters.employee) {
      const user = allUsers?.find(u => String(u.id) === String(leave.user_id));
      const filterValue = filters.employee.trim().toLowerCase();
      if (!user) {
        if (String(filters.employee) !== String(leave.user_id)) return false;
      } else if (
        String(user.id) !== filterValue &&
        !(user.name && user.name.trim().toLowerCase().includes(filterValue))
      ) {
        return false;
      }
    }
    // Month filter
    if (filters.selectedMonth) {
      const leaveMonth = dayjs(leave.from_date).format('YYYY-MM');
      if (leaveMonth !== filters.selectedMonth) return false;
    }
    // Status filter
    if (filters.status && filters.status !== 'all' && String(leave.status).toLowerCase() !== String(filters.status).toLowerCase()) return false;
    // Leave type filter
    if (filters.leaveType && filters.leaveType !== 'all' && String(leave.leave_type).toLowerCase() !== String(filters.leaveType).toLowerCase()) return false;
    // Department filter
    if (filters.department && filters.department !== 'all') {
      const user = allUsers?.find(u => String(u.id) === String(leave.user_id));
      if (!user || String(user.department).toLowerCase() !== String(filters.department).toLowerCase()) return false;
    }
    return true;
  }, [filters, allUsers]);

  // Memoize leaves for table rendering
  const memoizedLeaves = useMemo(() => leaves || [], [leaves]);

  // Optimistic UI for add/edit
  const addLeaveOptimized = useCallback((newLeave) => {
    if (!leaveMatchesFilters(newLeave)) return;
    setTableLoading(true);
    setLeaves(prevLeaves => {
      const updatedLeaves = [...prevLeaves, newLeave];
      return sortLeavesByFromDate(updatedLeaves).slice(0, pagination.perPage);
    });
    updatePaginationMetadata({
      total: totalRows + 1,
      last_page: Math.ceil((totalRows + 1) / pagination.perPage),
      current_page: pagination.page,
      per_page: pagination.perPage
    });

    setTableLoading(false);
    if (pagination.page !== 1) {
      fetchLeaves();
    }
    fetchLeavesStats();
  }, [leaveMatchesFilters, sortLeavesByFromDate, pagination, totalRows, updatePaginationMetadata, fetchLeaves, fetchLeavesStats]);

  // Optimistic UI for bulk add - optimized to handle only created leaves
  const addBulkLeavesOptimized = useCallback((responseData) => {
    // Handle the response data from backend (now returns only created leaves)
    if (!responseData || !responseData.success) {
      console.error('Invalid bulk response data:', responseData);
      return;
    }
    
    // Update leaves data with the fresh data from backend
    if (responseData.leavesData) {
      setLeavesData(responseData.leavesData);
    }
    
    // Get the created leaves from the response
    const createdLeaves = responseData.created_leaves || [];
    if (createdLeaves.length === 0) {
      // Just refresh stats if no leaves were created
      fetchLeavesStats();
      return;
    }
    
    // Filter created leaves that match current filters
    const filteredNewLeaves = createdLeaves.filter(leave => leaveMatchesFilters(leave));
    
    if (filteredNewLeaves.length === 0) {
      // Even if no leaves match filters, update stats
      fetchLeavesStats();
      return;
    }

    setTableLoading(true);
    
    // Add the new leaves to the current page if they match filters
    setLeaves(prevLeaves => {
      const updatedLeaves = [...prevLeaves, ...filteredNewLeaves];
      return sortLeavesByFromDate(updatedLeaves).slice(0, pagination.perPage);
    });
    
    // Update pagination metadata based on successful creations
    const successfulCount = responseData.summary?.successful || createdLeaves.length;
    updatePaginationMetadata({
      total: totalRows + successfulCount,
      last_page: Math.ceil((totalRows + successfulCount) / pagination.perPage),
      current_page: pagination.page,
      per_page: pagination.perPage
    });

    setTableLoading(false);
    
    // If not on first page, might need to refresh to see all new data
    if (pagination.page !== 1) {
      fetchLeaves();
    }
    
    // Refresh leave stats to update balance cards
    fetchLeavesStats();
  }, [leaveMatchesFilters, sortLeavesByFromDate, pagination, totalRows, updatePaginationMetadata, fetchLeaves, fetchLeavesStats]);

  const updateLeaveOptimized = useCallback((updatedLeave) => {
    const leaveExistsInCurrentPage = leaves.some(leave => leave.id === updatedLeave.id);
    setTableLoading(true);
    if (!leaveMatchesFilters(updatedLeave) && leaveExistsInCurrentPage) {
      setLeaves(prevLeaves => {
        return prevLeaves.filter(leave => leave.id !== updatedLeave.id);
      });
      
      // Use toast promise pattern for safety
      const promise = Promise.resolve();
      showToast.promise(
        promise,
        {
          success: {
            render() {
              return <div>Leave removed from filtered view.</div>;
            },
            icon: 'ℹ️'
          }
        }
      );
      
      setTableLoading(false);
      return;
    }
    if (!leaveExistsInCurrentPage && !leaveMatchesFilters(updatedLeave)) {
      setTableLoading(false);
      return;
    }
    setLeaves(prevLeaves => {
      const exists = prevLeaves.some(leave => leave.id === updatedLeave.id);
      let updatedLeaves;
      if (exists) {
        updatedLeaves = prevLeaves.map(leave =>
          leave.id === updatedLeave.id ? updatedLeave : leave
        );
      } else {
        updatedLeaves = [...prevLeaves, updatedLeave];
      }
      return sortLeavesByFromDate(updatedLeaves).slice(0, pagination.perPage);
    });
    
    // Use toast promise pattern for safety
    const promise = Promise.resolve();
    showToast.promise(
      promise,
      {
        success: {
          render() {
            return <div>Leave updated!</div>;
          },
          icon: '✅'
        }
      }
    );
    
    setTableLoading(false);
    if (pagination.page !== 1) {
      fetchLeaves();
    }
    fetchLeavesStats();
  }, [leaveMatchesFilters, sortLeavesByFromDate, leaves, pagination, fetchLeaves, fetchLeavesStats]);

  const deleteLeaveOptimized = useCallback((leaveId) => {
    setLeaves(prevLeaves => {
      const updatedLeaves = prevLeaves.filter(leave => leave.id !== leaveId);
      // After removing a leave, check if we need to fetch more data
      const newTotal = Math.max(0, totalRows - 1);
      fetchAdditionalItemsIfNeeded(updatedLeaves, newTotal, 'delete');
      return updatedLeaves;
    });
    // Update pagination metadata
    const newTotal = Math.max(0, totalRows - 1);
    updatePaginationMetadata({
      total: newTotal,
      last_page: Math.max(1, Math.ceil(newTotal / pagination.perPage)),
      current_page: pagination.page,
      per_page: pagination.perPage
    });
    // Only fetch leave stats to update the balance cards
    fetchLeavesStats();
  }, [fetchLeavesStats, totalRows, pagination, updatePaginationMetadata, fetchAdditionalItemsIfNeeded]);

  // Optimistic UI for bulk deletion
  const deleteBulkLeavesOptimized = useCallback((responseData) => {
    // Handle the response data from backend
    if (!responseData || !responseData.success) {
      console.error('Invalid bulk delete response data:', responseData);
      return;
    }
    
    // Update leaves data with the fresh data from backend
    if (responseData.leavesData) {
      setLeavesData(responseData.leavesData);
    }
    
    // Get the deleted leave IDs from the response
    const deletedLeaves = responseData.deleted_leaves || [];
    const deletedLeaveIds = deletedLeaves.map(leave => leave.id);
    
    if (deletedLeaveIds.length === 0) {
      // Just refresh stats if no leaves were deleted
      fetchLeavesStats();
      return;
    }

    setTableLoading(true);
    
    // Remove the deleted leaves from the current page
    setLeaves(prevLeaves => {
      return prevLeaves.filter(leave => !deletedLeaveIds.includes(leave.id));
    });
    
    // Update pagination metadata based on successful deletions
    const deletedCount = responseData.deleted_count || deletedLeaves.length;
    const newTotal = Math.max(0, totalRows - deletedCount);
    updatePaginationMetadata({
      total: newTotal,
      last_page: Math.max(1, Math.ceil(newTotal / pagination.perPage)),
      current_page: pagination.page,
      per_page: pagination.perPage
    });

    setTableLoading(false);
    
    // Fetch additional items if needed to fill the page
    fetchAdditionalItemsIfNeeded(leaves.filter(leave => !deletedLeaveIds.includes(leave.id)), newTotal, 'delete');
    
    // Refresh leave stats to update balance cards
    fetchLeavesStats();
  }, [updatePaginationMetadata, pagination, totalRows, leaves, fetchAdditionalItemsIfNeeded, fetchLeavesStats]);

  // Action buttons for the header
  const actionButtons = [
    {
      label: "Add Leave",
      icon: <PlusIcon className="w-4 h-4" />,
      onPress: () => openModal('add_leave'),
      className: "bg-linear-to-r from-(--theme-primary) to-(--theme-secondary) text-white font-medium hover:opacity-90"
    },
    {
      label: "Add Bulk",
      icon: <CalendarIcon className="w-4 h-4" />,
      onPress: () => openModal('bulk_leave'),
      className: "bg-linear-to-r from-(--theme-primary) to-(--theme-secondary) text-white font-medium hover:opacity-90"
    },
    {
      label: "Current Year",
      icon: <CalendarIcon className="w-4 h-4" />,
      onPress: () => handleFilterChange('year', new Date().getFullYear()),
      className: "bg-linear-to-r from-(--theme-primary) to-(--theme-secondary) text-white font-medium hover:opacity-90"
    },
    {
      label: "Refresh",
      icon: <ArrowPathIcon className="w-4 h-4" />,
      onPress: fetchLeaves,
      className: "bg-linear-to-r from-[rgba(var(--theme-success-rgb),0.8)] to-[rgba(var(--theme-success-rgb),1)] text-white font-medium hover:opacity-90"
    }
  ];

  // Render leave type cards with responsive design
  const renderLeaveTypeCards = () => {
    if (!leavesData.leaveTypes.length) {
      return (
        <Card 
          className="text-center py-8"
          style={{
            background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
            border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
            borderRadius: getThemeRadius(),
          }}
        >
          <CardBody>
            <ChartBarIcon 
              className="w-12 h-12 mx-auto mb-4 opacity-40"
              style={{ color: 'var(--theme-foreground)' }}
            />
            <p 
              className="opacity-70"
              style={{ color: 'var(--theme-foreground)' }}
            >
              No leave types available
            </p>
          </CardBody>
        </Card>
      );
    }

    return (
      <div className={`grid gap-4 ${
        isMobile 
          ? 'grid-cols-1' 
          : isTablet 
            ? 'grid-cols-2' 
            : 'grid-cols-4'
      }`}>
        {leavesData.leaveTypes.map(({ type }) => {
          const leaveCount = userLeaveCounts.find(count => count.leave_type === type) || {};
          const usedDays = leaveCount.days_used || 0;
          const remainingDays = leaveCount.remaining_days || 0;
          const totalDays = usedDays + remainingDays;

          return (
            <Card 
              key={type} 
              className="transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: `color-mix(in srgb, var(--theme-content2) 60%, transparent)`,
                border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                borderRadius: getThemeRadius(),
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon 
                    className="w-5 h-5"
                    style={{ color: 'var(--theme-primary)' }}
                  />
                  <h3 
                    className={`font-semibold truncate ${isMobile ? 'text-base' : 'text-lg'}`}
                    style={{ color: 'var(--theme-foreground)' }}
                  >
                    {type}
                  </h3>
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <p 
                        className="text-xs opacity-70 mb-1"
                        style={{ color: 'var(--theme-foreground)' }}
                      >
                        Used
                      </p>
                      <p 
                        className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}
                        style={{ color: 'var(--theme-danger)' }}
                      >
                        {usedDays}
                      </p>
                    </div>
                    <Divider 
                      orientation="vertical" 
                      className="h-8"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--theme-content3) 50%, transparent)' }}
                    />
                    <div className="text-center">
                      <p 
                        className="text-xs opacity-70 mb-1"
                        style={{ color: 'var(--theme-foreground)' }}
                      >
                        Remaining
                      </p>
                      <p 
                        className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}
                        style={{ color: 'var(--theme-success)' }}
                      >
                        {remainingDays}
                      </p>
                    </div>
                  </div>
                  {totalDays > 0 && (
                    <div 
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--theme-content3) 40%, transparent)' }}
                    >
                      <div 
                        className="h-full transition-all duration-300 rounded-full"
                        style={{ 
                          width: `${(usedDays / totalDays) * 100}%`,
                          background: `linear-gradient(90deg, var(--theme-danger), color-mix(in srgb, var(--theme-danger) 80%, var(--theme-warning)))`
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    );
  };
  const leaveTableRef = useRef(null);

  return (
    <>
      <Head title={title} />
      
      {/* Modals for Leave Management */}
      {modalStates.add_leave && (
        <LeaveForm
          open={modalStates.add_leave}
          closeModal={() => closeModal()}
          leavesData={leavesData}
          setLeavesData={setLeavesData}
          currentLeave={null}
          allUsers={allUsers}
          setTotalRows={setTotalRows}
          setLastPage={setLastPage}
          setLeaves={setLeaves}
          employee={''}  // In employee mode, we hide the employee selector
          selectedMonth={filters.selectedMonth}
          addLeaveOptimized={addLeaveOptimized}
          updatePaginationMetadata={updatePaginationMetadata}
          fetchLeavesStats={fetchLeavesStats}
        />
      )}
      
      {modalStates.edit_leave && (
        <LeaveForm
          open={modalStates.edit_leave}
          closeModal={() => closeModal()}
          leavesData={leavesData}
          setLeavesData={setLeavesData}
          currentLeave={currentLeave}
          allUsers={allUsers}
          setTotalRows={setTotalRows}
          setLastPage={setLastPage}
          setLeaves={setLeaves}
          employee={''}  // In employee mode, we hide the employee selector
          selectedMonth={filters.selectedMonth}
          updateLeaveOptimized={updateLeaveOptimized}
          updatePaginationMetadata={updatePaginationMetadata}
          fetchLeavesStats={fetchLeavesStats}
        />
      )}

      {modalStates.delete_leave && (
        <DeleteLeaveForm
          open={modalStates.delete_leave}
          closeModal={() => closeModal()}
          leaveId={currentLeave?.id}
          setLeaves={setLeaves}
          setTotalRows={setTotalRows}
          setLastPage={setLastPage}
          deleteLeaveOptimized={deleteLeaveOptimized}
          updatePaginationMetadata={updatePaginationMetadata}
          fetchLeavesStats={fetchLeavesStats}
        />
      )}

      {modalStates.bulk_leave && (
        <BulkLeaveModal
          open={modalStates.bulk_leave}
          onClose={() => closeModal()}
          onSuccess={(responseData) => {
            // Use the same optimization pattern as single leave
            addBulkLeavesOptimized(responseData);
          }}
          allUsers={allUsers}
          leavesData={leavesData}
          isAdmin={false}
          existingLeaves={leaves || []}
          publicHolidays={leavesData?.publicHolidays || []}
        />
      )}

      {modalStates.bulk_delete && (
        <BulkDeleteModal
          open={modalStates.bulk_delete}
          onClose={() => closeModal()}
          onSuccess={(responseData) => {
            // Use the bulk deletion optimization
            deleteBulkLeavesOptimized(responseData);
          }}
          selectedLeaves={selectedLeavesForBulkDelete}
          allUsers={allUsers}
        />
      )}

      <div 
          className="flex flex-col w-full h-full p-4"
          role="main"
          aria-label="My Attendance Management"
      >
          <div className="space-y-4">
              <div className="w-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-7xl mx-auto"
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
                                            <PresentationChartLineIcon 
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
                                                My Leaves
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
                                                Your leave requests and balances
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardBody className="pt-4">

                      {/* Filters Section */}
                      <div className="mb-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                          <div className="w-full sm:w-auto sm:min-w-[200px]">
                            <Select
                              label="Select Year"
                              selectedKeys={[String(filters.year)]}
                              onSelectionChange={(keys) => {
                                const year = Number(Array.from(keys)[0]);
                                handleFilterChange('year', year);
                              }}
                              className="w-full"
                              variant="bordered"
                              style={{
                                '--input-background': 'color-mix(in srgb, var(--theme-content2) 50%, transparent)',
                                '--input-border': 'color-mix(in srgb, var(--theme-content3) 50%, transparent)',
                                '--input-hover-border': 'var(--theme-primary)',
                                '--input-focus-border': 'var(--theme-primary)',
                                '--input-color': 'var(--theme-foreground)',
                                '--input-placeholder': 'color-mix(in srgb, var(--theme-foreground) 60%, transparent)',
                                borderRadius: getThemeRadius(),
                              }}
                              startContent={<CalendarIcon className="w-4 h-4 opacity-70" />}
                            >
                              {yearOptions.map((year) => (
                                <SelectItem key={year.key} value={year.value}>
                                  {year.label}
                                </SelectItem>
                              ))}
                            </Select>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="flat"
                              color="primary"
                              size={isMobile ? "sm" : "md"}
                              onPress={fetchLeaves}
                              isLoading={loading}
                              startContent={!loading && !tableLoading && <ArrowPathIcon className="w-4 h-4" />}
                            >
                              Refresh
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Leave Types Summary */}
                      <div className="mb-6">
                        <h2 
                          className="text-lg font-semibold mb-4 flex items-center gap-2"
                          style={{ color: 'var(--theme-foreground)' }}
                        >
                          <ChartBarIcon className="w-5 h-5" />
                          Leave Balance Summary
                        </h2>
                        {renderLeaveTypeCards()}
                      </div>

                      {/* Leave History Table */}
                      <div className="min-h-96">
                        <h2 
                          className="text-lg font-semibold mb-4 flex items-center gap-2"
                          style={{ color: 'var(--theme-foreground)' }}
                        >
                          <CalendarIcon className="w-5 h-5" />
                          Leave History
                        </h2>

                        {tableLoading ? ( // Use tableLoading for the table spinner
                          <Card 
                            className="text-center py-12"
                            style={{
                              background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                              border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                              borderRadius: getThemeRadius(),
                            }}
                          >
                            <CardBody>
                              <div className="flex justify-center mb-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent" style={{ borderColor: 'var(--theme-primary)' }}></div>
                              </div>
                              <p 
                                className="opacity-70"
                                style={{ color: 'var(--theme-foreground)' }}
                              >
                                Loading leave data...
                              </p>
                            </CardBody>
                          </Card>
                        ) : error ? (
                          <Card 
                            className="text-center py-12"
                            style={{
                              background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                              border: `1px solid color-mix(in srgb, var(--theme-danger) 30%, transparent)`,
                              borderRadius: getThemeRadius(),
                            }}
                          >
                            <CardBody>
                              <XCircleSolid 
                                className="w-16 h-16 mx-auto mb-4"
                                style={{ color: 'var(--theme-danger)' }}
                              />
                              <h3 
                                className="text-lg font-semibold mb-2"
                                style={{ color: 'var(--theme-foreground)' }}
                              >
                                Error Loading Data
                              </h3>
                              <p 
                                className="opacity-70"
                                style={{ color: 'var(--theme-foreground)' }}
                              >
                                {error}
                              </p>
                            </CardBody>
                          </Card>
                        ) : leaves.length > 0 ? (
                          <div className="overflow-hidden rounded-lg">
                            <LeaveEmployeeTable
                              ref={leaveTableRef}
                              leaves={leaves}
                              allUsers={allUsers || []}
                              handleClickOpen={handleClickOpen}
                              setCurrentLeave={handleSetCurrentLeave}
                              openModal={openModal}
                              setLeaves={setLeaves}
                              setCurrentPage={handlePageChange}
                              currentPage={pagination.page}
                              totalRows={totalRows}
                              lastPage={lastPage}
                              perPage={pagination.perPage}
                              selectedMonth={filters.selectedMonth}
                              employee={''}
                              isAdminView={false}
                              fetchLeavesStats={fetchLeavesStats}
                              updatePaginationMetadata={updatePaginationMetadata}
                              onBulkDelete={handleBulkDelete}
                              canDeleteLeaves={true}
                          />
                          </div>
                        ) : (
                          <Card 
                            className="text-center py-12"
                            style={{
                              background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                              border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                              borderRadius: getThemeRadius(),
                            }}
                          >
                            <CardBody>
                              <CalendarIcon 
                                className="w-16 h-16 mx-auto mb-4 opacity-40"
                                style={{ color: 'var(--theme-foreground)' }}
                              />
                              <h3 
                                className="text-lg font-semibold mb-2"
                                style={{ color: 'var(--theme-foreground)' }}
                              >
                                No Leave Records Found
                              </h3>
                              <p 
                                className="opacity-70"
                                style={{ color: 'var(--theme-foreground)' }}
                              >
                                You haven't submitted any leave requests for {filters.year}.
                              </p>
                            </CardBody>
                          </Card>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>

              </div>
          </div>
      </div>

      
    </>
  );
};

LeavesEmployee.layout = (page) => <App>{page}</App>;

export default LeavesEmployee;
