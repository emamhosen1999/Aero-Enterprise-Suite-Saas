import React, { useState } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Input,
    Textarea,
    Button,
    Select,
    SelectItem,
    Checkbox,
} from '@heroui/react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';

const AdvancedContactFormBlock = ({ data = {} }) => {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const fields = data.fields || [];
    const submitText = data.submit_text || 'Send Message';

    const handleChange = (fieldName, value) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: value,
        }));
        if (errors[fieldName]) {
            setErrors((prev) => ({
                ...prev,
                [fieldName]: null,
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        fields.forEach((field) => {
            if (field.required && !formData[field.name]) {
                newErrors[field.name] = `${field.label} is required`;
            }
            if (field.name === 'email' && formData[field.name]) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData[field.name])) {
                    newErrors[field.name] = 'Please enter a valid email address';
                }
            }
        });
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            if (!data.recipient_email) {
                showToast.error('Form is not properly configured. Please contact the administrator.');
                setIsSubmitting(false);
                return;
            }

            const response = await axios.post(route('cms.forms.submit'), {
                form_data: formData,
                recipient_email: data.recipient_email,
                page_id: data.page_id,
            });

            if (response.status === 200 || response.status === 201) {
                showToast.success('Thank you! Your message has been sent successfully.');
                setFormData({});
                setIsSubmitted(true);
                setTimeout(() => setIsSubmitted(false), 5000);
            }
        } catch (error) {
            showToast.error(
                error.response?.data?.message ||
                'Failed to send your message. Please try again.'
            );
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderField = (field) => {
        const value = formData[field.name] || '';
        const error = errors[field.name];

        switch (field.type) {
            case 'textarea':
                return (
                    <Textarea
                        key={field.name}
                        label={field.label}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        value={value}
                        onValueChange={(v) => handleChange(field.name, v)}
                        isInvalid={!!error}
                        errorMessage={error}
                        isRequired={field.required}
                        minRows={4}
                        variant="bordered"
                        classNames={{
                            inputWrapper: 'bg-default-100',
                        }}
                    />
                );

            case 'select':
                return (
                    <Select
                        key={field.name}
                        label={field.label}
                        placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
                        selectedKeys={value ? [String(value)] : []}
                        onSelectionChange={(keys) =>
                            handleChange(field.name, Array.from(keys)[0])
                        }
                        isInvalid={!!error}
                        errorMessage={error}
                        isRequired={field.required}
                        variant="bordered"
                        classNames={{
                            trigger: 'bg-default-100',
                        }}
                    >
                        {(field.options || []).map((option) => (
                            <SelectItem key={option}>{option}</SelectItem>
                        ))}
                    </Select>
                );

            case 'checkbox':
                return (
                    <div key={field.name} className="flex items-center gap-2">
                        <Checkbox
                            isSelected={formData[field.name] === true}
                            onChange={(e) =>
                                handleChange(field.name, e.target.checked)
                            }
                        >
                            {field.label}
                        </Checkbox>
                        {error && (
                            <span className="text-xs text-danger">{error}</span>
                        )}
                    </div>
                );

            case 'email':
            case 'text':
            default:
                return (
                    <Input
                        key={field.name}
                        label={field.label}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        type={field.type === 'email' ? 'email' : 'text'}
                        value={value}
                        onValueChange={(v) => handleChange(field.name, v)}
                        isInvalid={!!error}
                        errorMessage={error}
                        isRequired={field.required}
                        variant="bordered"
                        classNames={{
                            inputWrapper: 'bg-default-100',
                        }}
                    />
                );
        }
    };

    if (!fields || fields.length === 0) {
        return (
            <div className="text-center text-default-500 py-8">
                <p>Form is not properly configured</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            <Card
                className="transition-all duration-200"
                style={{
                    background: `var(--theme-content1, #FAFAFA)`,
                    borderColor: `var(--theme-divider, #E4E4E7)`,
                    borderWidth: `var(--borderWidth, 2px)`,
                    borderRadius: `var(--borderRadius, 12px)`,
                }}
            >
                <CardHeader className="flex items-start gap-3 p-6 border-b border-divider">
                    <div className="p-2 rounded-lg"
                        style={{
                            background: `color-mix(in srgb, var(--theme-primary, #0070F0) 15%, transparent)`,
                        }}
                    >
                        <EnvelopeIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        {data.title && (
                            <h3 className="text-lg font-bold text-foreground">
                                {data.title}
                            </h3>
                        )}
                        {data.description && (
                            <p className="text-sm text-default-600 mt-1">
                                {data.description}
                            </p>
                        )}
                    </div>
                </CardHeader>

                <CardBody className="p-6">
                    {isSubmitted && (
                        <div className="mb-6 p-4 rounded-lg bg-success/10 border border-success/20">
                            <p className="text-sm text-success font-medium">
                                Thank you for your message. We'll get back to you soon!
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {fields.map((field) => renderField(field))}

                        <Button
                            type="submit"
                            color="primary"
                            fullWidth
                            size="lg"
                            isLoading={isSubmitting}
                            disabled={isSubmitting || isSubmitted}
                            className="mt-6"
                        >
                            {isSubmitting ? 'Sending...' : submitText}
                        </Button>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
};

export default AdvancedContactFormBlock;
