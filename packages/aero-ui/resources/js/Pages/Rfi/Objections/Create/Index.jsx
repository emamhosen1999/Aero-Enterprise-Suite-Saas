import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import App from '@/Layouts/App';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Textarea,
    Select,
    SelectItem,
} from '@heroui/react';
import {
    ArrowLeftIcon,
    DocumentPlusIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';

const ObjectionsCreate = ({
    auth,
    title = 'Create Objection',
    categories = [],
    categoryLabels = {},
}) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        category: '',
        notes: '',
        files: [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route('rfi.objections.store'), {
            onSuccess: () => {
                showToast.success('Objection created successfully');
            },
            onError: () => {
                showToast.error('Failed to create objection');
            },
        });
    };

    const handleBack = () => {
        safeNavigate('rfi.objections.index');
    };

    return (
        <App auth={auth}>
            <Head title={title} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        isIconOnly
                        variant="flat"
                        onPress={handleBack}
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{title}</h1>
                        <p className="text-default-500">Create a new objection record</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <Card className="aero-card">
                        <CardHeader className="border-b border-divider p-4">
                            <h3 className="text-lg font-semibold">Objection Details</h3>
                        </CardHeader>
                        <CardBody className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Title"
                                    placeholder="Enter objection title"
                                    value={data.title}
                                    onValueChange={(value) => setData('title', value)}
                                    isInvalid={!!errors.title}
                                    errorMessage={errors.title}
                                    isRequired
                                    classNames={{ inputWrapper: 'bg-default-100' }}
                                />

                                <Select
                                    label="Category"
                                    placeholder="Select category"
                                    selectedKeys={data.category ? [data.category] : []}
                                    onSelectionChange={(keys) => setData('category', Array.from(keys)[0])}
                                    isInvalid={!!errors.category}
                                    errorMessage={errors.category}
                                    isRequired
                                    classNames={{ trigger: 'bg-default-100' }}
                                >
                                    {Object.entries(categoryLabels).map(([key, label]) => (
                                        <SelectItem key={key}>{label}</SelectItem>
                                    ))}
                                </Select>
                            </div>

                            <Textarea
                                label="Description"
                                placeholder="Describe the objection in detail"
                                value={data.description}
                                onValueChange={(value) => setData('description', value)}
                                isInvalid={!!errors.description}
                                errorMessage={errors.description}
                                minRows={4}
                                classNames={{ inputWrapper: 'bg-default-100' }}
                            />

                            <Textarea
                                label="Notes"
                                placeholder="Additional notes (optional)"
                                value={data.notes}
                                onValueChange={(value) => setData('notes', value)}
                                isInvalid={!!errors.notes}
                                errorMessage={errors.notes}
                                minRows={2}
                                classNames={{ inputWrapper: 'bg-default-100' }}
                            />

                            {/* File Upload - simplified */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Attachments
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) => setData('files', Array.from(e.target.files))}
                                    className="block w-full text-sm text-default-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-lg file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-primary-100 file:text-primary-700
                                        hover:file:bg-primary-200"
                                />
                                {errors.files && (
                                    <p className="text-danger text-sm mt-1">{errors.files}</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-divider">
                                <Button
                                    variant="flat"
                                    onPress={handleBack}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    isLoading={processing}
                                    startContent={!processing && <DocumentPlusIcon className="w-5 h-5" />}
                                >
                                    Create Objection
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </form>
            </div>
        </App>
    );
};

export default ObjectionsCreate;
