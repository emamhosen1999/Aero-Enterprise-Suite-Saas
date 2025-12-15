import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { usePage, router } from "@inertiajs/react";
import { showToast } from '@/utils/toastUtils';
import { debounce } from "lodash";
import StatsCards from '@/Components/Common/StatsCards';
import ProfileAvatar, { getProfileAvatarTokens } from '@/Components/ProfileAvatar';

import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    User,
    Tooltip,
    Pagination,
    Chip,
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Card,
    CardHeader,
    CardBody,
    Divider,
    ScrollShadow,
    Select,
    SelectItem,
    Link,
    Spinner,
    CircularProgress,
    Input,
    Skeleton
} from "@heroui/react";
import {
    CalendarDaysIcon,
    UserIcon,
    ClockIcon,
    DocumentTextIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    ClockIcon as ClockIconOutline,
    MapPinIcon,
    BuildingOfficeIcon,
    DocumentIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    PlayIcon,
    ArrowPathIcon,
    NoSymbolIcon,
    DocumentArrowUpIcon,
    DocumentCheckIcon,
    XCircleIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import {
    CheckCircleIcon as CheckCircleSolid,
    XCircleIcon as XCircleSolid,
    ClockIcon as ClockSolid,
    ExclamationTriangleIcon as ExclamationTriangleSolid,
    PlayCircleIcon as PlayCircleSolid,
    ArrowPathIcon as ArrowPathSolid,
    PlusIcon as PlusIconSolid
} from '@heroicons/react/24/solid';
import axios from 'axios';
import { jsPDF } from "jspdf";

const DailyWorksTable = ({ 
    allData, 
    setData, 
    loading, 
    handleClickOpen, 
    allInCharges, 
    reports, 
    juniors, 
    reports_with_daily_works, 
    openModal, 
    setCurrentRow, 
    filteredData, 
    setFilteredData,
    currentPage,
    totalRows,
    lastPage,
    onPageChange
}) => {
    const { auth, users, jurisdictions } = usePage().props;
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

    // Handle refresh functionality
    const handleRefresh = useCallback(() => {
        router.reload({ only: ['allData', 'reports_with_daily_works'], onSuccess: () => {
            showToast.success('Daily works data refreshed successfully');
        }});
    }, []);

    const [isUpdating, setIsUpdating] = useState(false);
    const [updatingWorkId, setUpdatingWorkId] = useState(null);
    
    // Mobile tab state - persist across pagination
    const [selectedTab, setSelectedTab] = useState("structure");
    
    // Mobile accordion state - persist across all updates and re-renders
    const [expandedItems, setExpandedItems] = useState(new Set());
    
    // Function to toggle expanded state for a specific work item
    const toggleExpanded = useCallback((workId) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(workId)) {
                newSet.delete(workId);
            } else {
                newSet.add(workId);
            }
            return newSet;
        });
    }, []);

    // Preserve expanded state across data updates
    useEffect(() => {
        // When allData changes, preserve expanded items that still exist
        if (allData && allData.length > 0) {
            const currentWorkIds = new Set(allData.map(work => work.id));
            setExpandedItems(prev => {
                const preserved = new Set();
                prev.forEach(id => {
                    if (currentWorkIds.has(id)) {
                        preserved.add(id);
                    }
                });
                return preserved;
            });
        }
    }, [allData]);

    // Permission-based access control using designations
    const userIsAdmin = auth.roles?.includes('Administrator') || auth.roles?.includes('Super Administrator') || false;
    const userIsSE = auth.designation === 'Supervision Engineer' || false;
    const userIsQCI = auth.designation === 'Quality Control Inspector' || auth.designation === 'Asst. Quality Control Inspector' || false;
    
    // Helper function to check if current user is the incharge of a specific work
    const isUserInchargeOfWork = (work) => {
        return work?.incharge && String(work.incharge) === String(auth.user?.id);
    };
    
    // Helper function to check if current user is the assignee of a specific work
    const isUserAssigneeOfWork = (work) => {
        return work?.assigned && String(work.assigned) === String(auth.user?.id);
    };
    
    // Check if user can assign for a specific work (admin or incharge of the work)
    const canUserAssign = (work) => {
        return userIsAdmin || isUserInchargeOfWork(work);
    };
    
    // Check if user can update status and completion time (admin, SE, or assignee of the work)
    const canUserUpdateStatus = (work) => {
        return userIsAdmin || userIsSE || isUserAssigneeOfWork(work);
    };
    
    // Check if user should see the assigned column (not if they're just an assignee viewing their own work)
    const shouldShowAssignedColumn = useMemo(() => {
        // Admins and incharges should see the column
        if (userIsAdmin) return true;
        
        // Check if user is incharge of any work
        const isInchargeOfAnyWork = allData?.some(work => isUserInchargeOfWork(work));
        if (isInchargeOfAnyWork) return true;
        
        // If user is only an assignee (not admin/incharge), hide the column
        return false;
    }, [userIsAdmin, allData, auth.user?.id]);

    // Use available data with fallbacks
    const availableInCharges = allInCharges || users || [];
    const availableJuniors = juniors || users || [];
    const availableJurisdictions = jurisdictions || [];

    // Filter incharges to only show users who are incharge of any jurisdiction
    // Get unique incharge IDs from jurisdictions
    const jurisdictionInchargeIds = [...new Set(
        availableJurisdictions
            .map(jurisdiction => jurisdiction.incharge)
            .filter(id => id) // Remove nulls
    )];

    // Filter available incharges to only those who manage jurisdictions
    const jurisdictionInCharges = availableInCharges.filter(user => 
        jurisdictionInchargeIds.includes(user.id)
    );

    // Fallback to availableInCharges if no jurisdiction incharges found
    const finalInCharges = jurisdictionInCharges.length > 0 ? jurisdictionInCharges : availableInCharges;

    // Function to get available assignees based on selected incharge
    const getAvailableAssignees = (inchargeId) => {
        if (!inchargeId) return [];
        return users?.filter(user => user.report_to === parseInt(inchargeId)) || [];
    };

    // Function to get the appropriate status key for the dropdown
    const getStatusKey = (status, inspectionResult) => {
        if (!status) return 'new';
        
        const statusLower = status.toLowerCase();
        
        // Handle completed status with inspection result
        if (statusLower === 'completed' && inspectionResult) {
            return `completed:${inspectionResult.toLowerCase()}`;
        }
        
        // Handle composite status (already in correct format)
        if (statusLower.includes(':')) {
            return statusLower;
        }
        
        // Map legacy statuses to new format
        const statusMap = {
            'new': 'new',
            'resubmission': 'resubmission', 
            'emergency': 'emergency',
            'completed': 'completed:pass' // Default to pass if no inspection result
        };
        
        return statusMap[statusLower] || 'new';
    };

    // Status configuration - standardized across the application
    const statusConfig = {
        'new': {
            color: 'primary',
            icon: PlusIconSolid,
            label: 'New',
        },
        'completed:pass': {
            color: 'success',
            icon: CheckCircleSolid,
            label: 'Completed: Passed',
           
        },
        'completed:fail': {
            color: 'danger',
            icon: XCircleSolid,
            label: 'Completed: Failed',
           
        },
        'resubmission': {
            color: 'warning',
            icon: ArrowPathSolid,
            label: 'Resubmission',
            
        },
        'emergency': {
            color: 'danger',
            icon: ExclamationTriangleSolid,
            label: 'Emergency',
           
        }
    };

    const getWorkTypeIcon = (type, className = "w-4 h-4") => {
        const iconClass = `${className} shrink-0`;
        
        switch (type?.toLowerCase()) {
            case "embankment":
                return <BuildingOfficeIcon className={`${iconClass} text-amber-600 dark:text-amber-400`} />;
            case "structure":
                return <DocumentIcon className={`${iconClass} text-blue-600 dark:text-blue-400`} />;
            case "pavement":
                return <MapPinIcon className={`${iconClass} text-gray-600 dark:text-gray-400`} />;
            case "earthwork":
                return <BuildingOfficeIcon className={`${iconClass} text-green-600 dark:text-green-400`} />;
            case "drainage":
                return <DocumentIcon className={`${iconClass} text-cyan-600 dark:text-cyan-400`} />;
            case "roadwork":
                return <MapPinIcon className={`${iconClass} text-orange-600 dark:text-orange-400`} />;
            case "bridge":
                return <BuildingOfficeIcon className={`${iconClass} text-purple-600 dark:text-purple-400`} />;
            case "culvert":
                return <DocumentIcon className={`${iconClass} text-indigo-600 dark:text-indigo-400`} />;
            case "standard":
            default:
                return <DocumentTextIcon className={`${iconClass} text-default-500`} />;
        }
    };

    const getStatusChip = (status, inspectionResult = null) => {
        // If status is 'completed' and inspection_result exists, use the composite status
        if (status === 'completed' && inspectionResult) {
            const compositeStatus = `completed:${inspectionResult}`;
            const config = statusConfig[compositeStatus] || statusConfig['new'];
            const StatusIcon = config.icon;
            
            return (
                <Chip
                    size="sm"
                    variant="flat"
                    color={config.color}
                    startContent={<StatusIcon className="w-3 h-3" />}
                    classNames={{
                        base: "h-6",
                        content: "text-xs font-medium"
                    }}
                >
                    {config.label}
                </Chip>
            );
        }

        // For composite status (e.g., 'completed:pass'), use it directly
        if (status && status.includes(':')) {
            const config = statusConfig[status] || statusConfig['new'];
            const StatusIcon = config.icon;
            
            return (
                <Chip
                    size="sm"
                    variant="flat"
                    color={config.color}
                    startContent={<StatusIcon className="w-3 h-3" />}
                    classNames={{
                        base: "h-6",
                        content: "text-xs font-medium"
                    }}
                >
                    {config.label}
                </Chip>
            );
        }

        // Default status display
        const config = statusConfig[status] || statusConfig['new'];
        const StatusIcon = config.icon;

        return (
            <Chip
                size="sm"
                variant="flat"
                color={config.color}
                startContent={<StatusIcon className="w-3 h-3" />}
                classNames={{
                    base: "h-6",
                    content: "text-xs font-medium"
                }}
            >
                {config.label}
            </Chip>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'Not set';
        
        try {
            return new Date(dateTimeString).toLocaleString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch (error) {
            return 'Invalid datetime';
        }
    };

    const getUserInfo = (userId) => {
        if (!userId) return { name: 'Unassigned', profile_image_url: null, profile_image: null };
        
        const user = availableInCharges?.find((u) => String(u.id) === String(userId)) || 
                    availableJuniors?.find((u) => String(u.id) === String(userId)) ||
                    users?.find((u) => String(u.id) === String(userId));
        return user || { name: 'Unassigned', profile_image_url: null, profile_image: null };
    };

    const getJurisdictionInfo = (jurisdictionId) => {
        if (!jurisdictionId) return { name: 'No jurisdiction assigned', location: 'Unknown' };
        
        const jurisdiction = availableJurisdictions?.find((j) => String(j.id) === String(jurisdictionId));
        return jurisdiction || { name: 'Unknown jurisdiction', location: 'Unknown' };
    };

    // Image capture functions
    const captureDocument = (taskNumber) => {
        return new Promise((resolve, reject) => {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*";
            fileInput.multiple = true;

            document.body.appendChild(fileInput);

            fileInput.onchange = async () => {
                const files = Array.from(fileInput.files);
                if (files.length > 0) {
                    try {
                        const images = [];

                        for (let file of files) {
                            const img = await loadImage(file);
                            const resizedCanvas = resizeImage(img, 1024);
                            images.push(resizedCanvas);
                        }

                        const pdfBlob = await combineImagesToPDF(images);
                        const pdfFile = new File([pdfBlob], `${taskNumber}_scanned_document.pdf`, { type: "application/pdf" });
                        resolve(pdfFile);

                        document.body.removeChild(fileInput);
                    } catch (error) {
                        reject(error);
                        document.body.removeChild(fileInput);
                    }
                } else {
                    reject(new Error("No files selected"));
                    document.body.removeChild(fileInput);
                }
            };

            fileInput.click();
        });
    };

    const loadImage = (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                resolve(img);
                URL.revokeObjectURL(img.src);
            };
            img.onerror = () => reject(new Error("Failed to load image"));
        });
    };

    const resizeImage = (img, targetHeight) => {
        const aspectRatio = img.width / img.height;
        const targetWidth = targetHeight * aspectRatio;
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        return canvas;
    };

    const combineImagesToPDF = (images) => {
        return new Promise((resolve, reject) => {
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "px",
                format: [images[0].width, images[0].height],
            });

            images.forEach((canvas, index) => {
                if (index > 0) pdf.addPage();
                const imgData = canvas.toDataURL("image/jpeg", 1.0);
                pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
            });

            try {
                const pdfBlob = pdf.output("blob");
                resolve(pdfBlob);
            } catch (error) {
                reject(error);
            }
        });
    };

    const uploadImage = async (taskId, imageFile) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const formData = new FormData();
                formData.append("taskId", taskId);
                formData.append("file", imageFile);

                const response = await axios.post(route('dailyWorks.uploadRFI'), formData, {
                    headers: {"Content-Type": "multipart/form-data"},
                });

                if (response.status === 200) {
                    setData(prevTasks =>
                        prevTasks.map(task =>
                            task.id === taskId ? {...task, file: response.data.url} : task
                        )
                    );
                    resolve([response.data.message || 'RFI file uploaded successfully']);
                }
            } catch (error) {
                console.error(error);
                reject(error.response.statusText || 'Failed to upload RFI file');
            }
        });

        showToast.promise(promise, {
            loading: 'Uploading RFI file...',
            success: (data) => data.join(', '),
            error: (data) => data,
        });
    };

    // Handle status updates - simplified approach
    const updateWorkStatus = useCallback(async (work, newStatus) => {
        if (updatingWorkId === work.id) return;

        setUpdatingWorkId(work.id);
        const promise = new Promise(async (resolve, reject) => {
            try {
                // Parse composite status (e.g., 'completed:pass' -> status: 'completed', inspection_result: 'pass')
                let actualStatus = newStatus;
                let inspectionResult = null;
                
                if (newStatus.includes(':')) {
                    const [statusPart, resultPart] = newStatus.split(':');
                    actualStatus = statusPart;
                    inspectionResult = resultPart;
                }

                // Simple status update - only send what's needed
                const updateData = {
                    id: work.id,
                    status: actualStatus,
                };

                // Add inspection result if it exists
                if (inspectionResult) {
                    updateData.inspection_result = inspectionResult;
                }

                const response = await axios.post(route('dailyWorks.updateStatus'), updateData);

                if (response.status === 200) {
                    // Update local state with the response data
                    setData(prevWorks =>
                        prevWorks.map(w =>
                            w.id === work.id ? response.data.dailyWork : w
                        )
                    );
                    
                    const statusLabel = statusConfig[newStatus]?.label || `${actualStatus}${inspectionResult ? ` - ${inspectionResult}` : ''}`;
                    resolve(response.data.message || `Work status updated to ${statusLabel}`);
                }
            } catch (error) {
                let errorMsg = "Failed to update work status";
                
                if (error.response?.status === 422 && error.response.data?.errors) {
                    // Handle validation errors
                    const errors = error.response.data.errors;
                    const errorMessages = Object.values(errors).flat();
                    errorMsg = errorMessages.join(', ');
                } else if (error.response?.data?.message) {
                    errorMsg = error.response.data.message;
                } else if (error.response?.statusText) {
                    errorMsg = error.response.statusText;
                }
                
                reject(errorMsg);
            } finally {
                setUpdatingWorkId(null);
            }
        });

        showToast.promise(promise, {
            loading: 'Updating work status...',
            success: (data) => data || "Work status updated successfully!",
            error: (data) => data || "Failed to update work status",
        });
    }, [setData, updatingWorkId]);

    // Handle completion time updates
    const updateCompletionTime = useCallback(async (work, completionTime) => {
        try {
            const response = await axios.post(route('dailyWorks.updateCompletionTime'), {
                id: work.id,
                completion_time: completionTime,
            });

            if (response.status === 200) {
                setData(prevWorks =>
                    prevWorks.map(w =>
                        w.id === work.id ? response.data.dailyWork : w
                    )
                );
                showToast.success('Completion time updated successfully');
            }
        } catch (error) {
            showToast.error('Failed to update completion time');
        }
    }, [setData]);

    // Handle submission time updates
    const updateSubmissionTime = useCallback(async (work, submissionTime) => {
        try {
            const response = await axios.post(route('dailyWorks.updateSubmissionTime'), {
                id: work.id,
                submission_time: submissionTime,
            });

            if (response.status === 200) {
                setData(prevWorks =>
                    prevWorks.map(w =>
                        w.id === work.id ? response.data.dailyWork : w
                    )
                );
                showToast.success('Submission time updated successfully');
            }
        } catch (error) {
            showToast.error('Failed to update submission time');
        }
    }, [setData]);

  

    // Create a ref to store the current allData and setData
    const allDataRef = useRef(allData);
    const setDataRef = useRef(setData);
    allDataRef.current = allData;
    setDataRef.current = setData;

 

    // Debounced function for updating incharge
    const debouncedUpdateIncharge = useMemo(
        () => debounce(async (workId, inchargeId) => {
            try {
                const work = allDataRef.current?.find(w => w.id === workId);
                if (!work) {
                    showToast.error('Work not found');
                    return;
                }

                const response = await axios.post(route('dailyWorks.updateIncharge'), {
                    id: work.id,
                    incharge: inchargeId,
                });

                if (response.status === 200) {
                    setDataRef.current(prevWorks =>
                        prevWorks.map(w =>
                            w.id === work.id ? response.data.dailyWork : w
                        )
                    );
                    showToast.success('Incharge updated successfully');
                }
            } catch (error) {
                console.error('Error updating incharge:', error);
                showToast.error('Failed to update incharge');
            }
        }, 500), // 0.5 second delay for dropdowns
        []
    );

    // Debounced function for updating assigned user
    const debouncedUpdateAssigned = useMemo(
        () => debounce(async (workId, assignedId) => {
            try {
                const work = allDataRef.current?.find(w => w.id === workId);
                if (!work) {
                    showToast.error('Work not found');
                    return;
                }

                const response = await axios.post(route('dailyWorks.updateAssigned'), {
                    id: work.id,
                    assigned: assignedId,
                });

                if (response.status === 200) {
                    setDataRef.current(prevWorks =>
                        prevWorks.map(w =>
                            w.id === work.id ? response.data.dailyWork : w
                        )
                    );
                    showToast.success('Assigned user updated successfully');
                }
            } catch (error) {
                console.error('Error updating assigned user:', error);
                showToast.error('Failed to update assigned user');
            }
        }, 500), // 0.5 second delay for dropdowns
        []
    );

    // Debounced function for updating completion time
    const debouncedUpdateCompletionTime = useMemo(
        () => debounce(async (workId, completionTime) => {
            try {
                const work = allDataRef.current?.find(w => w.id === workId);
                if (!work) {
                    showToast.error('Work not found');
                    return;
                }

                const response = await axios.post(route('dailyWorks.updateCompletionTime'), {
                    id: work.id,
                    completion_time: completionTime,
                });

                if (response.status === 200) {
                    setDataRef.current(prevWorks =>
                        prevWorks.map(w =>
                            w.id === work.id ? response.data.dailyWork : w
                        )
                    );
                    showToast.success('Completion time updated successfully');
                }
            } catch (error) {
                console.error('Error updating completion time:', error);
                showToast.error('Failed to update completion time');
            }
        }, 800), // 0.8 second delay for time inputs
        []
    );

    // Debounced function for updating RFI submission time
    const debouncedUpdateSubmissionTime = useMemo(
        () => debounce(async (workId, submissionTime) => {
            try {
                const work = allDataRef.current?.find(w => w.id === workId);
                if (!work) {
                    showToast.error('Work not found');
                    return;
                }

                const response = await axios.post(route('dailyWorks.updateSubmissionTime'), {
                    id: work.id,
                    rfi_submission_date: submissionTime,
                });

                if (response.status === 200) {
                    setDataRef.current(prevWorks =>
                        prevWorks.map(w =>
                            w.id === work.id ? response.data.dailyWork : w
                        )
                    );
                    showToast.success('RFI submission time updated successfully');
                }
            } catch (error) {
                console.error('Error updating RFI submission time:', error);
                showToast.error('Failed to update RFI submission time');
            }
        }, 800), // 0.8 second delay for time inputs
        []
    );

    // Cleanup debounced functions on unmount
    useEffect(() => {
        return () => {
         
            debouncedUpdateIncharge.cancel();
            debouncedUpdateAssigned.cancel();
            debouncedUpdateCompletionTime.cancel();
            debouncedUpdateSubmissionTime.cancel();
        };
    }, [
   
        debouncedUpdateIncharge,
        debouncedUpdateAssigned,
        debouncedUpdateCompletionTime,
        debouncedUpdateSubmissionTime
    ]);

    // Handle general field updates
    const handleChange = async (taskId, taskNumber, key, value, type) => {
        try {
            // Find the current work to get all its data
            const currentWork = allData?.find(work => work.id === taskId);
            if (!currentWork) {
                showToast.error('Work not found');
                return;
            }

            // Prepare update data with logical field assignments
            const updateData = {
                id: taskId,
                [key]: value,
                // Include required fields with standardized fallbacks
                date: currentWork.date || new Date().toISOString().split('T')[0],
                number: currentWork.number || `RFI-${Date.now()}`,
                planned_time: currentWork.planned_time || '09:00',
                status: key === 'status' ? value : (currentWork.status || 'new'),
                type: currentWork.type || 'Standard',
                description: currentWork.description || 'Work description pending',
                location: currentWork.location || 'Location to be determined',
                side: currentWork.side || 'Both'
            };

            // Logical field assignments
            if (key === 'status') {
                if (value === 'completed') {
                    // Auto-set completion time and submission time if not already set
                    updateData.completion_time = currentWork.completion_time || new Date().toISOString();
                    updateData.submission_time = currentWork.submission_time || new Date().toISOString();
                    
                    // Capture document if not structure type
                    if (!(type === 'Structure')) {
                        const pdfFile = await captureDocument(taskNumber);
                        if (pdfFile) {
                            await uploadImage(taskId, pdfFile);
                        }
                    }
                } else if (value === 'resubmission') {
                    // Increment resubmission count
                    updateData.resubmission_count = (currentWork.resubmission_count || 0) + 1;
                } else if (value === 'new') {
                    // Reset completion and submission times for new status
                    updateData.completion_time = null;
                    updateData.submission_time = null;
                }
            }

            const response = await axios.post(route('dailyWorks.update'), updateData);

            if (response.status === 200) {
                setData(prevTasks =>
                    prevTasks.map(task =>
                        task.id === taskId ? { 
                            ...task, 
                            [key]: value,
                            // Update logical fields based on status change
                            ...(key === 'status' && value === 'completed' && {
                                completion_time: updateData.completion_time,
                                submission_time: updateData.submission_time
                            }),
                            ...(key === 'status' && value === 'resubmission' && {
                                resubmission_count: updateData.resubmission_count
                            }),
                            ...(key === 'status' && value === 'new' && {
                                completion_time: null,
                                submission_time: null
                            })
                        } : task
                    )
                );

                showToast.success(response.data.message || `Task updated successfully`, {
                    icon: '🟢',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: 'var(--theme-content1)',
                        border: '1px solid var(--theme-divider)',
                        color: 'var(--theme-primary)',
                    }
                });
            }
        } catch (error) {
            console.error(error);
            let errorMessage = 'An unexpected error occurred.';
            
            if (error.response?.status === 422 && error.response.data?.errors) {
                // Handle validation errors
                const errors = error.response.data.errors;
                const errorMessages = Object.values(errors).flat();
                errorMessage = errorMessages.join(', ');
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.statusText) {
                errorMessage = error.response.statusText;
            }

            showToast.error(errorMessage, {
                icon: '🔴',
                style: {
                    backdropFilter: 'blur(16px) saturate(200%)',
                    background: 'var(--theme-content1)',
                    border: '1px solid var(--theme-divider)',
                    color: 'var(--theme-primary)',
                }
            });
        }
    };

    // Mobile tabs and accordion component - organized by work types
    const MobileDailyWorkCard = ({ works, selectedTab, setSelectedTab, expandedItems, toggleExpanded }) => {
        
        // Define work types and their corresponding data
        const workTypes = [
            { key: "structure", label: "Structure", icon: "🏗️" },
            { key: "embankment", label: "Embankment", icon: "🏔️" },
            { key: "pavement", label: "Pavement", icon: "🛣️" }
        ];

        // Group works by type
        const groupedWorks = useMemo(() => {
            const groups = {
                structure: [],
                embankment: [],
                pavement: []
            };

            works.forEach(work => {
                const workType = work.type?.toLowerCase() || 'structure';
                if (groups[workType]) {
                    groups[workType].push(work);
                } else {
                    groups.structure.push(work); // Default to structure if type doesn't match
                }
            });

            return groups;
        }, [works]);

        // Mobile Loading Skeleton
        const MobileLoadingSkeleton = () => {
            return (
                <div className="space-y-2">
                    {/* Tab skeleton */}
                    <div className="flex overflow-x-auto border-b border-divider mb-3 scrollbar-hide">
                        {workTypes.map((type) => (
                            <div key={type.key} className="flex items-center gap-2 px-3 py-2.5 min-w-fit">
                                <Skeleton className="w-6 h-6 rounded" />
                                <Skeleton className="w-16 h-4 rounded" />
                                <Skeleton className="w-6 h-5 rounded-full" />
                            </div>
                        ))}
                    </div>
                    
                    {/* Card skeletons */}
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Card
                            key={index}
                            radius={getThemeRadius()}
                            className="mb-2 bg-content1/98 backdrop-blur-sm border border-divider/30"
                        >
                            <CardHeader className="pb-2 px-3 py-3 flex flex-col relative">
                                {/* Status chip skeleton */}
                                <div className="flex flex-row justify-end mb-2 w-full">
                                    <Skeleton className="w-24 h-6 rounded-full" />
                                </div>
                                
                                {/* Main content skeleton */}
                                <div className="flex flex-row items-start gap-3 w-full pr-10">
                                    <Skeleton className="w-8 h-8 rounded-lg" />
                                    <div className="min-w-0 flex-1 flex flex-col space-y-2">
                                        <Skeleton className="w-32 h-4 rounded" />
                                        <div className="flex flex-row items-center gap-2">
                                            <Skeleton className="w-3 h-3 rounded" />
                                            <Skeleton className="w-20 h-3 rounded" />
                                        </div>
                                        <div className="flex flex-row items-center gap-2">
                                            <Skeleton className="w-3 h-3 rounded" />
                                            <Skeleton className="w-40 h-3 rounded" />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Dropdown button skeleton */}
                                <Skeleton className="absolute bottom-2 right-3 w-8 h-8 rounded-full" />
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            );
        };

        // Show loading skeleton when loading
        if (loading) {
            return <MobileLoadingSkeleton />;
        }

        // Individual work accordion item component
        const WorkAccordionItem = ({ work, index, isExpanded, onToggle }) => {
            const inchargeUser = getUserInfo(work.incharge);
            const assignedUser = getUserInfo(work.assigned);
            const statusConf = statusConfig[work.status] || statusConfig['new'];

            return (
                <Card
                    key={work.id}
                    radius={getThemeRadius()}
                    className="mb-2 bg-content1/98 backdrop-blur-sm border border-divider/30 shadow-sm hover:shadow-md transition-all duration-200"
                    style={{
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}
                >
                    {/* Collapsible Header */}
                    <CardHeader className="pb-2 px-3 py-3 flex flex-col relative">
                        {/* Row 1: Status chip */}
                        <div className="flex flex-row justify-end mb-2 w-full">
                            {getStatusChip(work.status, work.inspection_result)}
                        </div>
                        
                        {/* Row 2: Main content only */}
                        <div className="flex flex-row items-start gap-3 w-full pr-10">
                            <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                                <DocumentIcon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1 flex flex-col">
                                <div className="font-semibold text-sm text-default-800 leading-normal mb-1">
                                    {work.number}
                                </div>
                                <div className="flex flex-row items-center gap-2 text-xs text-default-500 mb-0.5">
                                    <CalendarDaysIcon className="w-3 h-3" />
                                    <span>{formatDate(work.date)}</span>
                                </div>
                                {work.location && (
                                    <div className="flex flex-row items-center gap-2 text-xs text-default-400">
                                        <MapPinIcon className="w-3 h-3" />
                                        <span className="truncate">{work.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Dropdown button - positioned absolutely at bottom right */}
                        <button
                            onClick={() => onToggle()}
                            className="absolute bottom-2 right-3 w-8 h-8 rounded-full bg-default-100/80 hover:bg-default-200/80 border border-default-200/50 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shrink-0"
                            aria-label={isExpanded ? "Collapse details" : "Expand details"}
                        >
                            <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                <svg className="w-4 h-4 text-default-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>
                    </CardHeader>

                    {/* Collapsible Content */}
                    {isExpanded && (
                        <CardBody className="pt-0 px-3 pb-3">
                            <div className="space-y-3">
                        {/* Basic Information - Compact Grid */}
                        <div className="grid grid-cols-1 gap-2 text-xs">
                            {/* Description */}
                            {work.description && (
                                <div className="flex items-start gap-2">
                                    <DocumentTextIcon className="w-3.5 h-3.5 text-default-400 mt-0.5 shrink-0" />
                                    <span className="text-default-600 flex-1 leading-relaxed">
                                        {work.description}
                                    </span>
                                </div>
                            )}

                            {/* Jurisdiction */}
                            <div className="flex items-center gap-2">
                                <BuildingOfficeIcon className="w-3.5 h-3.5 text-default-400" />
                                <span className="text-default-600">
                                    {getJurisdictionInfo(work.jurisdiction_id)?.name || 'Not assigned'}
                                </span>
                            </div>

                            {/* Side and Layers in one row */}
                            <div className="flex items-center gap-4">
                                {work.side && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-default-400">Side:</span>
                                        <Chip size="sm" variant="flat" color="default" className="capitalize text-xs">
                                            {work.side}
                                        </Chip>
                                    </div>
                                )}
                                {work.qty_layer && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-default-400">Layers:</span>
                                        <span className="text-default-600 font-medium">{work.qty_layer}</span>
                                    </div>
                                )}
                            </div>

                            {/* Resubmission Count */}
                            {work.resubmission_count > 0 && (
                                <div className="flex items-center gap-2">
                                    <Chip size="sm" variant="flat" color="warning" className="text-xs">
                                        {work.resubmission_count} resubmissions
                                    </Chip>
                                </div>
                            )}
                        </div>

                        {/* Timing Information - Compact */}
                        <div className="bg-content2/20 p-2.5 rounded-md">
                            <h4 className="text-xs font-semibold text-default-700 mb-2">Timing</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <ClockIcon className="w-3.5 h-3.5 text-default-400" />
                                    <span className="text-xs text-default-600">
                                        Planned: {work.planned_time || 'Not set'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CheckCircleIcon className="w-3.5 h-3.5 text-default-400" />
                                        <span className="text-xs font-medium text-default-600">Completion Time:</span>
                                    </div>
                                    <Input
                                        size="sm"
                                        type="datetime-local"
                                        variant="bordered"
                                        radius={getThemeRadius()}
                                        value={work.completion_time
                                            ? new Date(work.completion_time).toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16)
                                            : ''
                                        }
                                        onChange={(e) => debouncedUpdateCompletionTime(work.id, e.target.value)}
                                        classNames={{
                                            input: "text-sm",
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Personnel Assignment - Compact */}
                        <div className="bg-content2/20 p-2.5 rounded-md">
                            <h4 className="text-xs font-semibold text-default-700 mb-2">Personnel</h4>
                            <div className="space-y-3">
                                {/* In-charge */}
                                {userIsAdmin && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <UserIcon className="w-4 h-4 text-default-500" />
                                            <span className="text-xs font-medium text-default-600">In-charge:</span>
                                        </div>
                                        <Select
                                            size="sm"
                                            variant="bordered"
                                            radius={getThemeRadius()}
                                            placeholder="Select in-charge"
                                            aria-label="Select in-charge person"
                                            selectedKeys={work.incharge && finalInCharges.find(user => user.id === parseInt(work.incharge)) 
                                                ? [String(work.incharge)] 
                                                : []}
                                            onSelectionChange={(keys) => {
                                                const selectedKey = Array.from(keys)[0];
                                                if (selectedKey) {
                                                    debouncedUpdateIncharge(work.id, selectedKey);
                                                }
                                            }}
                                            classNames={{
                                                trigger: "min-h-8 w-full",
                                                value: "text-sm leading-tight",
                                                popoverContent: "w-64"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                            renderValue={(items) => {
                                                if (items.length === 0) {
                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            <UserIcon className="w-4 h-4 text-default-400" />
                                                            <span className="text-sm">Select in-charge</span>
                                                        </div>
                                                    );
                                                }
                                                return items.map((item) => (
                                                    <div key={item.key} className="flex items-center gap-2">
                                                        <ProfileAvatar
                                                            src={inchargeUser.profile_image_url || inchargeUser.profile_image}
                                                            size="sm"
                                                            name={inchargeUser.name}
                                                            className="w-5 h-5"
                                                            showBorder
                                                        />
                                                        <span className="text-sm font-medium">{inchargeUser.name}</span>
                                                    </div>
                                                ));
                                            }}
                                        >
                                            {finalInCharges.map((user) => (
                                                <SelectItem key={String(user.id)} textValue={user.name}>
                                                    <div className="flex items-center gap-2">
                                                        <ProfileAvatar
                                                            src={user.profile_image_url || user.profile_image}
                                                            size="sm"
                                                            name={user.name}
                                                            className="w-6 h-6"
                                                            showBorder
                                                        />
                                                        <div>
                                                            <div className="text-sm font-medium">{user.name}</div>
                                                            <div className="text-xs text-default-400">{user.role_name || 'Team Member'}</div>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                )}

                                {/* Assigned To - Hidden for assignees viewing their own work */}
                                {(canUserAssign(work) || !isUserAssigneeOfWork(work)) && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="w-4 h-4 text-default-500" />
                                        <span className="text-xs font-medium text-default-600">Assigned to:</span>
                                    </div>
                                    {canUserAssign(work) ? (
                                        <Select
                                            size="sm"
                                            variant="bordered"
                                            radius={getThemeRadius()}
                                            placeholder="Select assignee"
                                            aria-label="Select assigned person"
                                            selectedKeys={work.assigned && getAvailableAssignees(work.incharge).find(user => user.id === parseInt(work.assigned))
                                                ? [String(work.assigned)]
                                                : []}
                                            onSelectionChange={(keys) => {
                                                const selectedKey = Array.from(keys)[0];
                                                if (selectedKey) {
                                                    debouncedUpdateAssigned(work.id, selectedKey);
                                                }
                                            }}
                                            classNames={{
                                                trigger: "min-h-8 w-full",
                                                value: "text-sm leading-tight",
                                                popoverContent: "w-64"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                            renderValue={(items) => {
                                                if (items.length === 0) {
                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            <UserIcon className="w-4 h-4 text-default-400" />
                                                            <span className="text-sm">Select assignee</span>
                                                        </div>
                                                    );
                                                }
                                                return items.map((item) => (
                                                    <div key={item.key} className="flex items-center gap-2">
                                                        <ProfileAvatar
                                                            src={assignedUser.profile_image_url || assignedUser.profile_image}
                                                            size="sm"
                                                            name={assignedUser.name}
                                                            className="w-5 h-5"
                                                            showBorder
                                                        />
                                                        <span className="text-sm font-medium">{assignedUser.name}</span>
                                                    </div>
                                                ));
                                            }}
                                        >
                                            {getAvailableAssignees(work.incharge).map((user) => (
                                                <SelectItem key={String(user.id)} textValue={user.name}>
                                                    <div className="flex items-center gap-2">
                                                        <ProfileAvatar
                                                            src={user.profile_image_url || user.profile_image}
                                                            size="sm"
                                                            name={user.name}
                                                            className="w-6 h-6"
                                                            showBorder
                                                        />
                                                        <div>
                                                            <div className="text-sm font-medium">{user.name}</div>
                                                            <div className="text-xs text-default-400">{user.designation_title || user.designation?.title || 'Staff'}</div>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    ) : (
                                        assignedUser.name !== 'Unassigned' ? (
                                            <User
                                                size="sm"
                                                name={assignedUser.name}
                                                description="Assigned"
                                                avatarProps={{
                                                    size: "sm",
                                                    src: assignedUser.profile_image_url || assignedUser.profile_image,
                                                    name: assignedUser.name,
                                                    ...getProfileAvatarTokens({
                                                        name: assignedUser.name,
                                                        size: 'sm',
                                                    }),
                                                }}
                                                classNames={{
                                                    name: "text-sm font-medium",
                                                    description: "text-xs text-default-400"
                                                }}
                                            />
                                        ) : (
                                            <Chip size="sm" variant="flat" color="default">
                                                Unassigned
                                            </Chip>
                                        )
                                    )}
                                </div>
                                )}
                            </div>
                        </div>

                        {/* Status Management - Compact (visible to admin, SE, or assignee) */}
                        {canUserUpdateStatus(work) && (
                            <div className="bg-content2/20 p-2.5 rounded-md">
                                <h4 className="text-xs font-semibold text-default-700 mb-2">Status</h4>
                                
                                {/* Status Dropdown */}
                                <div className="space-y-2">
                                    <span className="text-xs font-medium text-default-600">Current Status:</span>
                                    <Select
                                        size="sm"
                                        color={(() => {
                                            const statusKey = getStatusKey(work.status, work.inspection_result);
                                            return statusConfig[statusKey]?.color || 'default';
                                        })()}
                                        variant="bordered"
                                        placeholder="Select status"
                                        aria-label="Select work status"
                                        selectedKeys={work.status ? [getStatusKey(work.status, work.inspection_result)] : []}
                                        onSelectionChange={(keys) => {
                                            const selectedKey = Array.from(keys)[0];
                                            if (selectedKey) {
                                                updateWorkStatus(work, selectedKey);
                                            }
                                        }}
                                        isDisabled={updatingWorkId === work.id}
                                        radius={getThemeRadius()}
                                        classNames={{
                                            trigger: `min-h-8 w-full transition-colors`,
                                            value: "text-sm font-medium",
                                            popoverContent: "min-w-[210px]"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                        renderValue={(items) => {
                                            if (items.length === 0) {
                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <ExclamationTriangleSolid className="w-4 h-4 text-default-400" />
                                                        <span className="text-sm">Select status</span>
                                                    </div>
                                                );
                                            }
                                            const statusKey = getStatusKey(work.status, work.inspection_result);
                                            const currentStatus = statusConfig[statusKey] || statusConfig['new'];
                                            const StatusIcon = currentStatus.icon;
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <StatusIcon className="w-4 h-4" />
                                                    <span className="text-sm font-medium">{currentStatus.label}</span>
                                                </div>
                                            );
                                        }}
                                    >
                                        {Object.keys(statusConfig).map((status) => {
                                            const config = statusConfig[status];
                                            const StatusIcon = config.icon;
                                            return (
                                                <SelectItem 
                                                    key={status} 
                                                    textValue={config.label}
                                                    color={config.color}
                                                    startContent={<StatusIcon className="w-4 h-4" />}
                                                    classNames={{
                                                        title: "text-sm font-medium",
                                                        description: "text-sm"
                                                    }}
                                                >
                                                    {config.label}
                                                </SelectItem>
                                            );
                                        })}
                                    </Select>
                                </div>

                                {/* RFI Submission Date (Admin only) */}
                                {userIsAdmin && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <CalendarDaysIcon className="w-4 h-4 text-default-500" />
                                            <span className="text-xs font-medium text-default-600">RFI Submission Date:</span>
                                        </div>
                                        <Input
                                            size="sm"
                                            type="date"
                                            variant="bordered"
                                            radius={getThemeRadius()}
                                            value={work.rfi_submission_date ? 
                                                new Date(work.rfi_submission_date).toISOString().slice(0, 10) : ''
                                            }
                                            onChange={(e) => debouncedUpdateSubmissionTime(work.id, e.target.value)}
                                            classNames={{
                                                input: "text-sm",
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        {userIsAdmin && (
                            <div className="flex items-center justify-between pt-2 border-t border-divider">
                                <span className="text-xs text-default-500">Actions:</span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        color="primary"
                                        radius={getThemeRadius()}
                                        onPress={() => {
                                            setCurrentRow(work);
                                            openModal("editDailyWork");
                                        }}
                                        startContent={<PencilIcon className="w-4 h-4" />}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        color="danger"
                                        radius={getThemeRadius()}
                                        onPress={() => handleClickOpen(work.id, "deleteDailyWork")}
                                        startContent={<TrashIcon className="w-4 h-4" />}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                        </CardBody>
                    )}
                </Card>
            );
        };

        return (
            <div className="w-full">
                {/* Custom Tab Headers - Compact */}
                <div className="flex overflow-x-auto border-b border-divider mb-3 scrollbar-hide">
                    {workTypes.map((type) => (
                        <button
                            key={type.key}
                            onClick={() => setSelectedTab(type.key)}
                            className={`flex items-center gap-2 px-3 py-2.5 min-w-fit whitespace-nowrap border-b-2 transition-all duration-200 ${
                                selectedTab === type.key
                                    ? 'border-primary text-primary font-semibold bg-primary/5'
                                    : 'border-transparent text-default-500 hover:text-default-700 hover:bg-default-50/50'
                            }`}
                        >
                            <span className="text-base">{type.icon}</span>
                            <span className="font-medium text-sm">{type.label}</span>
                            <Chip 
                                size="sm" 
                                variant="flat" 
                                color={selectedTab === type.key ? "primary" : "default"}
                                className="text-xs min-w-[20px] h-5"
                            >
                                {groupedWorks[type.key]?.length || 0}
                            </Chip>
                        </button>
                    ))}
                </div>

                {/* Tab Content - Compact */}
                <div className="pt-1">
                    {workTypes.map((type) => (
                        <div key={type.key} className={selectedTab === type.key ? 'block' : 'hidden'}>
                            {groupedWorks[type.key]?.length > 0 ? (
                                <div className="space-y-2">
                                    {groupedWorks[type.key].map((work, index) => (
                                        <WorkAccordionItem 
                                            key={work.id} 
                                            work={work} 
                                            index={index}
                                            isExpanded={expandedItems.has(work.id)}
                                            onToggle={() => toggleExpanded(work.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="text-4xl mb-3">{type.icon}</div>
                                    <div className="text-default-500 text-sm">
                                        No {type.label.toLowerCase()} works found
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const handlePageChange = useCallback((page) => {
        if (onPageChange) {
            onPageChange(page);
        }
    }, [onPageChange]);

    const cellBaseClasses = "text-xs sm:text-sm md:text-base whitespace-nowrap";

    const renderCell = useCallback((work, columnKey) => {
        const inchargeUser = getUserInfo(work.incharge);
        const assignedUser = getUserInfo(work.assigned);

        switch (columnKey) {
            case "date":
                return (
                    <TableCell className={cellBaseClasses}>
                        <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                            <CalendarDaysIcon className="w-3 h-3 text-default-500" />
                            <span className="text-sm font-medium">
                                {formatDate(work.date)}
                            </span>
                        </div>
                    </TableCell>
                );

            case "number":
                return (
                    <TableCell className="max-w-32">
                        <div className="flex flex-col items-center justify-center gap-1 w-full whitespace-nowrap">
                            {(work.status === 'completed' || work.status?.startsWith('completed:')) && work.file ? (
                                <Link
                                    isExternal
                                    href={work.file}
                                    color={(() => {
                                        const statusKey = getStatusKey(work.status, work.inspection_result);
                                        return statusConfig[statusKey]?.color || 'default';
                                    })()}
                                    size="sm"
                                    className="font-medium text-center"
                                    title={work.number}
                                >
                                    {work.number}
                                </Link>
                            ) : (work.status === 'completed' || work.status?.startsWith('completed:')) && !work.file ? (
                                <Link
                                    href="#"
                                    color={(() => {
                                        const statusKey = getStatusKey(work.status, work.inspection_result);
                                        return statusConfig[statusKey]?.color || 'default';
                                    })()}
                                    size="sm"
                                    className="font-medium text-center"
                                    title={work.number}
                                    onPress={async () => {
                                        const pdfFile = await captureDocument(work.number);
                                        if (pdfFile) {
                                            await uploadImage(work.id, pdfFile);
                                        }
                                    }}
                                >
                                    {work.number}
                                </Link>
                            ) : (
                                <span 
                                    className="text-sm font-medium text-primary text-center"
                                    title={work.number}
                                >
                                    {work.number}
                                </span>
                            )}
                            {work.reports?.map(report => (
                                <span 
                                    key={report.ref_no} 
                                    className="text-xs text-default-500 text-center"
                                    title={`• ${report.ref_no}`}
                                >
                                    • {report.ref_no}
                                </span>
                            ))}
                        </div>
                    </TableCell>
                );

            case "status":
                return (
                    <TableCell className="min-w-56">
                        <div className="flex items-center justify-center gap-2 w-full">
                            {canUserUpdateStatus(work) ? (
                                <Select
                                    size="sm"
                                    color={(() => {
                                        const statusKey = getStatusKey(work.status, work.inspection_result);
                                        return statusConfig[statusKey]?.color || 'default';
                                    })()}
                                    variant="bordered"
                                    placeholder="Select status"
                                    aria-label="Select work status"
                                    selectedKeys={work.status ? [getStatusKey(work.status, work.inspection_result)] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0];
                                        if (selectedKey) {
                                            updateWorkStatus(work, selectedKey);
                                        }
                                    }}
                                    isDisabled={updatingWorkId === work.id}
                                    radius={getThemeRadius()}
                                    classNames={{
                                        trigger: `min-h-10 w-full transition-colors`,
                                        value: "text-sm font-medium",
                                        popoverContent: "min-w-[210px]"
                                    }}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                    renderValue={(items) => {
                                        if (items.length === 0) {
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <ExclamationTriangleSolid className="w-4 h-4 text-default-400" />
                                                    <span className="text-xs">Select status</span>
                                                </div>
                                            );
                                        }
                                        const statusKey = getStatusKey(work.status, work.inspection_result);
                                        const currentStatus = statusConfig[statusKey] || statusConfig['new'];
                                        const StatusIcon = currentStatus.icon;
                                        return (
                                            <div className="flex items-center gap-2">
                                                <StatusIcon className="w-4 h-4" />
                                                <span className="text-xs font-medium">{currentStatus.label}</span>
                                            </div>
                                        );
                                    }}
                                >
                                    {Object.keys(statusConfig).map((status) => {
                                        const config = statusConfig[status];
                                        const StatusIcon = config.icon;
                                        return (
                                            <SelectItem 
                                                key={status} 
                                                textValue={config.label}
                                                color={config.color}
                                                startContent={<StatusIcon className="w-4 h-4" />}
                                           
                                                classNames={{
                                                    title: "text-sm font-medium",
                                                    description: "text-sm"
                                                }}
                                            >
                                                {config.label}
                                            </SelectItem>
                                        );
                                    })}
                                </Select>
                            ) : (
                                getStatusChip(work.status, work.inspection_result)
                            )}
                        </div>
                    </TableCell>
                );

            case "type":
                return (
                    <TableCell className={cellBaseClasses}>
                        <div className="flex items-center justify-center gap-2">
                            {getWorkTypeIcon(work.type, "w-4 h-4")}
                            <span className="text-sm font-medium capitalize">
                                {work.type || 'Standard Work'}
                            </span>
                        </div>
                    </TableCell>
                );

            case "description":
                return (
                    <TableCell className={`max-w-60 ${cellBaseClasses}`}>
                        <div className="w-full">
                            <span 
                                className="text-sm text-default-600 leading-tight line-clamp-2 break-words"
                                style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    wordBreak: 'break-word',
                                    lineHeight: '1.3',
                                    maxHeight: '2.6em'
                                }}
                                title={work.description || "No description provided"}
                            >
                                {work.description || "No description provided"}
                            </span>
                        </div>
                    </TableCell>
                );

            case "location":
                return (
                    <TableCell className="max-w-48">
                        <div className="flex flex-col items-center justify-center gap-1">
                            <div className="flex items-center justify-center gap-2">
                                <MapPinIcon className="w-3 h-3 text-default-500 shrink-0" />
                                <span 
                                    className="text-sm font-medium leading-tight line-clamp-2 break-words text-center"
                                    style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        wordBreak: 'break-word',
                                        lineHeight: '1.3',
                                        maxHeight: '2.6em'
                                    }}
                                    title={work.location || 'Location not specified'}
                                >
                                    {work.location || 'Location not specified'}
                                </span>
                            </div>
                        </div>
                    </TableCell>
                );

            case "side":
                return (
                    <TableCell>
                        <div className="flex items-center justify-center">
                            <Chip 
                                size="sm" 
                                variant="flat" 
                                color="default"
                                className="capitalize"
                            >
                                {work.side || 'Both Sides'}
                            </Chip>
                        </div>
                    </TableCell>
                );

            case "qty_layer":
                return (
                    <TableCell>
                        <div className="flex items-center justify-center">
                            <span className="text-sm">
                                {work.qty_layer ? work.qty_layer : 'N/A'}
                            </span>
                        </div>
                    </TableCell>
                );

            case "planned_time":
                return (
                    <TableCell>
                        <div className="flex items-center justify-center gap-1">
                            <ClockIcon className="w-3 h-3 text-default-500" />
                            <span className="text-sm">
                                {work.planned_time || 'Not set'}
                            </span>
                        </div>
                    </TableCell>
                );

            case "resubmission_count":
                return (
                    <TableCell>
                        <div className="flex items-center justify-center">
                            <Chip 
                                size="sm" 
                                variant="flat" 
                                color={work.resubmission_count > 0 ? "warning" : "default"}
                            >
                                {work.resubmission_count || 0}
                            </Chip>
                        </div>
                    </TableCell>
                );

            case "incharge":
                return (
                    <TableCell className="w-64">
                        <div className="flex items-center justify-center">
                            {userIsAdmin ? (
                                <Select
                                    size="sm"
                                    variant="bordered"
                                    radius={getThemeRadius()}
                                    placeholder="Select in-charge"
                                    aria-label="Select in-charge person"
                                    selectedKeys={work.incharge && finalInCharges.find(user => user.id === parseInt(work.incharge)) 
                                        ? [String(work.incharge)] 
                                        : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0];
                                        if (selectedKey) {
                                            debouncedUpdateIncharge(work.id, selectedKey);
                                        }
                                    }}
                                    classNames={{
                                        trigger: "min-h-10 w-full bg-white/50 hover:bg-white/80 focus:bg-white/90 transition-colors",
                                        value: "text-sm leading-tight",
                                        popoverContent: "w-64"
                                    }}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                renderValue={(items) => {
                                    if (items.length === 0) {
                                        return (
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="w-4 h-4 text-default-400" />
                                                <span className="text-xs">Select in-charge</span>
                                            </div>
                                        );
                                    }
                                    return items.map((item) => (
                                        <div key={item.key} className="flex items-center justify-center gap-2">
                                            <ProfileAvatar
                                                src={inchargeUser.profile_image_url || inchargeUser.profile_image}
                                                size="sm"
                                                name={inchargeUser.name}
                                                showBorder
                                            />
                                            <span 
                                                className="text-xs font-medium leading-tight break-words"
                                                style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 1,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    wordBreak: 'break-word'
                                                }}
                                                title={inchargeUser.name}
                                            >
                                                {inchargeUser.name}
                                            </span>
                                        </div>
                                    ));
                                }}
                            >
                                {finalInCharges?.map((incharge) => (
                                    <SelectItem key={incharge.id} textValue={incharge.name}>
                                        <User
                                            size="sm"
                                            name={incharge.name}
                                            description={`Employee ID: ${incharge.employee_id || 'N/A'}`}
                                            avatarProps={{
                                                size: "sm",
                                                src: incharge.profile_image_url || incharge.profile_image,
                                                name: incharge.name,
                                                ...getProfileAvatarTokens({
                                                    name: incharge.name,
                                                    size: 'sm',
                                                }),
                                            }}
                                        />
                                    </SelectItem>
                                ))}
                            </Select>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                {inchargeUser.name !== 'Unassigned' ? (
                                    <User
                                        size="sm"
                                        name={
                                            <span 
                                                style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 1,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    wordBreak: 'break-word',
                                                    lineHeight: '1.3'
                                                }}
                                                title={inchargeUser.name}
                                            >
                                                {inchargeUser.name}
                                            </span>
                                        }
                                        description="In-charge"
                                        avatarProps={{
                                            size: "sm",
                                            src: inchargeUser.profile_image_url || inchargeUser.profile_image,
                                            name: inchargeUser.name,
                                            ...getProfileAvatarTokens({
                                                name: inchargeUser.name,
                                                size: 'sm',
                                            }),
                                        }}
                                        classNames={{
                                            name: "text-xs font-medium leading-tight",
                                            description: "text-xs text-default-400"
                                        }}
                                    />
                                ) : (
                                    <Chip size="sm" variant="flat" color="default">
                                        Unassigned
                                    </Chip>
                                )}
                            </div>
                        )}
                        </div>
                    </TableCell>
                );

            case "assigned":
                return (
                    <TableCell className="w-64 text-center">
                        <div className="flex items-center justify-center">
                            {canUserAssign(work) ? (
                                <Select
                                    size="sm"
                                    variant="bordered"
                                    radius={getThemeRadius()}
                                    placeholder="Select assignee"
                                    aria-label="Select assigned person"
                                    selectedKeys={work.assigned && getAvailableAssignees(work.incharge).find(user => user.id === parseInt(work.assigned))
                                        ? [String(work.assigned)]
                                        : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0];
                                        if (selectedKey) {
                                            debouncedUpdateAssigned(work.id, selectedKey);
                                        }
                                    }}
                                    classNames={{
                                        trigger: "min-h-10 w-full bg-white/50 hover:bg-white/80 focus:bg-white/90 transition-colors",
                                        value: "text-sm leading-tight text-center",
                                        popoverContent: "w-64"
                                    }}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                    renderValue={(items) => {
                                        if (items.length === 0) {
                                        return (
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="w-4 h-4 text-default-400" />
                                                <span className="text-xs">Select assignee</span>
                                            </div>
                                        );
                                    }
                                    return items.map((item) => (
                                        <div key={item.key} className="flex items-center gap-2">
                                            <ProfileAvatar
                                                src={assignedUser.profile_image_url || assignedUser.profile_image}
                                                size="sm"
                                                name={assignedUser.name}
                                                showBorder
                                            />
                                            <span 
                                                className="text-xs font-medium leading-tight break-words"
                                                style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 1,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    wordBreak: 'break-word'
                                                }}
                                                title={assignedUser.name}
                                            >
                                                {assignedUser.name}
                                            </span>
                                        </div>
                                    ));
                                }}
                            >
                                {getAvailableAssignees(work.incharge)?.map((assignee) => (
                                    <SelectItem key={assignee.id} textValue={assignee.name}>
                                        <User
                                            size="sm"
                                            name={assignee.name}
                                            description={assignee.designation_title || assignee.designation?.title || 'Staff'}
                                            avatarProps={{
                                                size: "sm",
                                                src: assignee.profile_image_url || assignee.profile_image,
                                                name: assignee.name,
                                                ...getProfileAvatarTokens({
                                                    name: assignee.name,
                                                    size: 'sm',
                                                }),
                                            }}
                                        />
                                    </SelectItem>
                                ))}
                            </Select>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                {assignedUser.name !== 'Unassigned' ? (
                                    <User
                                        size="sm"
                                        name={
                                            <span 
                                                style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 1,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    wordBreak: 'break-word',
                                                    lineHeight: '1.3'
                                                }}
                                                title={assignedUser.name}
                                            >
                                                {assignedUser.name}
                                            </span>
                                        }
                                        description="Assigned"
                                        avatarProps={{
                                            size: "sm",
                                            src: assignedUser.profile_image_url || assignedUser.profile_image,
                                            name: assignedUser.name,
                                            ...getProfileAvatarTokens({
                                                name: assignedUser.name,
                                                size: 'sm',
                                            }),
                                        }}
                                        classNames={{
                                            name: "text-xs font-medium leading-tight",
                                            description: "text-xs text-default-400"
                                        }}
                                    />
                                ) : (
                                    <Chip size="sm" variant="flat" color="default">
                                        Unassigned
                                    </Chip>
                                )}
                            </div>
                        )}
                        </div>
                    </TableCell>
                );

            case "completion_time":
                return (
                    <TableCell>
                        <div className="flex items-center justify-center">
                            <Input
                                size="sm"
                                type="datetime-local"
                                variant="bordered"
                                value={work.completion_time
                                    ? new Date(work.completion_time).toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16)
                                    : ''
                                }
                                onChange={(e) => debouncedUpdateCompletionTime(work.id, e.target.value)}
                                startContent={
                                    <CheckCircleIcon className="w-4 h-4 text-default-400" />
                                }
                                classNames={{
                                    input: "text-xs text-center",
                                    inputWrapper: "min-h-10 bg-content2/50 hover:bg-content2/80 focus-within:bg-content2/90 border-divider/50 hover:border-divider data-[focus]:border-primary"
                                }}
                                style={{
                                    fontFamily: 'var(--font-family)',
                                }}
                            />
                        </div>
                    </TableCell>
                );

            case "rfi_submission_date":
                return (
                    <TableCell>
                        {userIsAdmin ? (
                            <div className="flex items-center justify-center">
                                <Input
                                    size="sm"
                                    type="date"
                                    variant="bordered"
                                    value={work.rfi_submission_date ? 
                                        new Date(work.rfi_submission_date).toISOString().slice(0, 10) : ''
                                    }
                                    onChange={(e) => debouncedUpdateSubmissionTime(work.id, e.target.value)}
                                    startContent={
                                        <CalendarDaysIcon className="w-4 h-4 text-default-400" />
                                    }
                                    classNames={{
                                        input: "text-xs text-center",
                                        inputWrapper: "min-h-10 bg-content2/50 hover:bg-content2/80 focus-within:bg-content2/90 border-divider/50 hover:border-divider data-[focus]:border-primary"
                                    }}
                                    style={{
                                        fontFamily: 'var(--font-family)',
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-1">
                                <CalendarDaysIcon className="w-3 h-3 text-default-500" />
                                <span className="text-sm">
                                    {work.rfi_submission_date ? formatDate(work.rfi_submission_date) : 'Not set'}
                                </span>
                            </div>
                        )}
                    </TableCell>
                );

            case "actions":
                return (
                    <TableCell>
                        <div className="flex items-center justify-center gap-1">
                            <Tooltip content="Edit Work">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="ghost"
                                    color="primary"
                                    radius={getThemeRadius()}
                                    onPress={() => {
                                        if (updatingWorkId === work.id) return;
                                        setCurrentRow(work);
                                        openModal("editDailyWork");
                                    }}
                                    className="min-w-8 h-8"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                            <Tooltip content="Delete Work" color="danger">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="ghost"
                                    color="danger"
                                    radius={getThemeRadius()}
                                    onPress={() => {
                                        if (updatingWorkId === work.id) return;
                                        setCurrentRow(work);
                                        handleClickOpen(work.id, "deleteDailyWork");
                                    }}
                                    className="min-w-8 h-8"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        </div>
                    </TableCell>
                );

            default:
                return <TableCell>{work[columnKey]}</TableCell>;
        }
    }, [userIsAdmin, userIsSE, updatingWorkId, setCurrentRow, openModal, handleClickOpen, handleChange]);

    const columns = [
        { name: "Date", uid: "date", icon: CalendarDaysIcon, sortable: true, width: "w-24" },
        { name: "RFI Number", uid: "number", icon: DocumentIcon, sortable: true, width: "w-32" },
        { name: "Status", uid: "status", icon: ClockIconOutline, sortable: true, width: "w-56" },
        { name: "Work Type", uid: "type", icon: DocumentTextIcon, sortable: true, width: "w-28" },
        { name: "Description", uid: "description", icon: DocumentTextIcon, sortable: false, width: "w-60" },
        { name: "Location", uid: "location", icon: MapPinIcon, sortable: true, width: "w-48" },
        { name: "Road Side", uid: "side", sortable: true, width: "w-20" },
        { name: "Layer Quantity", uid: "qty_layer", sortable: true, width: "w-24" },
        ...(userIsAdmin ? [{ name: "In-Charge", uid: "incharge", icon: UserIcon, sortable: true, width: "w-64" }] : []),
        ...(shouldShowAssignedColumn ? [{ name: "Assigned To", uid: "assigned", icon: UserIcon, sortable: true, width: "w-64" }] : []),
        { name: "Planned Time", uid: "planned_time", icon: ClockIcon, sortable: true, width: "w-28" },
        { name: "Completion Time", uid: "completion_time", icon: CheckCircleIcon, sortable: true, width: "w-56" },
        { name: "Resubmissions", uid: "resubmission_count", icon: ArrowPathIcon, sortable: true, width: "w-28" },
        ...(userIsAdmin ? [{ name: "RFI Submission Date", uid: "rfi_submission_date", icon: CalendarDaysIcon, sortable: true, width: "w-36" }] : []),
        ...(userIsAdmin ? [{ name: "Actions", uid: "actions", sortable: false, width: "w-20" }] : [])
    ];

    if (isMobile) {
        return (
            <div className="space-y-4">
                <ScrollShadow className="max-h-[70vh]">
                    <MobileDailyWorkCard 
                        works={allData || []} 
                        selectedTab={selectedTab}
                        setSelectedTab={setSelectedTab}
                        expandedItems={expandedItems}
                        toggleExpanded={toggleExpanded}
                    />
                </ScrollShadow>
                {!isMobile && totalRows > 30 && (
                    <div className="flex justify-center pt-4">
                        <Pagination
                            showControls
                            showShadow
                            color="primary"
                            variant="bordered"
                            page={currentPage}
                            total={lastPage}
                            onChange={handlePageChange}
                            size="sm"
                            radius={getThemeRadius()}
                            classNames={{
                                wrapper: "bg-content1/80 backdrop-blur-md border-divider/50",
                                item: "bg-content1/50 border-divider/30",
                                cursor: "bg-primary/20 backdrop-blur-md"
                            }}
                            style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                        />
                    </div>
                )}
            </div>
        );
    }

    // Desktop Table Loading Skeleton
    const DesktopLoadingSkeleton = () => {
        return (
            <div className="max-h-[84vh] overflow-y-auto">
                {/* Header skeleton */}
                <div className="flex items-center justify-between mb-4 px-2">
                    <Skeleton className="w-32 h-6 rounded" />
                    <Skeleton className="w-20 h-8 rounded" />
                </div>
                
                <ScrollShadow className="max-h-[70vh]">
                    <div className="border border-divider rounded-lg overflow-hidden">
                        {/* Table header skeleton */}
                        <div className="bg-default-100/80 backdrop-blur-md border-b border-divider">
                            <div className="flex">
                                {columns.map((column, index) => (
                                    <div key={index} className="flex-1 p-3 flex items-center justify-center gap-1">
                                        <Skeleton className="w-3 h-3 rounded" />
                                        <Skeleton className="w-16 h-4 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Table body skeleton */}
                        <div className="divide-y divide-divider">
                            {Array.from({ length: 8 }).map((_, rowIndex) => (
                                <div key={rowIndex} className="flex bg-content1 hover:bg-content2/50">
                                    {columns.map((column, colIndex) => (
                                        <div key={colIndex} className="flex-1 p-3 flex items-center justify-center">
                                            {column.uid === 'status' ? (
                                                <Skeleton className="w-32 h-8 rounded" />
                                            ) : column.uid === 'description' ? (
                                                <div className="w-full space-y-1">
                                                    <Skeleton className="w-full h-3 rounded" />
                                                    <Skeleton className="w-3/4 h-3 rounded" />
                                                </div>
                                            ) : column.uid === 'incharge' || column.uid === 'assigned' ? (
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="w-8 h-8 rounded-full" />
                                                    <Skeleton className="w-20 h-4 rounded" />
                                                </div>
                                            ) : column.uid === 'completion_time' || column.uid === 'rfi_submission_date' ? (
                                                <Skeleton className="w-32 h-8 rounded" />
                                            ) : column.uid === 'actions' ? (
                                                <div className="flex gap-1">
                                                    <Skeleton className="w-8 h-8 rounded" />
                                                    <Skeleton className="w-8 h-8 rounded" />
                                                </div>
                                            ) : column.uid === 'side' || column.uid === 'resubmission_count' ? (
                                                <Skeleton className="w-16 h-6 rounded-full" />
                                            ) : (
                                                <Skeleton className="w-20 h-4 rounded" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollShadow>
                
                {/* Pagination skeleton */}
                <div className="py-4 flex justify-center">
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-8 h-8 rounded" />
                        <Skeleton className="w-8 h-8 rounded" />
                        <Skeleton className="w-8 h-8 rounded" />
                        <Skeleton className="w-8 h-8 rounded" />
                        <Skeleton className="w-8 h-8 rounded" />
                    </div>
                </div>
            </div>
        );
    };

    // Show loading skeleton when loading
    if (loading) {
        return <DesktopLoadingSkeleton />;
    }

    return (
        <div className="max-h-[84vh] overflow-y-auto">
            {/* Table Header with Refresh Button */}
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-lg font-semibold text-default-700">Daily Works</h3>
                <Button
                    variant="flat"
                    color="primary"
                    size="sm"
                    radius={getThemeRadius()}
                    style={{
                        backgroundColor: 'rgba(var(--color-primary), 0.1)',
                        borderColor: 'rgba(var(--color-primary), 0.3)',
                        color: 'var(--color-text)'
                    }}
                    onClick={handleRefresh}
                    startContent={<ArrowPathIcon className="w-4 h-4" />}
                >
                    Refresh
                </Button>
            </div>
            
            <ScrollShadow className="max-h-[70vh]">
                <Table
                    selectionMode="none"
                    isCompact
                    removeWrapper
                    isStriped
                    aria-label="Daily Works Management Table"
                    isHeaderSticky
                    radius={getThemeRadius()}
                    classNames={{
                        base: "max-h-[520px] overflow-auto",
                        table: "min-h-[200px] w-full",
                        thead: "z-10",
                        tbody: "overflow-y-auto",
                        th: "bg-default-100 text-default-700 font-semibold",
                        td: "text-default-600",
                    }}
                    style={{
                        borderRadius: `var(--borderRadius, 12px)`,
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn 
                                key={column.uid} 
                                align={column.uid === "description" ? "start" : "center"}
                                className={`bg-default-100/80 backdrop-blur-md ${column.width || ''}`}
                                style={{
                                    minWidth: column.uid === "description" ? "240px" : 
                                            column.uid === "location" ? "192px" :
                                            column.uid === "number" ? "128px" :
                                            column.uid === "status" ? "192px" :
                                            "auto"
                                }}
                            >
                                <div className={`flex items-center gap-1 ${column.uid === "description" ? "justify-start" : "justify-center"}`}>
                                    {column.icon && <column.icon className="w-3 h-3" />}
                                    <span className="text-xs font-semibold">{column.name}</span>
                                </div>
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody 
                        items={allData || []}
                        emptyContent={
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <DocumentTextIcon className="w-12 h-12 text-default-300 mb-4" />
                                <h6 className="text-lg font-medium text-default-600">
                                    No daily works found
                                </h6>
                                <span className="text-sm text-default-500">
                                    No work logs available for the selected period
                                </span>
                            </div>
                        }
                    >
                        {(work) => (
                            <TableRow 
                                key={work.id} 
                            >
                                {(columnKey) => renderCell(work, columnKey)}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollShadow>
            {!isMobile && totalRows > 30 && (
                <div className="py-4 flex justify-center">
                    <Pagination
                        showControls
                        showShadow
                        color="primary"
                        variant="bordered"
                        page={currentPage}
                        total={lastPage}
                        onChange={handlePageChange}
                        size={isMediumScreen ? "sm" : "md"}
                        radius={getThemeRadius()}
                        classNames={{
                            wrapper: "bg-content1/80 backdrop-blur-md border-divider/50",
                            item: "bg-content1/50 border-divider/30",
                            cursor: "bg-primary/20 backdrop-blur-md"
                        }}
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default DailyWorksTable;
