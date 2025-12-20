import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { getThemeRadius } from '@/Hooks/useThemeRadius.js';
import { usePage, router } from "@inertiajs/react";
import { showToast } from '@/utils/toastUtils';
import { debounce } from "lodash";
import StatsCards from '@/Components/StatsCards';
import ProfileAvatar, { getProfileAvatarTokens } from '@/Components/ProfileAvatar';
import SwipeableCard from '@/Components/Common/SwipeableCard';
import RfiFilesModal from '@/Components/DailyWork/RfiFilesModal';
import StatusUpdateModal from '@/Components/StatusUpdateModal';
import ObjectionsModal from '@/Components/DailyWork/ObjectionsModal';
import ObjectionWarningModal from '@/Components/DailyWork/ObjectionWarningModal';
import BulkSubmitModal from '@/Components/DailyWork/BulkSubmitModal';
import BulkImportSubmitModal from '@/Components/DailyWork/BulkImportSubmitModal';
import BulkResponseStatusModal from '@/Components/DailyWork/BulkResponseStatusModal';
import BulkImportResponseStatusModal from '@/Components/DailyWork/BulkImportResponseStatusModal';

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
    DocumentArrowDownIcon,
    DocumentCheckIcon,
    XCircleIcon,
    PlusIcon,
    EyeIcon,
    FolderOpenIcon,
    ShieldExclamationIcon,
    ClipboardDocumentCheckIcon,
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

