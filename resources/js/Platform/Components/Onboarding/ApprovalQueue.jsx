import React, { useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Checkbox, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea } from "@heroui/react";
import { CheckIcon, XMarkIcon, EllipsisVerticalIcon, EyeIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function ApprovalQueue({ pendingApprovals = [] }) {
    const [selectedApprovals, setSelectedApprovals] = useState([]);
    const [viewModal, setViewModal] = useState(false);
    const [rejectModal, setRejectModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);

    // Get theme radius
    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'full';
    };

    const themeRadius = getThemeRadius();

    const columns = [
        { uid: "select", name: "" },
        { uid: "tenant_name", name: "Tenant Name" },
        { uid: "admin_email", name: "Admin Email" },
        { uid: "plan", name: "Plan" },
        { uid: "submitted_at", name: "Submitted" },
        { uid: "actions", name: "Actions" }
    ];

    const handleApprove = async (tenantId) => {
        setProcessing(true);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.onboarding.approve', tenantId));
                resolve([response.data.message || 'Tenant approved successfully']);
                router.reload({ only: ['pendingApprovals', 'tenants'] });
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to approve tenant']);
            }
        });

        showToast.promise(promise, {
            loading: 'Approving tenant...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });

        promise.finally(() => setProcessing(false));
    };

    const handleReject = async () => {
        if (!selectedTenant) return;
        
        if (!rejectionReason.trim()) {
            showToast.error('Please provide a reason for rejection');
            return;
        }

        setProcessing(true);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.onboarding.reject', selectedTenant.id), {
                    reason: rejectionReason
                });
                resolve([response.data.message || 'Tenant rejected successfully']);
                setRejectModal(false);
                setRejectionReason('');
                setSelectedTenant(null);
                router.reload({ only: ['pendingApprovals'] });
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to reject tenant']);
            }
        });

        showToast.promise(promise, {
            loading: 'Rejecting tenant...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });

        promise.finally(() => setProcessing(false));
    };

    const handleBulkApprove = async () => {
        if (selectedApprovals.length === 0) {
            showToast.error('Please select tenants to approve');
            return;
        }

        setProcessing(true);
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('admin.onboarding.bulk-approve'), {
                    tenant_ids: selectedApprovals
                });
                resolve([`${selectedApprovals.length} tenant(s) approved successfully`]);
                setSelectedApprovals([]);
                router.reload({ only: ['pendingApprovals', 'tenants'] });
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to approve tenants']);
            }
        });

        showToast.promise(promise, {
            loading: 'Approving tenants...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });

        promise.finally(() => setProcessing(false));
    };

    const handleViewDetails = (tenant) => {
        setSelectedTenant(tenant);
        setViewModal(true);
    };

    const handleOpenRejectModal = (tenant) => {
        setSelectedTenant(tenant);
        setRejectModal(true);
    };

    const renderCell = (tenant, columnKey) => {
        switch (columnKey) {
            case "select":
                return (
                    <Checkbox
                        isSelected={selectedApprovals.includes(tenant.id)}
                        onValueChange={(checked) => {
                            if (checked) {
                                setSelectedApprovals([...selectedApprovals, tenant.id]);
                            } else {
                                setSelectedApprovals(selectedApprovals.filter(id => id !== tenant.id));
                            }
                        }}
                        radius={themeRadius}
                    />
                );
            case "tenant_name":
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{tenant.tenant_name}</span>
                        <span className="text-xs text-default-400">{tenant.subdomain}.yourdomain.com</span>
                    </div>
                );
            case "admin_email":
                return (
                    <div className="flex flex-col">
                        <span className="text-sm">{tenant.admin_name}</span>
                        <span className="text-xs text-default-400">{tenant.admin_email}</span>
                    </div>
                );
            case "plan":
                return (
                    <Chip size="sm" color="primary" variant="flat">
                        {tenant.plan_name}
                    </Chip>
                );
            case "submitted_at":
                return (
                    <div className="flex flex-col">
                        <span className="text-sm">{new Date(tenant.created_at).toLocaleDateString()}</span>
                        <span className="text-xs text-default-400">{new Date(tenant.created_at).toLocaleTimeString()}</span>
                    </div>
                );
            case "actions":
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            isIconOnly
                            size="sm"
                            color="success"
                            variant="flat"
                            onPress={() => handleApprove(tenant.id)}
                            isDisabled={processing}
                            radius={themeRadius}
                        >
                            <CheckIcon className="w-4 h-4" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="flat"
                            onPress={() => handleOpenRejectModal(tenant)}
                            isDisabled={processing}
                            radius={themeRadius}
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </Button>
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light" radius={themeRadius}>
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Actions">
                                <DropdownItem 
                                    key="view" 
                                    startContent={<EyeIcon className="w-4 h-4" />}
                                    onPress={() => handleViewDetails(tenant)}
                                >
                                    View Details
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return tenant[columnKey];
        }
    };

    return (
        <div className="space-y-4">
            {/* Bulk Actions */}
            {selectedApprovals.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-primary-50 border border-primary rounded-lg">
                    <span className="text-sm font-medium">
                        {selectedApprovals.length} tenant(s) selected
                    </span>
                    <Button
                        size="sm"
                        color="success"
                        variant="flat"
                        startContent={<CheckIcon className="w-4 h-4" />}
                        onPress={handleBulkApprove}
                        isLoading={processing}
                        radius={themeRadius}
                    >
                        Approve Selected
                    </Button>
                    <Button
                        size="sm"
                        variant="flat"
                        onPress={() => setSelectedApprovals([])}
                        radius={themeRadius}
                    >
                        Clear Selection
                    </Button>
                </div>
            )}

            {/* Table */}
            <Table 
                aria-label="Approval queue table"
                classNames={{
                    wrapper: "shadow-none border border-divider rounded-lg",
                    th: "bg-default-100 text-default-600 font-semibold",
                    td: "py-3"
                }}
            >
                <TableHeader columns={columns}>
                    {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                </TableHeader>
                <TableBody items={pendingApprovals} emptyContent="No pending approvals">
                    {(tenant) => (
                        <TableRow key={tenant.id}>
                            {(columnKey) => <TableCell>{renderCell(tenant, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* View Details Modal */}
            <Modal 
                isOpen={viewModal} 
                onOpenChange={setViewModal}
                size="2xl"
                classNames={{
                    base: "bg-content1",
                    header: "border-b border-divider",
                    body: "py-6",
                    footer: "border-t border-divider"
                }}
            >
                <ModalContent>
                    <ModalHeader>
                        <h2 className="text-lg font-semibold">Tenant Details</h2>
                    </ModalHeader>
                    <ModalBody>
                        {selectedTenant && (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Basic Information</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-default-500">Tenant Name:</span>
                                            <p className="font-medium">{selectedTenant.tenant_name}</p>
                                        </div>
                                        <div>
                                            <span className="text-default-500">Subdomain:</span>
                                            <p className="font-medium">{selectedTenant.subdomain}.yourdomain.com</p>
                                        </div>
                                        <div>
                                            <span className="text-default-500">Admin Name:</span>
                                            <p className="font-medium">{selectedTenant.admin_name}</p>
                                        </div>
                                        <div>
                                            <span className="text-default-500">Admin Email:</span>
                                            <p className="font-medium">{selectedTenant.admin_email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Subscription</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-default-500">Plan:</span>
                                            <p className="font-medium">{selectedTenant.plan_name}</p>
                                        </div>
                                        <div>
                                            <span className="text-default-500">Billing Cycle:</span>
                                            <p className="font-medium">{selectedTenant.billing_cycle}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Resources</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-default-500">Database:</span>
                                            <p className="font-medium">{selectedTenant.database_name}</p>
                                        </div>
                                        <div>
                                            <span className="text-default-500">Max Users:</span>
                                            <p className="font-medium">{selectedTenant.max_users}</p>
                                        </div>
                                        <div>
                                            <span className="text-default-500">Storage Limit:</span>
                                            <p className="font-medium">{selectedTenant.storage_limit} GB</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Timeline</h4>
                                    <div className="text-sm">
                                        <span className="text-default-500">Submitted:</span>
                                        <p className="font-medium">{new Date(selectedTenant.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button 
                            color="danger"
                            variant="flat"
                            onPress={() => {
                                setViewModal(false);
                                handleOpenRejectModal(selectedTenant);
                            }}
                            radius={themeRadius}
                        >
                            Reject
                        </Button>
                        <Button 
                            color="success"
                            onPress={() => {
                                handleApprove(selectedTenant.id);
                                setViewModal(false);
                            }}
                            radius={themeRadius}
                        >
                            Approve
                        </Button>
                        <Button 
                            variant="flat" 
                            onPress={() => setViewModal(false)}
                            radius={themeRadius}
                        >
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Reject Modal */}
            <Modal 
                isOpen={rejectModal} 
                onOpenChange={setRejectModal}
                classNames={{
                    base: "bg-content1",
                    header: "border-b border-divider",
                    body: "py-6",
                    footer: "border-t border-divider"
                }}
            >
                <ModalContent>
                    <ModalHeader>
                        <h2 className="text-lg font-semibold">Reject Tenant</h2>
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-default-500 mb-4">
                            Please provide a reason for rejecting this tenant application. This message will be sent to the applicant.
                        </p>
                        <Textarea
                            label="Rejection Reason"
                            placeholder="Enter reason for rejection..."
                            value={rejectionReason}
                            onValueChange={setRejectionReason}
                            minRows={4}
                            isRequired
                            radius={themeRadius}
                            classNames={{ inputWrapper: "bg-default-100" }}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button 
                            variant="flat" 
                            onPress={() => {
                                setRejectModal(false);
                                setRejectionReason('');
                            }}
                            isDisabled={processing}
                            radius={themeRadius}
                        >
                            Cancel
                        </Button>
                        <Button 
                            color="danger"
                            onPress={handleReject}
                            isLoading={processing}
                            radius={themeRadius}
                        >
                            Reject Tenant
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
