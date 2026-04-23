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
import { showToast } from "@/utils/ui/toastUtils";
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const themeRadius = useThemeRadius();

const DisciplinaryCaseForm = ({ disciplinaryCase, actionTypes, employees, open, closeModal, onSuccess, editMode = false }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm('post', editMode ? route('hrm.disciplinary.cases.update', disciplinaryCase?.id) : route('hrm.disciplinary.cases.store'), {
        employee_id: disciplinaryCase?.employee_id || '',
        action_type_id: disciplinaryCase?.action_type_id || '',
        incident_date: disciplinaryCase?.incident_date || new Date().toISOString().split('T')[0],
        description: disciplinaryCase?.description || '',
        employee_statement: disciplinaryCase?.employee_statement || '',
        witness_statement: disciplinaryCase?.witness_statement || '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await form.submit();
                if (response?.data) {
                    resolve([response.data.message || `Disciplinary case ${editMode ? 'updated' : 'created'} successfully`]);
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
            loading: editMode ? 'Updating case...' : 'Creating case...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    return (
        <Modal
            isOpen={open}
            onOpenChange={closeModal}
            size="3xl"
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
                            {editMode ? 'Edit Disciplinary Case' : 'Create New Disciplinary Case'}
                        </h2>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <Select
                                label="Employee"
                                placeholder="Select employee"
                                selectedKeys={form.data.employee_id ? [String(form.data.employee_id)] : []}
                                onSelectionChange={(keys) => form.setData('employee_id', Array.from(keys)[0])}
                                isInvalid={!!form.errors.employee_id}
                                errorMessage={form.errors.employee_id}
                                isRequired
                                radius={themeRadius}
                                classNames={{ trigger: "bg-default-100" }}
                            >
                                {employees?.map(employee => (
                                    <SelectItem key={String(employee.id)} value={String(employee.id)}>
                                        {employee.name}
                                    </SelectItem>
                                ))}
                            </Select>

                            <Select
                                label="Action Type"
                                placeholder="Select action type"
                                selectedKeys={form.data.action_type_id ? [String(form.data.action_type_id)] : []}
                                onSelectionChange={(keys) => form.setData('action_type_id', Array.from(keys)[0])}
                                isInvalid={!!form.errors.action_type_id}
                                errorMessage={form.errors.action_type_id}
                                isRequired
                                radius={themeRadius}
                                classNames={{ trigger: "bg-default-100" }}
                            >
                                {actionTypes?.map(type => (
                                    <SelectItem key={String(type.id)} value={String(type.id)}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </Select>

                            <Input
                                type="date"
                                label="Incident Date"
                                value={form.data.incident_date}
                                onChange={(e) => form.setData('incident_date', e.target.value)}
                                isInvalid={!!form.errors.incident_date}
                                errorMessage={form.errors.incident_date}
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Textarea
                                label="Description"
                                placeholder="Describe the incident"
                                value={form.data.description}
                                onValueChange={(value) => form.setData('description', value)}
                                isInvalid={!!form.errors.description}
                                errorMessage={form.errors.description}
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                                minRows={4}
                            />

                            <Textarea
                                label="Employee Statement"
                                placeholder="Enter employee's statement"
                                value={form.data.employee_statement}
                                onValueChange={(value) => form.setData('employee_statement', value)}
                                isInvalid={!!form.errors.employee_statement}
                                errorMessage={form.errors.employee_statement}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                                minRows={3}
                            />

                            <Textarea
                                label="Witness Statement (Optional)"
                                placeholder="Enter witness statement"
                                value={form.data.witness_statement}
                                onValueChange={(value) => form.setData('witness_statement', value)}
                                isInvalid={!!form.errors.witness_statement}
                                errorMessage={form.errors.witness_statement}
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

export default DisciplinaryCaseForm;