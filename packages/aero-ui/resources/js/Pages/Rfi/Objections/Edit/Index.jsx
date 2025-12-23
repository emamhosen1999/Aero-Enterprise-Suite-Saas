import React from 'react';
import { Head, router, useForm } from '@inertiajs/react';
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
    CheckIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';

const ObjectionsEdit = ({
    auth,
    title = 'Edit Objection',
    objection = {},
    categories = [],
    categoryLabels = {},
    statusLabels = {},
}) => {
    const { data, setData, put, processing, errors } = useForm({
        title: objection.title || '',
        description: objection.description || '',
        category: objection.category || '',
        notes: objection.notes || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        put(route('rfi.objections.update', objection.id), {
            onSuccess: () => {
                showToast.success('Objection updated successfully');
            },
            onError: () => {
                showToast.error('Failed to update objection');
            },
        });
    };

    const handleBack = () => {
        router.visit(route('rfi.objections.show', objection.id));
    };

    return (
        <App auth={auth}>
            <Head title={`${title} - #${objection.id}`} />

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
                        <p className="text-default-500">Objection #{objection.id}</p>
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
                                    startContent={!processing && <CheckIcon className="w-5 h-5" />}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </form>
            </div>
        </App>
    );
};

export default ObjectionsEdit;
