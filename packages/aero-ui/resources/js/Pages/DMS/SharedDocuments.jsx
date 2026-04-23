import React, { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from "@heroui/react";
import {
    ArrowDownTrayIcon,
    ClockIcon,
    DocumentTextIcon,
    EllipsisVerticalIcon,
    ShareIcon,
    TrashIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import { showToast } from '@/utils/ui/toastUtils';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { motion } from 'framer-motion';

const SharedDocuments = ({ documents = { data: [], current_page: 1, last_page: 1 } }) => {
    const { auth } = usePage().props;
    const { canDelete } = useHRMAC('dms');
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

    const columns = [
        { uid: 'title', name: 'Document' },
        { uid: 'shared_by', name: 'Shared By' },
        { uid: 'category', name: 'Category' },
        { uid: 'shared_at', name: 'Shared On' },
        { uid: 'expires_at', name: 'Expires' },
        { uid: 'actions', name: 'Actions' },
    ];

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleDownload = (document) => {
        window.open(route('dms.documents.download', document.id), '_blank');
    };

    const handleRemoveShare = (document) => {
        if (!confirm('Remove this document from your shared list?')) return;

        const promise = new Promise((resolve, reject) => {
            router.delete(route('dms.shares.remove', document.id), {
                preserveScroll: true,
                onSuccess: () => resolve(['Share removed successfully']),
                onError: (errors) => reject(Object.values(errors)),
            });
        });

        showToast.promise(promise, {
            loading: 'Removing share...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'title':
                return (
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <DocumentTextIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <Link 
                                href={route('dms.documents.show', item.id)}
                                className="font-medium text-sm hover:text-primary transition-colors"
                            >
                                {item.title}
                            </Link>
                            <p className="text-xs text-default-400">{item.document_number || 'No number'}</p>
                        </div>
                    </div>
                );
            case 'shared_by':
                return (
                    <span className="text-sm">{item.creator?.name || 'Unknown'}</span>
                );
            case 'category':
                return item.category ? (
                    <Chip size="sm" variant="flat" color="secondary">
                        {item.category.name}
                    </Chip>
                ) : (
                    <span className="text-default-400">-</span>
                );
            case 'shared_at':
                return (
                    <span className="text-sm text-default-500">{formatDate(item.pivot?.created_at)}</span>
                );
            case 'expires_at':
                return (
                    <Chip 
                        size="sm" 
                        variant="flat" 
                        color={item.pivot?.expires_at ? 'warning' : 'default'}
                        startContent={<ClockIcon className="w-3 h-3" />}
                    >
                        {item.pivot?.expires_at ? formatDate(item.pivot.expires_at) : 'Never'}
                    </Chip>
                );
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Document actions">
                            <DropdownItem 
                                key="view" 
                                startContent={<DocumentTextIcon className="w-4 h-4" />}
                                onPress={() => router.visit(route('dms.documents.show', item.id))}
                            >
                                View Details
                            </DropdownItem>
                            <DropdownItem 
                                key="download" 
                                startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                onPress={() => handleDownload(item)}
                            >
                                Download
                            </DropdownItem>
                            <DropdownItem 
                                key="remove" 
                                className="text-danger" 
                                color="danger"
                                startContent={<TrashIcon className="w-4 h-4" />}
                                onPress={() => handleRemoveShare(item)}
                            >
                                Remove from Shared
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return item[columnKey];
        }
    };

    const statsSection = [
        { 
            title: 'Shared with Me', 
            value: documents.total || documents.data?.length || 0, 
            icon: <UserGroupIcon className="w-6 h-6" />, 
            color: 'text-primary', 
            iconBg: 'bg-primary/20' 
        },
    ];

    const contentSection = (
        <Table
            aria-label="Shared documents table"
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
            <TableBody items={documents.data || []} emptyContent="No documents have been shared with you.">
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
            <Head title="Shared Documents" />
            <StandardPageLayout
                title="Shared Documents"
                subtitle="Documents that have been shared with you"
                icon={<ShareIcon className="w-8 h-8" />}
                stats={<StatsCards stats={statsSection} />}
                content={contentSection}
                breadcrumbs={[
                    { label: 'Home', href: route('core.dashboard') },
                    { label: 'Document Management' },
                    { label: 'Shared Documents' },
                ]}
            />
        </>
    );
};

export default SharedDocuments;
