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

    const form = useForm('post', editMode ? route('hrm.expenses.update', claim?.id) : route('hrm.expenses.store'), {
        expense_category_id: claim?.expense_category_id || '',
        amount: claim?.amount || '',
        claim_date: claim?.claim_date || new Date().toISOString().split('T')[0],
        description: claim?.description || '',
        notes: claim?.notes || '',
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
                                selectedKeys={form.data.expense_category_id ? [String(form.data.expense_category_id)] : []}
                                onSelectionChange={(keys) => form.setData('expense_category_id', Array.from(keys)[0])}
                                isInvalid={!!form.errors.expense_category_id}
                                errorMessage={form.errors.expense_category_id}
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
                                label="Claim Date"
                                value={form.data.claim_date}
                                onChange={(e) => form.setData('claim_date', e.target.value)}
                                isInvalid={!!form.errors.claim_date}
                                errorMessage={form.errors.claim_date}
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

                            <Textarea
                                label="Notes (Optional)"
                                placeholder="Additional notes"
                                value={form.data.notes}
                                onValueChange={(value) => form.setData('notes', value)}
                                isInvalid={!!form.errors.notes}
                                errorMessage={form.errors.notes}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                                minRows={2}
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
