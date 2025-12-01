import React, { useState } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Card,
    CardBody,
    Chip,
    Avatar,
    Tooltip,
    Spinner,
    Progress,
    Divider,
} from '@heroui/react';
import {
    ClockIcon,
    DocumentIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    CheckCircleIcon,
    TrashIcon,
    UserIcon,
    ArrowUturnLeftIcon,
    DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { showToast } from '@/utils/toastUtils';

/**
 * Format file size to human readable
 */
const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Format date relative to now
 */
const formatRelativeDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
};

/**
 * VersionHistoryModal - Displays version history for a document and allows rollback
 */
const VersionHistoryModal = ({
    isOpen,
    onClose,
    document,
    versions = [],
    isLoading = false,
    onRollback,
    onDownloadVersion,
    onPreviewVersion,
    onCompareVersions,
}) => {
    const [selectedVersions, setSelectedVersions] = useState([]);
    const [actionLoading, setActionLoading] = useState(null);

    const handleRollback = async (version) => {
        if (!onRollback) return;

        setActionLoading(version.id);
        try {
            await onRollback(document.id, version.id);
            showToast(`Rolled back to version ${version.version}`, 'success');
            onClose();
        } catch (error) {
            showToast('Failed to rollback to this version', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDownload = async (version) => {
        if (!onDownloadVersion) return;

        setActionLoading(version.id);
        try {
            await onDownloadVersion(document.id, version.id);
        } catch (error) {
            showToast('Failed to download version', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCompare = () => {
        if (selectedVersions.length !== 2) {
            showToast('Please select exactly 2 versions to compare', 'warning');
            return;
        }
        if (onCompareVersions) {
            onCompareVersions(document.id, selectedVersions[0], selectedVersions[1]);
        }
    };

    const toggleVersionSelection = (versionId) => {
        setSelectedVersions((prev) => {
            if (prev.includes(versionId)) {
                return prev.filter((id) => id !== versionId);
            }
            if (prev.length >= 2) {
                return [prev[1], versionId];
            }
            return [...prev, versionId];
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
            <ModalContent>
                {(onModalClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <ClockIcon className="w-6 h-6 text-primary" />
                                <span>Version History</span>
                            </div>
                            <p className="text-sm font-normal text-default-500">
                                {document?.title || 'Document'}
                            </p>
                        </ModalHeader>

                        <ModalBody className="py-4">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Spinner size="lg" />
                                    <p className="mt-4 text-default-500">Loading version history...</p>
                                </div>
                            ) : versions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <DocumentIcon className="w-16 h-16 text-default-300" />
                                    <p className="mt-4 text-default-500">No version history available</p>
                                    <p className="text-sm text-default-400">
                                        Version history will appear when you upload new versions
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Compare Button */}
                                    {versions.length > 1 && (
                                        <div className="flex justify-between items-center pb-2 border-b border-divider">
                                            <p className="text-sm text-default-500">
                                                {selectedVersions.length > 0
                                                    ? `${selectedVersions.length} version(s) selected`
                                                    : 'Select 2 versions to compare'}
                                            </p>
                                            <Button
                                                size="sm"
                                                color="primary"
                                                variant="flat"
                                                isDisabled={selectedVersions.length !== 2}
                                                onPress={handleCompare}
                                                startContent={<DocumentDuplicateIcon className="w-4 h-4" />}
                                            >
                                                Compare Selected
                                            </Button>
                                        </div>
                                    )}

                                    {/* Version Timeline */}
                                    <div className="relative">
                                        {/* Timeline line */}
                                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-default-200" />

                                        {versions.map((version, index) => (
                                            <div
                                                key={version.id}
                                                className={`relative pl-12 pb-6 ${
                                                    index === versions.length - 1 ? 'pb-0' : ''
                                                }`}
                                            >
                                                {/* Timeline dot */}
                                                <div
                                                    className={`absolute left-2 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                        index === 0
                                                            ? 'bg-primary border-primary'
                                                            : selectedVersions.includes(version.id)
                                                            ? 'bg-secondary border-secondary'
                                                            : 'bg-background border-default-300'
                                                    }`}
                                                >
                                                    {index === 0 && (
                                                        <CheckCircleIcon className="w-3 h-3 text-white" />
                                                    )}
                                                </div>

                                                <Card
                                                    className={`transition-all ${
                                                        selectedVersions.includes(version.id)
                                                            ? 'ring-2 ring-secondary'
                                                            : 'hover:shadow-md'
                                                    }`}
                                                    isPressable={versions.length > 1}
                                                    onPress={() =>
                                                        versions.length > 1 &&
                                                        toggleVersionSelection(version.id)
                                                    }
                                                >
                                                    <CardBody className="p-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold">
                                                                        Version {version.version}
                                                                    </span>
                                                                    {index === 0 && (
                                                                        <Chip
                                                                            size="sm"
                                                                            color="success"
                                                                            variant="flat"
                                                                        >
                                                                            Current
                                                                        </Chip>
                                                                    )}
                                                                </div>

                                                                <p className="text-sm text-default-500 mt-1">
                                                                    {version.change_summary ||
                                                                        'No description provided'}
                                                                </p>

                                                                <div className="flex items-center gap-4 mt-3 text-xs text-default-400">
                                                                    <div className="flex items-center gap-1">
                                                                        <UserIcon className="w-3.5 h-3.5" />
                                                                        <span>
                                                                            {version.creator?.name || 'Unknown'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <ClockIcon className="w-3.5 h-3.5" />
                                                                        <span>
                                                                            {formatRelativeDate(
                                                                                version.created_at
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <span>
                                                                        {formatFileSize(version.file_size)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1">
                                                                {onPreviewVersion && (
                                                                    <Tooltip content="Preview">
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="light"
                                                                            onPress={(e) => {
                                                                                e.stopPropagation();
                                                                                onPreviewVersion(
                                                                                    document.id,
                                                                                    version.id
                                                                                );
                                                                            }}
                                                                        >
                                                                            <EyeIcon className="w-4 h-4" />
                                                                        </Button>
                                                                    </Tooltip>
                                                                )}

                                                                <Tooltip content="Download">
                                                                    <Button
                                                                        isIconOnly
                                                                        size="sm"
                                                                        variant="light"
                                                                        isLoading={
                                                                            actionLoading === version.id
                                                                        }
                                                                        onPress={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDownload(version);
                                                                        }}
                                                                    >
                                                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                                                    </Button>
                                                                </Tooltip>

                                                                {index !== 0 && onRollback && (
                                                                    <Tooltip content="Restore this version">
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="light"
                                                                            color="warning"
                                                                            isLoading={
                                                                                actionLoading === version.id
                                                                            }
                                                                            onPress={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRollback(version);
                                                                            }}
                                                                        >
                                                                            <ArrowUturnLeftIcon className="w-4 h-4" />
                                                                        </Button>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </ModalBody>

                        <ModalFooter>
                            <Button color="default" variant="flat" onPress={onModalClose}>
                                Close
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

/**
 * VersionCompareModal - Side-by-side comparison of two document versions
 */
export const VersionCompareModal = ({
    isOpen,
    onClose,
    document,
    version1,
    version2,
    isLoading = false,
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
            <ModalContent>
                {(onModalClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <DocumentDuplicateIcon className="w-6 h-6 text-primary" />
                                <span>Compare Versions</span>
                            </div>
                            <p className="text-sm font-normal text-default-500">
                                {document?.title || 'Document'}
                            </p>
                        </ModalHeader>

                        <ModalBody className="py-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Spinner size="lg" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Version 1 */}
                                    <Card>
                                        <CardBody>
                                            <div className="flex items-center justify-between mb-4">
                                                <Chip color="primary" variant="flat">
                                                    Version {version1?.version}
                                                </Chip>
                                                <span className="text-sm text-default-500">
                                                    {formatRelativeDate(version1?.created_at)}
                                                </span>
                                            </div>
                                            <div className="bg-default-100 rounded-lg p-4 min-h-[300px]">
                                                <p className="text-sm text-default-600">
                                                    {version1?.change_summary ||
                                                        'No changes recorded for this version'}
                                                </p>
                                                <Divider className="my-4" />
                                                <div className="space-y-2 text-xs text-default-500">
                                                    <p>
                                                        File Size: {formatFileSize(version1?.file_size)}
                                                    </p>
                                                    <p>Created by: {version1?.creator?.name}</p>
                                                    {version1?.checksum && (
                                                        <p className="font-mono truncate">
                                                            Checksum: {version1.checksum}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>

                                    {/* Version 2 */}
                                    <Card>
                                        <CardBody>
                                            <div className="flex items-center justify-between mb-4">
                                                <Chip color="secondary" variant="flat">
                                                    Version {version2?.version}
                                                </Chip>
                                                <span className="text-sm text-default-500">
                                                    {formatRelativeDate(version2?.created_at)}
                                                </span>
                                            </div>
                                            <div className="bg-default-100 rounded-lg p-4 min-h-[300px]">
                                                <p className="text-sm text-default-600">
                                                    {version2?.change_summary ||
                                                        'No changes recorded for this version'}
                                                </p>
                                                <Divider className="my-4" />
                                                <div className="space-y-2 text-xs text-default-500">
                                                    <p>
                                                        File Size: {formatFileSize(version2?.file_size)}
                                                    </p>
                                                    <p>Created by: {version2?.creator?.name}</p>
                                                    {version2?.checksum && (
                                                        <p className="font-mono truncate">
                                                            Checksum: {version2.checksum}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            )}
                        </ModalBody>

                        <ModalFooter>
                            <Button color="default" variant="flat" onPress={onModalClose}>
                                Close
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default VersionHistoryModal;
