import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Spinner,
    Chip,
    Divider,
    Card,
    CardBody,
    Avatar,
    Tooltip,
    Checkbox,
    CheckboxGroup,
    Input,
    ScrollShadow,
    Tabs,
    Tab,
} from "@heroui/react";
import {
    ExclamationTriangleIcon,
    DocumentIcon,
    EyeIcon,
    PlusIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    PaperAirplaneIcon,
    LinkIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    ShieldExclamationIcon,
    DocumentTextIcon,
    PhotoIcon,
    ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { showToast } from '@/utils/toastUtils';
import { getThemeRadius } from '@/Hooks/useThemeRadius';
import axios from 'axios';
import { router } from '@inertiajs/react';

// Category labels for display
const CATEGORY_LABELS = {
    'design_conflict': 'Design Conflict',
    'site_mismatch': 'Site Condition Mismatch',
    'material_change': 'Material Change',
    'safety_concern': 'Safety Concern',
    'specification_error': 'Specification Error',
    'other': 'Other',
};

// Status colors and icons
const STATUS_CONFIG = {
    draft: { color: 'default', icon: DocumentIcon, label: 'Draft' },
    submitted: { color: 'warning', icon: PaperAirplaneIcon, label: 'Submitted' },
    under_review: { color: 'primary', icon: ClockIcon, label: 'Under Review' },
    resolved: { color: 'success', icon: CheckCircleIcon, label: 'Resolved' },
    rejected: { color: 'danger', icon: XCircleIcon, label: 'Rejected' },
};

/**
 * ObjectionsModal - Modal for managing objections attached to an RFI/Daily Work
 * 
 * This modal shows:
 * 1. Already attached objections to this RFI
 * 2. Available objections that can be attached (based on chainage range)
 * 
 * To create new objections, users should use the Objections page.
 */
const ObjectionsModal = ({
    isOpen,
    onClose,
    dailyWork,
    onObjectionsUpdated,
}) => {
    const [activeTab, setActiveTab] = useState('attached');
    const [loading, setLoading] = useState(false);
    const [attachedObjections, setAttachedObjections] = useState([]);
    const [availableObjections, setAvailableObjections] = useState([]);
    const [selectedObjections, setSelectedObjections] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [attaching, setAttaching] = useState(false);
    const [detaching, setDetaching] = useState(null);

    // Fetch objections when modal opens
    useEffect(() => {
        if (isOpen && dailyWork?.id) {
            fetchAttachedObjections();
            fetchAvailableObjections();
        }
    }, [isOpen, dailyWork?.id]);

    // Force unlock scroll on mobile
    const unlockScroll = useCallback(() => {
        // Remove all scroll-blocking styles
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        document.body.style.touchAction = '';
        document.body.style.overscrollBehavior = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.position = '';
        
        // Also remove any data attributes HeroUI might set
        document.body.removeAttribute('data-scroll-locked');
        
        // Force a reflow
        window.scrollTo(window.scrollX, window.scrollY);
    }, []);

    // Wrapped close handler that ensures scroll is unlocked
    const handleClose = useCallback(() => {
        unlockScroll();
        onClose?.();
    }, [onClose, unlockScroll]);

    // Reset state when modal closes and ensure scroll is restored
    useEffect(() => {
        if (!isOpen) {
            setActiveTab('attached');
            setSelectedObjections([]);
            setSearchTerm('');
            
            // Ensure body scroll is restored on mobile (fixes stuck scroll issue)
            unlockScroll();
        }
        
        // Cleanup on unmount
        return () => {
            unlockScroll();
        };
    }, [isOpen, unlockScroll]);

    // Fetch objections attached to this RFI
    const fetchAttachedObjections = async () => {
        if (!dailyWork?.id) return;

        setLoading(true);
        try {
            const response = await axios.get(route('dailyWorks.objections.index', dailyWork.id));
            setAttachedObjections(response.data.objections || []);
        } catch (error) {
            console.error('Error fetching attached objections:', error);
            showToast.error('Failed to load attached objections');
        } finally {
            setLoading(false);
        }
    };

    // Fetch available objections that can be attached (based on chainage)
    const fetchAvailableObjections = async () => {
        if (!dailyWork?.id) return;

        try {
            // Fetch objections that could match this RFI's chainage
            const response = await axios.get(route('dailyWorks.objections.available', dailyWork.id));
            setAvailableObjections(response.data.objections || []);
        } catch (error) {
            console.error('Error fetching available objections:', error);
            // Don't show error for available - it's optional
        }
    };

    // Attach selected objections to this RFI
    const handleAttachObjections = async () => {
        if (selectedObjections.length === 0) {
            showToast.error('Please select at least one objection to attach');
            return;
        }

        setAttaching(true);
        try {
            const response = await axios.post(route('dailyWorks.objections.attach', dailyWork.id), {
                objection_ids: selectedObjections.map(id => parseInt(id)),
            });
            
            showToast.success(response.data.message || 'Objections attached successfully');
            setSelectedObjections([]);
            
            // Refresh lists
            await fetchAttachedObjections();
            await fetchAvailableObjections();
            
            // Switch to attached tab to show the newly attached objections
            setActiveTab('attached');
            
            // Use the active count returned from the API
            if (onObjectionsUpdated) {
                const newActiveCount = response.data.active_objections_count ?? attachedObjections.filter(o => 
                    ['draft', 'submitted', 'under_review'].includes(o.status)
                ).length + selectedObjections.length;
                onObjectionsUpdated(dailyWork.id, newActiveCount);
            }
        } catch (error) {
            console.error('Error attaching objections:', error);
            showToast.error(error.response?.data?.error || 'Failed to attach objections');
        } finally {
            setAttaching(false);
        }
    };

    // Detach an objection from this RFI
    const handleDetachObjection = async (objectionId) => {
        if (!confirm('Are you sure you want to detach this objection from this RFI?')) {
            return;
        }

        setDetaching(objectionId);
        try {
            const response = await axios.post(route('dailyWorks.objections.detach', dailyWork.id), {
                objection_ids: [objectionId],
            });
            
            showToast.success(response.data.message || 'Objection detached successfully');
            
            // Refresh lists
            await fetchAttachedObjections();
            await fetchAvailableObjections();
            
            // Calculate new active count
            const newActiveCount = response.data.active_objections_count ?? Math.max(0, (dailyWork.active_objections_count || 0) - 1);
            
            if (onObjectionsUpdated) {
                onObjectionsUpdated(dailyWork.id, newActiveCount);
            }
        } catch (error) {
            console.error('Error detaching objection:', error);
            showToast.error(error.response?.data?.error || 'Failed to detach objection');
        } finally {
            setDetaching(null);
        }
    };

    // Navigate to Objections page
    const goToObjectionsPage = () => {
        router.visit(route('objections.index'));
    };

    // Render status chip
    const renderStatusChip = (status) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
        const Icon = config.icon;
        return (
            <Chip
                size="sm"
                color={config.color}
                variant="flat"
                startContent={<Icon className="w-3 h-3" />}
            >
                {config.label}
            </Chip>
        );
    };

    // Render attached objection card
    const renderAttachedObjectionCard = (objection) => {
        const isActive = ['draft', 'submitted', 'under_review'].includes(objection.status);

        return (
            <Card 
                key={objection.id} 
                className={`mb-3 ${isActive ? 'border-l-4 border-warning' : 'border-l-4 border-success'}`}
                shadow="sm"
                radius={getThemeRadius()}
            >
                <CardBody className="p-3 sm:p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                                {renderStatusChip(objection.status)}
                                <Chip size="sm" variant="bordered" className="text-[10px]">
                                    {CATEGORY_LABELS[objection.category] || objection.category}
                                </Chip>
                            </div>
                            <h4 className="font-semibold text-xs sm:text-sm truncate">{objection.title}</h4>
                            {objection.chainage_from && objection.chainage_to && (
                                <div className="flex items-center gap-1 text-xs text-default-500 mt-1">
                                    <MapPinIcon className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{objection.chainage_from} - {objection.chainage_to}</span>
                                </div>
                            )}
                        </div>
                        <Tooltip content="Detach from this RFI">
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                isLoading={detaching === objection.id}
                                onPress={() => handleDetachObjection(objection.id)}
                                className="flex-shrink-0"
                            >
                                <XCircleIcon className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                    </div>

                    {/* Description */}
                    <div className="mb-3">
                        <p className="text-xs text-default-500 mb-1">Description:</p>
                        <p className="text-sm line-clamp-2">{objection.description}</p>
                    </div>

                    {/* Reason */}
                    <div className="mb-3">
                        <p className="text-xs text-default-500 mb-1">Reason:</p>
                        <p className="text-sm line-clamp-2">{objection.reason}</p>
                    </div>

                    {/* Resolution notes if resolved/rejected */}
                    {objection.resolution_notes && (
                        <div className="mb-3 p-2 bg-default-100 rounded-lg">
                            <p className="text-xs text-default-500 mb-1">
                                {objection.status === 'resolved' ? 'Resolution:' : 'Rejection Reason:'}
                            </p>
                            <p className="text-sm">{objection.resolution_notes}</p>
                        </div>
                    )}

                    {/* Files */}
                    {objection.files && objection.files.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs text-default-500 mb-2">Attachments ({objection.files.length}):</p>
                            <div className="flex flex-wrap gap-2">
                                {objection.files.slice(0, 3).map((file) => (
                                    <div key={file.id} className="flex items-center gap-1 p-1 bg-default-100 rounded text-xs">
                                        {file.is_image ? (
                                            <PhotoIcon className="w-3 h-3 text-blue-500" />
                                        ) : (
                                            <DocumentTextIcon className="w-3 h-3 text-red-500" />
                                        )}
                                        <span className="max-w-[80px] truncate">{file.name}</span>
                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                            <EyeIcon className="w-3 h-3 cursor-pointer hover:text-primary" />
                                        </a>
                                    </div>
                                ))}
                                {objection.files.length > 3 && (
                                    <span className="text-xs text-default-400">
                                        +{objection.files.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-divider text-xs text-default-400">
                        <div className="flex items-center gap-2">
                            <Avatar
                                size="sm"
                                name={objection.created_by?.name || 'Unknown'}
                                className="w-5 h-5"
                            />
                            <span>{objection.created_by?.name || 'Unknown'}</span>
                        </div>
                        <span>{new Date(objection.created_at).toLocaleDateString()}</span>
                    </div>
                </CardBody>
            </Card>
        );
    };

    // Filter available objections by search term
    const filteredAvailableObjections = availableObjections.filter(obj => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            obj.title?.toLowerCase().includes(term) ||
            obj.description?.toLowerCase().includes(term) ||
            obj.chainage_from?.toLowerCase().includes(term) ||
            obj.chainage_to?.toLowerCase().includes(term)
        );
    });

    // Count of active attached objections
    const activeCount = attachedObjections.filter(o => 
        ['draft', 'submitted', 'under_review'].includes(o.status)
    ).length;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="3xl"
            scrollBehavior="inside"
            placement="center"
            radius={getThemeRadius()}
            shouldBlockScroll={false}
            hideCloseButton={false}
            classNames={{
                base: "max-h-[95vh] sm:max-h-[90vh] m-2 sm:m-4",
                wrapper: "items-end sm:items-center",
                body: "px-4 sm:px-6",
                header: "px-4 sm:px-6",
                footer: "px-4 sm:px-6",
            }}
            onOpenChange={(open) => {
                if (!open) {
                    unlockScroll();
                }
            }}
        >
            <ModalContent>
                {(onCloseModal) => (
                    <>
                        <ModalHeader className="flex flex-col gap-2 pb-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <ShieldExclamationIcon className="w-5 h-5 text-warning flex-shrink-0" />
                                <span className="text-sm sm:text-base font-semibold truncate">RFI Objections - {dailyWork?.number}</span>
                                {activeCount > 0 && (
                                    <Chip size="sm" color="warning" variant="solid">
                                        {activeCount} Active
                                    </Chip>
                                )}
                            </div>
                            <p className="text-xs sm:text-sm text-default-500 font-normal">
                                View attached objections or attach existing ones to this RFI
                            </p>
                        </ModalHeader>

                        <ModalBody className="py-0">
                            <Tabs 
                                selectedKey={activeTab} 
                                onSelectionChange={setActiveTab}
                                color="primary"
                                variant="underlined"
                                classNames={{
                                    tabList: "gap-2 sm:gap-4",
                                    tab: "px-2 sm:px-0 h-10 text-xs sm:text-sm",
                                }}
                            >
                                <Tab 
                                    key="attached" 
                                    title={
                                        <div className="flex items-center gap-1 sm:gap-2">
                                            <ShieldExclamationIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span>Attached ({attachedObjections.length})</span>
                                        </div>
                                    }
                                >
                                    <div className="py-4">
                                        {loading ? (
                                            <div className="flex justify-center py-8">
                                                <Spinner size="lg" />
                                            </div>
                                        ) : attachedObjections.length === 0 ? (
                                            <div className="text-center py-8 text-default-400">
                                                <ShieldExclamationIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No objections attached to this RFI</p>
                                                <p className="text-xs mt-1">
                                                    Switch to "Add Objection" tab to attach existing objections
                                                </p>
                                            </div>
                                        ) : (
                                            <ScrollShadow className="max-h-[50vh] sm:max-h-[400px]">
                                                <div className="space-y-2">
                                                    {attachedObjections.map(renderAttachedObjectionCard)}
                                                </div>
                                            </ScrollShadow>
                                        )}
                                    </div>
                                </Tab>

                                <Tab 
                                    key="add" 
                                    title={
                                        <div className="flex items-center gap-1 sm:gap-2">
                                            <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span className="hidden sm:inline">Add Objection</span>
                                            <span className="sm:hidden">Add</span>
                                        </div>
                                    }
                                >
                                    <div className="py-4 space-y-3 sm:space-y-4">
                                        {/* Info banner */}
                                        <div className="p-2 sm:p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                                            <p className="text-xs sm:text-sm text-primary-700 dark:text-primary-300">
                                                <strong>Note:</strong> Select from existing objections to attach to this RFI. 
                                                To create a new objection, go to the{' '}
                                                <button 
                                                    onClick={goToObjectionsPage}
                                                    className="underline hover:no-underline font-medium"
                                                >
                                                    Objections page
                                                </button>.
                                            </p>
                                        </div>

                                        {/* Search */}
                                        <Input
                                            placeholder="Search objections..."
                                            value={searchTerm}
                                            onValueChange={setSearchTerm}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            size="sm"
                                            isClearable
                                            onClear={() => setSearchTerm('')}
                                        />

                                        {/* Available objections list */}
                                        {filteredAvailableObjections.length === 0 ? (
                                            <div className="text-center py-8 text-default-400">
                                                <DocumentIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No available objections found</p>
                                                <p className="text-xs mt-1">
                                                    Create objections on the Objections page first
                                                </p>
                                                <Button
                                                    color="primary"
                                                    variant="flat"
                                                    size="sm"
                                                    className="mt-3"
                                                    startContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                                                    onPress={goToObjectionsPage}
                                                >
                                                    Go to Objections Page
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-xs sm:text-sm text-default-600">
                                                    Select objections to attach ({selectedObjections.length} selected):
                                                </p>
                                                <CheckboxGroup
                                                    value={selectedObjections}
                                                    onValueChange={setSelectedObjections}
                                                >
                                                    <ScrollShadow className="max-h-[40vh] sm:max-h-[300px]">
                                                        <div className="space-y-2">
                                                            {filteredAvailableObjections.map((objection) => (
                                                                <div
                                                                    key={objection.id}
                                                                    className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg hover:bg-default-100 transition-colors ${
                                                                        selectedObjections.includes(String(objection.id))
                                                                            ? 'border-primary bg-primary-50/50 dark:bg-primary-900/20'
                                                                            : 'border-divider'
                                                                    }`}
                                                                >
                                                                    <Checkbox value={String(objection.id)} className="mt-0.5" size="sm" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap mb-1">
                                                                            {renderStatusChip(objection.status)}
                                                                            <Chip size="sm" variant="bordered" className="text-[10px]">
                                                                                {CATEGORY_LABELS[objection.category] || objection.category}
                                                                            </Chip>
                                                                        </div>
                                                                        <h4 className="font-medium text-sm">{objection.title}</h4>
                                                                        {objection.chainage_from && objection.chainage_to && (
                                                                            <div className="flex items-center gap-1 text-xs text-default-500 mt-1">
                                                                                <MapPinIcon className="w-3 h-3" />
                                                                                <span>{objection.chainage_from} - {objection.chainage_to}</span>
                                                                            </div>
                                                                        )}
                                                                        <p className="text-xs text-default-400 mt-1 line-clamp-2">
                                                                            {objection.description}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </ScrollShadow>
                                                </CheckboxGroup>

                                                {/* Attach button */}
                                                <div className="flex justify-end pt-2">
                                                    <Button
                                                        color="primary"
                                                        startContent={<LinkIcon className="w-4 h-4" />}
                                                        onPress={handleAttachObjections}
                                                        isLoading={attaching}
                                                        isDisabled={selectedObjections.length === 0}
                                                        className="w-full sm:w-auto"
                                                        size="md"
                                                    >
                                                        <span className="hidden sm:inline">
                                                            Attach {selectedObjections.length > 0 ? `(${selectedObjections.length})` : ''} Objection{selectedObjections.length !== 1 ? 's' : ''}
                                                        </span>
                                                        <span className="sm:hidden">
                                                            Attach {selectedObjections.length > 0 ? `(${selectedObjections.length})` : ''}
                                                        </span>
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </Tab>
                            </Tabs>
                        </ModalBody>

                        <ModalFooter className="py-3 sm:py-4">
                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
                                <Button
                                    variant="flat"
                                    size="sm"
                                    startContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                                    onPress={goToObjectionsPage}
                                    className="w-full sm:w-auto"
                                >
                                    <span className="hidden sm:inline">Go to Objections Page</span>
                                    <span className="sm:hidden">Objections Page</span>
                                </Button>
                                <Button color="primary" variant="light" onPress={() => {
                                    unlockScroll();
                                    onCloseModal();
                                }}
                                className="w-full sm:w-auto"
                                >
                                    Close
                                </Button>
                            </div>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ObjectionsModal;
