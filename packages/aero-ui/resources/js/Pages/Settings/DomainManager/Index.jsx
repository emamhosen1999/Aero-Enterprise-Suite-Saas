import React, { useState, useCallback, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import App from '@/Layouts/App';
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    Input,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Chip,
    Tooltip,
    Divider,
    Skeleton,
    Spinner,
} from '@heroui/react';
import {
    GlobeAltIcon,
    PlusIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    ArrowPathIcon,
    TrashIcon,
    ClipboardDocumentIcon,
    ShieldCheckIcon,
    LockClosedIcon,
    StarIcon,
    InformationCircleIcon,
    ServerStackIcon,
    DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import {
    CheckCircleIcon as CheckCircleSolid,
    StarIcon as StarSolid,
} from '@heroicons/react/24/solid';
import { showToast } from '@/utils/toastUtils.jsx';
import axios from 'axios';

// Consistent styling from existing settings pages
const mainCardStyle = {
    border: `var(--borderWidth, 2px) solid transparent`,
    borderRadius: `var(--borderRadius, 12px)`,
    fontFamily: `var(--fontFamily, "Inter")`,
    background: `linear-gradient(135deg, 
        var(--theme-content1, #FAFAFA) 20%, 
        var(--theme-content2, #F4F4F5) 10%, 
        var(--theme-content3, #F1F3F4) 20%)`,
};

const headerStyle = {
    borderColor: `var(--theme-divider, #E4E4E7)`,
    background: `linear-gradient(135deg, 
        color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
        color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
};

const sectionCardStyle = {
    background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
    border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
    borderRadius: `var(--borderRadius, 12px)`,
};

const domainRowStyle = {
    background: `color-mix(in srgb, var(--theme-content1) 80%, transparent)`,
    border: `1px solid color-mix(in srgb, var(--theme-divider) 50%, transparent)`,
    borderRadius: `var(--borderRadius, 10px)`,
};

const DomainManager = () => {
    const { title = 'Domain Settings', domains = [], tenant = {}, platformDomain = 'eos365.com' } = usePage().props;
    
    // Modal states
    const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
    const { isOpen: isInstructionsOpen, onOpen: onInstructionsOpen, onClose: onInstructionsClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    
    // Form states
    const [newDomain, setNewDomain] = useState('');
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [verifyingDomainId, setVerifyingDomainId] = useState(null);
    const [copiedField, setCopiedField] = useState(null);
    
    // Separate domains by type
    const systemDomains = useMemo(() => 
        domains.filter(d => !d.is_custom), 
    [domains]);
    
    const customDomains = useMemo(() => 
        domains.filter(d => d.is_custom), 
    [domains]);
    
    // Get primary subdomain for CNAME target
    const primarySubdomain = useMemo(() => {
        const primary = systemDomains.find(d => d.is_primary);
        return primary?.domain || `${tenant.id}.${platformDomain}`;
    }, [systemDomains, tenant.id, platformDomain]);
    
    // Status badge colors
    const getStatusChip = (domain) => {
        if (!domain.is_custom) {
            return (
                <Chip 
                    size="sm" 
                    variant="flat" 
                    color="secondary"
                    startContent={<ServerStackIcon className="w-3 h-3" />}
                >
                    System Default
                </Chip>
            );
        }
        
        switch (domain.status) {
            case 'active':
                return (
                    <Chip 
                        size="sm" 
                        variant="flat" 
                        color="success"
                        startContent={<CheckCircleSolid className="w-3 h-3" />}
                    >
                        Active
                    </Chip>
                );
            case 'verified':
                return (
                    <Chip 
                        size="sm" 
                        variant="flat" 
                        color="primary"
                        startContent={<ShieldCheckIcon className="w-3 h-3" />}
                    >
                        Verified
                    </Chip>
                );
            case 'pending':
                return (
                    <Chip 
                        size="sm" 
                        variant="flat" 
                        color="warning"
                        startContent={<ClockIcon className="w-3 h-3" />}
                    >
                        Pending Verification
                    </Chip>
                );
            case 'failed':
                return (
                    <Chip 
                        size="sm" 
                        variant="flat" 
                        color="danger"
                        startContent={<ExclamationTriangleIcon className="w-3 h-3" />}
                    >
                        Failed
                    </Chip>
                );
            default:
                return (
                    <Chip size="sm" variant="flat" color="default">
                        Unknown
                    </Chip>
                );
        }
    };
    
    // Copy to clipboard helper
    const handleCopy = useCallback(async (text, field) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            showToast.success('Copied to clipboard!');
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            showToast.error('Failed to copy to clipboard.');
        }
    }, []);
    
    // Add domain handler
    const handleAddDomain = useCallback(async () => {
        if (!newDomain.trim()) {
            showToast.error('Please enter a domain name.');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            const response = await axios.post(route('settings.domains.store'), {
                domain: newDomain.trim(),
            });
            
            showToast.success('Domain added successfully! Please configure DNS settings.');
            setNewDomain('');
            onAddClose();
            
            // Show instructions for the new domain
            setSelectedDomain(response.data.domain);
            onInstructionsOpen();
            
            // Refresh the page to get updated domains list
            router.reload({ only: ['domains'] });
        } catch (error) {
            const message = error.response?.data?.message || error.response?.data?.errors?.domain?.[0] || 'Failed to add domain.';
            showToast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    }, [newDomain, onAddClose, onInstructionsOpen]);
    
    // Verify domain handler
    const handleVerifyDomain = useCallback(async (domain) => {
        setVerifyingDomainId(domain.id);
        
        try {
            const response = await axios.post(route('settings.domains.verify', { domain: domain.id }));
            
            if (response.data.success) {
                showToast.success(response.data.message || 'Domain verified successfully!');
                router.reload({ only: ['domains'] });
            } else {
                showToast.error(response.data.message || 'DNS verification failed. Please check your DNS settings.');
                // Show instructions modal with errors
                setSelectedDomain({
                    ...domain,
                    verification_errors: response.data.errors,
                    instructions: response.data.instructions,
                });
                onInstructionsOpen();
            }
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setVerifyingDomainId(null);
        }
    }, [onInstructionsOpen]);
    
    // Delete domain handler
    const handleDeleteDomain = useCallback(async () => {
        if (!selectedDomain) return;
        
        setIsSubmitting(true);
        
        try {
            await axios.delete(route('settings.domains.destroy', { domain: selectedDomain.id }));
            showToast.success('Domain removed successfully.');
            onDeleteClose();
            setSelectedDomain(null);
            router.reload({ only: ['domains'] });
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to remove domain.');
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedDomain, onDeleteClose]);
    
    // Set primary domain handler
    const handleSetPrimary = useCallback(async (domain) => {
        try {
            await axios.post(route('settings.domains.set-primary', { domain: domain.id }));
            showToast.success('Primary domain updated!');
            router.reload({ only: ['domains'] });
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to set primary domain.');
        }
    }, []);
    
    // Show instructions for domain
    const handleShowInstructions = useCallback((domain) => {
        setSelectedDomain(domain);
        onInstructionsOpen();
    }, [onInstructionsOpen]);
    
    // Confirm delete
    const confirmDelete = useCallback((domain) => {
        setSelectedDomain(domain);
        onDeleteOpen();
    }, [onDeleteOpen]);
    
    // Render domain row
    const renderDomainRow = (domain) => (
        <div 
            key={domain.id}
            className="p-4 transition-all duration-200 hover:shadow-sm"
            style={domainRowStyle}
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Domain Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{
                            background: domain.is_primary 
                                ? `color-mix(in srgb, var(--theme-warning) 15%, transparent)`
                                : `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                        }}
                    >
                        <GlobeAltIcon 
                            className="w-5 h-5" 
                            style={{ 
                                color: domain.is_primary 
                                    ? 'var(--theme-warning)' 
                                    : 'var(--theme-primary)' 
                            }} 
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground truncate">
                                {domain.domain}
                            </span>
                            {domain.is_primary && (
                                <Tooltip content="Primary Domain">
                                    <StarSolid className="w-4 h-4 text-warning flex-shrink-0" />
                                </Tooltip>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {getStatusChip(domain)}
                            {domain.ssl_status === 'active' && (
                                <Chip 
                                    size="sm" 
                                    variant="flat" 
                                    color="success"
                                    startContent={<LockClosedIcon className="w-3 h-3" />}
                                >
                                    SSL
                                </Chip>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    {domain.is_custom && domain.status === 'pending' && (
                        <>
                            <Button
                                size="sm"
                                variant="flat"
                                color="primary"
                                onPress={() => handleShowInstructions(domain)}
                                startContent={<InformationCircleIcon className="w-4 h-4" />}
                            >
                                DNS Setup
                            </Button>
                            <Button
                                size="sm"
                                color="success"
                                variant="flat"
                                onPress={() => handleVerifyDomain(domain)}
                                isLoading={verifyingDomainId === domain.id}
                                startContent={!verifyingDomainId && <ArrowPathIcon className="w-4 h-4" />}
                            >
                                Verify Now
                            </Button>
                        </>
                    )}
                    
                    {domain.is_custom && (domain.status === 'verified' || domain.status === 'active') && !domain.is_primary && (
                        <Tooltip content="Set as Primary">
                            <Button
                                size="sm"
                                variant="flat"
                                color="warning"
                                isIconOnly
                                onPress={() => handleSetPrimary(domain)}
                            >
                                <StarIcon className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                    )}
                    
                    {domain.is_custom && !domain.is_primary && (
                        <Tooltip content="Remove Domain">
                            <Button
                                size="sm"
                                variant="flat"
                                color="danger"
                                isIconOnly
                                onPress={() => confirmDelete(domain)}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                    )}
                </div>
            </div>
        </div>
    );
    
    return (
        <>
            <Head title={title} />
            
            <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6">
                {/* Main Card */}
                <Card className="transition-all duration-200" style={mainCardStyle}>
                    <CardHeader className="border-b p-0" style={headerStyle}>
                        <div className="p-6 w-full">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="p-3 rounded-xl flex items-center justify-center"
                                        style={{
                                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                            borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                            borderWidth: `var(--borderWidth, 2px)`,
                                            borderRadius: `var(--borderRadius, 12px)`,
                                        }}
                                    >
                                        <GlobeAltIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-bold text-foreground">Domain Settings</h4>
                                        <p className="text-sm text-default-500">
                                            Manage your workspace domains and custom domain mappings.
                                        </p>
                                    </div>
                                </div>
                                <Button 
                                    color="primary"
                                    onPress={onAddOpen}
                                    startContent={<PlusIcon className="w-4 h-4" />}
                                >
                                    Add Custom Domain
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardBody className="p-6 space-y-6">
                        {/* System Domains Section */}
                        <div className="space-y-4" style={sectionCardStyle}>
                            <div className="p-4 border-b" style={{ borderColor: 'color-mix(in srgb, var(--theme-divider) 50%, transparent)' }}>
                                <h5 className="font-semibold text-foreground flex items-center gap-2">
                                    <ServerStackIcon className="w-5 h-5 text-secondary" />
                                    System Subdomain
                                </h5>
                                <p className="text-sm text-default-500 mt-1">
                                    Your default workspace subdomain provided by the platform.
                                </p>
                            </div>
                            <div className="p-4 pt-0 space-y-3">
                                {systemDomains.length === 0 ? (
                                    <p className="text-default-500 text-center py-4">No system domains configured.</p>
                                ) : (
                                    systemDomains.map(renderDomainRow)
                                )}
                            </div>
                        </div>
                        
                        <Divider />
                        
                        {/* Custom Domains Section */}
                        <div className="space-y-4" style={sectionCardStyle}>
                            <div className="p-4 border-b" style={{ borderColor: 'color-mix(in srgb, var(--theme-divider) 50%, transparent)' }}>
                                <h5 className="font-semibold text-foreground flex items-center gap-2">
                                    <GlobeAltIcon className="w-5 h-5 text-primary" />
                                    Custom Domains
                                </h5>
                                <p className="text-sm text-default-500 mt-1">
                                    Connect your own domains to access this workspace.
                                </p>
                            </div>
                            <div className="p-4 pt-0 space-y-3">
                                {customDomains.length === 0 ? (
                                    <div className="text-center py-8">
                                        <GlobeAltIcon className="w-12 h-12 mx-auto text-default-300 mb-3" />
                                        <p className="text-default-500">No custom domains configured yet.</p>
                                        <p className="text-sm text-default-400 mt-1">
                                            Add a custom domain to use your own branded URL.
                                        </p>
                                        <Button 
                                            color="primary" 
                                            variant="flat"
                                            className="mt-4"
                                            onPress={onAddOpen}
                                            startContent={<PlusIcon className="w-4 h-4" />}
                                        >
                                            Add Your First Domain
                                        </Button>
                                    </div>
                                ) : (
                                    customDomains.map(renderDomainRow)
                                )}
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
            
            {/* Add Domain Modal */}
            <Modal 
                isOpen={isAddOpen} 
                onClose={onAddClose}
                size="lg"
                classNames={{
                    base: "bg-content1",
                    header: "border-b border-divider",
                    footer: "border-t border-divider",
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <span className="text-lg font-semibold">Add Custom Domain</span>
                        <span className="text-sm text-default-500 font-normal">
                            Enter the domain you want to connect to your workspace.
                        </span>
                    </ModalHeader>
                    <ModalBody className="py-6">
                        <Input
                            label="Domain Name"
                            placeholder="portal.yourcompany.com"
                            description="Enter the full domain or subdomain (without http:// or https://)"
                            value={newDomain}
                            onValueChange={setNewDomain}
                            startContent={
                                <GlobeAltIcon className="w-4 h-4 text-default-400" />
                            }
                            onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                        />
                        
                        <div 
                            className="mt-4 p-4 rounded-lg"
                            style={{ background: 'color-mix(in srgb, var(--theme-warning) 10%, transparent)' }}
                        >
                            <div className="flex items-start gap-3">
                                <InformationCircleIcon className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-warning-600 dark:text-warning-400">
                                        After adding, you'll need to configure DNS
                                    </p>
                                    <p className="text-sm text-default-500 mt-1">
                                        You'll be shown instructions on how to verify domain ownership through DNS records.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onAddClose}>
                            Cancel
                        </Button>
                        <Button 
                            color="primary" 
                            onPress={handleAddDomain}
                            isLoading={isSubmitting}
                        >
                            Add Domain
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            
            {/* DNS Instructions Modal */}
            <Modal 
                isOpen={isInstructionsOpen} 
                onClose={onInstructionsClose}
                size="2xl"
                scrollBehavior="inside"
                classNames={{
                    base: "bg-content1",
                    header: "border-b border-divider",
                    footer: "border-t border-divider",
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <span className="text-lg font-semibold">DNS Configuration Instructions</span>
                        <span className="text-sm text-default-500 font-normal">
                            Configure your DNS records to verify {selectedDomain?.domain}
                        </span>
                    </ModalHeader>
                    <ModalBody className="py-6 space-y-6">
                        {/* Verification Errors */}
                        {selectedDomain?.verification_errors?.length > 0 && (
                            <div 
                                className="p-4 rounded-lg"
                                style={{ background: 'color-mix(in srgb, var(--theme-danger) 10%, transparent)' }}
                            >
                                <div className="flex items-start gap-3">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-danger">
                                            Verification Failed
                                        </p>
                                        <ul className="list-disc list-inside text-sm text-default-500 mt-1">
                                            {selectedDomain.verification_errors.map((error, idx) => (
                                                <li key={idx}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Step by step instructions */}
                        <div className="space-y-4">
                            <div 
                                className="p-4 rounded-lg border"
                                style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div 
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                        style={{ 
                                            background: 'var(--theme-primary)', 
                                            color: 'white' 
                                        }}
                                    >
                                        1
                                    </div>
                                    <h6 className="font-semibold">Log in to your DNS provider</h6>
                                </div>
                                <p className="text-sm text-default-500 ml-8">
                                    Access the DNS management panel for <strong>{selectedDomain?.domain}</strong> at your domain registrar 
                                    (e.g., GoDaddy, Cloudflare, Namecheap, AWS Route 53).
                                </p>
                            </div>
                            
                            <div 
                                className="p-4 rounded-lg border"
                                style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div 
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                        style={{ 
                                            background: 'var(--theme-primary)', 
                                            color: 'white' 
                                        }}
                                    >
                                        2
                                    </div>
                                    <h6 className="font-semibold">Create a CNAME record</h6>
                                </div>
                                <p className="text-sm text-default-500 ml-8 mb-3">
                                    Add a CNAME record pointing your domain to our platform.
                                </p>
                                
                                <div className="ml-8 space-y-3">
                                    {/* Host/Name */}
                                    <div 
                                        className="p-3 rounded-lg flex items-center justify-between gap-3"
                                        style={sectionCardStyle}
                                    >
                                        <div>
                                            <p className="text-xs text-default-400 uppercase tracking-wider">Host / Name</p>
                                            <p className="font-mono text-sm font-medium mt-1">
                                                {selectedDomain?.domain?.split('.')[0] === selectedDomain?.domain 
                                                    ? '@' 
                                                    : selectedDomain?.domain?.split('.')[0] || 'portal'}
                                            </p>
                                        </div>
                                        <Tooltip content={copiedField === 'host' ? 'Copied!' : 'Copy'}>
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                isIconOnly
                                                onPress={() => handleCopy(
                                                    selectedDomain?.domain?.split('.')[0] === selectedDomain?.domain 
                                                        ? '@' 
                                                        : selectedDomain?.domain?.split('.')[0] || 'portal',
                                                    'host'
                                                )}
                                            >
                                                {copiedField === 'host' 
                                                    ? <CheckCircleSolid className="w-4 h-4 text-success" />
                                                    : <DocumentDuplicateIcon className="w-4 h-4" />
                                                }
                                            </Button>
                                        </Tooltip>
                                    </div>
                                    
                                    {/* Value/Target */}
                                    <div 
                                        className="p-3 rounded-lg flex items-center justify-between gap-3"
                                        style={sectionCardStyle}
                                    >
                                        <div>
                                            <p className="text-xs text-default-400 uppercase tracking-wider">Value / Target</p>
                                            <p className="font-mono text-sm font-medium mt-1 break-all">
                                                {primarySubdomain}
                                            </p>
                                        </div>
                                        <Tooltip content={copiedField === 'value' ? 'Copied!' : 'Copy'}>
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                isIconOnly
                                                onPress={() => handleCopy(primarySubdomain, 'value')}
                                            >
                                                {copiedField === 'value' 
                                                    ? <CheckCircleSolid className="w-4 h-4 text-success" />
                                                    : <DocumentDuplicateIcon className="w-4 h-4" />
                                                }
                                            </Button>
                                        </Tooltip>
                                    </div>
                                    
                                    {/* TTL */}
                                    <div 
                                        className="p-3 rounded-lg"
                                        style={sectionCardStyle}
                                    >
                                        <p className="text-xs text-default-400 uppercase tracking-wider">TTL</p>
                                        <p className="font-mono text-sm font-medium mt-1">
                                            3600 <span className="text-default-400 font-normal">(or "Auto")</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Alternative: TXT Record */}
                            {selectedDomain?.dns_verification_code && (
                                <div 
                                    className="p-4 rounded-lg border"
                                    style={{ borderColor: 'color-mix(in srgb, var(--theme-secondary) 30%, transparent)' }}
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <div 
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                            style={{ 
                                                background: 'var(--theme-secondary)', 
                                                color: 'white' 
                                            }}
                                        >
                                            ✓
                                        </div>
                                        <h6 className="font-semibold">Alternative: TXT Record Verification</h6>
                                    </div>
                                    <p className="text-sm text-default-500 ml-8 mb-3">
                                        If you cannot create a CNAME, add this TXT record for ownership verification:
                                    </p>
                                    
                                    <div className="ml-8 space-y-3">
                                        <div 
                                            className="p-3 rounded-lg flex items-center justify-between gap-3"
                                            style={sectionCardStyle}
                                        >
                                            <div>
                                                <p className="text-xs text-default-400 uppercase tracking-wider">TXT Record Name</p>
                                                <p className="font-mono text-sm font-medium mt-1 break-all">
                                                    _eos365-verification.{selectedDomain?.domain}
                                                </p>
                                            </div>
                                            <Tooltip content={copiedField === 'txt-name' ? 'Copied!' : 'Copy'}>
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    isIconOnly
                                                    onPress={() => handleCopy(`_eos365-verification.${selectedDomain?.domain}`, 'txt-name')}
                                                >
                                                    {copiedField === 'txt-name' 
                                                        ? <CheckCircleSolid className="w-4 h-4 text-success" />
                                                        : <DocumentDuplicateIcon className="w-4 h-4" />
                                                    }
                                                </Button>
                                            </Tooltip>
                                        </div>
                                        
                                        <div 
                                            className="p-3 rounded-lg flex items-center justify-between gap-3"
                                            style={sectionCardStyle}
                                        >
                                            <div>
                                                <p className="text-xs text-default-400 uppercase tracking-wider">TXT Record Value</p>
                                                <p className="font-mono text-sm font-medium mt-1 break-all">
                                                    eos365-verify={selectedDomain?.dns_verification_code}
                                                </p>
                                            </div>
                                            <Tooltip content={copiedField === 'txt-value' ? 'Copied!' : 'Copy'}>
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    isIconOnly
                                                    onPress={() => handleCopy(`eos365-verify=${selectedDomain?.dns_verification_code}`, 'txt-value')}
                                                >
                                                    {copiedField === 'txt-value' 
                                                        ? <CheckCircleSolid className="w-4 h-4 text-success" />
                                                        : <DocumentDuplicateIcon className="w-4 h-4" />
                                                    }
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div 
                                className="p-4 rounded-lg border"
                                style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div 
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                        style={{ 
                                            background: 'var(--theme-primary)', 
                                            color: 'white' 
                                        }}
                                    >
                                        3
                                    </div>
                                    <h6 className="font-semibold">Wait for DNS propagation</h6>
                                </div>
                                <p className="text-sm text-default-500 ml-8">
                                    DNS changes can take up to 48 hours to propagate worldwide, though most updates complete within minutes. 
                                    Once ready, click "Verify Now" to check your configuration.
                                </p>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onInstructionsClose}>
                            Close
                        </Button>
                        {selectedDomain?.status === 'pending' && (
                            <Button 
                                color="success" 
                                onPress={() => {
                                    onInstructionsClose();
                                    handleVerifyDomain(selectedDomain);
                                }}
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                            >
                                Verify Now
                            </Button>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>
            
            {/* Delete Confirmation Modal */}
            <Modal 
                isOpen={isDeleteOpen} 
                onClose={onDeleteClose}
                size="md"
                classNames={{
                    base: "bg-content1",
                    header: "border-b border-divider",
                    footer: "border-t border-divider",
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <span className="text-lg font-semibold text-danger">Remove Domain</span>
                    </ModalHeader>
                    <ModalBody className="py-6">
                        <div className="flex items-start gap-3">
                            <div 
                                className="p-2 rounded-lg flex-shrink-0"
                                style={{ background: 'color-mix(in srgb, var(--theme-danger) 15%, transparent)' }}
                            >
                                <ExclamationTriangleIcon className="w-6 h-6 text-danger" />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">
                                    Are you sure you want to remove this domain?
                                </p>
                                <p className="text-sm text-default-500 mt-2">
                                    <strong className="font-mono">{selectedDomain?.domain}</strong> will no longer be able to access this workspace.
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onDeleteClose}>
                            Cancel
                        </Button>
                        <Button 
                            color="danger" 
                            onPress={handleDeleteDomain}
                            isLoading={isSubmitting}
                        >
                            Remove Domain
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

DomainManager.layout = (page) => <App children={page} />;

export default DomainManager;
