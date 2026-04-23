import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Input, Textarea, Button, Select, SelectItem } from '@heroui/react';
import { showToast } from '@/utils/ui/toastUtils';

const ContactFormBlock = ({ data = {} }) => {
    const {
        title = 'Contact Us',
        description = 'Get in touch with our team',
        submitUrl = '/api/contact/submit',
        fields = [],
        submitText = 'Send Message',
        successMessage = 'Thank you for your message!'
    } = data;

    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const fieldList = typeof fields === 'string' ? JSON.parse(fields || '[]') : (fields || []);

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(submitUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showToast.success(successMessage);
                setFormData({});
            } else {
                showToast.error('Failed to send message. Please try again.');
            }
        } catch (error) {
            showToast.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border border-divider max-w-2xl">
            <CardHeader className="flex flex-col items-start px-6 pt-6">
                <h3 className="text-2xl font-bold">{title}</h3>
                {description && <p className="text-default-600 mt-2">{description}</p>}
            </CardHeader>

            <CardBody className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {fieldList.map((field, idx) => {
                        if (field.type === 'email') {
                            return (
                                <Input
                                    key={idx}
                                    type="email"
                                    label={field.label}
                                    placeholder={field.placeholder || ''}
                                    value={formData[field.name] || ''}
                                    onValueChange={(value) => handleChange(field.name, value)}
                                    isRequired={field.required}
                                    radius="lg"
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            );
                        } else if (field.type === 'textarea') {
                            return (
                                <Textarea
                                    key={idx}
                                    label={field.label}
                                    placeholder={field.placeholder || ''}
                                    value={formData[field.name] || ''}
                                    onValueChange={(value) => handleChange(field.name, value)}
                                    isRequired={field.required}
                                    minRows={4}
                                    radius="lg"
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            );
                        } else if (field.type === 'select') {
                            return (
                                <Select
                                    key={idx}
                                    label={field.label}
                                    selectedKeys={formData[field.name] ? [formData[field.name]] : []}
                                    onSelectionChange={(keys) => handleChange(field.name, Array.from(keys)[0])}
                                    isRequired={field.required}
                                    radius="lg"
                                    classNames={{ trigger: "bg-default-100" }}
                                >
                                    {(field.options || []).map((opt, oidx) => (
                                        <SelectItem key={opt.value || oidx}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </Select>
                            );
                        } else {
                            return (
                                <Input
                                    key={idx}
                                    type={field.type || 'text'}
                                    label={field.label}
                                    placeholder={field.placeholder || ''}
                                    value={formData[field.name] || ''}
                                    onValueChange={(value) => handleChange(field.name, value)}
                                    isRequired={field.required}
                                    radius="lg"
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            );
                        }
                    })}

                    <Button
                        type="submit"
                        color="primary"
                        size="lg"
                        isLoading={loading}
                        className="w-full font-semibold"
                    >
                        {submitText}
                    </Button>
                </form>
            </CardBody>
        </Card>
    );
};

export default ContactFormBlock;
