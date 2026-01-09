import {
    Button,
    Spinner,
    Select,
    SelectItem,
    Input,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Textarea,
} from "@heroui/react";
import React, { useEffect, useState } from "react";
import { useForm } from 'laravel-precognition-react';
import { showToast } from "@/utils/toastUtils";

const getThemeRadius = () => {
    if (typeof window === 'undefined') return 'lg';
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    const radiusValue = parseInt(borderRadius);
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 16) return 'lg';
    return 'full';
};

const AssetForm = ({ asset, categories, open, closeModal, onSuccess, editMode = false }) => {
    const themeRadius = getThemeRadius();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm('post', editMode ? route('hrm.assets.update', asset?.id) : route('hrm.assets.store'), {
        asset_category_id: asset?.asset_category_id || '',
        name: asset?.name || '',
        serial_number: asset?.serial_number || '',
        qr_code: asset?.qr_code || '',
        purchase_date: asset?.purchase_date || '',
        purchase_price: asset?.purchase_price || '',
        warranty_expiry: asset?.warranty_expiry || '',
        description: asset?.description || '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await form.submit();
                if (response?.data) {
                    resolve([response.data.message || `Asset ${editMode ? 'updated' : 'created'} successfully`]);
                    closeModal();
                    if (onSuccess) onSuccess();
                }
            } catch (error) {
                const errors = error.response?.data?.errors || { general: ['An error occurred'] };
                const errorMessages = Object.values(errors).flat();
                reject(errorMessages);
            } finally {
                setIsSubmitting(false);
            }
        });

        showToast.promise(promise, {
            loading: editMode ? 'Updating asset...' : 'Creating asset...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    return (
        <Modal
            isOpen={open}
            onOpenChange={closeModal}
            size="2xl"
            scrollBehavior="inside"
            classNames={{
                base: "bg-content1",
                header: "border-b border-divider",
                body: "py-6",
                footer: "border-t border-divider"
            }}
        >
            <ModalContent>
                <form onSubmit={handleSubmit}>
                    <ModalHeader className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold">
                            {editMode ? 'Edit Asset' : 'Create New Asset'}
                        </h2>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <Select
                                label="Asset Category"
                                placeholder="Select category"
                                selectedKeys={form.data.asset_category_id ? [String(form.data.asset_category_id)] : []}
                                onSelectionChange={(keys) => form.setData('asset_category_id', Array.from(keys)[0])}
                                isInvalid={!!form.errors.asset_category_id}
                                errorMessage={form.errors.asset_category_id}
                                isRequired
                                radius={themeRadius}
                                classNames={{ trigger: "bg-default-100" }}
                            >
                                {categories?.map(category => (
                                    <SelectItem key={String(category.id)} value={String(category.id)}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </Select>

                            <Input
                                label="Asset Name"
                                placeholder="Enter asset name"
                                value={form.data.name}
                                onValueChange={(value) => form.setData('name', value)}
                                isInvalid={!!form.errors.name}
                                errorMessage={form.errors.name}
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Input
                                label="Serial Number"
                                placeholder="Enter serial number"
                                value={form.data.serial_number}
                                onValueChange={(value) => form.setData('serial_number', value)}
                                isInvalid={!!form.errors.serial_number}
                                errorMessage={form.errors.serial_number}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Input
                                label="QR Code"
                                placeholder="Scan or enter QR code"
                                value={form.data.qr_code}
                                onValueChange={(value) => form.setData('qr_code', value)}
                                isInvalid={!!form.errors.qr_code}
                                errorMessage={form.errors.qr_code}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Input
                                type="date"
                                label="Purchase Date"
                                value={form.data.purchase_date}
                                onChange={(e) => form.setData('purchase_date', e.target.value)}
                                isInvalid={!!form.errors.purchase_date}
                                errorMessage={form.errors.purchase_date}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Input
                                type="number"
                                step="0.01"
                                label="Purchase Price"
                                placeholder="Enter purchase price"
                                value={form.data.purchase_price}
                                onValueChange={(value) => form.setData('purchase_price', value)}
                                isInvalid={!!form.errors.purchase_price}
                                errorMessage={form.errors.purchase_price}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                                startContent={<span className="text-default-400">$</span>}
                            />

                            <Input
                                type="date"
                                label="Warranty Expiry"
                                value={form.data.warranty_expiry}
                                onChange={(e) => form.setData('warranty_expiry', e.target.value)}
                                isInvalid={!!form.errors.warranty_expiry}
                                errorMessage={form.errors.warranty_expiry}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Textarea
                                label="Description (Optional)"
                                placeholder="Enter asset description"
                                value={form.data.description}
                                onValueChange={(value) => form.setData('description', value)}
                                isInvalid={!!form.errors.description}
                                errorMessage={form.errors.description}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                                minRows={3}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={closeModal} isDisabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            type="submit"
                            isLoading={isSubmitting}
                            isDisabled={isSubmitting}
                        >
                            {editMode ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default AssetForm;
