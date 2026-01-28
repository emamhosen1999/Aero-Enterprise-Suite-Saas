import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Avatar } from "@heroui/react";
import { 
    AcademicCapIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    UserIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    PhoneIcon,
    EnvelopeIcon,
    CalendarDaysIcon,
    StarIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const Trainers = ({ title, departments: initialDepartments = [], skills: initialSkills = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
    // Theme radius helper
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
    const [trainers, setTrainers] = useState([]);
    const [departments, setDepartments] = useState(initialDepartments);
    const [skills, setSkills] = useState(initialSkills);
    const [filters, setFilters] = useState({ 
        search: '', 
        department_id: '', 
        expertise: '', 
        certification_level: '', 
        availability_status: '',
        rating: ''
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_trainers: 0, 
        active_trainers: 0, 
        certified_trainers: 0, 
        avg_rating: 0,
        total_programs: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, view: false, delete: false, programs: false });
    const [selectedTrainer, setSelectedTrainer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        employee_id: '',
        department_id: '',
        expertise_areas: [],
        certifications: [],
        bio: '',
        experience_years: '',
        hourly_rate: '',
        availability_status: 'available',
        max_trainees_per_session: '',
        preferred_training_methods: [],
        languages: [],
        social_links: {
            linkedin: '',
            website: '',
            portfolio: ''
        },
        profile_image: null
    });

    // Permission checks
    const canCreateTrainer = canCreate('hrm.training.trainers') || isSuperAdmin();
    const canUpdateTrainer = canUpdate('hrm.training.trainers') || isSuperAdmin();
    const canDeleteTrainer = canDelete('hrm.training.trainers') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Trainers", 
            value: stats.total_trainers, 
            icon: <AcademicCapIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Active Trainers", 
            value: stats.active_trainers, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Certified Trainers", 
            value: stats.certified_trainers, 
            icon: <StarIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Average Rating", 
            value: `${stats.avg_rating}/5.0`, 
            icon: <StarIcon className="w-6 h-6" />, 
            color: "text-secondary", 
            iconBg: "bg-secondary/20" 
        },
    ], [stats]);

    // Trainer configuration
    const availabilityStatuses = [
        { key: 'available', label: 'Available', color: 'success' },
        { key: 'busy', label: 'Busy', color: 'warning' },
        { key: 'on_leave', label: 'On Leave', color: 'danger' },
        { key: 'inactive', label: 'Inactive', color: 'default' },
    ];

    const certificationLevels = [
        { key: 'beginner', label: 'Beginner' },
        { key: 'intermediate', label: 'Intermediate' },
        { key: 'advanced', label: 'Advanced' },
        { key: 'expert', label: 'Expert' },
        { key: 'master', label: 'Master' },
    ];

    const trainingMethods = [
        { key: 'classroom', label: 'Classroom Training' },
        { key: 'online', label: 'Online Training' },
        { key: 'workshop', label: 'Workshop' },
        { key: 'seminar', label: 'Seminar' },
        { key: 'hands_on', label: 'Hands-on Training' },
        { key: 'mentoring', label: 'One-on-One Mentoring' },
        { key: 'webinar', label: 'Webinar' },
    ];

    const languages = [
        { key: 'english', label: 'English' },
        { key: 'spanish', label: 'Spanish' },
        { key: 'french', label: 'French' },
        { key: 'german', label: 'German' },
        { key: 'italian', label: 'Italian' },
        { key: 'portuguese', label: 'Portuguese' },
        { key: 'mandarin', label: 'Mandarin' },
        { key: 'japanese', label: 'Japanese' },
    ];

    const getStatusColor = (status) => {
        return availabilityStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return availabilityStatuses.find(s => s.key === status)?.label || status;
    };

    const getRatingStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        
        for (let i = 0; i < fullStars; i++) {
            stars.push(<StarIcon key={i} className="w-4 h-4 text-warning fill-current" />);
        }
        
        if (hasHalfStar) {
            stars.push(<StarIcon key="half" className="w-4 h-4 text-warning fill-current opacity-50" />);
        }
        
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<StarIcon key={`empty-${i}`} className="w-4 h-4 text-default-300" />);
        }
        
        return stars;
    };

    // Data fetching
    const fetchTrainers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.training.trainers.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setTrainers(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch trainers'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.training.trainers.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch trainer stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrainers();
        fetchStats();
    }, [fetchTrainers, fetchStats]);

    // Modal handlers
    const openModal = (type, trainer = null) => {
        setSelectedTrainer(trainer);
        if (trainer) {
            setFormData({
                name: trainer.name || '',
                email: trainer.email || '',
                phone: trainer.phone || '',
                employee_id: trainer.employee_id || '',
                department_id: trainer.department_id || '',
                expertise_areas: trainer.expertise_areas || [],
                certifications: trainer.certifications || [],
                bio: trainer.bio || '',
                experience_years: trainer.experience_years || '',
                hourly_rate: trainer.hourly_rate || '',
                availability_status: trainer.availability_status || 'available',
                max_trainees_per_session: trainer.max_trainees_per_session || '',
                preferred_training_methods: trainer.preferred_training_methods || [],
                languages: trainer.languages || [],
                social_links: trainer.social_links || {
                    linkedin: '',
                    website: '',
                    portfolio: ''
                },
                profile_image: null
            });
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                employee_id: '',
                department_id: '',
                expertise_areas: [],
                certifications: [],
                bio: '',
                experience_years: '',
                hourly_rate: '',
                availability_status: 'available',
                max_trainees_per_session: '',
                preferred_training_methods: [],
                languages: [],
                social_links: {
                    linkedin: '',
                    website: '',
                    portfolio: ''
                },
                profile_image: null
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedTrainer(null);
    };

    // File upload handler
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, profile_image: file }));
        }
    };

    // Form submission
    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const formDataToSubmit = new FormData();
                
                // Handle arrays and objects
                Object.keys(formData).forEach(key => {
                    if (key === 'social_links') {
                        formDataToSubmit.append(key, JSON.stringify(formData[key]));
                    } else if (Array.isArray(formData[key])) {
                        formDataToSubmit.append(key, JSON.stringify(formData[key]));
                    } else if (formData[key] !== null && formData[key] !== '') {
                        formDataToSubmit.append(key, formData[key]);
                    }
                });

                const endpoint = selectedTrainer 
                    ? route('hrm.training.trainers.update', selectedTrainer.id)
                    : route('hrm.training.trainers.store');
                
                const method = selectedTrainer ? 'POST' : 'POST';
                if (selectedTrainer) {
                    formDataToSubmit.append('_method', 'PUT');
                }

                const response = await axios.post(endpoint, formDataToSubmit, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || `Trainer ${selectedTrainer ? 'updated' : 'created'} successfully`]);
                    fetchTrainers();
                    fetchStats();
                    closeModal(selectedTrainer ? 'edit' : 'add');
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedTrainer ? 'update' : 'create'} trainer`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedTrainer ? 'Updating' : 'Creating'} trainer...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Delete handler
    const handleDelete = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.training.trainers.destroy', selectedTrainer.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Trainer deleted successfully']);
                    fetchTrainers();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete trainer']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting trainer...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Multi-select handlers
    const handleMultiSelectChange = (key, selectedKeys) => {
        setFormData(prev => ({ ...prev, [key]: Array.from(selectedKeys) }));
    };

    // Social links handler
    const handleSocialLinkChange = (platform, value) => {
        setFormData(prev => ({
            ...prev,
            social_links: {
                ...prev.social_links,
                [platform]: value
            }
        }));
    };

    // Table columns
    const columns = [
        { uid: 'trainer', name: 'Trainer' },
        { uid: 'contact', name: 'Contact' },
        { uid: 'department', name: 'Department' },
        { uid: 'expertise', name: 'Expertise' },
        { uid: 'experience', name: 'Experience' },
        { uid: 'rating', name: 'Rating' },
        { uid: 'availability', name: 'Availability' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'trainer':
                return (
                    <div className="flex items-center gap-3">
                        <Avatar
                            src={item.profile_image_url}
                            name={item.name}
                            size="sm"
                            fallback={<UserIcon className="w-4 h-4" />}
                        />
                        <div>
                            <p className="font-medium">{item.name}</p>
                            {item.employee_id && <p className="text-small text-default-500">ID: {item.employee_id}</p>}
                        </div>
                    </div>
                );
            case 'contact':
                return (
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <EnvelopeIcon className="w-4 h-4 text-default-400" />
                            <span className="text-small">{item.email}</span>
                        </div>
                        {item.phone && (
                            <div className="flex items-center gap-2">
                                <PhoneIcon className="w-4 h-4 text-default-400" />
                                <span className="text-small">{item.phone}</span>
                            </div>
                        )}
                    </div>
                );
            case 'department':
                return item.department?.name || 'N/A';
            case 'expertise':
                return (
                    <div className="flex flex-wrap gap-1">
                        {item.expertise_areas?.slice(0, 2).map((skill, index) => (
                            <Chip key={index} size="sm" variant="flat" color="primary">
                                {skill}
                            </Chip>
                        ))}
                        {item.expertise_areas?.length > 2 && (
                            <Chip size="sm" variant="flat">
                                +{item.expertise_areas.length - 2}
                            </Chip>
                        )}
                    </div>
                );
            case 'experience':
                return item.experience_years ? `${item.experience_years} years` : 'N/A';
            case 'rating':
                return (
                    <div className="flex items-center gap-2">
                        <div className="flex">
                            {getRatingStars(item.average_rating || 0)}
                        </div>
                        <span className="text-small text-default-500">
                            ({item.total_reviews || 0})
                        </span>
                    </div>
                );
            case 'availability':
                return (
                    <Chip 
                        color={getStatusColor(item.availability_status)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getStatusLabel(item.availability_status)}
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
                        {canUpdateTrainer && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light"
                                onPress={() => openModal('edit', item)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeleteTrainer && (
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
    }, [canUpdateTrainer, canDeleteTrainer]);

    return (
        <>
            <Head title={title} />
            
            {/* Modals */}
            {(modalStates.add || modalStates.edit) && (
                <Modal 
                    isOpen={modalStates.add || modalStates.edit} 
                    onOpenChange={() => closeModal(modalStates.add ? 'add' : 'edit')}
                    size="3xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">
                                {selectedTrainer ? 'Edit Trainer' : 'Add Trainer'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-semibold text-default-700">Basic Information</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Full Name"
                                            placeholder="Enter trainer name"
                                            value={formData.name}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                                            isRequired
                                            radius={getThemeRadius()}
                                        />

                                        <Input
                                            label="Employee ID"
                                            placeholder="Enter employee ID"
                                            value={formData.employee_id}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}
                                            radius={getThemeRadius()}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Email"
                                            placeholder="Enter email address"
                                            value={formData.email}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                                            type="email"
                                            isRequired
                                            radius={getThemeRadius()}
                                        />

                                        <Input
                                            label="Phone"
                                            placeholder="Enter phone number"
                                            value={formData.phone}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                                            radius={getThemeRadius()}
                                        />
                                    </div>

                                    <Select
                                        label="Department"
                                        placeholder="Select department"
                                        selectedKeys={formData.department_id ? [formData.department_id] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, department_id: Array.from(keys)[0] || '' }))}
                                        radius={getThemeRadius()}
                                    >
                                        {departments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                {/* Professional Details */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-semibold text-default-700">Professional Details</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Experience Years"
                                            placeholder="Enter years of experience"
                                            value={formData.experience_years}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, experience_years: value }))}
                                            type="number"
                                            radius={getThemeRadius()}
                                        />

                                        <Input
                                            label="Hourly Rate"
                                            placeholder="Enter hourly rate"
                                            value={formData.hourly_rate}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, hourly_rate: value }))}
                                            startContent="$"
                                            type="number"
                                            radius={getThemeRadius()}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select
                                            label="Availability Status"
                                            placeholder="Select availability"
                                            selectedKeys={formData.availability_status ? [formData.availability_status] : []}
                                            onSelectionChange={(keys) => setFormData(prev => ({ ...prev, availability_status: Array.from(keys)[0] || 'available' }))}
                                            radius={getThemeRadius()}
                                        >
                                            {availabilityStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <Input
                                            label="Max Trainees Per Session"
                                            placeholder="Enter maximum capacity"
                                            value={formData.max_trainees_per_session}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, max_trainees_per_session: value }))}
                                            type="number"
                                            radius={getThemeRadius()}
                                        />
                                    </div>

                                    <Select
                                        label="Expertise Areas"
                                        placeholder="Select expertise areas"
                                        selectedKeys={new Set(formData.expertise_areas)}
                                        onSelectionChange={(keys) => handleMultiSelectChange('expertise_areas', keys)}
                                        selectionMode="multiple"
                                        radius={getThemeRadius()}
                                    >
                                        {skills.map(skill => (
                                            <SelectItem key={skill.name || skill} value={skill.name || skill}>
                                                {skill.name || skill}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Preferred Training Methods"
                                        placeholder="Select training methods"
                                        selectedKeys={new Set(formData.preferred_training_methods)}
                                        onSelectionChange={(keys) => handleMultiSelectChange('preferred_training_methods', keys)}
                                        selectionMode="multiple"
                                        radius={getThemeRadius()}
                                    >
                                        {trainingMethods.map(method => (
                                            <SelectItem key={method.key}>{method.label}</SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Languages"
                                        placeholder="Select languages"
                                        selectedKeys={new Set(formData.languages)}
                                        onSelectionChange={(keys) => handleMultiSelectChange('languages', keys)}
                                        selectionMode="multiple"
                                        radius={getThemeRadius()}
                                    >
                                        {languages.map(language => (
                                            <SelectItem key={language.key}>{language.label}</SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                {/* Additional Information */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-semibold text-default-700">Additional Information</h4>
                                    
                                    <Textarea
                                        label="Bio"
                                        placeholder="Enter trainer biography"
                                        value={formData.bio}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, bio: value }))}
                                        rows={4}
                                        radius={getThemeRadius()}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Input
                                            label="LinkedIn Profile"
                                            placeholder="https://linkedin.com/in/..."
                                            value={formData.social_links.linkedin}
                                            onValueChange={(value) => handleSocialLinkChange('linkedin', value)}
                                            radius={getThemeRadius()}
                                        />

                                        <Input
                                            label="Website"
                                            placeholder="https://website.com"
                                            value={formData.social_links.website}
                                            onValueChange={(value) => handleSocialLinkChange('website', value)}
                                            radius={getThemeRadius()}
                                        />

                                        <Input
                                            label="Portfolio"
                                            placeholder="https://portfolio.com"
                                            value={formData.social_links.portfolio}
                                            onValueChange={(value) => handleSocialLinkChange('portfolio', value)}
                                            radius={getThemeRadius()}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-default-600 mb-2 block">
                                            Profile Image
                                        </label>
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png"
                                            onChange={handleFileUpload}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedTrainer ? 'Update' : 'Add'} Trainer
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.view && selectedTrainer && (
                <Modal 
                    isOpen={modalStates.view} 
                    onOpenChange={() => closeModal('view')}
                    size="3xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Trainer Profile</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <Avatar
                                        src={selectedTrainer.profile_image_url}
                                        name={selectedTrainer.name}
                                        size="lg"
                                        fallback={<UserIcon className="w-8 h-8" />}
                                    />
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedTrainer.name}</h3>
                                        <p className="text-default-600">{selectedTrainer.department?.name}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex">
                                                {getRatingStars(selectedTrainer.average_rating || 0)}
                                            </div>
                                            <span className="text-small text-default-500">
                                                ({selectedTrainer.total_reviews || 0} reviews)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {selectedTrainer.bio && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Biography</label>
                                        <p className="text-default-900 bg-default-100 p-3 rounded text-sm mt-1">
                                            {selectedTrainer.bio}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Contact</label>
                                        <div className="space-y-1 mt-1">
                                            <div className="flex items-center gap-2">
                                                <EnvelopeIcon className="w-4 h-4 text-default-400" />
                                                <span className="text-sm">{selectedTrainer.email}</span>
                                            </div>
                                            {selectedTrainer.phone && (
                                                <div className="flex items-center gap-2">
                                                    <PhoneIcon className="w-4 h-4 text-default-400" />
                                                    <span className="text-sm">{selectedTrainer.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Experience</label>
                                        <p className="text-default-900">{selectedTrainer.experience_years} years</p>
                                    </div>
                                </div>

                                {selectedTrainer.expertise_areas?.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600 mb-2 block">
                                            Expertise Areas
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTrainer.expertise_areas.map((skill, index) => (
                                                <Chip key={index} variant="flat" color="primary">
                                                    {skill}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedTrainer.preferred_training_methods?.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-default-600 mb-2 block">
                                            Training Methods
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTrainer.preferred_training_methods.map((method, index) => (
                                                <Chip key={index} variant="flat" color="secondary">
                                                    {trainingMethods.find(m => m.key === method)?.label || method}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Availability</label>
                                        <Chip 
                                            color={getStatusColor(selectedTrainer.availability_status)} 
                                            variant="flat"
                                            className="mt-1"
                                        >
                                            {getStatusLabel(selectedTrainer.availability_status)}
                                        </Chip>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Hourly Rate</label>
                                        <p className="text-default-900">
                                            ${selectedTrainer.hourly_rate || 'Not set'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Max Trainees</label>
                                        <p className="text-default-900">
                                            {selectedTrainer.max_trainees_per_session || 'No limit'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('view')}>Close</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.delete && selectedTrainer && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Trainer</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete trainer "{selectedTrainer?.name}"?</p>
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
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Training Trainers Management">
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
                                                    <AcademicCapIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Training Trainers
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Manage training instructors and their profiles
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateTrainer && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('add')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Add Trainer
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
                                            placeholder="Search trainers..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={getThemeRadius()}
                                        />
                                        
                                        <Select
                                            placeholder="All Departments"
                                            selectedKeys={filters.department_id ? [filters.department_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('department_id', Array.from(keys)[0] || '')}
                                        >
                                            {departments.map(dept => (
                                                <SelectItem key={dept.id}>{dept.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Expertise"
                                            selectedKeys={filters.expertise ? [filters.expertise] : []}
                                            onSelectionChange={(keys) => handleFilterChange('expertise', Array.from(keys)[0] || '')}
                                        >
                                            {skills.map(skill => (
                                                <SelectItem key={skill.name || skill}>{skill.name || skill}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={filters.availability_status ? [filters.availability_status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('availability_status', Array.from(keys)[0] || '')}
                                        >
                                            {availabilityStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Training Trainers" 
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
                                            items={trainers} 
                                            emptyContent={loading ? "Loading..." : "No trainers found"}
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

Trainers.layout = (page) => <App children={page} />;
export default Trainers;