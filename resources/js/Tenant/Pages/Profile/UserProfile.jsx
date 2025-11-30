import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    ButtonGroup,
    Button,
    Chip,
    Tabs,
    Tab,
    Card,
    CardBody,
    Spinner,
    Input,
    Select,
    SelectItem
} from "@heroui/react";

import {
    UserIcon,
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    DocumentArrowDownIcon,
    UserPlusIcon,
    CheckCircleIcon,
    ClockIcon,
    ChartBarIcon,
    ExclamationTriangleIcon,
    CalendarIcon,
    AcademicCapIcon,
    BriefcaseIcon,
    BanknotesIcon,
    HeartIcon,
    ShieldCheckIcon,
    CogIcon,
    PhoneIcon,
    MapPinIcon,
    IdentificationIcon,
    GlobeAltIcon,
    HomeIcon,
    BuildingOfficeIcon,
    UsersIcon,
    CurrencyDollarIcon,
    EyeIcon,
    EyeSlashIcon,
    ArrowDownTrayIcon,
    CloudArrowUpIcon,
    DocumentIcon,
    DocumentTextIcon,
    PhotoIcon,
    TrashIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";
import {Head, usePage} from "@inertiajs/react";
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";
import StatsCards from "@/Components/StatsCards.jsx";
import EnhancedProfileCard from "@/Components/EnhancedProfileCard.jsx";
import ProfileSection from "@/Components/ProfileSection.jsx";
import InfoRow from "@/Components/InfoRow.jsx";
import EnhancedModal from "@/Components/EnhancedModal.jsx";
import ProfileForm from '@/Forms/ProfileForm.jsx';
import PersonalInformationForm from "@/Forms/PersonalInformationForm.jsx";
import EmergencyContactForm from "@/Forms/EmergencyContactForm.jsx";
import BankInformationForm from "@/Forms/BankInformationForm.jsx";
import FamilyMemberForm from "@/Forms/FamilyMemberForm.jsx";
import EducationInformationDialog from "@/Forms/EducationInformationForm.jsx";
import ExperienceInformationForm from "@/Forms/ExperienceInformationForm.jsx";
import SalaryInformationForm from "@/Forms/SalaryInformationForm.jsx";
import ProjectCard from "@/Components/ProjectCard.jsx";
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';

const projects = [
    {
        title: "Office Management",
        openTasks: 1,
        completedTasks: 9,
        description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry...",
        deadline: "17 Apr 2019",
        leaders: [
            { name: "John Doe", avatar: "assets/img/profiles/avatar-02.jpg" },
            { name: "Richard Miles", avatar: "assets/img/profiles/avatar-09.jpg" },
            { name: "John Smith", avatar: "assets/img/profiles/avatar-10.jpg" },
            { name: "Mike Litorus", avatar: "assets/img/profiles/avatar-05.jpg" }
        ],
        team: [
            { name: "John Doe", avatar: "assets/img/profiles/avatar-02.jpg" },
            { name: "Richard Miles", avatar: "assets/img/profiles/avatar-09.jpg" },
            { name: "John Smith", avatar: "assets/img/profiles/avatar-10.jpg" },
            { name: "Mike Litorus", avatar: "assets/img/profiles/avatar-05.jpg" }
        ],
        progress: 40
    },
    // Add other projects similarly...
];

const UserProfile = ({ title, allUsers, report_to, departments, designations }) => {
    const { auth } = usePage().props;
    
    // Custom media queries
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
    
    const [user, setUser] = useState(usePage().props.user);
    const [selectedTab, setSelectedTab] = useState("overview");
    const [loading, setLoading] = useState(false);
    
    // Unified modal state management
    const [modals, setModals] = useState({
        profile: false,
        personal: false,
        emergency: false,
        bank: false,
        family: false,
        education: false,
        experience: false,
        salary: false
    });
    
    // Enhanced filters and search
    const [filters, setFilters] = useState({
        search: '',
        section: 'all',
        completionStatus: 'all',
        showEmpty: true
    });
    
    const [showFilters, setShowFilters] = useState(false);
    
    // Bank account visibility toggle
    const [showAccountNumber, setShowAccountNumber] = useState(false);
    
    // Document upload state
    const [uploadingDocument, setUploadingDocument] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    
    // Profile statistics
    const [profileStats, setProfileStats] = useState({
        completion_percentage: 0,
        total_sections: 8,
        completed_sections: 0,
        last_updated: null,
        profile_views: 0
    });

    // Check permissions
    const canEditProfile = auth.permissions?.includes('profile.own.update') || 
                          auth.permissions?.includes('profile.update') || 
                          auth.user.id === user.id;
    const canViewProfile = auth.permissions?.includes('profile.own.view') || 
                          auth.permissions?.includes('profile.view') || 
                          auth.user.id === user.id;

    // Modal handlers
    const openModal = useCallback((modalType) => {
        setModals(prev => ({ ...prev, [modalType]: true }));
    }, []);

    const closeModal = useCallback((modalType) => {
        setModals(prev => ({ ...prev, [modalType]: false }));
    }, []);

    // Filter handlers
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    // Calculate profile completion
    const calculateProfileCompletion = useCallback(() => {
        const sections = [
            user.name && user.email, // Basic info
            user.phone && user.address, // Contact info
            user.birthday && user.gender, // Personal info
            user.department && user.designation, // Work info
            user.emergency_contact_primary_name, // Emergency contact
            user.bank_name || user.bank_account_no, // Bank info
            user.educations && user.educations.length > 0, // Education
            user.experiences && user.experiences.length > 0, // Experience
        ];
        
        const completed = sections.filter(Boolean).length;
        const percentage = Math.round((completed / sections.length) * 100);
        
        setProfileStats(prev => ({
            ...prev,
            completion_percentage: percentage,
            completed_sections: completed,
            total_sections: sections.length
        }));

        return { completed, total: sections.length, percentage };
    }, [user]);

    // Fetch profile statistics
    const fetchProfileStats = useCallback(async () => {
        try {
            const response = await axios.get(route('profile.stats', { user: user.id }));
            if (response.data.stats) {
                setProfileStats(prev => ({ ...prev, ...response.data.stats }));
            }
        } catch (error) {
            // Silently handle error and use local calculation
            // Only log in development
            if (import.meta.env.DEV) {
                console.warn('Profile stats API not available, using local calculation:', error.response?.data?.message || error.message);
            }
            // Use calculated stats as fallback
            const { completed, total, percentage } = calculateProfileCompletion();
            setProfileStats(prev => ({
                ...prev,
                completion_percentage: percentage,
                completed_sections: completed,
                total_sections: total,
                profile_views: 0,
                last_updated: null
            }));
        }
    }, [user.id, calculateProfileCompletion]);

    // Effect to calculate completion on user data change
    useEffect(() => {
        calculateProfileCompletion();
        fetchProfileStats();
    }, [calculateProfileCompletion, fetchProfileStats]);

    // Success handler for form updates
    const handleFormSuccess = useCallback((updatedUser) => {
        if (updatedUser) {
            setUser(updatedUser);
        }
        calculateProfileCompletion();
        fetchProfileStats();
        showToast.success('Profile updated successfully');
    }, [calculateProfileCompletion, fetchProfileStats]);

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        {
            title: "Profile Completion",
            value: `${profileStats.completion_percentage}%`,
            icon: <CheckCircleIcon />,
            color: profileStats.completion_percentage >= 80 ? "text-green-400" : 
                   profileStats.completion_percentage >= 50 ? "text-orange-400" : "text-red-400",
            iconBg: profileStats.completion_percentage >= 80 ? "bg-green-500/20" : 
                    profileStats.completion_percentage >= 50 ? "bg-orange-500/20" : "bg-red-500/20",
            description: `${profileStats.completed_sections}/${profileStats.total_sections} sections completed`
        },
        {
            title: "Last Updated",
            value: profileStats.last_updated ? dayjs(profileStats.last_updated).fromNow() : 'Never',
            icon: <ClockIcon />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "Profile last modified"
        },
        {
            title: "Profile Views",
            value: profileStats.profile_views || 0,
            icon: <ChartBarIcon />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "Times profile viewed"
        },
        {
            title: "Account Status",
            value: user.active ? "Active" : "Inactive",
            icon: user.active ? <CheckCircleIcon /> : <ExclamationTriangleIcon />,
            color: user.active ? "text-green-400" : "text-red-400",
            iconBg: user.active ? "bg-green-500/20" : "bg-red-500/20",
            description: "Current account status"
        }
    ], [profileStats, user.active]);

    // Action buttons for PageHeader
    const actionButtons = useMemo(() => {
        const buttons = [];
        
        if (canEditProfile) {
            buttons.push({
                label: isMobile ? "Edit" : "Edit Profile",
                icon: <UserPlusIcon className="w-4 h-4" />,
                onPress: () => openModal('profile'),
                color: "primary",
                variant: "solid"
            });
        }

        buttons.push({
            label: isMobile ? "" : "Export",
            isIconOnly: isMobile,
            icon: <DocumentArrowDownIcon className="w-4 h-4" />,
            color: "default",
            variant: "bordered"
        });
        
        return buttons;
    }, [canEditProfile, isMobile, openModal]);

    // Check if section is empty
    const isSectionEmpty = useCallback((sectionType) => {
        switch (sectionType) {
            case 'personal':
                return !user.passport_no && !user.nationality && !user.religion && !user.marital_status;
            case 'emergency':
                return !user.emergency_contact_primary_name && !user.emergency_contact_secondary_name;
            case 'bank':
                return !user.bank_name && !user.bank_account_no && !user.ifsc_code && !user.pan_no;
            case 'family':
                return !user.family_member_name && !user.family_member_relationship;
            case 'education':
                return !user.educations || user.educations.length === 0;
            case 'experience':
                return !user.experiences || user.experiences.length === 0;
            default:
                return false;
        }
    }, [user]);

    // Check if section is completed
    const isSectionCompleted = useCallback((sectionType) => {
        switch (sectionType) {
            case 'personal':
                return !!(user.passport_no && user.nationality && user.religion && user.marital_status);
            case 'emergency':
                return !!(user.emergency_contact_primary_name && user.emergency_contact_primary_phone);
            case 'bank':
                return !!(user.bank_name && user.bank_account_no);
            case 'family':
                return !!(user.family_member_name && user.family_member_relationship);
            case 'education':
                return !!(user.educations && user.educations.length > 0);
            case 'experience':
                return !!(user.experiences && user.experiences.length > 0);
            default:
                return false;
        }
    }, [user]);

    // Early return if no permissions
    if (!canViewProfile) {
        return (
            <App>
                <Head title={title} />
                <div className="min-h-screen flex items-center justify-center p-4">
                    <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-md">
                        <CardBody className="p-8 text-center">
                            <ExclamationTriangleIcon className="w-16 h-16 text-warning-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
                            <p className="text-default-500">
                                You don't have permission to view this profile.
                            </p>
                        </CardBody>
                    </Card>
                </div>
            </App>
        );
    }

    // Render functions for different tabs
    const renderOverviewTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <ProfileSection
                title="Personal Information"
                icon={<IdentificationIcon />}
                onEdit={() => openModal('personal')}
                canEdit={canEditProfile}
                isEmpty={isSectionEmpty('personal')}
                isCompleted={isSectionCompleted('personal')}
            >
                <div className="space-y-1">
                    <InfoRow 
                        label="Passport No." 
                        value={user.passport_no} 
                        icon={<IdentificationIcon />}
                    />
                    <InfoRow 
                        label="Passport Expiry" 
                        value={user.passport_exp_date} 
                        type="date"
                        icon={<CalendarIcon />}
                    />
                    <InfoRow 
                        label="NID No." 
                        value={user.nid} 
                        icon={<IdentificationIcon />}
                    />
                    <InfoRow 
                        label="Nationality" 
                        value={user.nationality} 
                        icon={<GlobeAltIcon />}
                    />
                    <InfoRow 
                        label="Religion" 
                        value={user.religion} 
                        icon={<UserIcon />}
                    />
                    <InfoRow 
                        label="Marital Status" 
                        value={user.marital_status} 
                        type="chip"
                        icon={<HeartIcon />}
                    />
                    <InfoRow 
                        label="Spouse Employment" 
                        value={user.employment_of_spouse} 
                        icon={<BriefcaseIcon />}
                    />
                    <InfoRow 
                        label="Children" 
                        value={user.number_of_children} 
                        icon={<UsersIcon />}
                        showDivider={false}
                    />
                </div>
            </ProfileSection>

            {/* Emergency Contact */}
            <ProfileSection
                title="Emergency Contacts"
                icon={<PhoneIcon />}
                onEdit={() => openModal('emergency')}
                canEdit={canEditProfile}
                isEmpty={isSectionEmpty('emergency')}
                isCompleted={isSectionCompleted('emergency')}
            >
                <div className="space-y-4">
                    {user.emergency_contact_primary_name && (
                        <div>
                            <h5 className="text-sm font-semibold text-foreground mb-2">Primary Contact</h5>
                            <div className="space-y-1 pl-4 border-l-2 border-primary-500">
                                <InfoRow 
                                    label="Name" 
                                    value={user.emergency_contact_primary_name} 
                                    icon={<UserIcon />}
                                />
                                <InfoRow 
                                    label="Relationship" 
                                    value={user.emergency_contact_primary_relationship} 
                                    icon={<HeartIcon />}
                                />
                                <InfoRow 
                                    label="Phone" 
                                    value={user.emergency_contact_primary_phone} 
                                    type="phone"
                                    icon={<PhoneIcon />}
                                    showDivider={false}
                                />
                            </div>
                        </div>
                    )}

                    {user.emergency_contact_secondary_name && (
                        <div>
                            <h5 className="text-sm font-semibold text-foreground mb-2">Secondary Contact</h5>
                            <div className="space-y-1 pl-4 border-l-2 border-secondary-500">
                                <InfoRow 
                                    label="Name" 
                                    value={user.emergency_contact_secondary_name} 
                                    icon={<UserIcon />}
                                />
                                <InfoRow 
                                    label="Relationship" 
                                    value={user.emergency_contact_secondary_relationship} 
                                    icon={<HeartIcon />}
                                />
                                <InfoRow 
                                    label="Phone" 
                                    value={user.emergency_contact_secondary_phone} 
                                    type="phone"
                                    icon={<PhoneIcon />}
                                    showDivider={false}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </ProfileSection>

            {/* Bank Information */}
            <ProfileSection
                title="Banking Information"
                icon={<BanknotesIcon />}
                onEdit={() => openModal('bank')}
                canEdit={canEditProfile}
                isEmpty={isSectionEmpty('bank')}
                isCompleted={isSectionCompleted('bank')}
            >
                <div className="space-y-1">
                    <InfoRow 
                        label="Bank Name" 
                        value={user.bank_name} 
                        icon={<BuildingOfficeIcon />}
                    />
                    {/* Account Number with Masking and Toggle */}
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                        <div className="flex items-center gap-2 text-sm text-default-600">
                            <IdentificationIcon className="w-4 h-4" />
                            <span>Account Number</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground font-mono">
                                {user.bank_account_no 
                                    ? (showAccountNumber 
                                        ? user.bank_account_no 
                                        : `****${user.bank_account_no.slice(-4)}`)
                                    : 'N/A'
                                }
                            </span>
                            {user.bank_account_no && (
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => setShowAccountNumber(!showAccountNumber)}
                                    className="min-w-6 w-6 h-6"
                                >
                                    {showAccountNumber 
                                        ? <EyeSlashIcon className="w-4 h-4 text-default-500" />
                                        : <EyeIcon className="w-4 h-4 text-default-500" />
                                    }
                                </Button>
                            )}
                        </div>
                    </div>
                    <InfoRow 
                        label="IFSC Code" 
                        value={user.ifsc_code} 
                        icon={<IdentificationIcon />}
                    />
                    <InfoRow 
                        label="PAN Number" 
                        value={user.pan_no} 
                        icon={<IdentificationIcon />}
                        showDivider={false}
                    />
                </div>
            </ProfileSection>

            {/* Family Information */}
            <ProfileSection
                title="Family Information"
                icon={<UsersIcon />}
                onEdit={() => openModal('family')}
                canEdit={canEditProfile}
                isEmpty={isSectionEmpty('family')}
                isCompleted={isSectionCompleted('family')}
            >
                <div className="space-y-1">
                    <InfoRow 
                        label="Member Name" 
                        value={user.family_member_name} 
                        icon={<UserIcon />}
                    />
                    <InfoRow 
                        label="Relationship" 
                        value={user.family_member_relationship} 
                        icon={<HeartIcon />}
                    />
                    <InfoRow 
                        label="Date of Birth" 
                        value={user.family_member_dob} 
                        type="date"
                        icon={<CalendarIcon />}
                    />
                    <InfoRow 
                        label="Phone" 
                        value={user.family_member_phone} 
                        type="phone"
                        icon={<PhoneIcon />}
                        showDivider={false}
                    />
                </div>
            </ProfileSection>

            {/* Education */}
            <ProfileSection
                title="Education History"
                icon={<AcademicCapIcon />}
                onEdit={() => openModal('education')}
                canEdit={canEditProfile}
                isEmpty={isSectionEmpty('education')}
                isCompleted={isSectionCompleted('education')}
                className="lg:col-span-2"
            >
                {user.educations && user.educations.length > 0 ? (
                    <div className="space-y-4">
                        {user.educations.map((education, index) => (
                            <motion.div
                                key={education.id || index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 bg-white/5 rounded-lg border border-white/10"
                            >
                                <h5 className="font-semibold text-foreground mb-2">{education.institution}</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-default-500">Degree:</span>
                                        <p className="font-medium">{education.degree || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-default-500">Start Date:</span>
                                        <p className="font-medium">
                                            {education.starting_date ? new Date(education.starting_date).getFullYear() : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-default-500">End Date:</span>
                                        <p className="font-medium">
                                            {education.complete_date ? new Date(education.complete_date).getFullYear() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : null}
            </ProfileSection>

            {/* Experience */}
            <ProfileSection
                title="Work Experience"
                icon={<BriefcaseIcon />}
                onEdit={() => openModal('experience')}
                canEdit={canEditProfile}
                isEmpty={isSectionEmpty('experience')}
                isCompleted={isSectionCompleted('experience')}
                className="lg:col-span-2"
            >
                {user.experiences && user.experiences.length > 0 ? (
                    <div className="space-y-4">
                        {user.experiences.map((experience, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 bg-white/5 rounded-lg border border-white/10"
                            >
                                <h5 className="font-semibold text-foreground mb-1">
                                    {experience.job_position}
                                </h5>
                                <p className="text-primary-400 font-medium mb-2">{experience.company_name}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-default-500">Duration:</span>
                                        <p className="font-medium">
                                            {experience.period_from
                                                ? new Date(experience.period_from).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                                                : 'N/A'}{' '}
                                            - {experience.period_to
                                                ? new Date(experience.period_to).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                                                : 'Present'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-default-500">Location:</span>
                                        <p className="font-medium">{experience.location || 'N/A'}</p>
                                    </div>
                                </div>
                                {experience.description && (
                                    <div className="mt-2">
                                        <span className="text-default-500 text-sm">Description:</span>
                                        <p className="text-sm mt-1">{experience.description}</p>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                ) : null}
            </ProfileSection>
        </div>
    );

    const renderProjectsTab = () => (
        <div className="text-center py-12">
            <div className="p-8 bg-white/5 rounded-lg border border-white/10 max-w-md mx-auto">
                <BriefcaseIcon className="w-16 h-16 text-default-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Projects Coming Soon</h3>
                <p className="text-default-500 text-sm">
                    Project management integration will be available in a future update.
                </p>
            </div>
        </div>
    );

    const renderSalaryTab = () => (
        <div className="text-center py-12">
            <div className="p-8 bg-white/5 rounded-lg border border-white/10 max-w-md mx-auto">
                <CurrencyDollarIcon className="w-16 h-16 text-default-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Salary Information</h3>
                <p className="text-default-500 text-sm mb-4">
                    Access detailed salary and compensation information.
                </p>
                {canEditProfile && (
                    <Button
                        color="primary"
                        variant="bordered"
                        onPress={() => openModal('salary')}
                        startContent={<CurrencyDollarIcon className="w-4 h-4" />}
                    >
                        View Salary Details
                    </Button>
                )}
            </div>
        </div>
    );

    const renderAssetsTab = () => (
        <div className="text-center py-12">
            <div className="p-8 bg-white/5 rounded-lg border border-white/10 max-w-md mx-auto">
                <ShieldCheckIcon className="w-16 h-16 text-default-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Assets Coming Soon</h3>
                <p className="text-default-500 text-sm">
                    Asset management and tracking will be available in a future update.
                </p>
            </div>
        </div>
    );

    // Helper function to get document icon based on type/mime
    const getDocumentIcon = (document) => {
        const mimeType = document.mime_type || '';
        if (mimeType.includes('pdf')) {
            return <DocumentTextIcon className="w-8 h-8 text-red-400" />;
        } else if (mimeType.includes('image')) {
            return <PhotoIcon className="w-8 h-8 text-blue-400" />;
        }
        return <DocumentIcon className="w-8 h-8 text-default-400" />;
    };

    // Helper to format file size
    const formatFileSize = (sizeKb) => {
        if (!sizeKb) return 'Unknown';
        if (sizeKb < 1024) return `${sizeKb} KB`;
        return `${(sizeKb / 1024).toFixed(1)} MB`;
    };

    // Helper to check if document is expiring soon (within 30 days)
    const isExpiringSoon = (expiryDate) => {
        if (!expiryDate) return false;
        const expiry = new Date(expiryDate);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    };

    // Helper to check if document is expired
    const isExpired = (expiryDate) => {
        if (!expiryDate) return false;
        return new Date(expiryDate) < new Date();
    };

    // Handle drag events for file upload
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    // Handle file drop
    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleFileUpload(e.dataTransfer.files[0]);
        }
    }, []);

    // Handle file input change
    const handleFileChange = useCallback(async (e) => {
        if (e.target.files && e.target.files[0]) {
            await handleFileUpload(e.target.files[0]);
        }
    }, []);

    // Handle file upload
    const handleFileUpload = async (file) => {
        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            showToast.error('Only PDF, JPG, and PNG files are allowed');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast.error('File size must not exceed 2MB');
            return;
        }

        setUploadingDocument(true);
        const formData = new FormData();
        formData.append('document', file);
        formData.append('name', file.name.replace(/\.[^/.]+$/, '')); // Remove extension for name
        formData.append('document_type', 'other');

        try {
            const response = await axios.post(
                route('hr.employees.documents.store', { user: user.id }),
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            
            if (response.data.success) {
                showToast.success('Document uploaded successfully');
                // Refresh user data to get new documents
                const updatedUser = { ...user };
                if (!updatedUser.documents) updatedUser.documents = [];
                updatedUser.documents = [response.data.document, ...updatedUser.documents];
                setUser(updatedUser);
            }
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to upload document');
        } finally {
            setUploadingDocument(false);
        }
    };

    // Handle document download
    const handleDownload = async (document) => {
        try {
            window.open(route('hr.employees.documents.download', { user: user.id, document: document.id }), '_blank');
        } catch (error) {
            showToast.error('Failed to download document');
        }
    };

    // Handle document delete
    const handleDeleteDocument = async (document) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        
        try {
            const response = await axios.delete(
                route('hr.employees.documents.destroy', { user: user.id, document: document.id })
            );
            
            if (response.data.success) {
                showToast.success('Document deleted successfully');
                // Remove from local state
                const updatedUser = { ...user };
                updatedUser.documents = updatedUser.documents.filter(d => d.id !== document.id);
                setUser(updatedUser);
            }
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to delete document');
        }
    };

    const renderDocumentsTab = () => {
        const documents = user.documents || [];
        
        return (
            <div className="space-y-6">
                {/* Upload Area */}
                {canEditProfile && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`
                            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
                            ${dragActive 
                                ? 'border-primary-500 bg-primary-500/10' 
                                : 'border-white/20 hover:border-white/40 bg-white/5'
                            }
                        `}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploadingDocument}
                        />
                        
                        {uploadingDocument ? (
                            <div className="flex flex-col items-center gap-3">
                                <Spinner size="lg" color="primary" />
                                <p className="text-default-500">Uploading document...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-4 bg-primary-500/20 rounded-full">
                                    <CloudArrowUpIcon className="w-8 h-8 text-primary-400" />
                                </div>
                                <div>
                                    <p className="text-foreground font-medium">
                                        Drag & drop files here or click to browse
                                    </p>
                                    <p className="text-default-500 text-sm mt-1">
                                        Supports PDF, JPG, PNG (max 2MB)
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Documents Grid */}
                {documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map((document, index) => (
                            <motion.div
                                key={document.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                                    <CardBody className="p-4">
                                        {/* Document Header */}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="p-2 bg-white/10 rounded-lg shrink-0">
                                                {getDocumentIcon(document)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-foreground truncate" title={document.name}>
                                                    {document.name}
                                                </h4>
                                                <p className="text-xs text-default-500 capitalize">
                                                    {document.document_type?.replace('_', ' ') || 'Document'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Document Meta */}
                                        <div className="space-y-2 text-sm">
                                            {document.document_number && (
                                                <div className="flex justify-between">
                                                    <span className="text-default-500">Number:</span>
                                                    <span className="text-foreground">{document.document_number}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-default-500">Size:</span>
                                                <span className="text-foreground">{formatFileSize(document.file_size_kb)}</span>
                                            </div>
                                            {document.expiry_date && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-default-500">Expires:</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-foreground ${
                                                            isExpired(document.expiry_date) 
                                                                ? 'text-danger-500' 
                                                                : isExpiringSoon(document.expiry_date) 
                                                                    ? 'text-warning-500' 
                                                                    : ''
                                                        }`}>
                                                            {new Date(document.expiry_date).toLocaleDateString()}
                                                        </span>
                                                        {isExpired(document.expiry_date) && (
                                                            <Chip size="sm" color="danger" variant="flat">Expired</Chip>
                                                        )}
                                                        {isExpiringSoon(document.expiry_date) && !isExpired(document.expiry_date) && (
                                                            <Chip size="sm" color="warning" variant="flat">Expiring</Chip>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Chip */}
                                        <div className="mt-3">
                                            <Chip 
                                                size="sm" 
                                                variant="flat"
                                                color={
                                                    document.status === 'verified' ? 'success' :
                                                    document.status === 'rejected' ? 'danger' :
                                                    document.status === 'expired' ? 'warning' : 'default'
                                                }
                                            >
                                                {document.status?.charAt(0).toUpperCase() + document.status?.slice(1) || 'Pending'}
                                            </Chip>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="primary"
                                                className="flex-1"
                                                startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                                onPress={() => handleDownload(document)}
                                            >
                                                Download
                                            </Button>
                                            {canEditProfile && (
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="flat"
                                                    color="danger"
                                                    onPress={() => handleDeleteDocument(document)}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="p-8 bg-white/5 rounded-lg border border-white/10 max-w-md mx-auto">
                            <DocumentIcon className="w-16 h-16 text-default-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Documents</h3>
                            <p className="text-default-500 text-sm">
                                {canEditProfile 
                                    ? 'Upload your first document using the drag & drop area above.'
                                    : 'No documents have been uploaded yet.'
                                }
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Head title={user.name} />
            
            {/* Enhanced Modals */}
            <AnimatePresence>
                {modals.profile && (
                    <ProfileForm
                        user={user}
                        allUsers={allUsers}
                        departments={departments}
                        designations={designations}
                        open={modals.profile}
                        setUser={setUser}
                        closeModal={() => closeModal('profile')}
                        onSuccess={handleFormSuccess}
                    />
                )}

                {modals.personal && (
                    <PersonalInformationForm
                        user={user}
                        open={modals.personal}
                        setUser={setUser}
                        closeModal={() => closeModal('personal')}
                        onSuccess={handleFormSuccess}
                    />
                )}

                {modals.emergency && (
                    <EmergencyContactForm
                        user={user}
                        open={modals.emergency}
                        setUser={setUser}
                        closeModal={() => closeModal('emergency')}
                        onSuccess={handleFormSuccess}
                    />
                )}

                {modals.bank && (
                    <BankInformationForm
                        user={user}
                        open={modals.bank}
                        setUser={setUser}
                        closeModal={() => closeModal('bank')}
                        onSuccess={handleFormSuccess}
                    />
                )}

                {modals.family && (
                    <FamilyMemberForm
                        user={user}
                        open={modals.family}
                        setUser={setUser}
                        closeModal={() => closeModal('family')}
                        onSuccess={handleFormSuccess}
                    />
                )}

                {modals.education && (
                    <EducationInformationDialog
                        user={user}
                        open={modals.education}
                        setUser={setUser}
                        closeModal={() => closeModal('education')}
                        onSuccess={handleFormSuccess}
                    />
                )}

                {modals.experience && (
                    <ExperienceInformationForm
                        user={user}
                        open={modals.experience}
                        setUser={setUser}
                        closeModal={() => closeModal('experience')}
                        onSuccess={handleFormSuccess}
                    />
                )}

                {modals.salary && (
                    <SalaryInformationForm user={user} setUser={setUser} />
                )}
            </AnimatePresence>

            {/* Page Header */}
            <PageHeader
                title={`${user.name}'s Profile`}
                subtitle="Comprehensive employee profile management with advanced features"
                icon={<UserIcon className="w-8 h-8" />}
                variant="default"
                actionButtons={actionButtons}
            />

            {/* Main Content Container */}
            <div className="p-4 space-y-6">
                {/* Statistics Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <StatsCards stats={statsData} />
                </motion.div>

                {/* Enhanced Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <EnhancedProfileCard
                        user={user}
                        departments={departments}
                        designations={designations}
                        onEditClick={() => openModal('profile')}
                        profileStats={profileStats}
                        canEdit={canEditProfile}
                    />
                </motion.div>

                {/* Search and Filters Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <div className="flex-1">
                        <Input
                            label="Search Profile Sections"
                            placeholder="Search sections, fields, or content..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            startContent={
                                <MagnifyingGlassIcon className="w-4 h-4" style={{ color: 'var(--theme-foreground-400, #71717A)' }} />
                            }
                            variant="bordered"
                            size={isMobile ? "sm" : "md"}
                            style={{
                                borderRadius: 'var(--borderRadius, 12px)',
                                fontFamily: 'var(--fontFamily, "Inter")'
                            }}
                        />
                    </div>

                    <div className="flex gap-2 items-end">
                        <ButtonGroup variant="bordered" className="bg-white/5">
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
                </motion.div>

                {/* Enhanced Filters Section */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <Card className="bg-white/10 backdrop-blur-md border-white/20">
                                <CardBody className="p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <FormControl 
                                            fullWidth
                                            variant="outlined"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                    backdropFilter: 'blur(16px)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    borderRadius: 2,
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                                    },
                                                    '&.Mui-focused': {
                                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                    },
                                                },
                                                '& .MuiInputLabel-root': {
                                                    color: 'text.secondary',
                                                },
                                            }}
                                        >
                                            <InputLabel>Profile Section</InputLabel>
                                            <Select
                                                value={filters.section || 'all'}
                                                label="Profile Section"
                                                onChange={(e) => handleFilterChange('section', e.target.value)}
                                            >
                                                <MenuItem value="all">All Sections</MenuItem>
                                                <MenuItem value="basic">Basic Information</MenuItem>
                                                <MenuItem value="personal">Personal Details</MenuItem>
                                                <MenuItem value="work">Work Information</MenuItem>
                                                <MenuItem value="emergency">Emergency Contacts</MenuItem>
                                                <MenuItem value="bank">Banking Details</MenuItem>
                                                <MenuItem value="education">Education</MenuItem>
                                                <MenuItem value="experience">Experience</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <FormControl 
                                            fullWidth
                                            variant="outlined"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                    backdropFilter: 'blur(16px)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    borderRadius: 2,
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                                    },
                                                    '&.Mui-focused': {
                                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                    },
                                                },
                                                '& .MuiInputLabel-root': {
                                                    color: 'text.secondary',
                                                },
                                            }}
                                        >
                                            <InputLabel>Completion Status</InputLabel>
                                            <Select
                                                value={filters.completionStatus || 'all'}
                                                label="Completion Status"
                                                onChange={(e) => handleFilterChange('completionStatus', e.target.value)}
                                            >
                                                <MenuItem value="all">All Status</MenuItem>
                                                <MenuItem value="completed">Completed</MenuItem>
                                                <MenuItem value="incomplete">Incomplete</MenuItem>
                                                <MenuItem value="empty">Empty</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-default-600">Show Empty:</label>
                                            <Button
                                                size="sm"
                                                variant={filters.showEmpty ? "solid" : "bordered"}
                                                color={filters.showEmpty ? "primary" : "default"}
                                                onPress={() => handleFilterChange('showEmpty', !filters.showEmpty)}
                                            >
                                                {filters.showEmpty ? 'Yes' : 'No'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Active Filters */}
                                    {(filters.search || filters.section !== 'all' || filters.completionStatus !== 'all') && (
                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                                            {filters.search && (
                                                <Chip
                                                    variant="flat"
                                                    color="primary"
                                                    size="sm"
                                                    onClose={() => handleFilterChange('search', '')}
                                                >
                                                    Search: {filters.search}
                                                </Chip>
                                            )}
                                            {filters.section !== 'all' && (
                                                <Chip
                                                    variant="flat"
                                                    color="secondary"
                                                    size="sm"
                                                    onClose={() => handleFilterChange('section', 'all')}
                                                >
                                                    Section: {filters.section}
                                                </Chip>
                                            )}
                                            {filters.completionStatus !== 'all' && (
                                                <Chip
                                                    variant="flat"
                                                    color="warning"
                                                    size="sm"
                                                    onClose={() => handleFilterChange('completionStatus', 'all')}
                                                >
                                                    Status: {filters.completionStatus}
                                                </Chip>
                                            )}
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tabbed Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                        <CardBody className="p-0">
                            <Tabs
                                selectedKey={selectedTab}
                                onSelectionChange={setSelectedTab}
                                variant="underlined"
                                classNames={{
                                    tabList: "gap-6 w-full relative rounded-none p-4 border-b border-white/10",
                                    cursor: "w-full bg-primary-500",
                                    tab: "max-w-fit px-4 h-12",
                                    tabContent: "group-data-[selected=true]:text-primary-foreground text-default-600 font-medium"
                                }}
                            >
                                <Tab key="overview" title="Overview" />
                                <Tab key="projects" title="Projects" />
                                <Tab key="salary" title="Salary & Benefits" />
                                <Tab key="assets" title="Assets" />
                                <Tab key="documents" title="Documents" />
                            </Tabs>

                            <div className="p-6">
                                <AnimatePresence mode="wait">
                                    {selectedTab === "overview" && (
                                        <motion.div
                                            key="overview"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {renderOverviewTab()}
                                        </motion.div>
                                    )}

                                    {selectedTab === "projects" && (
                                        <motion.div
                                            key="projects"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {renderProjectsTab()}
                                        </motion.div>
                                    )}

                                    {selectedTab === "salary" && (
                                        <motion.div
                                            key="salary"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {renderSalaryTab()}
                                        </motion.div>
                                    )}

                                    {selectedTab === "assets" && (
                                        <motion.div
                                            key="assets"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {renderAssetsTab()}
                                        </motion.div>
                                    )}

                                    {selectedTab === "documents" && (
                                        <motion.div
                                            key="documents"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {renderDocumentsTab()}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

UserProfile.layout = (page) => <App>{page}</App>;
export default UserProfile;
