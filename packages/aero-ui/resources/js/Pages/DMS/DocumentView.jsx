import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Avatar,
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Divider,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Textarea,
} from "@heroui/react";
import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ClockIcon,
    DocumentTextIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    FolderIcon,
    PencilIcon,
    ShareIcon,
    TagIcon,
    TrashIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import { showToast } from '@/utils/toastUtils.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';

const DocumentView = ({ document, versions = [] }) => {
    const { auth } = usePage().props;
    const { canUpdate, canDelete } = useHRMAC('dms');

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareMessage, setShareMessage] = useState('');

    const statusColorMap = {
        draft: 'default',
        pending_review: 'warning',
        published: 'success',
        archived: 'secondary',
        expired: 'danger',
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDownload = () => {
        window.open(route('dms.documents.download', document.id), '_blank');
    };

    const handleDelete = () => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        const promise = new Promise((resolve, reject) => {
            router.delete(route('dms.documents.destroy', document.id), {
                onSuccess: () => resolve(['Document deleted successfully']),
                onError: (errors) => reject(Object.values(errors)),
            });
        });

        showToast.promise(promise, {
            loading: 'Deleting document...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const versionColumns = [
        { uid: 'version', name: 'Version' },
        { uid: 'creator', name: 'Created By' },
        { uid: 'created_at', name: 'Date' },
        { uid: 'size', name: 'Size' },
        { uid: 'actions', name: 'Actions' },
    ];

    const shareColumns = [
        { uid: 'user', name: 'Shared With' },
        { uid: 'permissions', name: 'Permissions' },
        { uid: 'shared_at', name: 'Shared On' },
        { uid: 'expires', name: 'Expires' },
    ];

    const renderVersionCell = (item, columnKey) => {
        switch (columnKey) {
            case 'version':
                return (
                    <Chip size="sm" variant="flat" color="primary">
                        v{item.version_number}
                    </Chip>
                );
            case 'creator':
                return (
                    <div className="flex items-center gap-2">
                        <Avatar size="sm" name={item.creator?.name} />
                        <span className="text-sm">{item.creator?.name || 'Unknown'}</span>
                    </div>
                );
            case 'created_at':
                return <span className="text-sm text-default-500">{formatDate(item.created_at)}</span>;
            case 'size':
                return <span className="text-sm">{formatFileSize(item.file_size)}</span>;
            case 'actions':
                return (
                    <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light"
                        onPress={() => window.open(route('dms.versions.download', item.id), '_blank')}
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                    </Button>
                );
            default:
                return item[columnKey];
        }
    };

    const headerActions = (
        <div className="flex gap-2">
            <Button 
                color="primary" 
                variant="flat"
                startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                onPress={handleDownload}
            >
                Download
            </Button>
            <Button 
                color="secondary" 
                variant="flat"
                startContent={<ShareIcon className="w-4 h-4" />}
                onPress={() => setIsShareModalOpen(true)}
            >
                Share
            </Button>
            {canUpdate && (
                <Button 
                    color="warning" 
                    variant="flat"
                    startContent={<PencilIcon className="w-4 h-4" />}
                    onPress={() => router.visit(route('dms.documents.edit', document.id))}
                >
                    Edit
                </Button>
            )}
            {canDelete && (
                <Button 
                    color="danger" 
                    variant="flat"
                    startContent={<TrashIcon className="w-4 h-4" />}
                    onPress={handleDelete}
                >
                    Delete
                </Button>
            )}
        </div>
    );

    const contentSection = (
        <div className="space-y-6">
            {/* Document Info Card */}
            <Card className="border border-divider">
                <CardBody className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Document Icon */}
                        <div className="shrink-0">
                            <div className="w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center">
                                <DocumentTextIcon className="w-12 h-12 text-primary" />
                            </div>
                        </div>
                        
                        {/* Document Details */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <h2 className="text-xl font-bold">{document.title}</h2>
                                <p className="text-default-500">{document.document_number || 'No document number'}</p>
                            </div>
                            
                            {document.description && (
                                <p className="text-default-600">{document.description}</p>
                            )}
                            
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Chip size="sm" variant="flat" color={statusColorMap[document.status] || 'default'}>
                                        {document.status?.replace('_', ' ').toUpperCase()}
                                    </Chip>
                                </div>
                                <div className="flex items-center gap-2 text-default-500">
                                    <FolderIcon className="w-4 h-4" />
                                    <span>{document.category?.name || 'Uncategorized'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-default-500">
                                    <UserIcon className="w-4 h-4" />
                                    <span>{document.creator?.name || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-default-500">
                                    <ClockIcon className="w-4 h-4" />
                                    <span>{formatDate(document.created_at)}</span>
                                </div>
                            </div>

                            {document.tags && document.tags.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <TagIcon className="w-4 h-4 text-default-400" />
                                    <div className="flex gap-1 flex-wrap">
                                        {document.tags.map((tag, idx) => (
                                            <Chip key={idx} size="sm" variant="flat">{tag}</Chip>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* File Info */}
                        <div className="shrink-0 space-y-2 text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-default-400">File Type:</span>
                                <span className="font-medium">{document.file_type || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-default-400">Size:</span>
                                <span className="font-medium">{formatFileSize(document.file_size)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-default-400">Version:</span>
                                <span className="font-medium">v{document.current_version || 1}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-default-400">Views:</span>
                                <span className="font-medium">{document.view_count || 0}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-default-400">Downloads:</span>
                                <span className="font-medium">{document.download_count || 0}</span>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Tabs for Versions and Sharing */}
            <Tabs aria-label="Document tabs" color="primary" variant="underlined">
                <Tab key="versions" title="Version History">
                    <Card className="border border-divider mt-4">
                        <CardBody className="p-0">
                            <Table
                                aria-label="Version history table"
                                removeWrapper
                                classNames={{
                                    th: "bg-default-50 text-default-600 font-semibold",
                                    td: "py-3"
                                }}
                            >
                                <TableHeader columns={versionColumns}>
                                    {(column) => (
                                        <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                                            {column.name}
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody items={versions || []} emptyContent="No version history available.">
                                    {(item) => (
                                        <TableRow key={item.id}>
                                            {(columnKey) => <TableCell>{renderVersionCell(item, columnKey)}</TableCell>}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardBody>
                    </Card>
                </Tab>
                <Tab key="sharing" title="Sharing">
                    <Card className="border border-divider mt-4">
                        <CardBody className="p-0">
                            <Table
                                aria-label="Sharing table"
                                removeWrapper
                                classNames={{
                                    th: "bg-default-50 text-default-600 font-semibold",
                                    td: "py-3"
                                }}
                            >
                                <TableHeader columns={shareColumns}>
                                    {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                                </TableHeader>
                                <TableBody items={document.shares || []} emptyContent="Document is not shared with anyone.">
                                    {(item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar size="sm" name={item.user?.name} />
                                                    <span className="text-sm">{item.user?.name || 'Unknown'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip size="sm" variant="flat">
                                                    {item.can_edit ? 'Edit' : 'View'}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-default-500">{formatDate(item.created_at)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-default-500">
                                                    {item.expires_at ? formatDate(item.expires_at) : 'Never'}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardBody>
                    </Card>
                </Tab>
            </Tabs>
        </div>
    );

    return (
        <>
            <Head title={document.title} />
            
            {/* Share Modal */}
            <Modal isOpen={isShareModalOpen} onOpenChange={setIsShareModalOpen} size="md">
                <ModalContent>
                    <ModalHeader>Share Document</ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4">
                            <p className="text-default-600">
                                Generate a shareable link for "{document.title}"
                            </p>
                            <Textarea
                                label="Message (optional)"
                                placeholder="Add a message for the recipients..."
                                value={shareMessage}
                                onValueChange={setShareMessage}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setIsShareModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="primary">
                            Generate Link
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <StandardPageLayout
                title={document.title}
                subtitle={`Document #${document.document_number || document.id}`}
                icon={<DocumentTextIcon className="w-8 h-8" />}
                actions={headerActions}
                content={contentSection}
                breadcrumbs={[
                    { label: 'Home', href: route('core.dashboard') },
                    { label: 'Document Management' },
                    { label: 'Documents', href: route('dms.documents') },
                    { label: document.title },
                ]}
            />
        </>
    );
};

export default DocumentView;
