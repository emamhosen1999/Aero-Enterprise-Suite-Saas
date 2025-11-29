import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Card, 
    CardBody, 
    CardHeader,
    Divider,
    Chip,
    Button,
    Tabs,
    Tab,
    Spacer,
    ButtonGroup,
    Input,
    Select,
    SelectItem,
    Spinner,
    Skeleton,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    User,
    Tooltip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter
} from "@heroui/react";
import { 
    AcademicCapIcon,
    ChartBarIcon, 
    ClockIcon,
    UserIcon,
    PlusIcon,
    FunnelIcon,
    DocumentArrowDownIcon,
    Cog6ToothIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    PresentationChartLineIcon,
    AdjustmentsHorizontalIcon,
    UserGroupIcon,
    DocumentTextIcon,
    CalendarDaysIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    CurrencyDollarIcon,
    MapPinIcon
} from "@heroicons/react/24/outline";
import { 
    MagnifyingGlassIcon 
} from '@heroicons/react/24/solid';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import TrainingForm from '@/Forms/TrainingForm.jsx';
import DeleteTrainingForm from '@/Forms/DeleteTrainingForm.jsx';
import ProfileAvatar from '@/Components/ProfileAvatar';
import dayjs from 'dayjs';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

const Training = ({ 
    trainings = { data: [], current_page: 1, last_page: 1, total: 0 }, 
    filters = {}, 
    categories = [], 
    trainers = [],
    employees = [],
    departments = [], 
    statuses = [],
    title = "Training Management"
}) => {
    const { auth } = usePage().props;
    
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
    
    // Custom media queries
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    // Modal states for Training operations
    const [modalStates, setModalStates] = useState({
        create_training: false,
        edit_training: false,
        delete_training: false,
        show_training: false,
    });

    const [currentTraining, setCurrentTraining] = useState(null);

    // Modal handlers
    const openModal = useCallback((modalType) => {
        setModalStates(prev => ({ ...prev, [modalType]: true }));
    }, []);

    const closeModal = useCallback((modalType) => {
        setModalStates(prev => ({ ...prev, [modalType]: false }));
        if (modalType === 'edit_training' || modalType === 'delete_training' || modalType === 'show_training') {
            setCurrentTraining(null);
        }
    }, []);

    const handleClickOpen = useCallback((training, modalType) => {
        setCurrentTraining(training);
        setModalStates(prev => ({ ...prev, [modalType]: true }));
    }, []);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // State management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Show/Hide advanced filters panel
    const [showFilters, setShowFilters] = useState(false);

    const [localFilters, setLocalFilters] = useState({
        search: filters.search || '',
        status: filters.status || '',
        category: filters.category_id || '',
        department: filters.department_id || ''
    });

    const handleFilterChange = useCallback((filterKey, filterValue) => {
        setLocalFilters(prev => ({
            ...prev,
            [filterKey]: filterValue
        }));
    }, []);

    // Check permissions using new system
    const canManageTrainings = auth.permissions?.includes('training.view') || false;
    const canCreateTrainings = auth.permissions?.includes('training.create') || false;
    const canEditTrainings = auth.permissions?.includes('training.update') || false;
    const canDeleteTrainings = auth.permissions?.includes('training.delete') || false;

    // Quick stats state - calculated from trainings data
    const trainingStats = useMemo(() => {
        if (!trainings?.data) {
            return {
                total: 0,
                active: 0,
                completed: 0,
                scheduled: 0,
                draft: 0,
                cancelled: 0
            };
        }

        return trainings.data.reduce((acc, training) => {
            acc.total = trainings.total || trainings.data.length;
            acc[training.status] = (acc[training.status] || 0) + 1;
            return acc;
        }, {
            total: trainings.total || 0,
            active: 0,
            completed: 0,
            scheduled: 0,
            draft: 0,
            cancelled: 0
        });
    }, [trainings]);

    // Prepare stats data for StatsCards component
    const statsData = useMemo(() => [
        {
            title: "Total Trainings",
            value: trainingStats.total,
            icon: <AcademicCapIcon />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "All training programs"
        },
        {
            title: "Active",
            value: trainingStats.active,
            icon: <UserGroupIcon />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: "Currently running"
        },
        {
            title: "Completed",
            value: trainingStats.completed,
            icon: <CheckCircleIcon />,
            color: "text-warning",
            iconBg: "bg-warning/20",
            description: "Finished programs"
        },
        {
            title: "Scheduled",
            value: trainingStats.scheduled,
            icon: <CalendarDaysIcon />,
            color: "text-secondary",
            iconBg: "bg-secondary/20",
            description: "Upcoming sessions"
        },
        {
            title: "Draft",
            value: trainingStats.draft,
            icon: <DocumentTextIcon />,
            color: "text-default",
            iconBg: "bg-default/20",
            description: "In preparation"
        },
        {
            title: "Cancelled",
            value: trainingStats.cancelled,
            icon: <XCircleIcon />,
            color: "text-danger",
            iconBg: "bg-danger/20",
            description: "Cancelled programs"
        }
    ], [trainingStats]);

    // Helper functions
    const getStatusColor = (status) => {
        const colors = {
            draft: 'default',
            scheduled: 'primary',
            active: 'success',
            completed: 'secondary',
            cancelled: 'danger'
        };
        return colors[status] || 'default';
    };

    const getTypeIcon = (type) => {
        const icons = {
            course: <AcademicCapIcon className="w-4 h-4" />,
            workshop: <UserGroupIcon className="w-4 h-4" />,
            seminar: <CalendarDaysIcon className="w-4 h-4" />,
            certification: <CheckCircleIcon className="w-4 h-4" />,
            on_the_job: <PencilIcon className="w-4 h-4" />,
            webinar: <ClockIcon className="w-4 h-4" />,
            conference: <MapPinIcon className="w-4 h-4" />
        };
        return icons[type] || <AcademicCapIcon className="w-4 h-4" />;
    };

    const formatDuration = (duration, unit) => {
        if (!duration) return 'N/A';
        return `${duration} ${unit}${duration > 1 ? 's' : ''}`;
    };

    const formatCurrency = (amount, currency = 'USD') => {
        if (!amount) return 'Free';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    // Handle search and filters
    const handleSearch = () => {
        setLoading(true);
        router.get(route('hr.training.index'), {
            search: localFilters.search,
            status: localFilters.status,
            category_id: localFilters.category,
            department_id: localFilters.department,
        }, {
            preserveState: true,
            onFinish: () => setLoading(false),
        });
    };

    const handleClearFilters = () => {
        setLocalFilters({
            search: '',
            status: '',
            category: '',
            department: ''
        });
        
        router.get(route('hr.training.index'), {}, {
            preserveState: true,
        });
    };

    // Updated action handlers to use modals following Leave Management pattern
    const handleView = (training) => {
        handleClickOpen(training, 'show_training');
    };

    const handleEdit = (training) => {
        handleClickOpen(training, 'edit_training');
    };

    const handleDelete = (training) => {
        handleClickOpen(training, 'delete_training');
    };

    const handleCreate = () => {
        openModal('create_training');
    };

    // Early return if no permissions
    if (!canManageTrainings) {
        return (
            <>
                <Head title={title} />
                <div className="flex justify-center p-4">
                    <Card 
                        className="w-full max-w-md"
                        style={{
                            border: `var(--borderWidth, 2px) solid transparent`,
                            borderRadius: `var(--borderRadius, 12px)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                            background: `linear-gradient(135deg, 
                                var(--theme-content1, #FAFAFA) 20%, 
                                var(--theme-content2, #F4F4F5) 10%, 
                                var(--theme-content3, #F1F3F4) 20%)`,
                        }}
                    >
                        <CardBody className="p-8 text-center">
                            <ExclamationTriangleIcon className="w-16 h-16 text-warning mx-auto mb-4" />
                            <h6 className="text-lg font-semibold mb-2">
                                Access Denied
                            </h6>
                            <p className="text-sm text-default-500">
                                You don't have permission to view training management.
                            </p>
                        </CardBody>
                    </Card>
                </div>
            </>
        );
    }

    // Table columns
    const columns = [
        { key: 'title', label: 'Training', sortable: true },
        { key: 'category', label: 'Category' },
        { key: 'type', label: 'Type' },
        { key: 'start_date', label: 'Start Date', sortable: true },
        { key: 'duration', label: 'Duration' },
        { key: 'instructor', label: 'Instructor' },
        { key: 'participants', label: 'Participants' },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'cost', label: 'Cost' },
        { key: 'actions', label: 'Actions' },
    ];

    const renderCell = (training, columnKey) => {
        switch (columnKey) {
            case 'title':
                return (
                    <div className="flex flex-col">
                        <p className="font-medium text-foreground">{training.title}</p>
                        {training.description && (
                            <p className="text-sm text-default-500 truncate max-w-md">
                                {training.description}
                            </p>
                        )}
                    </div>
                );
            
            case 'category':
                return training.category ? (
                    <Chip
                        variant="flat"
                        color="primary"
                        size="sm"
                    >
                        {training.category.name}
                    </Chip>
                ) : 'N/A';
            
            case 'type':
                return (
                    <div className="flex items-center gap-2">
                        {getTypeIcon(training.type)}
                        <span className="capitalize text-sm">
                            {training.type?.replace('_', ' ')}
                        </span>
                    </div>
                );
            
            case 'start_date':
                return training.start_date ? (
                    <div className="flex flex-col">
                        <span className="font-medium">
                            {new Date(training.start_date).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-default-500">
                            {new Date(training.start_date).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                ) : 'N/A';
            
            case 'duration':
                return (
                    <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4 text-default-400" />
                        <span className="text-sm">
                            {formatDuration(training.duration, training.duration_unit)}
                        </span>
                    </div>
                );
            
            case 'instructor':
                return training.instructor ? (
                    <div className="flex items-center gap-2">
                        <ProfileAvatar
                            src={training.instructor.avatar}
                            name={training.instructor.name}
                            size="sm"
                        />
                        <span className="text-sm">{training.instructor.name}</span>
                    </div>
                ) : 'N/A';
            
            case 'participants':
                const enrolled = training.enrollments_count || 0;
                const max = training.max_participants || 0;
                const percentage = max > 0 ? Math.round((enrolled / max) * 100) : 0;
                
                return (
                    <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-4 h-4 text-default-400" />
                        <span className="text-sm">
                            {enrolled}{max > 0 && `/${max}`}
                        </span>
                        {max > 0 && (
                            <Chip
                                variant="flat"
                                size="sm"
                                color={percentage > 80 ? 'danger' : percentage > 60 ? 'warning' : 'success'}
                            >
                                {percentage}%
                            </Chip>
                        )}
                    </div>
                );
            
            case 'status':
                return (
                    <Chip
                        variant="flat"
                        color={getStatusColor(training.status)}
                        size="sm"
                    >
                        {training.status?.charAt(0).toUpperCase() + training.status?.slice(1)}
                    </Chip>
                );
            
            case 'cost':
                return (
                    <div className="flex items-center gap-1">
                        <CurrencyDollarIcon className="w-4 h-4 text-default-400" />
                        <span className="text-sm">
                            {formatCurrency(training.cost, training.currency)}
                        </span>
                    </div>
                );
            
            case 'actions':
                return (
                    <div className="flex items-center gap-1">
                        {canManageTrainings && (
                            <Tooltip content="View Details">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => handleView(training)}
                                >
                                    <EyeIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        )}
                        
                        {canEditTrainings && (
                            <Tooltip content="Edit Training">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => handleEdit(training)}
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        )}
                        
                        {canDeleteTrainings && (
                            <Tooltip content="Delete Training" color="danger">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    onPress={() => handleDelete(training)}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        )}
                    </div>
                );
            
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={title} />
            
            <div 
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Training Management"
            >
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
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
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col space-y-4">
                                            {/* Main Header Content */}
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                {/* Title Section */}
                                                <div className="flex items-center gap-3 lg:gap-4">
                                                    <div 
                                                        className={`
                                                            ${!isMobile ? 'p-3' : 'p-2'} 
                                                            rounded-xl flex items-center justify-center
                                                        `}
                                                        style={{
                                                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                            borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                            borderWidth: `var(--borderWidth, 2px)`,
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                        }}
                                                    >
                                                        <AcademicCapIcon 
                                                            className={`
                                                                ${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}
                                                            `}
                                                            style={{ color: 'var(--theme-primary)' }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 
                                                            className={`
                                                                ${!isMobile ? 'text-2xl' : 'text-xl'}
                                                                font-bold text-foreground
                                                                ${isMobile ? 'truncate' : ''}
                                                            `}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Training Management
                                                        </h4>
                                                        <p 
                                                            className={`
                                                                ${!isMobile ? 'text-sm' : 'text-xs'} 
                                                                text-default-500
                                                                ${isMobile ? 'truncate' : ''}
                                                            `}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Manage employee training programs and development courses
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Action Buttons */}
                                                <div className="flex gap-2 flex-wrap">
                                                    {canCreateTrainings && (
                                                        <Button
                                                            color="primary"
                                                            variant="shadow"
                                                            startContent={<PlusIcon className="w-4 h-4" />}
                                                            onPress={handleCreate}
                                                            size={isMobile ? "sm" : "md"}
                                                            className="font-semibold"
                                                            style={{
                                                                borderRadius: `var(--borderRadius, 8px)`,
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Create Training
                                                        </Button>
                                                    )}
                                                    <Button
                                                        color="default"
                                                        variant="bordered"
                                                        startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                                        size={isMobile ? "sm" : "md"}
                                                        className="font-semibold"
                                                        style={{
                                                            borderRadius: `var(--borderRadius, 8px)`,
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                    >
                                                        Export
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
                                    {/* Filters Section */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <div className="flex-1">
                                            <Input
                                                label="Search Trainings"
                                                placeholder="Search by title or description..."
                                                value={localFilters.search}
                                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                className="w-full"
                                                classNames={{
                                                    input: "text-sm",
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                                aria-label="Search trainings"
                                            />
                                        </div>
                                        <div className="flex gap-2 items-end">
                                            <ButtonGroup 
                                                variant="bordered" 
                                                radius={getThemeRadius()}
                                                className="bg-white/5"
                                            >
                                                <Button
                                                    isIconOnly={isMobile}
                                                    color={showFilters ? 'primary' : 'default'}
                                                    onPress={() => setShowFilters(!showFilters)}
                                                    className={showFilters ? 'bg-purple-500/20' : 'bg-white/5'}
                                                >
                                                    <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                                    {!isMobile && <span className="ml-1">Filters</span>}
                                                </Button>
                                            </ButtonGroup>
                                        </div>
                                    </div>

                                    {/* Advanced Filters */}
                                    {showFilters && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="mb-6 p-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/10">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <Select
                                                        label="Status"
                                                        placeholder="Select status..."
                                                        selectedKeys={localFilters.status ? [localFilters.status] : []}
                                                        onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                                                        variant="bordered"
                                                        size="sm"
                                                        radius={getThemeRadius()}
                                                        className="w-full"
                                                    >
                                                        <SelectItem key="draft" value="draft">Draft</SelectItem>
                                                        <SelectItem key="scheduled" value="scheduled">Scheduled</SelectItem>
                                                        <SelectItem key="active" value="active">Active</SelectItem>
                                                        <SelectItem key="completed" value="completed">Completed</SelectItem>
                                                        <SelectItem key="cancelled" value="cancelled">Cancelled</SelectItem>
                                                    </Select>

                                                    <Select
                                                        label="Category"
                                                        placeholder="Select category..."
                                                        selectedKeys={localFilters.category ? [localFilters.category] : []}
                                                        onSelectionChange={(keys) => handleFilterChange('category', Array.from(keys)[0] || '')}
                                                        variant="bordered"
                                                        size="sm"
                                                        radius={getThemeRadius()}
                                                        className="w-full"
                                                    >
                                                        {categories.map(category => (
                                                            <SelectItem key={category.id.toString()} value={category.id.toString()}>
                                                                {category.name}
                                                            </SelectItem>
                                                        ))}
                                                    </Select>

                                                    <Select
                                                        label="Department"
                                                        placeholder="Select department..."
                                                        selectedKeys={localFilters.department ? [localFilters.department] : []}
                                                        onSelectionChange={(keys) => handleFilterChange('department', Array.from(keys)[0] || '')}
                                                        variant="bordered"
                                                        size="sm"
                                                        radius={getThemeRadius()}
                                                        className="w-full"
                                                    >
                                                        {departments.map(department => (
                                                            <SelectItem key={department.id.toString()} value={department.id.toString()}>
                                                                {department.name}
                                                            </SelectItem>
                                                        ))}
                                                    </Select>

                                                    <div className="flex gap-2">
                                                        <Button
                                                            color="primary"
                                                            variant="solid"
                                                            onPress={handleSearch}
                                                            isLoading={loading}
                                                            size="sm"
                                                            className="flex-1"
                                                        >
                                                            Apply
                                                        </Button>
                                                        <Button
                                                            variant="flat"
                                                            onPress={handleClearFilters}
                                                            size="sm"
                                                            className="flex-1"
                                                        >
                                                            Clear
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Table Section */}
                                    <div className="min-h-96">
                                        <div className="mb-4 flex items-center gap-2 font-semibold text-lg">
                                            <ChartBarIcon className="w-5 h-5" />
                                            Training Programs
                                        </div>

                                        {loading ? (
                                            <Card className="bg-white/10 backdrop-blur-md border-white/20">
                                                <CardBody className="text-center py-12">
                                                    <Spinner size="lg" />
                                                    <p className="mt-4 text-default-500">
                                                        Loading training data...
                                                    </p>
                                                </CardBody>
                                            </Card>
                                        ) : trainings?.data && trainings.data.length > 0 ? (
                                            <div className="overflow-hidden rounded-lg">
                                                <Card 
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                                                        border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                                                        borderRadius: getThemeRadius(),
                                                        backdropFilter: 'blur(16px)',
                                                    }}
                                                >
                                                    <CardBody className="p-0">
                                                        <Table
                                                            aria-label="Training programs table"
                                                            removeWrapper
                                                        >
                                                            <TableHeader columns={columns}>
                                                                {(column) => (
                                                                    <TableColumn
                                                                        key={column.key}
                                                                        allowsSorting={column.sortable}
                                                                    >
                                                                        {column.label}
                                                                    </TableColumn>
                                                                )}
                                                            </TableHeader>
                                                            <TableBody
                                                                items={trainings.data || []}
                                                                emptyContent="No training programs found"
                                                            >
                                                                {(training) => (
                                                                    <TableRow key={training.id}>
                                                                        {(columnKey) => (
                                                                            <TableCell>{renderCell(training, columnKey)}</TableCell>
                                                                        )}
                                                                    </TableRow>
                                                                )}
                                                            </TableBody>
                                                        </Table>

                                                        {/* Pagination */}
                                                        {trainings.last_page > 1 && (
                                                            <div className="flex justify-center p-4">
                                                                <Pagination
                                                                    total={trainings.last_page}
                                                                    page={trainings.current_page}
                                                                    onChange={(page) => {
                                                                        router.get(route('hr.training.index'), {
                                                                            ...filters,
                                                                            page
                                                                        }, {
                                                                            preserveState: true,
                                                                        });
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        ) : error ? (
                                            <div className="text-center py-12">
                                                <ExclamationTriangleIcon className="w-16 h-16 text-warning mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold mb-2">No Data Found</h3>
                                                <p className="text-default-500">{error}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <AcademicCapIcon className="w-16 h-16 text-default-400 mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold mb-2">No Training Programs Found</h3>
                                                <p className="text-default-500">No training programs found for the selected criteria.</p>
                                                {canCreateTrainings && (
                                                    <Button
                                                        color="primary"
                                                        variant="flat"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={handleCreate}
                                                        className="mt-4"
                                                    >
                                                        Create First Training
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Modal Components following Leave Management pattern */}
            <TrainingForm
                training={currentTraining}
                isOpen={modalStates.create_training || modalStates.edit_training}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        closeModal(modalStates.create_training ? 'create_training' : 'edit_training');
                    }
                }}
                mode={modalStates.create_training ? 'create' : 'edit'}
            />
            
            <DeleteTrainingForm
                training={currentTraining}
                isOpen={modalStates.delete_training}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        closeModal('delete_training');
                    }
                }}
            />
        </>
    );
};

Training.layout = (page) => <App>{page}</App>;

export default Training;
