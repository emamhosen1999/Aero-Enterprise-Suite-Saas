import React from 'react';
import { router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Progress, Button, Chip } from '@heroui/react';
import { ArrowUpTrayIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

export default function StorageQuotaManager({ storageStats, onAction }) {
    const [loading, setLoading] = React.useState(false);

    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const getUsagePercentage = () => {
        if (!storageStats?.total || storageStats.total === 0) return 0;
        return Math.round((storageStats.used / storageStats.total) * 100);
    };

    const getUsageColor = () => {
        const percentage = getUsagePercentage();
        if (percentage >= 90) return 'danger';
        if (percentage >= 75) return 'warning';
        return 'success';
    };

    const handleEmptyTrash = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                setLoading(true);
                const response = await axios.delete(route('admin.files.trash.empty'));
                resolve([response.data.message || 'Trash emptied successfully']);
                onAction?.();
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to empty trash']);
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Emptying trash...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleCompressOld = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                setLoading(true);
                const response = await axios.post(route('admin.files.compress-old'));
                resolve([response.data.message || 'Old files compressed successfully']);
                onAction?.();
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to compress files']);
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Compressing old files...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDeleteDuplicates = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                setLoading(true);
                const response = await axios.delete(route('admin.files.delete-duplicates'));
                resolve([response.data.message || 'Duplicate files removed successfully']);
                onAction?.();
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to remove duplicates']);
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Removing duplicate files...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    return (
        <div className="space-y-6">
            {/* Storage Overview */}
            <Card className="transition-all duration-200">
                <CardHeader className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Storage Usage</h3>
                    <Chip color={getUsageColor()} variant="flat">
                        {getUsagePercentage()}% Used
                    </Chip>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-default-600">
                                {formatBytes(storageStats?.used || 0)} of {formatBytes(storageStats?.total || 0)}
                            </span>
                            <span className="text-default-600">
                                {formatBytes(storageStats?.available || 0)} available
                            </span>
                        </div>
                        <Progress
                            value={getUsagePercentage()}
                            color={getUsageColor()}
                            size="lg"
                            showValueLabel
                        />
                    </div>

                    {getUsagePercentage() >= 75 && (
                        <div className="p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                            <p className="text-sm text-warning-800 dark:text-warning-200">
                                {getUsagePercentage() >= 90 
                                    ? '⚠️ Storage is almost full. Consider upgrading your plan or cleaning up files.'
                                    : '⚠️ Storage usage is high. You may want to free up some space.'}
                            </p>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Usage by Type */}
            <Card className="transition-all duration-200">
                <CardHeader>
                    <h3 className="text-lg font-semibold">Usage by File Type</h3>
                </CardHeader>
                <CardBody>
                    <div className="space-y-3">
                        {storageStats?.byType?.map((type) => (
                            <div key={type.name} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-default-700">{type.name}</span>
                                    <span className="text-default-600">
                                        {formatBytes(type.size)} ({type.count} files)
                                    </span>
                                </div>
                                <Progress
                                    value={Math.round((type.size / (storageStats?.used || 1)) * 100)}
                                    color="primary"
                                    size="sm"
                                />
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>

            {/* Top 10 Largest Files */}
            <Card className="transition-all duration-200">
                <CardHeader>
                    <h3 className="text-lg font-semibold">Largest Files</h3>
                </CardHeader>
                <CardBody>
                    <div className="space-y-2">
                        {storageStats?.largestFiles?.slice(0, 10).map((file, index) => (
                            <div key={index} className="flex justify-between items-center p-2 hover:bg-default-100 rounded-lg">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                    <p className="text-xs text-default-500">{file.path}</p>
                                </div>
                                <span className="text-sm text-default-600 ml-4">
                                    {formatBytes(file.size)}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>

            {/* Cleanup Recommendations */}
            <Card className="transition-all duration-200">
                <CardHeader>
                    <h3 className="text-lg font-semibold">Cleanup Recommendations</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="grid gap-4">
                        {/* Empty Trash */}
                        <div className="flex justify-between items-start p-3 border border-default-200 rounded-lg">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrashIcon className="w-5 h-5 text-danger" />
                                    <h4 className="font-medium">Empty Trash</h4>
                                </div>
                                <p className="text-sm text-default-600">
                                    {storageStats?.trash?.count || 0} files in trash ({formatBytes(storageStats?.trash?.size || 0)})
                                </p>
                            </div>
                            <Button
                                size="sm"
                                color="danger"
                                variant="flat"
                                onPress={handleEmptyTrash}
                                isLoading={loading}
                                isDisabled={!storageStats?.trash?.count}
                            >
                                Empty Trash
                            </Button>
                        </div>

                        {/* Compress Old Files */}
                        <div className="flex justify-between items-start p-3 border border-default-200 rounded-lg">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <ArrowUpTrayIcon className="w-5 h-5 text-primary" />
                                    <h4 className="font-medium">Compress Old Files</h4>
                                </div>
                                <p className="text-sm text-default-600">
                                    {storageStats?.oldFiles?.count || 0} files older than 180 days ({formatBytes(storageStats?.oldFiles?.size || 0)})
                                </p>
                            </div>
                            <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                onPress={handleCompressOld}
                                isLoading={loading}
                                isDisabled={!storageStats?.oldFiles?.count}
                            >
                                Compress
                            </Button>
                        </div>

                        {/* Delete Duplicates */}
                        <div className="flex justify-between items-start p-3 border border-default-200 rounded-lg">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <DocumentDuplicateIcon className="w-5 h-5 text-warning" />
                                    <h4 className="font-medium">Remove Duplicates</h4>
                                </div>
                                <p className="text-sm text-default-600">
                                    {storageStats?.duplicates?.count || 0} duplicate files ({formatBytes(storageStats?.duplicates?.size || 0)})
                                </p>
                            </div>
                            <Button
                                size="sm"
                                color="warning"
                                variant="flat"
                                onPress={handleDeleteDuplicates}
                                isLoading={loading}
                                isDisabled={!storageStats?.duplicates?.count}
                            >
                                Remove
                            </Button>
                        </div>
                    </div>

                    {getUsagePercentage() >= 90 && (
                        <Button
                            color="primary"
                            className="w-full"
                            onPress={() => router.visit(route('admin.plans.index'))}
                        >
                            Upgrade Storage Plan
                        </Button>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
