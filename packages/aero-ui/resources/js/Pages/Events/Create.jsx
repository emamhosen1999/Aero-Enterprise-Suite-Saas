import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { motion } from 'framer-motion';
import {
    Button,
    Input,
    Textarea,
    Select,
    SelectItem,
    Switch,
    Card,
    CardBody,
    CardHeader,
    Divider
} from "@heroui/react";
import {
    CalendarIcon,
    MapPinIcon,
    PlusIcon,
    TrashIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

const CreateEvent = () => {
    const [data, setData] = useState({
        title: '',
        slug: '',
        description: '',
        venue: '',
        event_date: '',
        event_time: '',
        registration_deadline: '',
        max_participants: '',
        banner_image: null,
        food_details: '',
        rules: '',
        organizer_name: '',
        organizer_phone: '',
        organizer_email: '',
        is_published: false,
        is_registration_open: true,
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        custom_fields: []
    });

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [bannerPreview, setBannerPreview] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const formData = new FormData();
                Object.keys(data).forEach(key => {
                    if (key === 'custom_fields') {
                        formData.append(key, JSON.stringify(data[key]));
                    } else if (key === 'banner_image' && data[key]) {
                        formData.append(key, data[key]);
                    } else if (typeof data[key] === 'boolean') {
                        // Handle boolean values - convert to '1' or '0' for Laravel
                        formData.append(key, data[key] ? '1' : '0');
                    } else if (data[key] !== null && data[key] !== '') {
                        formData.append(key, data[key]);
                    }
                });

                const response = await axios.post(route('events.store'), formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (response.status === 200 || response.status === 201) {
                    // Redirect to events index or show page
                    safeNavigate('events.index');
                    resolve('Event created successfully!');
                } else {
                    reject(`Unexpected response status: ${response.status}`);
                }
            } catch (error) {
                console.error('Error creating event:', error);
                
                if (error.response) {
                    if (error.response.status === 422) {
                        setErrors(error.response.data.errors || {});
                        reject(error.response.data.message || 'Failed to create event. Please check the form.');
                    } else {
                        reject(`HTTP Error ${error.response.status}: ${error.response.data.message || 'An unexpected error occurred.'}`);
                    }
                } else if (error.request) {
                    reject('No response received from the server. Please check your internet connection.');
                } else {
                    reject('An error occurred while setting up the request.');
                }
            } finally {
                setProcessing(false);
            }
        });

        showToast.promise(
            promise,
            {
                pending: 'Creating event...',
                success: {
                    render({ data }) {
                        return data;
                    }
                },
                error: {
                    render({ data }) {
                        return data;
                    }
                }
            }
        );
    };

    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData(prev => ({ ...prev, banner_image: file }));
            setBannerPreview(URL.createObjectURL(file));
        }
    };

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleTitleChange = (value) => {
        setData(prev => ({ ...prev, title: value }));
        if (!data.slug) {
            setData(prev => ({ ...prev, slug: generateSlug(value) }));
        }
    };

    // Helper function to update a single field
    const updateField = (field, value) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const addCustomField = () => {
        setData(prev => ({
            ...prev,
            custom_fields: [...prev.custom_fields, {
                field_name: '',
                field_label: '',
                field_type: 'text',
                field_options: [],
                is_required: false,
                placeholder: '',
                help_text: ''
            }]
        }));
    };

    const removeCustomField = (index) => {
        setData(prev => ({
            ...prev,
            custom_fields: prev.custom_fields.filter((_, i) => i !== index)
        }));
    };

    const updateCustomField = (index, key, value) => {
        setData(prev => ({
            ...prev,
            custom_fields: prev.custom_fields.map((field, i) => 
                i === index ? { ...field, [key]: value } : field
            )
        }));
    };

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

    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    return (
        <>
            <Head title="Create Event" />
            
            <div className="min-h-screen bg-background">
                <div className="max-w-[1600px] mx-auto">
                    <div className="p-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="bg-content1/50 backdrop-blur-md border border-divider/30" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                <CardHeader className="pb-0">
                                    <div className="w-full">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 pb-2">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-xl bg-primary/20">
                                                    <CalendarIcon className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <h1 className="text-2xl font-bold text-foreground">Create Event</h1>
                                                    <p className="text-sm text-default-500 mt-1">
                                                        Set up a new event with sub-events and custom registration fields
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="flat"
                                                onPress={() => router.get(route('events.index'))}
                                                startContent={<ArrowLeftIcon className="w-5 h-5" />}
                                                radius={getThemeRadius()}
                                            >
                                                Back to Events
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
            
                                <CardBody className="p-6">
                                    <form onSubmit={handleSubmit}>
                                        <div className="space-y-6">
                                            {/* Basic Information */}
                                            <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                <CardBody>
                                                    <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <Input
                                                            label="Event Title"
                                                            placeholder="Enter event title"
                                                            value={data.title}
                                                            onChange={(e) => handleTitleChange(e.target.value)}
                                                            errorMessage={errors.title}
                                                            isInvalid={!!errors.title}
                                                            isRequired
                                                            radius={getThemeRadius()}
                                                        />
                                                        
                                                        <Input
                                                            label="Slug (URL)"
                                                            placeholder="event-slug"
                                                            value={data.slug}
                                                            onChange={(e) => setData(prev => ({ ...prev, slug: e.target.value }))}
                                                            errorMessage={errors.slug}
                                                            isInvalid={!!errors.slug}
                                                            description="Auto-generated from title, can be customized"
                                                            radius={getThemeRadius()}
                                                        />
                                                        
                                                        <Input
                                                            label="Venue"
                                                            placeholder="Enter venue location"
                                                            value={data.venue}
                                                            onChange={(e) => setData(prev => ({ ...prev, venue: e.target.value }))}
                                                            errorMessage={errors.venue}
                                                            isInvalid={!!errors.venue}
                                                            startContent={<MapPinIcon className="w-4 h-4" />}
                                                            isRequired
                                                            radius={getThemeRadius()}
                                                        />
                                                        
                                                        <Input
                                                            type="date"
                                                            label="Event Date"
                                                            value={data.event_date}
                                                            onChange={(e) => setData(prev => ({ ...prev, event_date: e.target.value }))}
                                                            errorMessage={errors.event_date}
                                                            isInvalid={!!errors.event_date}
                                                            isRequired
                                                            radius={getThemeRadius()}
                                                        />
                                                        
                                                        <Input
                                                            type="time"
                                                            label="Event Time"
                                                            value={data.event_time}
                                                            onChange={(e) => setData(prev => ({ ...prev, event_time: e.target.value }))}
                                                            errorMessage={errors.event_time}
                                                            isInvalid={!!errors.event_time}
                                                            isRequired
                                                            radius={getThemeRadius()}
                                                        />
                                                        
                                                        <Input
                                                            type="datetime-local"
                                                            label="Registration Deadline"
                                                            value={data.registration_deadline}
                                                            onChange={(e) => setData(prev => ({ ...prev, registration_deadline: e.target.value }))}
                                                            errorMessage={errors.registration_deadline}
                                                            isInvalid={!!errors.registration_deadline}
                                                            radius={getThemeRadius()}
                                                        />
                                                        
                                                        <Input
                                                            type="number"
                                                            label="Max Participants"
                                                            placeholder="Leave empty for unlimited"
                                                            value={data.max_participants}
                                                            onChange={(e) => setData(prev => ({ ...prev, max_participants: e.target.value }))}
                                                            errorMessage={errors.max_participants}
                                                            isInvalid={!!errors.max_participants}
                                                            radius={getThemeRadius()}
                                                        />
                                                    </div>
                                                    
                                                    <div className="mt-4">
                                                        <Textarea
                                                            label="Description"
                                                            placeholder="Enter event description"
                                                            value={data.description}
                                                            onChange={(e) => updateField('description', e.target.value)}
                                                            errorMessage={errors.description}
                                                            isInvalid={!!errors.description}
                                                            rows={4}
                                                            isRequired
                                                            radius={getThemeRadius()}
                                                        />
                                                    </div>
                                                    
                                                    <div className="mt-4">
                                                        <label className="block text-sm font-medium mb-2">Event Banner</label>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleBannerChange}
                                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-600"
                                                        />
                                                        {errors.banner_image && (
                                                            <p className="text-xs text-danger mt-1">{errors.banner_image}</p>
                                                        )}
                                                        {bannerPreview && (
                                                            <img src={bannerPreview} alt="Banner preview" className="mt-4 max-h-48 rounded-lg" />
                                                        )}
                                                    </div>
                                                </CardBody>
                                            </Card>

                                            {/* Additional Details */}
                                            <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                <CardBody>
                                                    <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
                                                    <div className="space-y-4">
                                                        <Textarea
                                                            label="Food Details"
                                                            placeholder="Enter food arrangements (optional)"
                                                            value={data.food_details}
                                                            onChange={(e) => updateField('food_details', e.target.value)}
                                                            rows={3}
                                                            radius={getThemeRadius()}
                                                        />
                                                        
                                                        <Textarea
                                                            label="Rules & Regulations"
                                                            placeholder="Enter event rules (optional)"
                                                            value={data.rules}
                                                            onChange={(e) => updateField('rules', e.target.value)}
                                                            rows={3}
                                                            radius={getThemeRadius()}
                                                        />
                                                    </div>
                                                </CardBody>
                                            </Card>

                                            {/* Organizer Information */}
                                            <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                <CardBody>
                                                    <h3 className="text-lg font-semibold mb-4">Organizer Information</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <Input
                                                            label="Organizer Name"
                                                            placeholder="Enter organizer name"
                                                            value={data.organizer_name}
                                                            onChange={(e) => updateField('organizer_name', e.target.value)}
                                                            radius={getThemeRadius()}
                                                        />
                                                        
                                                        <Input
                                                            label="Organizer Phone"
                                                            placeholder="Enter phone number"
                                                            value={data.organizer_phone}
                                                            onChange={(e) => updateField('organizer_phone', e.target.value)}
                                                            radius={getThemeRadius()}
                                                        />
                                                        
                                                        <Input
                                                            type="email"
                                                            label="Organizer Email"
                                                            placeholder="Enter email address"
                                                            value={data.organizer_email}
                                                            onChange={(e) => updateField('organizer_email', e.target.value)}
                                                            radius={getThemeRadius()}
                                                        />
                                                    </div>
                                                </CardBody>
                                            </Card>

                                            {/* SEO Settings */}
                                            <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                <CardBody>
                                                    <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
                                                    <div className="space-y-4">
                                                        <Input
                                                            label="Meta Title"
                                                            placeholder="SEO title"
                                                            value={data.meta_title}
                                                            onChange={(e) => updateField('meta_title', e.target.value)}
                                                            radius={getThemeRadius()}
                                                        />
                                                        
                                                        <Textarea
                                                            label="Meta Description"
                                                            placeholder="SEO description"
                                                            value={data.meta_description}
                                                            onChange={(e) => updateField('meta_description', e.target.value)}
                                                            rows={3}
                                                            radius={getThemeRadius()}
                                                        />
                                                        
                                                        <Input
                                                            label="Meta Keywords"
                                                            placeholder="Comma separated keywords"
                                                            value={data.meta_keywords}
                                                            onChange={(e) => updateField('meta_keywords', e.target.value)}
                                                            radius={getThemeRadius()}
                                                        />
                                                    </div>
                                                </CardBody>
                                            </Card>

                                            {/* Custom Registration Fields */}
                                            <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                <CardBody>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-lg font-semibold">Custom Registration Fields</h3>
                                                        <Button
                                                            size="sm"
                                                            color="primary"
                                                            variant="flat"
                                                            startContent={<PlusIcon className="w-4 h-4" />}
                                                            onPress={addCustomField}
                                                            radius={getThemeRadius()}
                                                        >
                                                            Add Field
                                                        </Button>
                                                    </div>
                                                    
                                                    {data.custom_fields && data.custom_fields.length > 0 ? (
                                                        <div className="space-y-4">
                                                            {data.custom_fields.map((field, index) => (
                                                                <Card key={index} style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                                    <CardBody>
                                                                        <div className="flex items-start justify-between mb-3">
                                                                            <h4 className="font-medium">Field #{index + 1}</h4>
                                                                            <Button
                                                                                size="sm"
                                                                                color="danger"
                                                                                variant="flat"
                                                                                isIconOnly
                                                                                onPress={() => removeCustomField(index)}
                                                                                radius={getThemeRadius()}
                                                                            >
                                                                                <TrashIcon className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>
                                                                        
                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                            <Input
                                                                                label="Field Name"
                                                                                placeholder="e.g., t_shirt_size"
                                                                                value={field.field_name}
                                                                                onChange={(e) => updateCustomField(index, 'field_name', e.target.value)}
                                                                                size="sm"
                                                                                radius={getThemeRadius()}
                                                                            />
                                                                            
                                                                            <Input
                                                                                label="Field Label"
                                                                                placeholder="e.g., T-Shirt Size"
                                                                                value={field.field_label}
                                                                                onChange={(e) => updateCustomField(index, 'field_label', e.target.value)}
                                                                                size="sm"
                                                                                radius={getThemeRadius()}
                                                                            />
                                                                            
                                                                            <Select
                                                                                label="Field Type"
                                                                                selectedKeys={[field.field_type]}
                                                                                onChange={(e) => updateCustomField(index, 'field_type', e.target.value)}
                                                                                size="sm"
                                                                                radius={getThemeRadius()}
                                                                            >
                                                                                <SelectItem key="text" value="text">Text</SelectItem>
                                                                                <SelectItem key="textarea" value="textarea">Textarea</SelectItem>
                                                                                <SelectItem key="number" value="number">Number</SelectItem>
                                                                                <SelectItem key="email" value="email">Email</SelectItem>
                                                                                <SelectItem key="phone" value="phone">Phone</SelectItem>
                                                                                <SelectItem key="select" value="select">Select</SelectItem>
                                                                                <SelectItem key="radio" value="radio">Radio</SelectItem>
                                                                                <SelectItem key="checkbox" value="checkbox">Checkbox</SelectItem>
                                                                                <SelectItem key="date" value="date">Date</SelectItem>
                                                                                <SelectItem key="file" value="file">File</SelectItem>
                                                                            </Select>
                                                                        </div>
                                                                        
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                                                            <Input
                                                                                label="Placeholder"
                                                                                placeholder="Optional placeholder text"
                                                                                value={field.placeholder}
                                                                                onChange={(e) => updateCustomField(index, 'placeholder', e.target.value)}
                                                                                size="sm"
                                                                                radius={getThemeRadius()}
                                                                            />
                                                                            
                                                                            <Input
                                                                                label="Help Text"
                                                                                placeholder="Optional help text"
                                                                                value={field.help_text}
                                                                                onChange={(e) => updateCustomField(index, 'help_text', e.target.value)}
                                                                                size="sm"
                                                                                radius={getThemeRadius()}
                                                                            />
                                                                        </div>
                                                                        
                                                                        <div className="mt-3">
                                                                            <Switch
                                                                                isSelected={field.is_required}
                                                                                onValueChange={(value) => updateCustomField(index, 'is_required', value)}
                                                                                size="sm"
                                                                            >
                                                                                Required Field
                                                                            </Switch>
                                                                        </div>
                                                                    </CardBody>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-center text-default-500 py-4">
                                                            No custom fields added. Click "Add Field" to create registration fields.
                                                        </p>
                                                    )}
                                                </CardBody>
                                            </Card>

                                            {/* Settings */}
                                            <Card className="bg-content2/50" style={{ borderRadius: 'var(--borderRadius, 12px)' }}>
                                                <CardBody>
                                                    <h3 className="text-lg font-semibold mb-4">Settings</h3>
                                                    <div className="space-y-3">
                                                        <Switch
                                                            isSelected={data.is_published}
                                                            onValueChange={(value) => setData(prev => ({ ...prev, is_published: value }))}
                                                        >
                                                            Publish Event (make visible to public)
                                                        </Switch>
                                                        
                                                        <Switch
                                                            isSelected={data.is_registration_open}
                                                            onValueChange={(value) => setData(prev => ({ ...prev, is_registration_open: value }))}
                                                        >
                                                            Open for Registration
                                                        </Switch>
                                                    </div>
                                                </CardBody>
                                            </Card>

                                            {/* Submit Buttons */}
                                            <div className="flex justify-end gap-3">
                                                <Button
                                                    variant="flat"
                                                    onPress={() => router.get(route('events.index'))}
                                                    isDisabled={processing}
                                                    radius={getThemeRadius()}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    color="primary"
                                                    isLoading={processing}
                                                    radius={getThemeRadius()}
                                                >
                                                    Create Event
                                                </Button>
                                            </div>
                                        </div>
                                    </form>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

CreateEvent.layout = (page) => <App>{page}</App>;

export default CreateEvent;
