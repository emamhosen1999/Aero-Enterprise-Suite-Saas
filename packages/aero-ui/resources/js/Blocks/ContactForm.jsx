import React, { useState } from 'react';
import { Button, Input, Textarea, Select, SelectItem, Checkbox, Card, CardBody } from "@heroui/react";
import { motion } from 'framer-motion';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

/**
 * ContactForm Block
 * Contact form with configurable fields and styling
 * 
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Section subtitle
 * @param {string} props.layout - Layout style: 'simple', 'split', 'card'
 * @param {Array} props.fields - Array of field definitions
 * @param {string} props.submitText - Submit button text
 * @param {string} props.submitEndpoint - Form submission endpoint
 * @param {string} props.successMessage - Message after successful submission
 * @param {boolean} props.showContactInfo - Whether to show contact info section
 * @param {Object} props.contactInfo - Contact information { email, phone, address }
 * @param {boolean} props.showSocialLinks - Whether to show social links
 * @param {Array} props.socialLinks - Array of social links { platform, url }
 */
const ContactForm = ({
    title = 'Get in Touch',
    subtitle = "Submit the form below and a member of our team will respond promptly.",
    layout = 'simple',
    fields = [
        { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe', colSpan: 1 },
        { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'john@example.com', colSpan: 1 },
        { name: 'phone', label: 'Phone Number', type: 'tel', required: false, placeholder: '+1 (555) 123-4567', colSpan: 1 },
        { name: 'company', label: 'Company', type: 'text', required: false, placeholder: 'Acme Inc.', colSpan: 1 },
        { name: 'subject', label: 'Subject', type: 'select', required: true, options: ['General Inquiry', 'Sales', 'Support', 'Partnership'], colSpan: 2 },
        { name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'Please describe your enquiry.', rows: 4, colSpan: 2 },
        { name: 'consent', label: 'I agree to the privacy policy and terms of service', type: 'checkbox', required: true, colSpan: 2 }
    ],
    submitText = 'Send Message',
    submitEndpoint = '/api/contact',
    successMessage = 'Your message has been received. A member of our team will be in touch shortly.',
    showContactInfo = true,
    contactInfo = {
        email: 'hello@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Business St, Suite 100\nNew York, NY 10001'
    },
    showSocialLinks = false,
    socialLinks = []
}) => {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Update form field
    const updateField = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when field is updated
        if (errors[name]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};
        
        fields.forEach(field => {
            if (field.required) {
                const value = formData[field.name];
                if (field.type === 'checkbox' && !value) {
                    newErrors[field.name] = 'This field is required';
                } else if (field.type !== 'checkbox' && (!value || value.trim() === '')) {
                    newErrors[field.name] = 'This field is required';
                }
            }
            
            // Email validation
            if (field.type === 'email' && formData[field.name]) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData[field.name])) {
                    newErrors[field.name] = 'Please enter a valid email address';
                }
            }
        });
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        
        try {
            await axios.post(submitEndpoint, formData);
            setIsSubmitted(true);
            setFormData({});
            showToast.success(successMessage);
        } catch (error) {
            console.error('Form submission error:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                showToast.error('Failed to submit form. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render form field
    const renderField = (field) => {
        const commonProps = {
            label: field.label,
            placeholder: field.placeholder || '',
            value: formData[field.name] || '',
            isRequired: field.required,
            isInvalid: !!errors[field.name],
            errorMessage: errors[field.name],
            classNames: { inputWrapper: "bg-default-100" }
        };

        switch (field.type) {
            case 'textarea':
                return (
                    <Textarea
                        {...commonProps}
                        minRows={field.rows || 4}
                        onValueChange={(val) => updateField(field.name, val)}
                    />
                );
            
            case 'select':
                return (
                    <Select
                        {...commonProps}
                        selectedKeys={formData[field.name] ? [formData[field.name]] : []}
                        onSelectionChange={(keys) => updateField(field.name, Array.from(keys)[0])}
                    >
                        {(field.options || []).map(option => (
                            <SelectItem key={option}>{option}</SelectItem>
                        ))}
                    </Select>
                );
            
            case 'checkbox':
                return (
                    <Checkbox
                        isSelected={formData[field.name] || false}
                        onValueChange={(val) => updateField(field.name, val)}
                        isInvalid={!!errors[field.name]}
                    >
                        <span className={`text-sm ${errors[field.name] ? 'text-danger' : 'text-default-500'}`}>
                            {field.label}
                        </span>
                    </Checkbox>
                );
            
            default:
                return (
                    <Input
                        {...commonProps}
                        type={field.type || 'text'}
                        onValueChange={(val) => updateField(field.name, val)}
                    />
                );
        }
    };

    // Render contact info section
    const renderContactInfo = () => (
        <div className="space-y-6">
            {contactInfo.email && (
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <EnvelopeIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-medium text-foreground">Email</h3>
                        <a href={`mailto:${contactInfo.email}`} className="text-default-500 hover:text-primary">
                            {contactInfo.email}
                        </a>
                    </div>
                </div>
            )}
            
            {contactInfo.phone && (
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <PhoneIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-medium text-foreground">Phone</h3>
                        <a href={`tel:${contactInfo.phone.replace(/\D/g, '')}`} className="text-default-500 hover:text-primary">
                            {contactInfo.phone}
                        </a>
                    </div>
                </div>
            )}
            
            {contactInfo.address && (
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <MapPinIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-medium text-foreground">Address</h3>
                        <p className="text-default-500 whitespace-pre-line">
                            {contactInfo.address}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    // Render success message
    if (isSubmitted) {
        return (
            <section className="py-12 lg:py-16 bg-background">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                    >
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
                            <CheckCircleIcon className="w-10 h-10 text-success" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-4">
                            Message Received
                        </h2>
                        <p className="text-default-500 mb-8">
                            {successMessage}
                        </p>
                        <Button
                            color="primary"
                            variant="flat"
                            onPress={() => setIsSubmitted(false)}
                        >
                            Send Another Message
                        </Button>
                    </motion.div>
                </div>
            </section>
        );
    }

    // Render form content
    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map((field, index) => (
                    <div 
                        key={field.name} 
                        className={field.colSpan === 2 ? 'md:col-span-2' : ''}
                    >
                        {renderField(field)}
                    </div>
                ))}
            </div>
            
            <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
            >
                {submitText}
            </Button>
        </form>
    );

    // Layout variations
    if (layout === 'card') {
        return (
            <section className="py-12 lg:py-16 bg-content2 dark:bg-content2">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <Card className="shadow-xl">
                            <CardBody className="p-8">
                                {(title || subtitle) && (
                                    <div className="text-center mb-8">
                                        {title && (
                                            <h2 className="text-3xl font-bold text-foreground">
                                                {title}
                                            </h2>
                                        )}
                                        {subtitle && (
                                            <p className="mt-3 text-default-500">
                                                {subtitle}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {formContent}
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>
            </section>
        );
    }

    if (layout === 'split') {
        return (
            <section className="py-12 lg:py-16 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                        {/* Info side */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            {title && (
                                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                                    {title}
                                </h2>
                            )}
                            {subtitle && (
                                <p className="mt-4 text-lg text-default-500">
                                    {subtitle}
                                </p>
                            )}
                            
                            {showContactInfo && (
                                <div className="mt-10">
                                    {renderContactInfo()}
                                </div>
                            )}
                        </motion.div>

                        {/* Form side */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            {formContent}
                        </motion.div>
                    </div>
                </div>
            </section>
        );
    }

    // Simple layout (default)
    return (
        <section className="py-12 lg:py-16 bg-background">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {(title || subtitle) && (
                    <motion.div
                        className="text-center mb-10"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        {title && (
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="mt-4 text-lg text-default-500">
                                {subtitle}
                            </p>
                        )}
                    </motion.div>
                )}
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    {formContent}
                </motion.div>
            </div>
        </section>
    );
};

export default ContactForm;
