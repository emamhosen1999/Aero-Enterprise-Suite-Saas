import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Tabs, Tab, Switch, Avatar } from "@heroui/react";
import { 
    AcademicCapIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    TrophyIcon,
    CheckBadgeIcon,
    DocumentTextIcon,
    ClockIcon,
    CalendarDaysIcon,
    UserIcon,
    BuildingOfficeIcon,
    GlobeAltIcon,
    PrinterIcon,
    ShareIcon,
    CheckCircleIcon,
    XMarkIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const CertificationIssuance = ({ title, trainingPrograms = [], employees = [], departments = [], certifications = [] }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete } = useHRMAC();
    
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
    const [certificationData, setCertificationData] = useState([]);
    const [filters, setFilters] = useState({ 
        search: '', 
        program_id: 'all', 
        department_id: 'all',
        status: 'all',
        certification_type: 'all',
        expiry_status: 'all'
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 20, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_certifications: 0, 
        active_certifications: 0, 
        expired_certifications: 0, 
        pending_certifications: 0,
        this_month_issued: 0,
        expiring_soon: 0
    });
    const [modalStates, setModalStates] = useState({ issue: false, edit: false, delete: false, view: false, renew: false, bulk: false });
    const [selectedCertification, setSelectedCertification] = useState(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        training_program_id: '',
        certification_name: '',
        certification_type: 'completion', // completion, proficiency, competency
        
        // Certification details
        issued_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        certificate_number: '',
        issuing_authority: '',
        accreditation_body: '',
        
        // Training completion details
        training_completion_date: '',
        training_score: '',
        minimum_score_required: '',
        hours_completed: '',
        
        // Certification metadata
        is_renewable: true,
        renewal_period_months: '12',
        digital_badge_enabled: true,
        public_verification_enabled: false,
        
        // Additional details
        skills_acquired: '',
        competencies: '',
        assessment_notes: '',
        instructor_signature: '',
        
        // Digital certificate options
        template_id: '',
        custom_fields: {},
        send_notification: true,
        include_linkedin_badge: false,
    });

    // Permission checks
    const canIssue = canCreate('hrm.training.certifications');
    const canEditCertifications = canUpdate('hrm.training.certifications');
    const canDeleteCertifications = canDelete('hrm.training.certifications');

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Certifications", 
            value: stats.total_certifications, 
            icon: <AcademicCapIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Active", 
            value: stats.active_certifications, 
            icon: <CheckBadgeIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Expired", 
            value: stats.expired_certifications, 
            icon: <ExclamationTriangleIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
        { 
            title: "This Month", 
            value: stats.this_month_issued, 
            icon: <TrophyIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
    ], [stats]);

    // Certification configuration
    const certificationTypes = [
        { key: 'completion', label: 'Course Completion', description: 'Basic completion certificate' },
        { key: 'proficiency', label: 'Proficiency Certificate', description: 'Demonstrates skill proficiency' },
        { key: 'competency', label: 'Competency Certification', description: 'Professional competency validation' },
        { key: 'accreditation', label: 'Professional Accreditation', description: 'Industry-recognized accreditation' },
    ];

    const certificationStatuses = [
        { key: 'active', label: 'Active', color: 'success' },
        { key: 'expired', label: 'Expired', color: 'danger' },
        { key: 'pending', label: 'Pending Issuance', color: 'warning' },
        { key: 'revoked', label: 'Revoked', color: 'default' },
        { key: 'renewed', label: 'Renewed', color: 'primary' },
    ];

    const getStatusColor = (status) => {
        return certificationStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return certificationStatuses.find(s => s.key === status)?.label || status;
    };

    const getExpiryStatus = (expiryDate) => {
        if (!expiryDate) return { status: 'never', color: 'default', text: 'Never Expires' };
        
        const today = new Date();
        const expiry = new Date(expiryDate);
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
            return { status: 'expired', color: 'danger', text: `Expired ${Math.abs(daysUntilExpiry)} days ago` };
        } else if (daysUntilExpiry <= 30) {
            return { status: 'expiring', color: 'warning', text: `Expires in ${daysUntilExpiry} days` };
        } else if (daysUntilExpiry <= 90) {
            return { status: 'due', color: 'primary', text: `Expires in ${daysUntilExpiry} days` };
        } else {
            return { status: 'active', color: 'success', text: `Expires in ${daysUntilExpiry} days` };
        }
    };

    // Data fetching
    const fetchCertifications = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.training.certifications.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setCertificationData(response.data.certifications || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch certifications'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.training.certifications.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch certification stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCertifications();
        fetchStats();
    }, [fetchCertifications, fetchStats]);

    // CRUD operations
    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const url = selectedCertification 
                    ? route('hrm.training.certifications.update', selectedCertification.id)
                    : route('hrm.training.certifications.store');
                
                const response = await axios({
                    method: selectedCertification ? 'PUT' : 'POST',
                    url,
                    data: formData
                });
                
                if (response.status === 200) {
                    resolve([response.data.message || `Certification ${selectedCertification ? 'updated' : 'issued'} successfully`]);
                    fetchCertifications();
                    fetchStats();
                    closeModal(selectedCertification ? 'edit' : 'issue');
                    resetForm();
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedCertification ? 'update' : 'issue'} certification`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedCertification ? 'Updating' : 'Issuing'} certification...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleRenew = async () => {
        if (!selectedCertification) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.training.certifications.renew', selectedCertification.id), {
                    renewal_period_months: formData.renewal_period_months,
                    send_notification: formData.send_notification
                });
                if (response.status === 200) {
                    resolve([response.data.message || 'Certification renewed successfully']);
                    fetchCertifications();
                    fetchStats();
                    closeModal('renew');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to renew certification']);
            }
        });

        showToast.promise(promise, {
            loading: 'Renewing certification...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDelete = async () => {
        if (!selectedCertification) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.training.certifications.destroy', selectedCertification.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Certification deleted successfully']);
                    fetchCertifications();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete certification']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting certification...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Generate certificate number
    const generateCertificateNumber = () => {
        const prefix = 'CERT';
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}-${year}-${random}`;
    };

    // Modal handlers
    const openModal = (type, certification = null) => {
        setSelectedCertification(certification);
        if (certification && (type === 'edit' || type === 'view' || type === 'renew')) {
            setFormData({
                employee_id: certification.employee_id || '',
                training_program_id: certification.training_program_id || '',
                certification_name: certification.certification_name || '',
                certification_type: certification.certification_type || 'completion',
                
                issued_date: certification.issued_date || new Date().toISOString().split('T')[0],
                expiry_date: certification.expiry_date || '',
                certificate_number: certification.certificate_number || '',
                issuing_authority: certification.issuing_authority || '',
                accreditation_body: certification.accreditation_body || '',
                
                training_completion_date: certification.training_completion_date || '',
                training_score: certification.training_score || '',
                minimum_score_required: certification.minimum_score_required || '',
                hours_completed: certification.hours_completed || '',
                
                is_renewable: certification.is_renewable !== false,
                renewal_period_months: certification.renewal_period_months || '12',
                digital_badge_enabled: certification.digital_badge_enabled !== false,
                public_verification_enabled: certification.public_verification_enabled === true,
                
                skills_acquired: certification.skills_acquired || '',
                competencies: certification.competencies || '',
                assessment_notes: certification.assessment_notes || '',
                instructor_signature: certification.instructor_signature || '',
                
                template_id: certification.template_id || '',
                custom_fields: certification.custom_fields || {},
                send_notification: true,
                include_linkedin_badge: certification.include_linkedin_badge === true,
            });
        } else if (type === 'issue') {
            // Auto-generate certificate number for new certificates
            setFormData(prev => ({
                ...prev,
                certificate_number: generateCertificateNumber()
            }));
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedCertification(null);
    };

    const resetForm = () => {
        setFormData({
            employee_id: '',
            training_program_id: '',
            certification_name: '',
            certification_type: 'completion',
            
            issued_date: new Date().toISOString().split('T')[0],
            expiry_date: '',
            certificate_number: '',
            issuing_authority: '',
            accreditation_body: '',
            
            training_completion_date: '',
            training_score: '',
            minimum_score_required: '',
            hours_completed: '',
            
            is_renewable: true,
            renewal_period_months: '12',
            digital_badge_enabled: true,
            public_verification_enabled: false,
            
            skills_acquired: '',
            competencies: '',
            assessment_notes: '',
            instructor_signature: '',
            
            template_id: '',
            custom_fields: {},
            send_notification: true,
            include_linkedin_badge: false,
        });
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Form handlers
    const handleFormChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // Table columns
    const columns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'certification', name: 'Certification' },
        { uid: 'program', name: 'Training Program' },
        { uid: 'type', name: 'Type' },
        { uid: 'issued_date', name: 'Issued' },
        { uid: 'expiry', name: 'Expiry Status' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((certification, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-3">
                        <Avatar 
                            src={certification.employee?.avatar} 
                            name={certification.employee?.name} 
                            size="sm"
                        />
                        <div>
                            <p className="font-medium">{certification.employee?.name}</p>
                            <p className="text-xs text-default-500">{certification.employee?.email}</p>
                        </div>
                    </div>
                );
            case 'certification':
                return (
                    <div>
                        <p className="font-medium">{certification.certification_name}</p>
                        <p className="text-xs text-default-500">#{certification.certificate_number}</p>
                    </div>
                );
            case 'program':
                return certification.training_program?.title || 'N/A';
            case 'type':
                const typeInfo = certificationTypes.find(t => t.key === certification.certification_type);
                return (
                    <Chip size="sm" variant="flat" color="primary">
                        {typeInfo?.label || certification.certification_type}
                    </Chip>
                );
            case 'issued_date':
                return certification.issued_date ? new Date(certification.issued_date).toLocaleDateString() : 'N/A';
            case 'expiry':
                const expiryInfo = getExpiryStatus(certification.expiry_date);
                return (
                    <Chip 
                        size="sm" 
                        color={expiryInfo.color} 
                        variant="flat"
                    >
                        {expiryInfo.text}
                    </Chip>
                );
            case 'status':
                return (
                    <Chip 
                        color={getStatusColor(certification.status)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getStatusLabel(certification.status)}
                    </Chip>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openModal('view', certification)}
                        >
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                        {canEditCertifications && (
                            <>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => openModal('edit', certification)}
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </Button>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="warning"
                                    onPress={() => openModal('renew', certification)}
                                >
                                    <TrophyIcon className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                        {canDeleteCertifications && (
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => openModal('delete', certification)}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            default:
                return certification[columnKey] || '-';
        }
    }, [canEditCertifications, canDeleteCertifications]);

    return (
        <>
            <Head title={title} />
            
            {/* Issue/Edit Certification Modal */}
            {(modalStates.issue || modalStates.edit) && (
                <Modal 
                    isOpen={modalStates.issue || modalStates.edit} 
                    onOpenChange={() => closeModal(modalStates.issue ? 'issue' : 'edit')}
                    size="4xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">
                                {selectedCertification ? 'Edit Certification' : 'Issue New Certification'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <Tabs aria-label="Certification Form">
                                <Tab key="basic" title="Basic Info">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Select
                                                label="Employee"
                                                placeholder="Select employee"
                                                selectedKeys={formData.employee_id ? [formData.employee_id] : []}
                                                onSelectionChange={(keys) => handleFormChange('employee_id', Array.from(keys)[0] || '')}
                                                isRequired
                                                radius={themeRadius}
                                            >
                                                {employees.map(employee => (
                                                    <SelectItem key={employee.id}>{employee.name}</SelectItem>
                                                ))}
                                            </Select>

                                            <Select
                                                label="Training Program"
                                                placeholder="Select training program"
                                                selectedKeys={formData.training_program_id ? [formData.training_program_id] : []}
                                                onSelectionChange={(keys) => handleFormChange('training_program_id', Array.from(keys)[0] || '')}
                                                radius={themeRadius}
                                            >
                                                {trainingPrograms.map(program => (
                                                    <SelectItem key={program.id}>{program.title}</SelectItem>
                                                ))}
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Certification Name"
                                                placeholder="Professional Development Certificate"
                                                value={formData.certification_name}
                                                onValueChange={(value) => handleFormChange('certification_name', value)}
                                                isRequired
                                                radius={themeRadius}
                                            />

                                            <Select
                                                label="Certification Type"
                                                selectedKeys={[formData.certification_type]}
                                                onSelectionChange={(keys) => handleFormChange('certification_type', Array.from(keys)[0])}
                                                radius={themeRadius}
                                            >
                                                {certificationTypes.map(type => (
                                                    <SelectItem key={type.key} description={type.description}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Certificate Number"
                                                value={formData.certificate_number}
                                                onValueChange={(value) => handleFormChange('certificate_number', value)}
                                                radius={themeRadius}
                                                endContent={
                                                    <Button
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => handleFormChange('certificate_number', generateCertificateNumber())}
                                                    >
                                                        Generate
                                                    </Button>
                                                }
                                            />

                                            <Input
                                                label="Issuing Authority"
                                                placeholder="HR Department"
                                                value={formData.issuing_authority}
                                                onValueChange={(value) => handleFormChange('issuing_authority', value)}
                                                radius={themeRadius}
                                            />
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="dates" title="Dates & Validity">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Issued Date"
                                                type="date"
                                                value={formData.issued_date}
                                                onValueChange={(value) => handleFormChange('issued_date', value)}
                                                isRequired
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Expiry Date"
                                                type="date"
                                                value={formData.expiry_date}
                                                onValueChange={(value) => handleFormChange('expiry_date', value)}
                                                radius={themeRadius}
                                                description="Leave empty for non-expiring certificates"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-medium">Renewable Certificate</span>
                                                    <p className="text-xs text-default-500">Allow automatic renewal</p>
                                                </div>
                                                <Switch
                                                    isSelected={formData.is_renewable}
                                                    onValueChange={(value) => handleFormChange('is_renewable', value)}
                                                />
                                            </div>

                                            {formData.is_renewable && (
                                                <Select
                                                    label="Renewal Period"
                                                    selectedKeys={[formData.renewal_period_months]}
                                                    onSelectionChange={(keys) => handleFormChange('renewal_period_months', Array.from(keys)[0])}
                                                    radius={themeRadius}
                                                >
                                                    <SelectItem key="6">6 Months</SelectItem>
                                                    <SelectItem key="12">1 Year</SelectItem>
                                                    <SelectItem key="24">2 Years</SelectItem>
                                                    <SelectItem key="36">3 Years</SelectItem>
                                                </Select>
                                            )}
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="training" title="Training Details">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Training Completion Date"
                                                type="date"
                                                value={formData.training_completion_date}
                                                onValueChange={(value) => handleFormChange('training_completion_date', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Hours Completed"
                                                type="number"
                                                placeholder="40"
                                                value={formData.hours_completed}
                                                onValueChange={(value) => handleFormChange('hours_completed', value)}
                                                radius={themeRadius}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Training Score (%)"
                                                type="number"
                                                min="0"
                                                max="100"
                                                placeholder="85"
                                                value={formData.training_score}
                                                onValueChange={(value) => handleFormChange('training_score', value)}
                                                radius={themeRadius}
                                            />

                                            <Input
                                                label="Minimum Score Required (%)"
                                                type="number"
                                                min="0"
                                                max="100"
                                                placeholder="70"
                                                value={formData.minimum_score_required}
                                                onValueChange={(value) => handleFormChange('minimum_score_required', value)}
                                                radius={themeRadius}
                                            />
                                        </div>

                                        <Textarea
                                            label="Skills Acquired"
                                            placeholder="List the key skills acquired through this training..."
                                            value={formData.skills_acquired}
                                            onValueChange={(value) => handleFormChange('skills_acquired', value)}
                                            radius={themeRadius}
                                        />

                                        <Textarea
                                            label="Competencies Demonstrated"
                                            placeholder="Describe competencies demonstrated by the employee..."
                                            value={formData.competencies}
                                            onValueChange={(value) => handleFormChange('competencies', value)}
                                            radius={themeRadius}
                                        />
                                    </div>
                                </Tab>

                                <Tab key="options" title="Certificate Options">
                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-medium">Digital Badge</span>
                                                    <p className="text-xs text-default-500">Enable digital badge for this certificate</p>
                                                </div>
                                                <Switch
                                                    isSelected={formData.digital_badge_enabled}
                                                    onValueChange={(value) => handleFormChange('digital_badge_enabled', value)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-medium">Public Verification</span>
                                                    <p className="text-xs text-default-500">Allow public verification of this certificate</p>
                                                </div>
                                                <Switch
                                                    isSelected={formData.public_verification_enabled}
                                                    onValueChange={(value) => handleFormChange('public_verification_enabled', value)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-medium">LinkedIn Badge</span>
                                                    <p className="text-xs text-default-500">Include option to add badge to LinkedIn</p>
                                                </div>
                                                <Switch
                                                    isSelected={formData.include_linkedin_badge}
                                                    onValueChange={(value) => handleFormChange('include_linkedin_badge', value)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-medium">Send Notification</span>
                                                    <p className="text-xs text-default-500">Notify employee when certificate is issued</p>
                                                </div>
                                                <Switch
                                                    isSelected={formData.send_notification}
                                                    onValueChange={(value) => handleFormChange('send_notification', value)}
                                                />
                                            </div>
                                        </div>

                                        <Input
                                            label="Accreditation Body"
                                            placeholder="Professional Certification Body"
                                            value={formData.accreditation_body}
                                            onValueChange={(value) => handleFormChange('accreditation_body', value)}
                                            radius={themeRadius}
                                        />

                                        <Textarea
                                            label="Assessment Notes"
                                            placeholder="Additional notes about the assessment or certification process..."
                                            value={formData.assessment_notes}
                                            onValueChange={(value) => handleFormChange('assessment_notes', value)}
                                            radius={themeRadius}
                                        />
                                    </div>
                                </Tab>
                            </Tabs>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.issue ? 'issue' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedCertification ? 'Update Certification' : 'Issue Certification'}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Renew Certification Modal */}
            {modalStates.renew && (
                <Modal isOpen={modalStates.renew} onOpenChange={() => closeModal('renew')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Renew Certification</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div className="text-sm">
                                    <p><strong>Employee:</strong> {selectedCertification?.employee?.name}</p>
                                    <p><strong>Certification:</strong> {selectedCertification?.certification_name}</p>
                                    <p><strong>Current Expiry:</strong> {selectedCertification?.expiry_date ? new Date(selectedCertification.expiry_date).toLocaleDateString() : 'N/A'}</p>
                                </div>

                                <Select
                                    label="Renewal Period"
                                    selectedKeys={[formData.renewal_period_months]}
                                    onSelectionChange={(keys) => handleFormChange('renewal_period_months', Array.from(keys)[0])}
                                    radius={themeRadius}
                                >
                                    <SelectItem key="6">6 Months</SelectItem>
                                    <SelectItem key="12">1 Year</SelectItem>
                                    <SelectItem key="24">2 Years</SelectItem>
                                    <SelectItem key="36">3 Years</SelectItem>
                                </Select>

                                <div className="flex items-center justify-between">
                                    <span>Send Renewal Notification</span>
                                    <Switch
                                        isSelected={formData.send_notification}
                                        onValueChange={(value) => handleFormChange('send_notification', value)}
                                    />
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('renew')}>Cancel</Button>
                            <Button color="primary" onPress={handleRenew}>Renew Certification</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {modalStates.delete && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Certification</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete the certification <strong>"{selectedCertification?.certification_name}"</strong> for <strong>{selectedCertification?.employee?.name}</strong>?</p>
                            <p className="text-sm text-danger">This action cannot be undone and will permanently remove the certification record.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('delete')}>Cancel</Button>
                            <Button color="danger" onPress={handleDelete}>Delete Certification</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
            
            {/* Main content wrapper */}
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Certification Issuance Management">
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
                                                        Certification Issuance
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Issue and manage professional certifications
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canIssue && (
                                                    <Button 
                                                        color="primary" 
                                                        variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('issue')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Issue Certificate
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
                                            placeholder="Search employees or certificates..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            placeholder="All Programs"
                                            selectedKeys={filters.program_id !== 'all' ? [filters.program_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('program_id', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Programs</SelectItem>
                                            {trainingPrograms.map(program => (
                                                <SelectItem key={program.id}>{program.title}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Departments"
                                            selectedKeys={filters.department_id !== 'all' ? [filters.department_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('department_id', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Departments</SelectItem>
                                            {departments.map(department => (
                                                <SelectItem key={department.id}>{department.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="Certification Type"
                                            selectedKeys={filters.certification_type !== 'all' ? [filters.certification_type] : []}
                                            onSelectionChange={(keys) => handleFilterChange('certification_type', Array.from(keys)[0] || 'all')}
                                        >
                                            <SelectItem key="all">All Types</SelectItem>
                                            {certificationTypes.map(type => (
                                                <SelectItem key={type.key}>{type.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Certifications" 
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
                                            items={certificationData} 
                                            emptyContent={loading ? "Loading..." : "No certifications found"}
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

CertificationIssuance.layout = (page) => <App children={page} />;
export default CertificationIssuance;