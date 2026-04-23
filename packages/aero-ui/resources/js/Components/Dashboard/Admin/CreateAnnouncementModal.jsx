import React, { useState } from 'react';
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, Input, Textarea, Select, SelectItem,
} from '@heroui/react';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';

const types = [
    { key: 'info', label: 'Info' },
    { key: 'warning', label: 'Warning' },
    { key: 'success', label: 'Success' },
    { key: 'danger', label: 'Danger' },
];

const priorities = [
    { key: 'low', label: 'Low' },
    { key: 'normal', label: 'Normal' },
    { key: 'high', label: 'High' },
    { key: 'urgent', label: 'Urgent' },
];

const CreateAnnouncementModal = ({ open, onClose, onCreated }) => {
    const [form, setForm] = useState({
        title: '', body: '', type: 'info', priority: 'normal',
        starts_at: '', expires_at: '', is_pinned: false, is_dismissible: true,
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setErrors(prev => ({ ...prev, [key]: undefined }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const res = await axios.post(route('core.dashboard.announcements.store'), form);
                resolve(res.data.message || 'Announcement created');
                onCreated?.(res.data.announcement);
                onClose();
            } catch (error) {
                const errs = error.response?.data?.errors;
                if (errs) {
                    setErrors(errs);
                    reject(Object.values(errs).flat().join(', '));
                } else {
                    reject('Failed to create announcement');
                }
            } finally {
                setSubmitting(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Creating announcement...',
            success: (msg) => msg,
            error: (msg) => msg,
        });
    };

    return (
        <Modal
            isOpen={open}
            onOpenChange={onClose}
            size="2xl"
            scrollBehavior="inside"
            classNames={{
                base: 'bg-content1',
                header: 'border-b border-divider',
                body: 'py-6',
                footer: 'border-t border-divider',
            }}
        >
            <ModalContent>
                <ModalHeader>Create Announcement</ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <Input
                            label="Title"
                            placeholder="Announcement title"
                            value={form.title}
                            onValueChange={(v) => handleChange('title', v)}
                            isInvalid={!!errors.title}
                            errorMessage={errors.title?.[0]}
                            isRequired
                        />
                        <Textarea
                            label="Body"
                            placeholder="Announcement content..."
                            value={form.body}
                            onValueChange={(v) => handleChange('body', v)}
                            isInvalid={!!errors.body}
                            errorMessage={errors.body?.[0]}
                            isRequired
                            minRows={3}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Type"
                                selectedKeys={[form.type]}
                                onSelectionChange={(keys) => handleChange('type', Array.from(keys)[0])}
                            >
                                {types.map(t => <SelectItem key={t.key}>{t.label}</SelectItem>)}
                            </Select>
                            <Select
                                label="Priority"
                                selectedKeys={[form.priority]}
                                onSelectionChange={(keys) => handleChange('priority', Array.from(keys)[0])}
                            >
                                {priorities.map(p => <SelectItem key={p.key}>{p.label}</SelectItem>)}
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                type="datetime-local"
                                label="Starts At"
                                value={form.starts_at}
                                onChange={(e) => handleChange('starts_at', e.target.value)}
                                isInvalid={!!errors.starts_at}
                                errorMessage={errors.starts_at?.[0]}
                            />
                            <Input
                                type="datetime-local"
                                label="Expires At"
                                value={form.expires_at}
                                onChange={(e) => handleChange('expires_at', e.target.value)}
                                isInvalid={!!errors.expires_at}
                                errorMessage={errors.expires_at?.[0]}
                            />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={onClose}>Cancel</Button>
                    <Button color="primary" onPress={handleSubmit} isLoading={submitting}>Create</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default CreateAnnouncementModal;
