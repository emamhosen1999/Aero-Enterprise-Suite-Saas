import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Switch, Divider } from "@heroui/react";
import { 
    DocumentTextIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentCheckIcon,
    CalendarDaysIcon,
    StarIcon,
    ArrowDownTrayIcon,
    PrinterIcon,
    EnvelopeIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';

const OfferLetters = ({ title, jobOpenings: initialJobOpenings = [], candidates: initialCandidates = [], templates: initialTemplates = [] }) => {
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
    const [offerLetters, setOfferLetters] = useState([]);
    const [jobOpenings, setJobOpenings] = useState(initialJobOpenings);
    const [candidates, setCandidates] = useState(initialCandidates);
    const [templates, setTemplates] = useState(initialTemplates);
    const [filters, setFilters] = useState({ 
        search: '', 
        job_opening_id: '', 
        candidate_id: '', 
        status: '', 
        template_id: '',
        offer_date: ''
    });
    const [pagination, setPagination] = useState({ currentPage: 1, perPage: 15, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ 
        total_offers: 0, 
        pending_offers: 0, 
        accepted_offers: 0, 
        rejected_offers: 0,
        expired_offers: 0
    });
    const [modalStates, setModalStates] = useState({ add: false, edit: false, view: false, delete: false, preview: false });
    const [selectedOfferLetter, setSelectedOfferLetter] = useState(null);
    const [formData, setFormData] = useState({
        job_opening_id: '',
        candidate_id: '',
        template_id: '',
        salary_offered: '',
        currency: 'USD',
        position_title: '',
        department: '',
        start_date: '',
        offer_valid_until: '',
        benefits: '',
        terms_conditions: '',
        status: 'draft',
        notes: '',
        send_email: true,
        require_signature: true,
        auto_expire: true
    });

    // Permission checks
    const canCreateOffer = canCreate('hrm.recruitment.offer-letters') || isSuperAdmin();
    const canUpdateOffer = canUpdate('hrm.recruitment.offer-letters') || isSuperAdmin();
    const canDeleteOffer = canDelete('hrm.recruitment.offer-letters') || isSuperAdmin();

    // Stats data for StatsCards component
    const statsData = useMemo(() => [
        { 
            title: "Total Offers", 
            value: stats.total_offers, 
            icon: <DocumentTextIcon className="w-6 h-6" />, 
            color: "text-primary", 
            iconBg: "bg-primary/20" 
        },
        { 
            title: "Pending", 
            value: stats.pending_offers, 
            icon: <ClockIcon className="w-6 h-6" />, 
            color: "text-warning", 
            iconBg: "bg-warning/20" 
        },
        { 
            title: "Accepted", 
            value: stats.accepted_offers, 
            icon: <CheckCircleIcon className="w-6 h-6" />, 
            color: "text-success", 
            iconBg: "bg-success/20" 
        },
        { 
            title: "Rejected/Expired", 
            value: stats.rejected_offers + stats.expired_offers, 
            icon: <DocumentCheckIcon className="w-6 h-6" />, 
            color: "text-danger", 
            iconBg: "bg-danger/20" 
        },
    ], [stats]);

    // Offer letter configuration
    const offerStatuses = [
        { key: 'draft', label: 'Draft', color: 'default' },
        { key: 'sent', label: 'Sent', color: 'primary' },
        { key: 'viewed', label: 'Viewed', color: 'warning' },
        { key: 'accepted', label: 'Accepted', color: 'success' },
        { key: 'rejected', label: 'Rejected', color: 'danger' },
        { key: 'expired', label: 'Expired', color: 'danger' },
        { key: 'withdrawn', label: 'Withdrawn', color: 'default' },
    ];

    const currencies = [
        { key: 'USD', label: 'USD ($)' },
        { key: 'EUR', label: 'EUR (€)' },
        { key: 'GBP', label: 'GBP (£)' },
        { key: 'INR', label: 'INR (₹)' },
        { key: 'CAD', label: 'CAD (C$)' },
        { key: 'AUD', label: 'AUD (A$)' },
    ];

    const defaultBenefits = [
        'Health Insurance',
        'Dental Insurance',
        'Retirement Plan (401k)',
        'Paid Time Off',
        'Flexible Work Schedule',
        'Professional Development',
        'Life Insurance',
        'Disability Insurance'
    ];

    const getStatusColor = (status) => {
        return offerStatuses.find(s => s.key === status)?.color || 'default';
    };

    const getStatusLabel = (status) => {
        return offerStatuses.find(s => s.key === status)?.label || status;
    };

    const getCurrencySymbol = (currency) => {
        const currencyMap = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'INR': '₹',
            'CAD': 'C$',
            'AUD': 'A$'
        };
        return currencyMap[currency] || currency;
    };

    const isOfferExpired = (offer) => {
        if (!offer.offer_valid_until) return false;
        const expiry = new Date(offer.offer_valid_until);
        const today = new Date();
        return expiry < today && offer.status !== 'accepted';
    };

    // Data fetching
    const fetchOfferLetters = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.recruitment.offer-letters.paginate'), {
                params: { 
                    page: pagination.currentPage, 
                    perPage: pagination.perPage,
                    ...filters
                }
            });
            if (response.status === 200) {
                setOfferLetters(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    lastPage: response.data.last_page || 1
                }));
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), {
                error: 'Failed to fetch offer letters'
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get(route('hrm.recruitment.offer-letters.stats'));
            if (response.status === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch offer letter stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOfferLetters();
        fetchStats();
    }, [fetchOfferLetters, fetchStats]);

    // Modal handlers
    const openModal = (type, offerLetter = null) => {
        setSelectedOfferLetter(offerLetter);
        if (offerLetter) {
            setFormData({
                job_opening_id: offerLetter.job_opening_id || '',
                candidate_id: offerLetter.candidate_id || '',
                template_id: offerLetter.template_id || '',
                salary_offered: offerLetter.salary_offered || '',
                currency: offerLetter.currency || 'USD',
                position_title: offerLetter.position_title || '',
                department: offerLetter.department || '',
                start_date: offerLetter.start_date || '',
                offer_valid_until: offerLetter.offer_valid_until || '',
                benefits: offerLetter.benefits || '',
                terms_conditions: offerLetter.terms_conditions || '',
                status: offerLetter.status || 'draft',
                notes: offerLetter.notes || '',
                send_email: offerLetter.send_email ?? true,
                require_signature: offerLetter.require_signature ?? true,
                auto_expire: offerLetter.auto_expire ?? true
            });
        } else {
            // Set default offer valid until date (30 days from now)
            const defaultExpiry = new Date();
            defaultExpiry.setDate(defaultExpiry.getDate() + 30);
            
            setFormData({
                job_opening_id: '',
                candidate_id: '',
                template_id: '',
                salary_offered: '',
                currency: 'USD',
                position_title: '',
                department: '',
                start_date: '',
                offer_valid_until: defaultExpiry.toISOString().split('T')[0],
                benefits: defaultBenefits.join('\n'),
                terms_conditions: '',
                status: 'draft',
                notes: '',
                send_email: true,
                require_signature: true,
                auto_expire: true
            });
        }
        setModalStates(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type) => {
        setModalStates(prev => ({ ...prev, [type]: false }));
        setSelectedOfferLetter(null);
    };

    // Auto-populate fields when job opening is selected
    const handleJobOpeningChange = (jobOpeningId) => {
        const selectedJob = jobOpenings.find(job => job.id === jobOpeningId);
        if (selectedJob) {
            setFormData(prev => ({
                ...prev,
                job_opening_id: jobOpeningId,
                position_title: selectedJob.title || '',
                department: selectedJob.department?.name || ''
            }));
        } else {
            setFormData(prev => ({ ...prev, job_opening_id: jobOpeningId }));
        }
    };

    // Form submission
    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const endpoint = selectedOfferLetter 
                    ? route('hrm.recruitment.offer-letters.update', selectedOfferLetter.id)
                    : route('hrm.recruitment.offer-letters.store');
                
                const method = selectedOfferLetter ? 'PUT' : 'POST';
                const response = await axios[method.toLowerCase()](endpoint, formData);
                
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || `Offer letter ${selectedOfferLetter ? 'updated' : 'created'} successfully`]);
                    fetchOfferLetters();
                    fetchStats();
                    closeModal(selectedOfferLetter ? 'edit' : 'add');
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${selectedOfferLetter ? 'update' : 'create'} offer letter`]);
            }
        });

        showToast.promise(promise, {
            loading: `${selectedOfferLetter ? 'Updating' : 'Creating'} offer letter...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Delete handler
    const handleDelete = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('hrm.recruitment.offer-letters.destroy', selectedOfferLetter.id));
                if (response.status === 200) {
                    resolve([response.data.message || 'Offer letter deleted successfully']);
                    fetchOfferLetters();
                    fetchStats();
                    closeModal('delete');
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete offer letter']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting offer letter...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Send offer letter
    const handleSendOffer = async (offerId) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.recruitment.offer-letters.send', offerId));
                if (response.status === 200) {
                    resolve([response.data.message || 'Offer letter sent successfully']);
                    fetchOfferLetters();
                    fetchStats();
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to send offer letter']);
            }
        });

        showToast.promise(promise, {
            loading: 'Sending offer letter...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    // Download offer letter
    const handleDownload = async (offerId) => {
        try {
            const response = await axios.get(route('hrm.recruitment.offer-letters.download', offerId), {
                responseType: 'blob'
            });
            
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `offer-letter-${offerId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showToast.success('Offer letter downloaded successfully');
        } catch (error) {
            showToast.error('Failed to download offer letter');
        }
    };

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Table columns
    const columns = [
        { uid: 'candidate', name: 'Candidate' },
        { uid: 'position', name: 'Position' },
        { uid: 'salary', name: 'Salary Offered' },
        { uid: 'offer_date', name: 'Offer Date' },
        { uid: 'valid_until', name: 'Valid Until' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'candidate':
                return (
                    <div>
                        <p className="font-medium">{item.candidate?.name || 'N/A'}</p>
                        <p className="text-small text-default-500">{item.candidate?.email || 'N/A'}</p>
                    </div>
                );
            case 'position':
                return (
                    <div>
                        <p className="font-medium">{item.position_title || item.job_opening?.title || 'N/A'}</p>
                        <p className="text-small text-default-500">{item.department || item.job_opening?.department?.name || 'N/A'}</p>
                    </div>
                );
            case 'salary':
                return item.salary_offered 
                    ? `${getCurrencySymbol(item.currency)} ${parseFloat(item.salary_offered).toLocaleString()}`
                    : 'Not specified';
            case 'offer_date':
                return item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A';
            case 'valid_until':
                if (!item.offer_valid_until) return 'No expiry';
                const validUntil = new Date(item.offer_valid_until);
                const isExpired = isOfferExpired(item);
                return (
                    <span className={isExpired ? 'text-danger' : ''}>
                        {validUntil.toLocaleDateString()}
                        {isExpired && ' (Expired)'}
                    </span>
                );
            case 'status':
                const isStatusExpired = isOfferExpired(item);
                const displayStatus = isStatusExpired && item.status !== 'accepted' ? 'expired' : item.status;
                return (
                    <Chip 
                        color={getStatusColor(displayStatus)} 
                        size="sm" 
                        variant="flat"
                    >
                        {getStatusLabel(displayStatus)}
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
                        <Button 
                            isIconOnly 
                            size="sm" 
                            variant="light" 
                            color="primary"
                            onPress={() => handleDownload(item.id)}
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                        </Button>
                        {item.status === 'draft' && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light" 
                                color="success"
                                onPress={() => handleSendOffer(item.id)}
                            >
                                <EnvelopeIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canUpdateOffer && (
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light"
                                onPress={() => openModal('edit', item)}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {canDeleteOffer && (
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
    }, [canUpdateOffer, canDeleteOffer]);

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
                                {selectedOfferLetter ? 'Edit Offer Letter' : 'Create Offer Letter'}
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-semibold text-default-700">Basic Information</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select
                                            label="Job Opening"
                                            placeholder="Select job opening"
                                            selectedKeys={formData.job_opening_id ? [formData.job_opening_id] : []}
                                            onSelectionChange={(keys) => handleJobOpeningChange(Array.from(keys)[0] || '')}
                                            isRequired
                                            radius={themeRadius}
                                        >
                                            {jobOpenings.map(job => (
                                                <SelectItem key={job.id} value={job.id}>
                                                    {job.title} ({job.department?.name})
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            label="Candidate"
                                            placeholder="Select candidate"
                                            selectedKeys={formData.candidate_id ? [formData.candidate_id] : []}
                                            onSelectionChange={(keys) => setFormData(prev => ({ ...prev, candidate_id: Array.from(keys)[0] || '' }))}
                                            isRequired
                                            radius={themeRadius}
                                        >
                                            {candidates.map(candidate => (
                                                <SelectItem key={candidate.id} value={candidate.id}>
                                                    {candidate.name} - {candidate.email}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Position Title"
                                            placeholder="Enter position title"
                                            value={formData.position_title}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, position_title: value }))}
                                            isRequired
                                            radius={themeRadius}
                                        />

                                        <Input
                                            label="Department"
                                            placeholder="Enter department"
                                            value={formData.department}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                                            radius={themeRadius}
                                        />
                                    </div>

                                    <Select
                                        label="Template"
                                        placeholder="Select offer letter template"
                                        selectedKeys={formData.template_id ? [formData.template_id] : []}
                                        onSelectionChange={(keys) => setFormData(prev => ({ ...prev, template_id: Array.from(keys)[0] || '' }))}
                                        radius={themeRadius}
                                    >
                                        {templates.map(template => (
                                            <SelectItem key={template.id} value={template.id}>
                                                {template.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                {/* Compensation & Dates */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-semibold text-default-700">Compensation & Timeline</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Select
                                            label="Currency"
                                            placeholder="Select currency"
                                            selectedKeys={formData.currency ? [formData.currency] : []}
                                            onSelectionChange={(keys) => setFormData(prev => ({ ...prev, currency: Array.from(keys)[0] || 'USD' }))}
                                            radius={themeRadius}
                                        >
                                            {currencies.map(currency => (
                                                <SelectItem key={currency.key}>{currency.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <Input
                                            label="Salary Offered"
                                            placeholder="Enter salary amount"
                                            value={formData.salary_offered}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, salary_offered: value }))}
                                            startContent={getCurrencySymbol(formData.currency)}
                                            type="number"
                                            isRequired
                                            radius={themeRadius}
                                        />

                                        <Select
                                            label="Status"
                                            placeholder="Select status"
                                            selectedKeys={formData.status ? [formData.status] : []}
                                            onSelectionChange={(keys) => setFormData(prev => ({ ...prev, status: Array.from(keys)[0] || 'draft' }))}
                                            radius={themeRadius}
                                        >
                                            {offerStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Start Date"
                                            placeholder="Select start date"
                                            value={formData.start_date}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, start_date: value }))}
                                            type="date"
                                            radius={themeRadius}
                                        />

                                        <Input
                                            label="Offer Valid Until"
                                            placeholder="Select expiry date"
                                            value={formData.offer_valid_until}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, offer_valid_until: value }))}
                                            type="date"
                                            radius={themeRadius}
                                        />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-semibold text-default-700">Offer Content</h4>
                                    
                                    <Textarea
                                        label="Benefits Package"
                                        placeholder="List benefits and perks..."
                                        value={formData.benefits}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, benefits: value }))}
                                        rows={6}
                                        radius={themeRadius}
                                    />

                                    <Textarea
                                        label="Terms & Conditions"
                                        placeholder="Enter terms and conditions..."
                                        value={formData.terms_conditions}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, terms_conditions: value }))}
                                        rows={4}
                                        radius={themeRadius}
                                    />

                                    <Textarea
                                        label="Internal Notes"
                                        placeholder="Enter internal notes (not visible to candidate)"
                                        value={formData.notes}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                                        rows={3}
                                        radius={themeRadius}
                                    />
                                </div>

                                {/* Settings */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-semibold text-default-700">Settings</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Switch
                                            isSelected={formData.send_email}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, send_email: value }))}
                                        >
                                            Send Email to Candidate
                                        </Switch>
                                        
                                        <Switch
                                            isSelected={formData.require_signature}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, require_signature: value }))}
                                        >
                                            Require Digital Signature
                                        </Switch>
                                        
                                        <Switch
                                            isSelected={formData.auto_expire}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, auto_expire: value }))}
                                        >
                                            Auto-Expire on Date
                                        </Switch>
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal(modalStates.add ? 'add' : 'edit')}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSubmit}>
                                {selectedOfferLetter ? 'Update' : 'Create'} Offer Letter
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.view && selectedOfferLetter && (
                <Modal 
                    isOpen={modalStates.view} 
                    onOpenChange={() => closeModal('view')}
                    size="3xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Offer Letter Details</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold text-default-700 mb-3">Candidate Information</h4>
                                        <div className="space-y-2">
                                            <p><strong>Name:</strong> {selectedOfferLetter.candidate?.name}</p>
                                            <p><strong>Email:</strong> {selectedOfferLetter.candidate?.email}</p>
                                            <p><strong>Phone:</strong> {selectedOfferLetter.candidate?.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold text-default-700 mb-3">Position Details</h4>
                                        <div className="space-y-2">
                                            <p><strong>Position:</strong> {selectedOfferLetter.position_title}</p>
                                            <p><strong>Department:</strong> {selectedOfferLetter.department}</p>
                                            <p><strong>Start Date:</strong> {selectedOfferLetter.start_date ? new Date(selectedOfferLetter.start_date).toLocaleDateString() : 'TBD'}</p>
                                        </div>
                                    </div>
                                </div>

                                <Divider />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold text-default-700 mb-3">Compensation</h4>
                                        <div className="space-y-2">
                                            <p><strong>Salary:</strong> {getCurrencySymbol(selectedOfferLetter.currency)} {parseFloat(selectedOfferLetter.salary_offered || 0).toLocaleString()}</p>
                                            <p><strong>Currency:</strong> {selectedOfferLetter.currency}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold text-default-700 mb-3">Timeline</h4>
                                        <div className="space-y-2">
                                            <p><strong>Offer Date:</strong> {new Date(selectedOfferLetter.created_at).toLocaleDateString()}</p>
                                            <p><strong>Valid Until:</strong> {selectedOfferLetter.offer_valid_until ? new Date(selectedOfferLetter.offer_valid_until).toLocaleDateString() : 'No expiry'}</p>
                                            <div className="flex items-center gap-2">
                                                <strong>Status:</strong>
                                                <Chip 
                                                    color={getStatusColor(selectedOfferLetter.status)} 
                                                    size="sm" 
                                                    variant="flat"
                                                >
                                                    {getStatusLabel(selectedOfferLetter.status)}
                                                </Chip>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedOfferLetter.benefits && (
                                    <>
                                        <Divider />
                                        <div>
                                            <h4 className="font-semibold text-default-700 mb-3">Benefits Package</h4>
                                            <div className="bg-default-100 p-4 rounded-lg">
                                                <pre className="whitespace-pre-wrap text-sm">{selectedOfferLetter.benefits}</pre>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {selectedOfferLetter.terms_conditions && (
                                    <>
                                        <Divider />
                                        <div>
                                            <h4 className="font-semibold text-default-700 mb-3">Terms & Conditions</h4>
                                            <div className="bg-default-100 p-4 rounded-lg">
                                                <pre className="whitespace-pre-wrap text-sm">{selectedOfferLetter.terms_conditions}</pre>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {selectedOfferLetter.notes && (
                                    <>
                                        <Divider />
                                        <div>
                                            <h4 className="font-semibold text-default-700 mb-3">Internal Notes</h4>
                                            <div className="bg-warning-50 p-4 rounded-lg">
                                                <pre className="whitespace-pre-wrap text-sm">{selectedOfferLetter.notes}</pre>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => closeModal('view')}>Close</Button>
                            <Button 
                                color="primary" 
                                startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                onPress={() => handleDownload(selectedOfferLetter.id)}
                            >
                                Download PDF
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {modalStates.delete && selectedOfferLetter && (
                <Modal isOpen={modalStates.delete} onOpenChange={() => closeModal('delete')}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold text-danger">Delete Offer Letter</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you sure you want to delete this offer letter?</p>
                            <p className="text-sm text-default-500">
                                Candidate: <strong>{selectedOfferLetter?.candidate?.name}</strong><br />
                                Position: <strong>{selectedOfferLetter?.position_title}</strong>
                            </p>
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
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Offer Letters Management">
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
                                                    <DocumentTextIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Offer Letters
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Generate and manage job offer letters
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateOffer && (
                                                    <Button color="primary" variant="shadow"
                                                        startContent={<PlusIcon className="w-4 h-4" />}
                                                        onPress={() => openModal('add')}
                                                        size={isMobile ? "sm" : "md"}
                                                    >
                                                        Create Offer Letter
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
                                            placeholder="Search offer letters..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        
                                        <Select
                                            placeholder="All Job Openings"
                                            selectedKeys={filters.job_opening_id ? [filters.job_opening_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('job_opening_id', Array.from(keys)[0] || '')}
                                        >
                                            {jobOpenings.map(job => (
                                                <SelectItem key={job.id}>{job.title}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Candidates"
                                            selectedKeys={filters.candidate_id ? [filters.candidate_id] : []}
                                            onSelectionChange={(keys) => handleFilterChange('candidate_id', Array.from(keys)[0] || '')}
                                        >
                                            {candidates.map(candidate => (
                                                <SelectItem key={candidate.id}>{candidate.name}</SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            placeholder="All Status"
                                            selectedKeys={filters.status ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                                        >
                                            {offerStatuses.map(status => (
                                                <SelectItem key={status.key}>{status.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    
                                    <Table 
                                        aria-label="Offer Letters" 
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
                                            items={offerLetters} 
                                            emptyContent={loading ? "Loading..." : "No offer letters found"}
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

OfferLetters.layout = (page) => <App children={page} />;
export default OfferLetters;