// Utility function to highlight matching text in search results
const HighlightedText = ({ text, searchTerm }) => {
    if (!searchTerm || !text) return <>{text}</>;
    
    const textStr = String(text);
    const searchLower = searchTerm.toLowerCase();
    const textLower = textStr.toLowerCase();
    const index = textLower.indexOf(searchLower);
    
    if (index === -1) return <>{textStr}</>;
    
    const before = textStr.slice(0, index);
    const match = textStr.slice(index, index + searchTerm.length);
    const after = textStr.slice(index + searchTerm.length);
    
    return (
        <>
            {before}
            <mark className="bg-warning-200 text-warning-800 dark:bg-warning-800/40 dark:text-warning-200 px-0.5 rounded">
                {match}
            </mark>
            {after}
        </>
    );
};

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
    onPageChange,
    searchTerm = ''
}) => {
    const { auth, users, jurisdictions } = usePage().props;
    const isLargeScreen = useMediaQuery('(min-width: 1025px)');
    const isMediumScreen = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
    const isMobile = useMediaQuery('(max-width: 640px)');

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
    
    // Define work types for mobile tabs - shared between loading skeleton and actual component
    const workTypes = [
        { key: "structure", label: "Structure", icon: "🏗️" },
        { key: "embankment", label: "Embankment", icon: "🏔️" },
        { key: "pavement", label: "Pavement", icon: "🛣️" }
    ];
    
    // Mobile accordion state - persist across all updates and re-renders
    const [expandedItems, setExpandedItems] = useState(new Set());
    
    // RFI Files Modal state
    const [rfiModalOpen, setRfiModalOpen] = useState(false);
    const [rfiModalWork, setRfiModalWork] = useState(null);
    
    // Status Update Modal state
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusModalWork, setStatusModalWork] = useState(null);
    
    // Objections Modal state
    const [objectionsModalOpen, setObjectionsModalOpen] = useState(false);
    const [objectionsModalWork, setObjectionsModalWork] = useState(null);
    
    // Objection Warning Modal state (for submission date changes)
    const [objectionWarningModal, setObjectionWarningModal] = useState({
        isOpen: false,
        dailyWork: null,
        newSubmissionDate: null,
        activeObjectionsCount: 0,
        activeObjections: [],
        isLoading: false,
    });

    // Bulk selection state
    const [selectedKeys, setSelectedKeys] = useState(new Set([]));
    const [bulkSubmitModalOpen, setBulkSubmitModalOpen] = useState(false);
    const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false);
    const [bulkResponseStatusModalOpen, setBulkResponseStatusModalOpen] = useState(false);
    const [bulkImportResponseStatusModalOpen, setBulkImportResponseStatusModalOpen] = useState(false);

    // Get selected works for bulk operations
    const selectedWorks = useMemo(() => {
        if (selectedKeys === "all") {
            return allData || [];
        }
        return (allData || []).filter(work => selectedKeys.has(String(work.id)));
    }, [selectedKeys, allData]);

    // Handle bulk submit success - update local state without page reload
    const handleBulkSubmitSuccess = useCallback((result) => {
        // Clear selection
        setSelectedKeys(new Set([]));
        
        // Update local state with the submitted works from the response
        if (result?.submitted && result.submitted.length > 0 && setData) {
            const updatedWorksMap = new Map(
                result.submitted
                    .filter(item => item.dailyWork)
                    .map(item => [item.dailyWork.id, item.dailyWork])
            );
            
            if (updatedWorksMap.size > 0) {
                setData(prevWorks =>
                    prevWorks.map(w =>
                        updatedWorksMap.has(w.id) ? updatedWorksMap.get(w.id) : w
                    )
                );
            }
        }
    }, [setData]);

    // Handle bulk import success - update local state without page reload
    const handleBulkImportSuccess = useCallback((result) => {
        // Update local state with the submitted works from the response
        if (result?.submitted && result.submitted.length > 0 && setData) {
            const updatedWorksMap = new Map(
                result.submitted
                    .filter(item => item.dailyWork)
                    .map(item => [item.dailyWork.id, item.dailyWork])
            );
            
            if (updatedWorksMap.size > 0) {
                setData(prevWorks =>
                    prevWorks.map(w =>
                        updatedWorksMap.has(w.id) ? updatedWorksMap.get(w.id) : w
                    )
                );
            }
        }
    }, [setData]);

    // Handle bulk response status success - update local state without page reload
    const handleBulkResponseStatusSuccess = useCallback((result) => {
        // Clear selection
        setSelectedKeys(new Set([]));
        
        // Update local state with the updated works from the response
        if (result?.updated && result.updated.length > 0 && setData) {
            const updatedWorksMap = new Map(
                result.updated
                    .filter(item => item.dailyWork)
                    .map(item => [item.dailyWork.id, item.dailyWork])
            );
            
            if (updatedWorksMap.size > 0) {
                setData(prevWorks =>
                    prevWorks.map(w =>
                        updatedWorksMap.has(w.id) ? updatedWorksMap.get(w.id) : w
                    )
                );
            }
        }
    }, [setData]);

    // Handle bulk import response status success - update local state without page reload
    const handleBulkImportResponseStatusSuccess = useCallback((result) => {
        // Update local state with the updated works from the response
        if (result?.updated && result.updated.length > 0 && setData) {
            const updatedWorksMap = new Map(
                result.updated
                    .filter(item => item.dailyWork)
                    .map(item => [item.dailyWork.id, item.dailyWork])
            );
            
            if (updatedWorksMap.size > 0) {
                setData(prevWorks =>
                    prevWorks.map(w =>
                        updatedWorksMap.has(w.id) ? updatedWorksMap.get(w.id) : w
                    )
                );
            }
        }
    }, [setData]);
    
    // Function to open Status Update modal
    const openStatusModal = useCallback((work) => {
        setStatusModalWork(work);
        setStatusModalOpen(true);
    }, []);
    
    // Function to handle status update from modal
    const handleStatusUpdated = useCallback((updatedWork) => {
        if (updatedWork && setData) {
            setData(prevWorks =>
                prevWorks.map(w =>
                    w.id === updatedWork.id ? updatedWork : w
                )
            );
        }
    }, [setData]);
    
    // Function to open RFI files modal
    const openRfiFilesModal = useCallback((work) => {
        setRfiModalWork(work);
        setRfiModalOpen(true);
    }, []);
    
    // Function to open Objections modal
    const openObjectionsModal = useCallback((work) => {
        setObjectionsModalWork(work);
        setObjectionsModalOpen(true);
    }, []);
    
    // Function to handle objections update - update local state without full reload
    const handleObjectionsUpdated = useCallback((workId, newActiveCount) => {
        if (workId && setData) {
            // Update the local data to reflect new objection count
            const updatedData = allData.map(w => 
                w.id === workId ? { ...w, active_objections_count: newActiveCount } : w
            );
            setData(updatedData);
            
            // Also update the modal work if it's the same
            if (objectionsModalWork?.id === workId) {
                setObjectionsModalWork(prev => prev ? { ...prev, active_objections_count: newActiveCount } : prev);
            }
        }
    }, [allData, setData, objectionsModalWork]);
    
    // Function to handle files update from modal
    const handleRfiFilesUpdated = useCallback((newCount) => {
        // Update the local data to reflect new file count
        if (rfiModalWork && setData) {
            const updatedData = allData.map(w => 
                w.id === rfiModalWork.id ? { ...w, rfi_files_count: newCount } : w
            );
            setData(updatedData);
        }
    }, [rfiModalWork, allData, setData]);
    
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
    const userIsAdmin = auth.roles?.includes('Administrator') || auth.roles?.includes('Super Administrator') || auth.roles?.includes('Daily Work Manager') || false;
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
    
    // Check if user can create/manage objections for a specific work
    // Only incharge, assigned, or admin can raise objections
    const canUserCreateObjections = (work) => {
        return userIsAdmin || isUserInchargeOfWork(work) || isUserAssigneeOfWork(work);
    };
    
    // Check if user can review objections (admin/manager level)
    // Managers include: Super Admin, Admin, Project Manager, Consultant, HR Manager
    const canUserReviewObjections = () => {
        const managerRoles = ['Super Administrator', 'Administrator', 'Project Manager', 'Consultant', 'HR Manager'];
        return auth.roles?.some(role => managerRoles.includes(role)) || false;
    };
    
    // Check if user is only an incharge (not admin)
    const isUserOnlyIncharge = useMemo(() => {
        if (userIsAdmin) return false;
        return allData?.some(work => isUserInchargeOfWork(work)) || false;
    }, [userIsAdmin, allData, auth.user?.id]);
    
    // Check if user is only an assignee (not admin and not incharge)
    const isUserOnlyAssignee = useMemo(() => {
        if (userIsAdmin) return false;
        if (isUserOnlyIncharge) return false;
        return allData?.some(work => isUserAssigneeOfWork(work)) || false;
    }, [userIsAdmin, isUserOnlyIncharge, allData, auth.user?.id]);
    
    // Check if user should see the incharge column (only admins)
    const shouldShowInchargeColumn = useMemo(() => {
        return userIsAdmin;
    }, [userIsAdmin]);
    
    // Check if user should see the assigned column
    // - Admins and incharges should see the column
    // - Assignees should NOT see the column
    const shouldShowAssignedColumn = useMemo(() => {
        if (userIsAdmin) return true;
        if (isUserOnlyIncharge) return true;
        // Assignees don't see assignee column
        return false;
    }, [userIsAdmin, isUserOnlyIncharge]);
    
    // Check if user should see the RFI submission date column (only admins)
    const shouldShowRfiColumn = useMemo(() => {
        return userIsAdmin;
    }, [userIsAdmin]);
    
    // Check if user should see edit/delete actions (only admins)
    const shouldShowActions = useMemo(() => {
        return userIsAdmin;
    }, [userIsAdmin]);

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
        
        // Map statuses - return as-is if valid, default to 'new'
        const validStatuses = ['new', 'in-progress', 'completed', 'rejected', 'resubmission', 'pending', 'emergency'];
        if (validStatuses.includes(statusLower)) {
            return statusLower;
        }
        
        // Default completed to pass if no inspection result
        if (statusLower === 'completed') {
            return 'completed:pass';
        }
        
        return 'new';
    };

    // Status configuration - consistent with backend DailyWork::$statuses and $inspectionResults
    const statusConfig = {
        // Base statuses (without inspection result)
        'new': {
            color: 'primary',
            icon: PlusIconSolid,
            label: 'New',
        },
        'in-progress': {
            color: 'secondary',
            icon: ArrowPathSolid,
            label: 'In Progress',
        },
        'pending': {
            color: 'default',
            icon: ClockSolid,
            label: 'Pending',
        },
        'rejected': {
            color: 'danger',
            icon: XCircleSolid,
            label: 'Rejected',
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
        },
        // Completed statuses with inspection results (matching database enum: pass, fail, conditional, pending)
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
        'completed:conditional': {
            color: 'warning',
            icon: CheckCircleSolid,
            label: 'Completed: Conditional',
        },
        'completed:pending': {
            color: 'default',
            icon: CheckCircleSolid,
            label: 'Completed: Pending Review',
        },
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
                console.error('Error updating work status:', error.response?.data || error.message || error);
                let errorMsg = "Failed to update work status";
                
                if (error.response?.status === 422 && error.response.data?.errors) {
                    // Handle validation errors
                    const errors = error.response.data.errors;
                    const errorMessages = Object.values(errors).flat();
                    errorMsg = errorMessages.join(', ');
                } else if (error.response?.data?.error) {
                    errorMsg = error.response.data.error;
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
        const promise = new Promise(async (resolve, reject) => {
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
                    resolve('Completion time updated successfully');
                }
            } catch (error) {
                console.error('Error updating completion time:', error.response?.data || error.message || error);
                reject(error.response?.data?.error || error.response?.data?.message || 'Failed to update completion time');
            }
        });

        showToast.promise(promise, {
            loading: 'Updating completion time...',
            success: (msg) => msg,
            error: (msg) => msg,
        });
    }, [setData]);

    // Handle submission time updates
    const updateSubmissionTime = useCallback(async (work, submissionTime) => {
        const promise = new Promise(async (resolve, reject) => {
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
                    resolve('Submission time updated successfully');
                }
            } catch (error) {
                console.error('Error updating submission time:', error.response?.data || error.message || error);
                reject(error.response?.data?.error || error.response?.data?.message || 'Failed to update submission time');
            }
        });

        showToast.promise(promise, {
            loading: 'Updating submission time...',
            success: (msg) => msg,
            error: (msg) => msg,
        });
    }, [setData]);

  

    // Create a ref to store the current allData and setData
    const allDataRef = useRef(allData);
    const setDataRef = useRef(setData);
    allDataRef.current = allData;
    setDataRef.current = setData;

 

    // Debounced function for updating incharge
    const debouncedUpdateIncharge = useMemo(
        () => debounce(async (workId, inchargeId) => {
            const work = allDataRef.current?.find(w => w.id === workId);
            if (!work) {
                showToast.error('Work not found');
                return;
            }

            const promise = new Promise(async (resolve, reject) => {
                try {
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
                        resolve('Incharge updated successfully');
                    }
                } catch (error) {
                    console.error('Error updating incharge:', error.response?.data || error.message || error);
                    reject(error.response?.data?.error || error.response?.data?.message || 'Failed to update incharge');
                }
            });

            showToast.promise(promise, {
                loading: 'Updating incharge...',
                success: (msg) => msg,
                error: (msg) => msg,
            });
        }, 500), // 0.5 second delay for dropdowns
        []
    );

    // Debounced function for updating assigned user
    const debouncedUpdateAssigned = useMemo(
        () => debounce(async (workId, assignedId) => {
            const work = allDataRef.current?.find(w => w.id === workId);
            if (!work) {
                showToast.error('Work not found');
                return;
            }

            const promise = new Promise(async (resolve, reject) => {
                try {
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
                        resolve('Assigned user updated successfully');
                    }
                } catch (error) {
                    console.error('Error updating assigned user:', error.response?.data || error.message || error);
                    reject(error.response?.data?.error || error.response?.data?.message || 'Failed to update assigned user');
                }
            });

            showToast.promise(promise, {
                loading: 'Updating assigned user...',
                success: (msg) => msg,
                error: (msg) => msg,
            });
        }, 500), // 0.5 second delay for dropdowns
        []
    );

    // Debounced function for updating completion time
    const debouncedUpdateCompletionTime = useMemo(
        () => debounce(async (workId, completionTime) => {
            const work = allDataRef.current?.find(w => w.id === workId);
            if (!work) {
                showToast.error('Work not found');
                return;
            }

            const promise = new Promise(async (resolve, reject) => {
                try {
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
                        resolve('Completion time updated successfully');
                    }
                } catch (error) {
                    console.error('Error updating completion time:', error.response?.data || error.message || error);
                    reject(error.response?.data?.error || error.response?.data?.message || 'Failed to update completion time');
                }
            });

            showToast.promise(promise, {
                loading: 'Updating completion time...',
                success: (msg) => msg,
                error: (msg) => msg,
            });
        }, 800), // 0.8 second delay for time inputs
        []
    );

    // Debounced function for updating inspection details
    const debouncedUpdateInspectionDetails = useMemo(
        () => debounce(async (workId, inspectionDetails) => {
            const work = allDataRef.current?.find(w => w.id === workId);
            if (!work) {
                showToast.error('Work not found');
                return;
            }

            const promise = new Promise(async (resolve, reject) => {
                try {
                    const response = await axios.post(route('dailyWorks.updateInspectionDetails'), {
                        id: work.id,
                        inspection_details: inspectionDetails,
                    });

                    if (response.status === 200) {
                        setDataRef.current(prevWorks =>
                            prevWorks.map(w =>
                                w.id === work.id ? { ...w, inspection_details: inspectionDetails } : w
                            )
                        );
                        resolve('Inspection details updated successfully');
                    }
                } catch (error) {
                    console.error('Error updating inspection details:', error.response?.data || error.message || error);
                    reject(error.response?.data?.error || error.response?.data?.message || 'Failed to update inspection details');
                }
            });

            showToast.promise(promise, {
                loading: 'Updating inspection details...',
                success: (msg) => msg,
                error: (msg) => msg,
            });
        }, 800), // 0.8 second delay for text inputs
        []
    );

    // Debounced function for updating RFI submission time
    const debouncedUpdateSubmissionTime = useMemo(
        () => debounce(async (workId, submissionTime) => {
            const work = allDataRef.current?.find(w => w.id === workId);
            if (!work) {
                console.error('Work not found for ID:', workId, 'Available works:', allDataRef.current?.length);
                showToast.error('Unable to find work record. Please refresh and try again.');
                return;
            }

            // Check if work has active objections - if so, show warning modal
            if (work.active_objections_count > 0) {
                // Fetch active objections for the warning modal
                try {
                    const objResponse = await axios.get(route('dailyWorks.objections.index', work.id));
                    
                    setObjectionWarningModal({
                        isOpen: true,
                        dailyWork: work,
                        newSubmissionDate: submissionTime,
                        activeObjectionsCount: work.active_objections_count,
                        activeObjections: objResponse.data?.objections?.filter(obj => 
                            ['draft', 'submitted', 'under_review'].includes(obj.status)
                        ) || [],
                        isLoading: false,
                    });
                } catch (error) {
                    console.error('Error fetching objections:', error);
                    // If fetch fails, still show the modal with count only
                    setObjectionWarningModal({
                        isOpen: true,
                        dailyWork: work,
                        newSubmissionDate: submissionTime,
                        activeObjectionsCount: work.active_objections_count,
                        activeObjections: [],
                        isLoading: false,
                    });
                }
                return;
            }

            const promise = new Promise(async (resolve, reject) => {
                try {
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
                        resolve('RFI submission time updated successfully');
                    }
                } catch (error) {
                    console.error('Error updating RFI submission time:', error.response?.data || error.message || error);
                    reject(error.response?.data?.error || error.response?.data?.message || 'Failed to update RFI submission time');
                }
            });

            showToast.promise(promise, {
                loading: 'Updating RFI submission time...',
                success: (msg) => msg,
                error: (msg) => msg,
            });
        }, 800), // 0.8 second delay for time inputs
        []
    );

    // Function to handle submission time update with override (after warning modal confirmation)
    const handleSubmissionTimeOverride = useCallback(async (workId, newSubmissionDate, overrideReason) => {
        const work = allDataRef.current?.find(w => w.id === workId);
        if (!work) {
            showToast.error('Work not found');
            return;
        }

        setObjectionWarningModal(prev => ({ ...prev, isLoading: true }));

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('dailyWorks.updateSubmissionTime'), {
                    id: work.id,
                    rfi_submission_date: newSubmissionDate,
                    override_confirmed: true,
                    override_reason: overrideReason,
                });

                if (response.status === 200) {
                    setDataRef.current(prevWorks =>
                        prevWorks.map(w =>
                            w.id === work.id ? response.data.dailyWork : w
                        )
                    );
                    setObjectionWarningModal({
                        isOpen: false,
                        dailyWork: null,
                        newSubmissionDate: null,
                        activeObjectionsCount: 0,
                        activeObjections: [],
                        isLoading: false,
                    });
                    resolve('RFI submission time updated successfully');
                }
            } catch (error) {
                console.error('Error updating RFI submission time:', error.response?.data || error.message || error);
                setObjectionWarningModal(prev => ({ ...prev, isLoading: false }));
                reject(error.response?.data?.error || error.response?.data?.message || 'Failed to update RFI submission time');
            }
        });

        showToast.promise(promise, {
            loading: 'Updating RFI submission time...',
            success: (msg) => msg,
            error: (msg) => msg,
        });
    }, []);

    // Function to close warning modal
    const closeObjectionWarningModal = useCallback(() => {
        setObjectionWarningModal({
            isOpen: false,
            dailyWork: null,
            newSubmissionDate: null,
            activeObjectionsCount: 0,
            activeObjections: [],
            isLoading: false,
        });
    }, []);

    // Cleanup debounced functions on unmount
    useEffect(() => {
        return () => {
         
            debouncedUpdateIncharge.cancel();
            debouncedUpdateAssigned.cancel();
            debouncedUpdateCompletionTime.cancel();
            debouncedUpdateInspectionDetails.cancel();
            debouncedUpdateSubmissionTime.cancel();
        };
    }, [
   
        debouncedUpdateIncharge,
        debouncedUpdateAssigned,
        debouncedUpdateCompletionTime,
        debouncedUpdateInspectionDetails,
        debouncedUpdateSubmissionTime
    ]);

    // Handle general field updates
    const handleChange = async (taskId, taskNumber, key, value, type) => {
        // Find the current work to get all its data
        const currentWork = allData?.find(work => work.id === taskId);
        if (!currentWork) {
            showToast.error('Work not found');
            return;
        }

        const promise = new Promise(async (resolve, reject) => {
            try {
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

                    resolve(response.data.message || 'Task updated successfully');
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

                reject(errorMessage);
            }
        });

        showToast.promise(promise, {
            loading: 'Updating task...',
            success: (msg) => msg,
            error: (msg) => msg,
        });
    };

    // Mobile tabs and accordion component - organized by work types
    const MobileDailyWorkCard = ({ works, selectedTab, setSelectedTab, expandedItems, toggleExpanded, openStatusModal, openRfiFilesModal, openObjectionsModal }) => {

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

        // Individual work accordion item component - Redesigned for better mobile UX
        const WorkAccordionItem = ({ work, index, isExpanded, onToggle, openStatusModal, openRfiFilesModal, openObjectionsModal }) => {
            const inchargeUser = getUserInfo(work.incharge);
            const assignedUser = getUserInfo(work.assigned);
            const statusKey = getStatusKey(work.status, work.inspection_result);
            const statusConf = statusConfig[statusKey] || statusConfig['new'];
            const StatusIcon = statusConf.icon;

            // Handle keyboard navigation
            const handleKeyDown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggle();
                }
            };

            // Compact info row component - without icons for cleaner mobile UI
            const InfoRow = ({ label, value, chip, chipColor = 'default', highlight = false }) => (
                <div className="flex items-center justify-between py-0.5 border-b border-divider/20 last:border-b-0 gap-2">
                    <span className="text-[10px] text-default-400 shrink-0">{label}</span>
                    {chip ? (
                        <Chip size="sm" variant="flat" color={chipColor} className="text-[9px] h-3.5 px-1">
                            {highlight ? <HighlightedText text={value} searchTerm={searchTerm} /> : value}
                        </Chip>
                    ) : (
                        <span className="text-[10px] font-medium text-default-600 text-right truncate max-w-[65%]">
                            {highlight ? <HighlightedText text={value} searchTerm={searchTerm} /> : value}
                        </span>
                    )}
                </div>
            );

            return (
                <Card
                    radius={getThemeRadius()}
                    className={`bg-content1 border shadow-sm ${
                        work.active_objections_count > 0 
                            ? 'border-warning/60 bg-warning-50/30' 
                            : 'border-divider/40'
                    }`}
                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                    role="article"
                    aria-label={`Daily work ${work.number}`}
                >
                    {/* Card Header - Compact & Clickable - Only this should toggle accordion */}
                    <CardHeader 
                        className="p-2 cursor-pointer select-none active:scale-[0.99] transition-transform duration-100"
                        onClick={onToggle}
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                        role="button"
                        aria-expanded={isExpanded}
                    >
                        <div className="flex flex-wrap items-center gap-1.5 w-full">
                            {/* Main Info - RFI Number with file indicators */}
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                {/* File indicator icon */}
                                {work.rfi_files_count > 0 && (
                                    <DocumentCheckIcon className="w-3 h-3 text-success shrink-0" />
                                )}
                                {/* Objection warning indicator */}
                                {work.active_objections_count > 0 && (
                                    <ShieldExclamationIcon 
                                        className="w-3 h-3 text-warning shrink-0 animate-pulse cursor-pointer" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openObjectionsModal(work);
                                        }}
                                        title={`${work.active_objections_count} active objection(s)`}
                                    />
                                )}
                                <span className="font-semibold text-[11px] text-default-800 break-all">
                                    <HighlightedText text={work.number} searchTerm={searchTerm} />
                                </span>
                                {work.rfi_files_count > 0 && (
                                    <span className="text-[9px] text-success shrink-0">
                                        ({work.rfi_files_count})
                                    </span>
                                )}
                                {work.active_objections_count > 0 && (
                                    <span className="text-[9px] text-warning shrink-0">
                                        ⚠{work.active_objections_count}
                                    </span>
                                )}
                            </div>
                            
                            {/* Status Badge & Expand Icon - Wrap to new line if needed */}
                            <div className="flex items-center gap-1 shrink-0">
                                <Chip 
                                    size="sm" 
                                    variant="flat" 
                                    color={statusConf.color}
                                    className="h-4 text-[9px] px-1"
                                >
                                    {statusConf.label.split(':')[0]}
                                </Chip>
                                <div className={`w-4 h-4 rounded-full bg-default-100 flex items-center justify-center transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                    <svg className="w-2.5 h-2.5 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    {/* Expandable Content */}
                    {isExpanded && (
                        <CardBody className="px-2 pb-2 pt-0" onClick={(e) => e.stopPropagation()}>
                            <Divider className="mb-2" />
                            
                            {/* Section 1: Info Section (Read-only) */}
                            <div className="bg-default-50 rounded-lg p-1.5 mb-2">
                                <InfoRow 
                                    label="Date" 
                                    value={formatDate(work.date)} 
                                    highlight
                                />
                                {work.description && (
                                    <InfoRow 
                                        label="Description" 
                                        value={work.description} 
                                        highlight
                                    />
                                )}
                                <InfoRow 
                                    label="Location" 
                                    value={work.location || 'Not set'} 
                                    highlight
                                />
                                <InfoRow 
                                    label="Side" 
                                    value={work.side || 'Both'} 
                                    chip 
                                    highlight
                                />
                                {work.qty_layer && (
                                    <InfoRow 
                                        label="Qty/Layer" 
                                        value={work.qty_layer} 
                                        highlight
                                    />
                                )}
                                <InfoRow 
                                    label="Planned" 
                                    value={work.planned_time || 'Not set'} 
                                    highlight
                                />
                                {work.resubmission_count > 0 && (
                                    <InfoRow 
                                        label="Resubmissions" 
                                        value={work.resubmission_count} 
                                        chip 
                                        chipColor="warning" 
                                    />
                                )}
                            </div>

                            {/* Section 2: Input Fields */}
                            <div className="space-y-1.5">
                                {/* In-charge - Admin only */}
                                {shouldShowInchargeColumn && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-default-400 w-14 shrink-0">In-charge:</span>
                                        <Select
                                            size="sm"
                                            variant="bordered"
                                            radius={getThemeRadius()}
                                            placeholder="Select"
                                            aria-label="Select in-charge"
                                            selectedKeys={work.incharge ? [String(work.incharge)] : []}
                                            onSelectionChange={(keys) => {
                                                const key = Array.from(keys)[0];
                                                if (key) debouncedUpdateIncharge(work.id, key);
                                            }}
                                            classNames={{
                                                base: "flex-1",
                                                trigger: "min-h-6 h-6",
                                                value: "text-[10px]",
                                                popoverContent: "max-w-[280px]"
                                            }}
                                            renderValue={() => (
                                                <div className="flex items-center gap-1">
                                                    <ProfileAvatar src={inchargeUser.profile_image_url} size="xs" name={inchargeUser.name} className="w-3 h-3" />
                                                    <span className="text-[10px] truncate">{inchargeUser.name}</span>
                                                </div>
                                            )}
                                        >
                                            {finalInCharges.map((user) => (
                                                <SelectItem key={String(user.id)} textValue={user.name}>
                                                    <div className="flex items-center gap-2">
                                                        <ProfileAvatar src={user.profile_image_url} size="sm" name={user.name} className="w-5 h-5" />
                                                        <span className="text-xs">{user.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                )}

                                {/* Assigned To - Visible to admins and incharges, not to assignees */}
                                {shouldShowAssignedColumn && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-default-400 w-14 shrink-0">Assigned:</span>
                                        {canUserAssign(work) ? (
                                            <Select
                                                size="sm"
                                                variant="bordered"
                                                radius={getThemeRadius()}
                                                placeholder="Select"
                                                aria-label="Select assignee"
                                                selectedKeys={work.assigned ? [String(work.assigned)] : []}
                                                onSelectionChange={(keys) => {
                                                    const key = Array.from(keys)[0];
                                                    if (key) debouncedUpdateAssigned(work.id, key);
                                                }}
                                                classNames={{
                                                    base: "flex-1",
                                                    trigger: "min-h-6 h-6",
                                                    value: "text-[10px]",
                                                    popoverContent: "max-w-[280px]"
                                                }}
                                                renderValue={() => (
                                                    assignedUser.name !== 'Unassigned' ? (
                                                        <div className="flex items-center gap-1">
                                                            <ProfileAvatar src={assignedUser.profile_image_url} size="xs" name={assignedUser.name} className="w-3 h-3" />
                                                            <span className="text-[10px] truncate">{assignedUser.name}</span>
                                                        </div>
                                                    ) : <span className="text-[10px] text-default-400">Select</span>
                                                )}
                                            >
                                                {getAvailableAssignees(work.incharge).map((user) => (
                                                    <SelectItem key={String(user.id)} textValue={user.name}>
                                                        <div className="flex items-center gap-2">
                                                            <ProfileAvatar src={user.profile_image_url} size="sm" name={user.name} className="w-4 h-4" />
                                                            <span className="text-[10px]">{user.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                        ) : (
                                            <div className="flex-1 flex items-center gap-1">
                                                <ProfileAvatar src={assignedUser.profile_image_url} size="xs" name={assignedUser.name} className="w-3 h-3" />
                                                <span className="text-[10px] text-default-600">{assignedUser.name || 'Unassigned'}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Status Dropdown */}
                                {canUserUpdateStatus(work) && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-default-400 w-14 shrink-0">Status:</span>
                                        <Select
                                            size="sm"
                                            variant="bordered"
                                            radius={getThemeRadius()}
                                            aria-label="Select status"
                                            selectedKeys={[statusKey]}
                                            onSelectionChange={(keys) => {
                                                const selectedKey = Array.from(keys)[0];
                                                if (selectedKey && selectedKey !== statusKey) {
                                                    updateWorkStatus(work, selectedKey);
                                                }
                                            }}
                                            classNames={{
                                                trigger: "min-h-7 h-7 bg-content2/50",
                                                value: "text-[10px]",
                                            }}
                                            renderValue={(items) => {
                                                return items.map((item) => (
                                                    <div key={item.key} className="flex items-center gap-1">
                                                        <StatusIcon className="w-3 h-3" />
                                                        <span className="text-[10px]">{statusConf.label}</span>
                                                    </div>
                                                ));
                                            }}
                                        >
                                            {Object.entries(statusConfig).map(([key, config]) => (
                                                <SelectItem key={key} textValue={config.label}>
                                                    <div className="flex items-center gap-2">
                                                        <config.icon className={`w-4 h-4 text-${config.color}`} />
                                                        <span>{config.label}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                )}

                                {/* Inspection Details */}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-default-400">Inspection Details:</span>
                                    <Input
                                        size="sm"
                                        type="text"
                                        variant="bordered"
                                        radius={getThemeRadius()}
                                        placeholder="Enter details..."
                                        defaultValue={work.inspection_details || ''}
                                        onChange={(e) => debouncedUpdateInspectionDetails(work.id, e.target.value)}
                                        classNames={{
                                            base: "w-full",
                                            input: "text-[10px]",
                                            inputWrapper: "min-h-7 h-7"
                                        }}
                                    />
                                </div>

                                {/* Completion Time */}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-default-400">Completion:</span>
                                    <Input
                                        size="sm"
                                        type="datetime-local"
                                        variant="bordered"
                                        radius={getThemeRadius()}
                                        value={work.completion_time ? new Date(work.completion_time).toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16) : ''}
                                        onChange={(e) => debouncedUpdateCompletionTime(work.id, e.target.value)}
                                        classNames={{
                                            base: "w-full",
                                            input: "text-[10px]",
                                            inputWrapper: "min-h-7 h-7"
                                        }}
                                    />
                                </div>

                                {/* RFI Date - Admin only */}
                                {shouldShowRfiColumn && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] text-default-400">RFI Date:</span>
                                        <Input
                                            size="sm"
                                            type="date"
                                            variant="bordered"
                                            radius={getThemeRadius()}
                                            value={work.rfi_submission_date ? new Date(work.rfi_submission_date).toISOString().slice(0, 10) : ''}
                                            onChange={(e) => debouncedUpdateSubmissionTime(work.id, e.target.value)}
                                            classNames={{
                                                base: "w-full",
                                                input: "text-[10px]",
                                                inputWrapper: "min-h-7 h-7"
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons - Admin only for Edit/Delete, all users can access files */}
                            <div className="flex gap-1.5 mt-2 pt-1.5 border-t border-divider">
                                {/* RFI Files button - available to all users */}
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color={work.rfi_files_count > 0 ? "success" : "default"}
                                    radius={getThemeRadius()}
                                    className="flex-1 h-7 text-[10px]"
                                    onPress={() => {
                                        openRfiFilesModal(work);
                                    }}
                                >
                                    Files {work.rfi_files_count > 0 && `(${work.rfi_files_count})`}
                                </Button>
                                
                                {/* Objections button - View/Add objections to this RFI */}
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color={work.active_objections_count > 0 ? "warning" : "default"}
                                    radius={getThemeRadius()}
                                    className="flex-1 h-7 text-[10px]"
                                    onPress={() => openObjectionsModal(work)}
                                >
                                    Objections {work.active_objections_count > 0 && `(${work.active_objections_count})`}
                                </Button>
                                
                                {shouldShowActions && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                            radius={getThemeRadius()}
                                            className="flex-1 h-7 text-[10px]"
                                            onPress={() => {
                                                setCurrentRow(work);
                                                openModal("editDailyWork");
                                            }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="danger"
                                            radius={getThemeRadius()}
                                            className="flex-1 h-7 text-[10px]"
                                            onPress={() => handleClickOpen(work.id, "deleteDailyWork")}
                                        >
                                            Delete
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardBody>
                    )}
                </Card>
            );
        };

        return (
            <div className="w-full">
                {/* Tab Headers - Compact for mobile */}
                <div className="flex overflow-x-auto border-b border-divider scrollbar-hide -mx-1 px-1">
                    {workTypes.map((type) => (
                        <button
                            key={type.key}
                            onClick={() => setSelectedTab(type.key)}
                            className={`flex items-center gap-1 px-2 py-1.5 min-w-fit whitespace-nowrap border-b-2 transition-all duration-150 ${
                                selectedTab === type.key
                                    ? 'border-primary text-primary font-semibold'
                                    : 'border-transparent text-default-500'
                            }`}
                        >
                            <span className="text-[10px]">{type.icon}</span>
                            <span className="text-[10px]">{type.label}</span>
                            <span className={`min-w-[16px] h-3.5 px-1 rounded-full text-[9px] font-medium flex items-center justify-center ${
                                selectedTab === type.key 
                                    ? 'bg-primary text-white' 
                                    : 'bg-default-100 text-default-600'
                            }`}>
                                {groupedWorks[type.key]?.length || 0}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="pt-2">
                    {workTypes.map((type) => (
                        <div key={type.key} className={selectedTab === type.key ? 'block' : 'hidden'}>
                            {groupedWorks[type.key]?.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {groupedWorks[type.key].map((work, index) => (
                                        <SwipeableCard
                                            key={work.id}
                                            onEdit={() => {
                                                setCurrentRow(work);
                                                openModal("editDailyWork");
                                            }}
                                            onDelete={() => handleClickOpen(work.id, "deleteDailyWork")}
                                            onStatusChange={() => {
                                                // Quick complete - set to completed:pass
                                                if (work.status !== 'completed') {
                                                    updateWorkStatus(work, 'completed:pass');
                                                }
                                            }}
                                            disabled={!shouldShowActions}
                                        >
                                            <WorkAccordionItem 
                                                work={work} 
                                                index={index}
                                                isExpanded={expandedItems.has(work.id)}
                                                onToggle={() => toggleExpanded(work.id)}
                                                openStatusModal={openStatusModal}
                                                openRfiFilesModal={openRfiFilesModal}
                                                openObjectionsModal={openObjectionsModal}
                                            />
                                        </SwipeableCard>
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
                                <HighlightedText text={formatDate(work.date)} searchTerm={searchTerm} />
                            </span>
                        </div>
                    </TableCell>
                );

            case "number":
                return (
                    <TableCell className="max-w-40">
                        <div className="flex flex-col items-center justify-center gap-1 w-full whitespace-nowrap">
                            {/* RFI Number with file icons */}
                            <div className="flex items-center gap-1">
                                {/* Eye icon - click to view/manage RFI files */}
                                <Tooltip content={work.rfi_files_count > 0 ? `View ${work.rfi_files_count} RFI file(s)` : "Manage RFI files"}>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        className="w-5 h-5 min-w-5"
                                        onPress={() => openRfiFilesModal(work)}
                                    >
                                        {work.rfi_files_count > 0 ? (
                                            <FolderOpenIcon className="w-3.5 h-3.5 text-primary" />
                                        ) : (
                                            <EyeIcon className="w-3.5 h-3.5 text-default-400" />
                                        )}
                                    </Button>
                                </Tooltip>
                                
                                {/* RFI Number */}
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
                                        <HighlightedText text={work.number} searchTerm={searchTerm} />
                                    </Link>
                                ) : (
                                    <span 
                                        className="text-sm font-medium text-primary text-center"
                                        title={work.number}
                                    >
                                        <HighlightedText text={work.number} searchTerm={searchTerm} />
                                    </span>
                                )}
                                
                                {/* Document check icon - shows if files exist */}
                                {work.rfi_files_count > 0 && (
                                    <Tooltip content={`${work.rfi_files_count} file(s) attached`}>
                                        <span className="flex items-center">
                                            <DocumentCheckIcon className="w-3.5 h-3.5 text-success" />
                                        </span>
                                    </Tooltip>
                                )}
                                
                                {/* Objection indicator - click to open objections modal */}
                                {work.active_objections_count > 0 && (
                                    <Tooltip content={`${work.active_objections_count} active objection(s) - Click to view`}>
                                        <span className="flex items-center cursor-pointer" onClick={() => openObjectionsModal(work)}>
                                            <ShieldExclamationIcon className="w-3.5 h-3.5 text-warning animate-pulse" />
                                        </span>
                                    </Tooltip>
                                )}
                            </div>
                            
                            {work.reports?.map(report => (
                                <span 
                                    key={report.ref_no} 
                                    className="text-xs text-default-500 text-center"
                                    title={`• ${report.ref_no}`}
                                >
                                    • <HighlightedText text={report.ref_no} searchTerm={searchTerm} />
                                </span>
                            ))}
                        </div>
                    </TableCell>
                );

            case "status":
                const statusKey = getStatusKey(work.status, work.inspection_result);
                const currentStatusConfig = statusConfig[statusKey] || statusConfig['new'];
                const StatusIconComponent = currentStatusConfig.icon;
                
                return (
                    <TableCell className="min-w-48">
                        <div className="flex items-center justify-center w-full">
                            {canUserUpdateStatus(work) ? (
                                <Select
                                    size="sm"
                                    variant="bordered"
                                    radius={getThemeRadius()}
                                    aria-label="Select status"
                                    selectedKeys={[statusKey]}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0];
                                        if (selectedKey && selectedKey !== statusKey) {
                                            updateWorkStatus(work, selectedKey);
                                        }
                                    }}
                                    classNames={{
                                        trigger: "min-h-10 bg-content2/50 hover:bg-content2/80",
                                        value: "text-xs",
                                    }}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                    renderValue={(items) => {
                                        return items.map((item) => (
                                            <div key={item.key} className="flex items-center gap-2">
                                                <StatusIconComponent className={`w-4 h-4 text-${currentStatusConfig.color}`} />
                                                <span className="text-xs font-medium">{currentStatusConfig.label}</span>
                                            </div>
                                        ));
                                    }}
                                >
                                    {Object.entries(statusConfig).map(([key, config]) => (
                                        <SelectItem key={key} textValue={config.label}>
                                            <div className="flex items-center gap-2">
                                                <config.icon className={`w-4 h-4 text-${config.color}`} />
                                                <span>{config.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
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
                                <HighlightedText text={work.type || 'Standard Work'} searchTerm={searchTerm} />
                            </span>
                        </div>
                    </TableCell>
                );

            case "description":
                return (
                    <TableCell className={`max-w-60 ${cellBaseClasses}`}>
                        <div className="w-full overflow-hidden">
                            <span 
                                className="text-sm text-default-600 line-clamp-2"
                                title={work.description || "No description provided"}
                            >
                                <HighlightedText text={work.description || "No description provided"} searchTerm={searchTerm} />
                            </span>
                        </div>
                    </TableCell>
                );

            case "location":
                return (
                    <TableCell className="max-w-48">
                        <div className="flex items-center justify-center gap-2 overflow-hidden">
                            <MapPinIcon className="w-3 h-3 text-default-500 shrink-0" />
                            <span 
                                className="text-sm font-medium line-clamp-2 text-center"
                                title={work.location || 'Location not specified'}
                            >
                                <HighlightedText text={work.location || 'Location not specified'} searchTerm={searchTerm} />
                            </span>
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
                                <HighlightedText text={work.side || 'Both Sides'} searchTerm={searchTerm} />
                            </Chip>
                        </div>
                    </TableCell>
                );

            case "qty_layer":
                return (
                    <TableCell>
                        <div className="flex items-center justify-center">
                            <span className="text-sm">
                                <HighlightedText text={work.qty_layer ? work.qty_layer : 'N/A'} searchTerm={searchTerm} />
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
                                <HighlightedText text={work.planned_time || 'Not set'} searchTerm={searchTerm} />
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
                                        trigger: "min-h-10 w-full bg-content2/50 hover:bg-content2/80 focus:bg-content2/90 transition-colors",
                                        value: "text-sm leading-tight",
                                        popoverContent: "w-64 max-w-[300px]"
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
                                                className="text-xs font-medium truncate max-w-[120px]"
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
                                                className="truncate max-w-[100px]"
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
                                        trigger: "min-h-10 w-full bg-content2/50 hover:bg-content2/80 focus:bg-content2/90 transition-colors",
                                        value: "text-sm leading-tight text-center",
                                        popoverContent: "w-64 max-w-[300px]"
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
                                                className="text-xs font-medium truncate max-w-[120px]"
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
                                                className="truncate max-w-[100px]"
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
                                            name: "text-xs font-medium",
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

            case "inspection_details":
                return (
                    <TableCell className="min-w-48">
                        <div className="flex items-center justify-center">
                            <Input
                                size="sm"
                                type="text"
                                variant="bordered"
                                radius={getThemeRadius()}
                                placeholder="Enter details..."
                                defaultValue={work.inspection_details || ''}
                                onChange={(e) => debouncedUpdateInspectionDetails(work.id, e.target.value)}
                                startContent={
                                    <DocumentTextIcon className="w-4 h-4 text-default-400" />
                                }
                                classNames={{
                                    input: "text-xs",
                                    inputWrapper: "min-h-10 bg-content2/50 hover:bg-content2/80 focus-within:bg-content2/90 border-divider/50 hover:border-divider data-[focus]:border-primary"
                                }}
                                style={{
                                    fontFamily: 'var(--font-family)',
                                }}
                            />
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

            case "rfi_response_status":
                const responseStatusConfig = {
                    approved: { label: 'Approved', color: 'success' },
                    rejected: { label: 'Rejected', color: 'danger' },
                    returned: { label: 'Returned', color: 'warning' },
                    concurred: { label: 'Concurred', color: 'primary' },
                    not_concurred: { label: 'Not Concurred', color: 'secondary' },
                };
                const statusCfg = responseStatusConfig[work.rfi_response_status] || null;
                return (
                    <TableCell>
                        <div className="flex flex-col items-center gap-1">
                            {work.rfi_response_status ? (
                                <>
                                    <Chip 
                                        size="sm" 
                                        color={statusCfg?.color || 'default'} 
                                        variant="flat"
                                    >
                                        {statusCfg?.label || work.rfi_response_status}
                                    </Chip>
                                    {work.rfi_response_date && (
                                        <span className="text-xs text-default-400">
                                            {formatDate(work.rfi_response_date)}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-sm text-default-400">-</span>
                            )}
                        </div>
                    </TableCell>
                );

            case "actions":
                return (
                    <TableCell>
                        <div className="flex items-center justify-center gap-1">
                            <Tooltip content={work.rfi_files_count > 0 ? `Files (${work.rfi_files_count})` : "Manage Files"}>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="ghost"
                                    color={work.rfi_files_count > 0 ? "success" : "default"}
                                    radius={getThemeRadius()}
                                    onPress={() => openRfiFilesModal(work)}
                                    className="min-w-8 h-8"
                                >
                                    {work.rfi_files_count > 0 ? (
                                        <DocumentCheckIcon className="w-4 h-4" />
                                    ) : (
                                        <FolderOpenIcon className="w-4 h-4" />
                                    )}
                                </Button>
                            </Tooltip>
                            <Tooltip content={work.active_objections_count > 0 ? `Objections (${work.active_objections_count})` : "View/Add Objections"}>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="ghost"
                                    color={work.active_objections_count > 0 ? "warning" : "default"}
                                    radius={getThemeRadius()}
                                    onPress={() => openObjectionsModal(work)}
                                    className="min-w-8 h-8"
                                >
                                    <ShieldExclamationIcon className={`w-4 h-4 ${work.active_objections_count > 0 ? 'animate-pulse' : ''}`} />
                                </Button>
                            </Tooltip>
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

    // Columns ordered to match mobile card layout:
    // Section 1: Info fields (read-only) - Date, Description, Location, Side, Qty/Layer, Planned Time, Resubmissions
    // Section 2: Input fields - In-charge, Assigned, Status, Inspection Details, Completion Time, RFI Date, Actions
    const columns = [
        // Info fields first
        { name: "Date", uid: "date", icon: CalendarDaysIcon, sortable: true, width: "w-24" },
        { name: "RFI Number", uid: "number", icon: DocumentIcon, sortable: true, width: "w-32" },
        { name: "Work Type", uid: "type", icon: DocumentTextIcon, sortable: true, width: "w-28" },
        { name: "Description", uid: "description", icon: DocumentTextIcon, sortable: false, width: "w-60" },
        { name: "Location", uid: "location", icon: MapPinIcon, sortable: true, width: "w-48" },
        { name: "Road Side", uid: "side", sortable: true, width: "w-20" },
        { name: "Layer Quantity", uid: "qty_layer", sortable: true, width: "w-24" },
        { name: "Planned Time", uid: "planned_time", icon: ClockIcon, sortable: true, width: "w-28" },
        { name: "Resubmissions", uid: "resubmission_count", icon: ArrowPathIcon, sortable: true, width: "w-28" },
        // Input fields last (matching mobile card order)
        ...(shouldShowInchargeColumn ? [{ name: "In-Charge", uid: "incharge", icon: UserIcon, sortable: true, width: "w-64" }] : []),
        ...(shouldShowAssignedColumn ? [{ name: "Assigned To", uid: "assigned", icon: UserIcon, sortable: true, width: "w-64" }] : []),
        { name: "Status", uid: "status", icon: ClockIconOutline, sortable: true, width: "w-56" },
        { name: "Inspection Details", uid: "inspection_details", icon: DocumentTextIcon, sortable: false, width: "w-48" },
        { name: "Completion Time", uid: "completion_time", icon: CheckCircleIcon, sortable: true, width: "w-56" },
        ...(shouldShowRfiColumn ? [{ name: "RFI Submission Date", uid: "rfi_submission_date", icon: CalendarDaysIcon, sortable: true, width: "w-36" }] : []),
        ...(shouldShowRfiColumn ? [{ name: "RFI Response", uid: "rfi_response_status", icon: ClipboardDocumentCheckIcon, sortable: true, width: "w-44" }] : []),
        ...(shouldShowActions ? [{ name: "Actions", uid: "actions", sortable: false, width: "w-28" }] : [])
    ];

    // Mobile Loading Skeleton - Only card rows, tabs are kept visible
    const MobileLoadingSkeleton = () => (
        <div className="w-full">
            {/* Tab Headers - Always visible */}
            <div className="flex overflow-x-auto border-b border-divider scrollbar-hide -mx-1 px-1">
                {workTypes.map((type) => (
                    <button
                        key={type.key}
                        onClick={() => setSelectedTab(type.key)}
                        className={`flex items-center gap-1 px-2 py-1.5 min-w-fit whitespace-nowrap border-b-2 transition-all duration-150 ${
                            selectedTab === type.key
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-default-500'
                        }`}
                    >
                        <span className="text-[10px]">{type.icon}</span>
                        <span className="text-[10px]">{type.label}</span>
                        <span className={`min-w-[16px] h-3.5 px-1 rounded-full text-[9px] font-medium flex items-center justify-center ${
                            selectedTab === type.key 
                                ? 'bg-primary text-white' 
                                : 'bg-default-100 text-default-600'
                        }`}>
                            -
                        </span>
                    </button>
                ))}
            </div>
            {/* Skeleton rows in tab content */}
            <div className="py-2 space-y-1.5">
                {Array.from({ length: 5 }).map((_, index) => (
                    <Card key={index} className="w-full border border-divider/50 shadow-none">
                        <CardHeader className="p-2 gap-1.5">
                            <div className="flex items-center gap-1.5 w-full">
                                <Skeleton className="flex-1 h-3 rounded" />
                                <Skeleton className="w-12 h-4 rounded-full shrink-0" />
                                <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );

    // Desktop Table Row Loading Skeleton - Only rows, not header/pagination
    const DesktopRowSkeleton = () => (
        <div className="divide-y divide-divider">
            {Array.from({ length: 8 }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex bg-content1 hover:bg-content2/50">
                    {columns.map((column, colIndex) => (
                        <div key={colIndex} className="flex-1 p-3 flex items-center justify-center">
                            {column.uid === 'status' ? (
                                <Skeleton className="w-28 h-7 rounded" />
                            ) : column.uid === 'description' ? (
                                <div className="w-full space-y-1">
                                    <Skeleton className="w-full h-3 rounded" />
                                    <Skeleton className="w-3/4 h-3 rounded" />
                                </div>
                            ) : column.uid === 'incharge' || column.uid === 'assigned' ? (
                                <div className="flex items-center gap-2">
                                    <Skeleton className="w-7 h-7 rounded-full" />
                                    <Skeleton className="w-16 h-3 rounded" />
                                </div>
                            ) : column.uid === 'completion_time' || column.uid === 'rfi_submission_date' ? (
                                <Skeleton className="w-28 h-7 rounded" />
                            ) : column.uid === 'actions' ? (
                                <div className="flex gap-1">
                                    <Skeleton className="w-7 h-7 rounded" />
                                    <Skeleton className="w-7 h-7 rounded" />
                                </div>
                            ) : column.uid === 'side' || column.uid === 'resubmission_count' ? (
                                <Skeleton className="w-14 h-5 rounded-full" />
                            ) : (
                                <Skeleton className="w-16 h-3 rounded" />
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );

    // Desktop Loading State
    const DesktopLoadingSkeleton = () => (
        <div className="max-h-[84vh] overflow-y-auto">
            {/* Table Header with Refresh Button - Always visible */}
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-lg font-semibold text-default-700">Daily Works</h3>
                <Button
                    variant="flat"
                    color="primary"
                    size="sm"
                    radius={getThemeRadius()}
                    isDisabled
                    startContent={<Spinner size="sm" />}
                >
                    Loading...
                </Button>
            </div>
            
            <ScrollShadow className="max-h-[70vh]">
                <div className="border border-divider rounded-lg overflow-hidden">
                    {/* Table header - real header */}
                    <div className="bg-default-100/80 backdrop-blur-md border-b border-divider">
                        <div className="flex">
                            {columns.map((column) => {
                                const IconComponent = column.icon;
                                return (
                                    <div key={column.uid} className="flex-1 p-3 flex items-center justify-center gap-1 text-xs font-medium text-default-600">
                                        {IconComponent && <IconComponent className="w-3 h-3" />}
                                        <span>{column.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Skeleton rows */}
                    <DesktopRowSkeleton />
                </div>
            </ScrollShadow>
            
            {/* Pagination - Always visible */}
            <div className="py-4 flex justify-center">
                <Pagination
                    isDisabled
                    total={lastPage || 1}
                    page={currentPage}
                    showControls
                    size="sm"
                    radius={getThemeRadius()}
                />
            </div>
        </div>
    );

    // Show loading skeleton BEFORE checking isMobile
    if (loading) {
        if (isMobile) {
            return (
                <div className="space-y-3">
                    <ScrollShadow 
                        className="max-h-[calc(100vh-280px)] min-h-[300px]"
                        hideScrollBar
                    >
                        <MobileLoadingSkeleton />
                    </ScrollShadow>
                </div>
            );
        }
        return <DesktopLoadingSkeleton />;
    }

    if (isMobile) {
        return (
            <div className="space-y-3">
                {/* Mobile Header with Import Buttons */}
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-base font-semibold text-default-700">Daily Works</h3>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="flat"
                            color="secondary"
                            size="sm"
                            radius={getThemeRadius()}
                            onPress={() => setBulkImportModalOpen(true)}
                            startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                        >
                            Import Submit
                        </Button>
                        <Button
                            variant="flat"
                            color="primary"
                            size="sm"
                            radius={getThemeRadius()}
                            onPress={() => setBulkImportResponseStatusModalOpen(true)}
                            startContent={<ClipboardDocumentCheckIcon className="w-4 h-4" />}
                        >
                            Import Status
                        </Button>
                    </div>
                </div>
                <ScrollShadow 
                    className="max-h-[calc(100vh-320px)] min-h-[300px]"
                    hideScrollBar
                >
                    <MobileDailyWorkCard 
                        works={allData || []} 
                        selectedTab={selectedTab}
                        setSelectedTab={setSelectedTab}
                        expandedItems={expandedItems}
                        toggleExpanded={toggleExpanded}
                        openStatusModal={openStatusModal}
                        openRfiFilesModal={openRfiFilesModal}
                        openObjectionsModal={openObjectionsModal}
                    />
                </ScrollShadow>
                {/* Mobile pagination - show when there are multiple pages */}
                {lastPage > 1 && (
                    <div className="flex justify-center pt-2 pb-safe">
                        <Pagination
                            showControls
                            showShadow
                            color="primary"
                            variant="bordered"
                            page={currentPage}
                            total={lastPage}
                            onChange={handlePageChange}
                            size="sm"
                            siblings={0}
                            boundaries={1}
                            radius={getThemeRadius()}
                            classNames={{
                                wrapper: "bg-content1/80 backdrop-blur-md border-divider/50 gap-1",
                                item: "bg-content1/50 border-divider/30 min-w-8 h-8",
                                cursor: "bg-primary/20 backdrop-blur-md"
                            }}
                            style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                        />
                    </div>
                )}
                
                {/* RFI Files Modal */}
                <RfiFilesModal
                    isOpen={rfiModalOpen}
                    onClose={() => {
                        setRfiModalOpen(false);
                        setRfiModalWork(null);
                    }}
                    dailyWork={rfiModalWork}
                    onFilesUpdated={handleRfiFilesUpdated}
                />
                
                {/* Status Update Modal */}
                <StatusUpdateModal
                    open={statusModalOpen}
                    closeModal={() => {
                        setStatusModalOpen(false);
                        setStatusModalWork(null);
                    }}
                    dailyWork={statusModalWork}
                    onStatusUpdated={handleStatusUpdated}
                />
                
                {/* Objections Modal */}
                <ObjectionsModal
                    isOpen={objectionsModalOpen}
                    onClose={() => {
                        setObjectionsModalOpen(false);
                        setObjectionsModalWork(null);
                    }}
                    dailyWork={objectionsModalWork}
                    onObjectionsUpdated={handleObjectionsUpdated}
                />
                
                {/* Objection Warning Modal - for submission date changes */}
                <ObjectionWarningModal
                    isOpen={objectionWarningModal.isOpen}
                    onClose={closeObjectionWarningModal}
                    dailyWork={objectionWarningModal.dailyWork}
                    newSubmissionDate={objectionWarningModal.newSubmissionDate}
                    activeObjectionsCount={objectionWarningModal.activeObjectionsCount}
                    activeObjections={objectionWarningModal.activeObjections}
                    isLoading={objectionWarningModal.isLoading}
                    onConfirm={handleSubmissionTimeOverride}
                />
                
                {/* Bulk Submit Modal */}
                <BulkSubmitModal
                    isOpen={bulkSubmitModalOpen}
                    onClose={() => setBulkSubmitModalOpen(false)}
                    selectedWorks={selectedWorks}
                    onSuccess={handleBulkSubmitSuccess}
                />
                
                {/* Bulk Import Submit Modal */}
                <BulkImportSubmitModal
                    isOpen={bulkImportModalOpen}
                    onClose={() => setBulkImportModalOpen(false)}
                    onSuccess={handleBulkImportSuccess}
                />

                {/* Bulk Response Status Modal */}
                <BulkResponseStatusModal
                    isOpen={bulkResponseStatusModalOpen}
                    onClose={() => setBulkResponseStatusModalOpen(false)}
                    selectedWorks={selectedWorks}
                    onSuccess={handleBulkResponseStatusSuccess}
                />

                {/* Bulk Import Response Status Modal */}
                <BulkImportResponseStatusModal
                    isOpen={bulkImportResponseStatusModalOpen}
                    onClose={() => setBulkImportResponseStatusModalOpen(false)}
                    onSuccess={handleBulkImportResponseStatusSuccess}
                />
            </div>
        );
    }

    return (
        <div className="max-h-[84vh] overflow-y-auto">
            {/* Table Header with Actions */}
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-default-700">Daily Works</h3>
                    {selectedKeys.size > 0 && (
                        <Chip size="sm" color="primary" variant="flat">
                            {selectedKeys === "all" ? allData?.length || 0 : selectedKeys.size} selected
                        </Chip>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Bulk Actions */}
                    {selectedKeys.size > 0 && (
                        <>
                            <Button
                                variant="flat"
                                color="primary"
                                size="sm"
                                radius={getThemeRadius()}
                                onPress={() => setBulkSubmitModalOpen(true)}
                                startContent={<DocumentArrowUpIcon className="w-4 h-4" />}
                            >
                                Submit RFIs ({selectedKeys === "all" ? allData?.length || 0 : selectedKeys.size})
                            </Button>
                            <Button
                                variant="flat"
                                color="secondary"
                                size="sm"
                                radius={getThemeRadius()}
                                onPress={() => setBulkResponseStatusModalOpen(true)}
                                startContent={<ClipboardDocumentCheckIcon className="w-4 h-4" />}
                            >
                                Response Status ({selectedKeys === "all" ? allData?.length || 0 : selectedKeys.size})
                            </Button>
                            <Button
                                variant="light"
                                size="sm"
                                radius={getThemeRadius()}
                                onPress={() => setSelectedKeys(new Set([]))}
                            >
                                Clear
                            </Button>
                        </>
                    )}
                    <Button
                        variant="flat"
                        color="secondary"
                        size="sm"
                        radius={getThemeRadius()}
                        onPress={() => setBulkImportModalOpen(true)}
                        startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                    >
                        Import Submission
                    </Button>
                    <Button
                        variant="flat"
                        color="primary"
                        size="sm"
                        radius={getThemeRadius()}
                        onPress={() => setBulkImportResponseStatusModalOpen(true)}
                        startContent={<ClipboardDocumentCheckIcon className="w-4 h-4" />}
                    >
                        Import Status
                    </Button>
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
            </div>
            
            <ScrollShadow className="max-h-[70vh]">
                <Table
                    selectionMode="multiple"
                    selectedKeys={selectedKeys}
                    onSelectionChange={setSelectedKeys}
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
                                className={work.active_objections_count > 0 ? 'bg-warning-50/40 hover:bg-warning-50/60 border-2 border-warning' : ''}
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
            
            {/* RFI Files Modal */}
            <RfiFilesModal
                isOpen={rfiModalOpen}
                onClose={() => {
                    setRfiModalOpen(false);
                    setRfiModalWork(null);
                }}
                dailyWork={rfiModalWork}
                onFilesUpdated={handleRfiFilesUpdated}
            />
            
            {/* Status Update Modal */}
            <StatusUpdateModal
                open={statusModalOpen}
                closeModal={() => {
                    setStatusModalOpen(false);
                    setStatusModalWork(null);
                }}
                dailyWork={statusModalWork}
                onStatusUpdated={handleStatusUpdated}
            />
            
            {/* Objections Modal */}
            <ObjectionsModal
                isOpen={objectionsModalOpen}
                onClose={() => {
                    setObjectionsModalOpen(false);
                    setObjectionsModalWork(null);
                }}
                dailyWork={objectionsModalWork}
                onObjectionsUpdated={handleObjectionsUpdated}
            />
            
            {/* Objection Warning Modal - for submission date changes */}
            <ObjectionWarningModal
                isOpen={objectionWarningModal.isOpen}
                onClose={closeObjectionWarningModal}
                dailyWork={objectionWarningModal.dailyWork}
                newSubmissionDate={objectionWarningModal.newSubmissionDate}
                activeObjectionsCount={objectionWarningModal.activeObjectionsCount}
                activeObjections={objectionWarningModal.activeObjections}
                isLoading={objectionWarningModal.isLoading}
                onConfirm={handleSubmissionTimeOverride}
            />
            
            {/* Bulk Submit Modal */}
            <BulkSubmitModal
                isOpen={bulkSubmitModalOpen}
                onClose={() => setBulkSubmitModalOpen(false)}
                selectedWorks={selectedWorks}
                onSuccess={handleBulkSubmitSuccess}
            />
            
            {/* Bulk Import Submit Modal */}
            <BulkImportSubmitModal
                isOpen={bulkImportModalOpen}
                onClose={() => setBulkImportModalOpen(false)}
                onSuccess={handleBulkImportSuccess}
            />

            {/* Bulk Response Status Modal */}
            <BulkResponseStatusModal
                isOpen={bulkResponseStatusModalOpen}
                onClose={() => setBulkResponseStatusModalOpen(false)}
                selectedWorks={selectedWorks}
                onSuccess={handleBulkResponseStatusSuccess}
            />

            {/* Bulk Import Response Status Modal */}
            <BulkImportResponseStatusModal
                isOpen={bulkImportResponseStatusModalOpen}
                onClose={() => setBulkImportResponseStatusModalOpen(false)}
                onSuccess={handleBulkImportResponseStatusSuccess}
            />
        </div>
    );
};

export default DailyWorksTable;
