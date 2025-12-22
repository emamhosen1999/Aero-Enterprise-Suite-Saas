import React, { useState } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import App from '@/Layouts/App';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Progress,
    Divider,
} from '@heroui/react';
import {
    DocumentDuplicateIcon,
    FolderIcon,
    CloudArrowUpIcon,
    ClockIcon,
    ShareIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';
import { FileManager, VersionHistory } from '@/Components/FileManager';

/**
 * Navigate using Inertia router (SPA navigation)
 */
const navigateTo = (url) => {
    router.visit(url, { preserveScroll: false });
};

const Dashboard = () => {
    const {
        stats = {},
        recentDocuments = [],
        sharedWithMe = [],
        storageUsage = { used: 0, total: 100, percentage: 0 },
    } = usePage().props;

    const [versionModalOpen, setVersionModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    const handleViewVersions = (document) => {
        setSelectedDocument(document);
        setVersionModalOpen(true);
    };

    return (
        <App>
            <Head title="Document Management" />

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Document Management
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Manage, share, and organize your documents
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <Button
                            color="primary"
                            startContent={<CloudArrowUpIcon className="h-5 w-5" />}
                            onPress={() => navigateTo(route('dms.documents.create'))}
                        >
                            Upload Document
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-xl">
                                <DocumentDuplicateIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Documents
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.totalDocuments || 0}
                                </p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-success/10 rounded-xl">
                                <FolderIcon className="h-6 w-6 text-success" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Folders
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.totalFolders || 0}
                                </p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-warning/10 rounded-xl">
                                <ShareIcon className="h-6 w-6 text-warning" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Shared with Me
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.sharedWithMe || 0}
                                </p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-secondary/10 rounded-xl">
                                <ChartBarIcon className="h-6 w-6 text-secondary" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    This Month
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.thisMonth || 0}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Storage Usage */}
                <Card className="mb-8">
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Storage Usage</h3>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {storageUsage.used} GB of {storageUsage.total} GB used
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {storageUsage.percentage}%
                            </span>
                        </div>
                        <Progress
                            value={storageUsage.percentage}
                            color={storageUsage.percentage > 80 ? 'danger' : storageUsage.percentage > 60 ? 'warning' : 'primary'}
                            className="h-2"
                        />
                    </CardBody>
                </Card>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Documents */}
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Recent Documents</h3>
                            <Button
                                size="sm"
                                variant="light"
                                onPress={() => navigateTo(route('dms.documents'))}
                            >
                                View All
                            </Button>
                        </CardHeader>
                        <Divider />
                        <CardBody className="p-0">
                            {recentDocuments.length > 0 ? (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {recentDocuments.map((doc) => (
                                        <li
                                            key={doc.id}
                                            className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                            onClick={() => navigateTo(route('dms.documents.show', doc.id))}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <DocumentDuplicateIcon className="h-5 w-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {doc.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {doc.size} • {doc.updated_at}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {doc.has_versions && (
                                                        <Button
                                                            size="sm"
                                                            variant="flat"
                                                            isIconOnly
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleViewVersions(doc);
                                                            }}
                                                        >
                                                            <ClockIcon className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Chip size="sm" variant="flat" color="primary">
                                                        {doc.type}
                                                    </Chip>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <DocumentDuplicateIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>No documents yet</p>
                                    <Button
                                        size="sm"
                                        color="primary"
                                        variant="flat"
                                        className="mt-3"
                                        onPress={() => navigateTo(route('dms.documents.create'))}
                                    >
                                        Upload your first document
                                    </Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Shared with Me */}
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Shared with Me</h3>
                            <Button
                                size="sm"
                                variant="light"
                                onPress={() => navigateTo(route('dms.shared'))}
                            >
                                View All
                            </Button>
                        </CardHeader>
                        <Divider />
                        <CardBody className="p-0">
                            {sharedWithMe.length > 0 ? (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {sharedWithMe.map((doc) => (
                                        <li
                                            key={doc.id}
                                            className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                            onClick={() => navigateTo(route('dms.documents.show', doc.id))}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <ShareIcon className="h-5 w-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {doc.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Shared by {doc.shared_by} • {doc.shared_at}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Chip size="sm" variant="flat" color="secondary">
                                                    {doc.permission}
                                                </Chip>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <ShareIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>No shared documents</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Version History Modal */}
                {selectedDocument && (
                    <VersionHistory
                        isOpen={versionModalOpen}
                        onClose={() => {
                            setVersionModalOpen(false);
                            setSelectedDocument(null);
                        }}
                        documentId={selectedDocument.id}
                        documentName={selectedDocument.name}
                    />
                )}
            </div>
        </App>
    );
};

export default Dashboard;
