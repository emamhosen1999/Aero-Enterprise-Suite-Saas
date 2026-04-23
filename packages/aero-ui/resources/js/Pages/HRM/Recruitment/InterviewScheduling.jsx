import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Avatar } from "@heroui/react";
import { 
    CalendarDaysIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserGroupIcon,
    VideoCameraIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const InterviewScheduling = ({ title, applicants: initialApplicants = [], interviewers: initialInterviewers = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
    // Responsive breakpoints
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

    // State management
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [interviews, setInterviews] = useState([]);
    const [applicants, setApplicants] = useState(initialApplicants);
    const [interviewers, setInterviewers] = useState(initialInterviewers);
    const [filters, setFilters] = useState({ search: '', applicant: '', interviewer: '', status: '', date_range: '' });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total: 0, 
        scheduled: 0, 
        completed: 0, 
        cancelled: 0,
        today: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, view: false, delete: false });
    const [selectedInterview, setSelectedInterview] = useState(null);
    const [formData, setFormData] = useState({
        applicant_id: '',
        interviewer_id: '',
        interview_date: '',
        interview_time: '',
        duration: 60,
        interview_type: 'in_person',
        location: '',
        meeting_link: '',
        notes: '',
        status: 'scheduled'
    });

    // Permission checks
    const canScheduleInterview = canCreate('hrm.recruitment.interviews') || isSuperAdmin();
    const canUpdateInterview = canUpdate('hrm.recruitment.interviews') || isSuperAdmin();
    const canDeleteInterview = canDelete('hrm.recruitment.interviews') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Interviews", 
            value: stats.total, 
            icon: <CalendarDaysIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Scheduled", 
            value: stats.scheduled, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Completed", 
            value: stats.completed, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Today", 
            value: stats.today, 
            icon: <CalendarDaysIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Interview status and types
    const interviewStatuses = [
        { key: 'scheduled', label: 'Scheduled', color: 'warning' },
        { key: 'completed', label: 'Completed', color: 'success' },
        { key: 'cancelled', label: 'Cancelled', color: 'danger' },
        { key: 'no_show', label: 'No Show', color: 'danger' },
    ];

    const interviewTypes = [
        { key: 'in_person', label: 'In Person' },
        { key: 'video_call', label: 'Video Call' },
        { key: 'phone_call', label: 'Phone Call' },
    ];

    const getStatusColor = (status) => {
        return interviewStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return interviewStatuses.find(s => s.key === status)?.label || status;
    };

    const getTypeLabel = (type) => {
        return interviewTypes.find(t => t.key === type)?.label || type;
    };

    // Data fetching
    const fetchInterviews = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.recruitment.interviews.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setInterviews(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch interviews'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.recruitment.interviews.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch interview stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInterviews();
        fetchStats();
    }, [fetchInterviews, fetchStats]);

    // Modal handlers
    const openModal = (type, interview = null) => {
        setSelectedInterview(interview);
        if (interview) {
            setFormData({
                applicant_id: interview.applicant_id || '',
                interviewer_id: interview.interviewer_id || '',
                interview_date: interview.interview_date || '',
                interview_time: interview.interview_time || '',
                duration: interview.duration || 60,
                interview_type: interview.interview_type || 'in_person',
                location: interview.location || '',
                meeting_link: interview.meeting_link || '',
                notes: interview.notes || '',
                status: interview.status || 'scheduled'
            });
        } else {
            setFormData({
                applicant_id: '',
                interviewer_id: '',
                interview_date: '',
                interview_time: '',
                duration: 60,
                interview_type: 'in_person',
                location: '',
                meeting_link: '',
                notes: '',
                status: 'scheduled'
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedInterview(null);
    };

    // Form submission
    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const endpoint = selectedInterview 
                    ? route('hrm.recruitment.interviews.update', selectedInterview.id)
                    : route('hrm.recruitment.interviews.store');
                
                const method = selectedInterview ? 'PUT' : 'POST';
                const response = await axios[method.toLowerCase()](endpoint, formData);
                
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || `Interview ${selectedInterview ? 'updated' : 'scheduled'} successfully`]);
                    fetchInterviews();
                    fetchStats();
                    closeModal(selectedInterview ? 'edit' : 'add');
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedInterview ? 'update' : 'schedule'} interview`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedInterview ? 'Updating' : 'Scheduling'} interview...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Delete handler
    const handleDelete = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.recruitment.interviews.destroy', selectedInterview.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Interview deleted successfully']);
                    fetchInterviews();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete interview']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting interview...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Table columns
    const columns = [
        { uid: 'applicant', name: 'Applicant' },
        { uid: 'interviewer', name: 'Interviewer' },
        { uid: 'datetime', name: 'Date & Time' },
        { uid: 'type', name: 'Type' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'applicant':
                return (
                    <div className="flex items-center gap-3">
                        <Avatar size="sm" name={item.applicant?.name} />
                        <div>
                            <p className="font-medium">{item.applicant?.name}</p>
                            <p className="text-small text-default-500">{item.applicant?.job_opening?.title}</p>
                        </div>
                    </div>
                );
            case 'interviewer':
                return (
                    <div className="flex items-center gap-3">
                        <Avatar size="sm" name={item.interviewer?.name} />
                        <p className="font-medium">{item.interviewer?.name}</p>
                    </div>
                );
            case 'datetime':
                return (
                    <div>
                        <p className="font-medium">{new Date(item.interview_date).toLocaleDateString()}</p>
                        <p className="text-small text-default-500">{item.interview_time} ({item.duration} min)</p>
                    </div>
                );
            case 'type':
                return (
                    <div className="flex items-center gap-1">
                        {item.interview_type === 'video_call' && <VideoCameraIcon className="w-4 h-4" />}
                        <span>{getTypeLabel(item.interview_type)}</span>
                    </div>
                );
            case 'status':
                return (
                    <Chip 
                        color={getStatusColor(item.status)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getStatusLabel(item.status)}
                    </Chip>
                );
            case 'actions':
                return (
                    <div className="flex gap-1">
                        <Button 
                            isIconOnly 
                            size="sm" 
                            variant="light"
                            onPress={() => openModal('view', item)}
                        >
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                        {canUpdateInterview && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light"
                                onPress={() => openModal('edit', item)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeleteInterview && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light" 
                                color="danger"
                                onPress={() => openModal('delete', item)}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            default:
                return item[columnKey] || '-';
        }
    }, [canUpdateInterview, canDeleteInterview]);

    // Get current date and time for minimum values
    const getCurrentDateTime = () => {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].substring(0, 5);
        return { date, time };
    };

    return (
        <>
            <Head title={title} />
            
            {/* Modals */}
            {(modalStates.add || modalStates.edit) && (
                <Modal 
                    isOpen={modalStates.add || modalStates.edit} 
                    onOpenChange={() => closeModal(modalStates.add ? 'add' : 'edit')}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">
                                {selectedInterview ? 'Edit Interview' : 'Schedule Interview'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Applicant"
                                        placeholder="Select applicant"
                                        selectedKeys={formData.applicant_id ? [formData.applicant_id] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, applicant_id: Array.from(keys)[0] || '' }))}
                                        isRequired
                                        radius={themeRadius}
                                    >
                                        {applicants.map(applicant => (
                                            <SelectItem key={applicant.id}>{applicant.name} - {applicant.job_opening?.title}</SelectItem>
                                        ))}
                                    </Select>
                                    
                                    <Select
                                        label="Interviewer"
                                        placeholder="Select interviewer"
                                        selectedKeys={formData.interviewer_id ? [formData.interviewer_id] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, interviewer_id: Array.from(keys)[0] || '' }))}
                                        isRequired
                                        radius={themeRadius}
                                    >
                                        {interviewers.map(interviewer => (
                                            <SelectItem key={interviewer.id}>{interviewer.name}</SelectItem>
                                        ))}
                                    </Select>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input
                                        type="date"
                                        label="Interview Date"
                                        value={formData.interview_date}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, interview_date: value }))}
                                        min={getCurrentDateTime().date}
                                        isRequired
                                        radius={themeRadius}
                                    />
                                    
                                    <Input
                                        type="time"
                                        label="Interview Time"
                                        value={formData.interview_time}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, interview_time: value }))}
                                        isRequired
                                        radius={themeRadius}
                                    />
                                    
                                    <Input
                                        type="number"
                                        label="Duration (minutes)"
                                        value={formData.duration.toString()}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) || 60 }))}
                                        min="15"
                                        max="480"
                                        radius={themeRadius}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Interview Type"
                                        selectedKeys={[formData.interview_type]}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, interview_type: Array.from(keys)[0] }))}
                                        radius={themeRadius}
                                    >
                                        {interviewTypes.map(type => (
                                            <SelectItem key={type.key}>{type.label}</SelectItem>
                                        ))}
                                    </Select>
                                    
                                    <Select
                                        label="Status"
                                        selectedKeys={[formData.status]}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, status: Array.from(keys)[0] }))}
                                        radius={themeRadius}
                                    >
                                        {interviewStatuses.map(status => (
                                            <SelectItem key={status.key}>{status.label}</SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                {formData.interview_type === 'in_person' && (
                                    <Input
                                        label="Location"
                                        placeholder="Enter interview location"
                                        value={formData.location}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                                        radius={themeRadius}
                                    />
                                )}

                                {formData.interview_type === 'video_call' && (
                                    <Input
                                        label="Meeting Link"
                                        placeholder="Enter video call meeting link"
                                        value={formData.meeting_link}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, meeting_link: value }))}
                                        radius={themeRadius}
                                    />
                                )}

                                <Textarea
                                    label="Notes"
                                    placeholder="Additional notes about the interview"
                                    value={formData.notes}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                                    rows={3}
                                    radius={themeRadius}
                                />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedInterview ? 'Update' : 'Schedule'} Interview
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.view && selectedInterview && (
                <Modal 
                    isOpen={modalStates.view} 
                    onOpenChange={() => closeModal('view')}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Interview Details</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Applicant</label>
                                        <p className="text-default-900">{selectedInterview.applicant?.name}</p>
                                        <p className="text-small text-default-500">{selectedInterview.applicant?.job_opening?.title}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Interviewer</label>
                                        <p className="text-default-900">{selectedInterview.interviewer?.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Date & Time</label>
                                        <p className="text-default-900">
                                            {new Date(selectedInterview.interview_date).toLocaleDateString()} at {selectedInterview.interview_time}
                                        </p>
                                        <p className="text-small text-default-500">Duration: {selectedInterview.duration} minutes</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Type & Status</label>
                                        <div className="flex gap-2 mt-1">
                                            <Chip size="sm" variant="flat">{getTypeLabel(selectedInterview.interview_type)}</Chip>
                                            <Chip 
                                                color={getStatusColor(selectedInterview.status)} 
                                                size="sm" 
                                                variant="flat"
                                            >
                                                {getStatusLabel(selectedInterview.status)}
                                            </Chip>
                                        </div>
                                    </div>
                                </div>

                                {selectedInterview.location && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Location</label>
                                        <p className="text-default-900">{selectedInterview.location}</p>
                                    </div>
                                )}

                                {selectedInterview.meeting_link && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Meeting Link</label>
                                        <a 
                                            href={selectedInterview.meeting_link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-primary-500 hover:underline"
                                        >
                                            {selectedInterview.meeting_link}
                                        </a>
                                    </div>
                                )}

                                {selectedInterview.notes && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Notes</label>
                                        <p className="text-default-900 mt-1 text-sm bg-default-100 p-3 rounded">
                                            {selectedInterview.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('view')}>Close</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.delete && selectedInterview && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Interview</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete this interview?</p>
                            <p className="text-sm text-default-500">This action cannot be undone.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Interview Scheduling">
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
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <CalendarDaysIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Interview Scheduling
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Schedule and manage recruitment interviews
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canScheduleInterview && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('add')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Schedule Interview
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} isLoading={statsLoading} className="mb-6" />
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            label="Search"
                                            placeholder="Search interviews..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            placeholder="All Applicants"
                                            selectedKeys={filters.applicant ? [filters.applicant] : []}
                                            onSelectionChange={(keys) => handleFilterChange('applicant', Array.from(keys)[0] || '')}
                                        >
                                            {applicants.map(applicant => (
                                                <SelectItem key={applicant.id}>{applicant.name}</SelectItem>
                                            ))}
                                        </Select>
                                        
                                        <Select
                                            placeholder="All Interviewers"
                                            selectedKeys={filters.interviewer ? [filters.interviewer] : []}
                                            onSelectionChange={(keys) => handleFilterChange('interviewer', Array.from(keys)[0] || '')}
                                        >
                                            {interviewers.map(interviewer => (
                                                <SelectItem key={interviewer.id}>{interviewer.name}</SelectItem>
                                            ))}
                                        </Select>
                                        
                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={filters.status ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                                        >
                                            {interviewStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Interview Schedule" 
                                        classNames={{
                                            wrapper: "shadow-none border border-divider rounded-lg",
                                            th: "bg-default-100 text-default-600 font-semibold",
                                            td: "py-3"
                                        }}
                                    >
                                        <TableHeader columns={columns}>
                                            {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                                        </TableHeader>
                                        <TableBody 
                                            items={interviews} 
                                            emptyContent={loading ? "Loading..." : "No interviews scheduled"}
                                            isLoading={loading}
                                        >
                                            {(item) => (
                                                <TableRow key={item.id}>
                                                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    
                                    {pagination.total > pagination.perPage && (
                                        <div className="flex justify-center mt-6">
                                            <Pagination
                                                total={pagination.lastPage}
                                                page={pagination.currentPage}
                                                onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                                                showControls
                                                showShadow
                                                color="primary"
                                                size={isMobile ? "sm" : "md"}
                                            />
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

InterviewScheduling.layout = (page) => <App children={page} />;
export default InterviewScheduling;