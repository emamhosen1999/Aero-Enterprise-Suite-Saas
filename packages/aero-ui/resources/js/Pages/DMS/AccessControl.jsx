import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    Chip,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from "@heroui/react";
import {
    EyeIcon,
    LockClosedIcon,
    PlusIcon,
    ShieldCheckIcon,
    TrashIcon,
    UserGroupIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { showToast } from '@/utils/toastUtils.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { motion } from 'framer-motion';

const AccessControl = ({ accessRules = [], users = [], roles = [] }) => {
    const { auth } = usePage().props;
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC('dms');
    const themeRadius = useThemeRadius();
    
    // Manual responsive state management (HRMAC pattern)
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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        type: 'user',
        user_id: null,
        role_id: null,
        permission: 'view',
    });

    const columns = [
        { uid: 'subject', name: 'User/Role' },
        { uid: 'type', name: 'Type' },
        { uid: 'permission', name: 'Permission' },
        { uid: 'created_at', name: 'Granted On' },
        { uid: 'actions', name: 'Actions' },
    ];

    const permissionOptions = [
        { value: 'view', label: 'View Only', color: 'primary' },
        { value: 'edit', label: 'Edit', color: 'warning' },
        { value: 'delete', label: 'Delete', color: 'danger' },
        { value: 'admin', label: 'Full Access', color: 'success' },
    ];

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const openCreateModal = () => {
        setFormData({ type: 'user', user_id: null, role_id: null, permission: 'view' });
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        const promise = new Promise((resolve, reject) => {
            router.post(route('dms.access-control.store'), formData, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    resolve(['Access rule created successfully']);
                },
                onError: (errors) => reject(Object.values(errors)),
            });
        });

        showToast.promise(promise, {
            loading: 'Creating access rule...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleDelete = (rule) => {
        if (!confirm('Are you sure you want to remove this access rule?')) return;

        const promise = new Promise((resolve, reject) => {
            router.delete(route('dms.access-control.destroy', rule.id), {
                preserveScroll: true,
                onSuccess: () => resolve(['Access rule removed successfully']),
                onError: (errors) => reject(Object.values(errors)),
            });
        });

        showToast.promise(promise, {
            loading: 'Removing access rule...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const getPermissionColor = (permission) => {
        const option = permissionOptions.find(p => p.value === permission);
        return option?.color || 'default';
    };

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'subject':
                return (
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.type === 'user' ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                            {item.type === 'user' ? (
                                <UserIcon className="w-5 h-5 text-primary" />
                            ) : (
                                <UserGroupIcon className="w-5 h-5 text-secondary" />
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-sm">{item.name || 'Unknown'}</p>
                            <p className="text-xs text-default-400">{item.email || item.description || ''}</p>
                        </div>
                    </div>
                );
            case 'type':
                return (
                    <Chip size="sm" variant="flat" color={item.type === 'user' ? 'primary' : 'secondary'}>
                        {item.type === 'user' ? 'User' : 'Role'}
                    </Chip>
                );
            case 'permission':
                return (
                    <Chip size="sm" variant="flat" color={getPermissionColor(item.permission)}>
                        {permissionOptions.find(p => p.value === item.permission)?.label || item.permission}
                    </Chip>
                );
            case 'created_at':
                return (
                    <span className="text-sm text-default-500">{formatDate(item.created_at)}</span>
                );
            case 'actions':
                return canDelete && (
                    <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light" 
                        color="danger"
                        onPress={() => handleDelete(item)}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </Button>
                );
            default:
                return item[columnKey];
        }
    };

    const statsSection = [
        { 
            title: 'Total Rules', 
            value: accessRules.length, 
            icon: <ShieldCheckIcon className="w-6 h-6" />, 
            color: 'text-primary', 
            iconBg: 'bg-primary/20' 
        },
        { 
            title: 'User Rules', 
            value: accessRules.filter(r => r.type === 'user').length, 
            icon: <UserIcon className="w-6 h-6" />, 
            color: 'text-success', 
            iconBg: 'bg-success/20' 
        },
        { 
            title: 'Role Rules', 
            value: accessRules.filter(r => r.type === 'role').length, 
            icon: <UserGroupIcon className="w-6 h-6" />, 
            color: 'text-warning', 
            iconBg: 'bg-warning/20' 
        },
    ];

    const headerActions = canCreate && (
        <Button 
            color="primary" 
            variant="shadow"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={openCreateModal}
        >
            Add Access Rule
        </Button>
    );

    const contentSection = (
        <Table
            aria-label="Access control rules table"
            isHeaderSticky
            classNames={{
                wrapper: "shadow-none border border-divider rounded-lg",
                th: "bg-default-100 text-default-600 font-semibold",
                td: "py-3"
            }}
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                        {column.name}
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody items={accessRules} emptyContent="No access rules defined.">
                {(item) => (
                    <TableRow key={item.id}>
                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <>
            <Head title="Access Control" />
            
            <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen} size="md">
                <ModalContent>
                    <ModalHeader>Add Access Rule</ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4">
                            <Select
                                label="Type"
                                selectedKeys={[formData.type]}
                                onSelectionChange={(keys) => setFormData(prev => ({ 
                                    ...prev, 
                                    type: Array.from(keys)[0],
                                    user_id: null,
                                    role_id: null,
                                }))}
                            >
                                <SelectItem key="user">User</SelectItem>
                                <SelectItem key="role">Role</SelectItem>
                            </Select>

                            {formData.type === 'user' && (
                                <Select
                                    label="User"
                                    placeholder="Select user"
                                    selectedKeys={formData.user_id ? [String(formData.user_id)] : []}
                                    onSelectionChange={(keys) => setFormData(prev => ({ 
                                        ...prev, 
                                        user_id: Array.from(keys)[0] 
                                    }))}
                                >
                                    {(users || []).map(user => (
                                        <SelectItem key={String(user.id)}>{user.name}</SelectItem>
                                    ))}
                                </Select>
                            )}

                            {formData.type === 'role' && (
                                <Select
                                    label="Role"
                                    placeholder="Select role"
                                    selectedKeys={formData.role_id ? [String(formData.role_id)] : []}
                                    onSelectionChange={(keys) => setFormData(prev => ({ 
                                        ...prev, 
                                        role_id: Array.from(keys)[0] 
                                    }))}
                                >
                                    {(roles || []).map(role => (
                                        <SelectItem key={String(role.id)}>{role.name}</SelectItem>
                                    ))}
                                </Select>
                            )}

                            <Select
                                label="Permission Level"
                                selectedKeys={[formData.permission]}
                                onSelectionChange={(keys) => setFormData(prev => ({ 
                                    ...prev, 
                                    permission: Array.from(keys)[0] 
                                }))}
                            >
                                {permissionOptions.map(option => (
                                    <SelectItem key={option.value}>{option.label}</SelectItem>
                                ))}
                            </Select>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleSubmit}>
                            Create Rule
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <StandardPageLayout
                title="Access Control"
                subtitle="Manage document access permissions"
                icon={<LockClosedIcon className="w-8 h-8" />}
                stats={<StatsCards stats={statsSection} />}
                actions={headerActions}
                content={contentSection}
                breadcrumbs={[
                    { label: 'Home', href: route('core.dashboard') },
                    { label: 'Document Management' },
                    { label: 'Access Control' },
                ]}
            />
        </>
    );
};

export default AccessControl;
