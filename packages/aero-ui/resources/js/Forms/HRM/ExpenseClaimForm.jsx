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

const ExpenseClaimForm = ({ claim, categories, open, closeModal, onSuccess, editMode = false }) => {
    const themeRadius = getThemeRadius();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Format expense_date properly for HTML date input (YYYY-MM-DD)
    const formatDateForInput = (dateValue) => {
        if (!dateValue) return new Date().toISOString().split('T')[0];
        // Handle ISO string or date object
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
        return date.toISOString().split('T')[0];
    };

    const form = useForm(editMode ? 'put' : 'post', editMode ? route('hrm.expenses.update', claim?.id) : route('hrm.expenses.store'), {
        category_id: claim?.category_id || '',
        amount: claim?.amount || '',
        expense_date: formatDateForInput(claim?.expense_date),
        description: claim?.description || '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await form.submit();
                if (response?.data) {
                    resolve([response.data.message || `Expense claim ${editMode ? 'updated' : 'created'} successfully`]);
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
            loading: editMode ? 'Updating expense claim...' : 'Creating expense claim...',
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
                            {editMode ? 'Edit Expense Claim' : 'Create New Expense Claim'}
                        </h2>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <Select
                                label="Expense Category"
                                placeholder="Select category"
                                selectedKeys={form.data.category_id ? [String(form.data.category_id)] : []}
                                onSelectionChange={(keys) => form.setData('category_id', Array.from(keys)[0])}
                                isInvalid={!!form.errors.category_id}
                                errorMessage={form.errors.category_id}
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
                                type="number"
                                step="0.01"
                                label="Amount"
                                placeholder="Enter amount"
                                value={form.data.amount}
                                onValueChange={(value) => form.setData('amount', value)}
                                isInvalid={!!form.errors.amount}
                                errorMessage={form.errors.amount}
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                                startContent={<span className="text-default-400">$</span>}
                            />

                            <Input
                                type="date"
                                label="Expense Date"
                                value={form.data.expense_date}
                                onChange={(e) => form.setData('expense_date', e.target.value)}
                                isInvalid={!!form.errors.expense_date}
                                errorMessage={form.errors.expense_date}
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Textarea
                                label="Description"
                                placeholder="Enter expense description"
                                value={form.data.description}
                                onValueChange={(value) => form.setData('description', value)}
                                isInvalid={!!form.errors.description}
                                errorMessage={form.errors.description}
                                isRequired
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

export default ExpenseClaimForm;
