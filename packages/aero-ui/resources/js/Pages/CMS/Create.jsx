import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Textarea,
    Switch,
    Spinner,
} from "@heroui/react";
import {
    DocumentTextIcon,
    ArrowLeftIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

const CmsCreate = ({ title }) => {
    const { auth } = usePage().props;

    // Theme radius helper
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

    // Responsive breakpoints
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        is_homepage: false,
        show_in_nav: false,
        nav_order: 0,
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [autoSlug, setAutoSlug] = useState(true);

    // Generate slug from title
    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    // Handle title change with auto-slug
    const handleTitleChange = (value) => {
        setFormData(prev => ({
            ...prev,
            title: value,
            slug: autoSlug ? generateSlug(value) : prev.slug,
        }));
    };

    // Handle slug change
    const handleSlugChange = (value) => {
        setAutoSlug(false);
        setFormData(prev => ({
            ...prev,
            slug: generateSlug(value),
        }));
    };

    // Update form field
    const updateField = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    // Submit form
    const handleSubmit = async (e) => {
        e?.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const response = await axios.post(route('admin.cms.pages.store'), formData);
            
            if (response.data?.page?.id) {
                showToast.success('Page created successfully');
                router.visit(route('admin.cms.pages.edit', response.data.page.id));
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                showToast.error(error.response?.data?.message || 'Failed to create page');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Head title={title || 'Create Page'} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Create CMS Page">
                <div className="space-y-4">
                    <div className="w-full max-w-4xl mx-auto">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="transition-all duration-200" style={getThemedCardStyle()}>
                                <CardHeader
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <Button
                                                    isIconOnly
                                                    variant="light"
                                                    onPress={() => router.visit(route('admin.cms.pages.index'))}
                                                >
                                                    <ArrowLeftIcon className="w-5 h-5" />
                                                </Button>
                                                <div
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <DocumentTextIcon
                                                        className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Create New Page
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        Set up basic page information
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 flex-wrap">
                                                <Button
                                                    variant="flat"
                                                    onPress={() => router.visit(route('admin.cms.pages.index'))}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    color="primary"
                                                    variant="shadow"
                                                    startContent={!isSubmitting && <CheckIcon className="w-4 h-4" />}
                                                    onPress={handleSubmit}
                                                    isLoading={isSubmitting}
                                                    size={isMobile ? "sm" : "md"}
                                                >
                                                    Create Page
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Basic Info */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">Basic Information</h3>
                                            
                                            <Input
                                                label="Page Title"
                                                placeholder="Enter page title"
                                                value={formData.title}
                                                onValueChange={handleTitleChange}
                                                isRequired
                                                isInvalid={!!errors.title}
                                                errorMessage={errors.title}
                                                radius={getThemeRadius()}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />

                                            <Input
                                                label="URL Slug"
                                                placeholder="page-url-slug"
                                                value={formData.slug}
                                                onValueChange={handleSlugChange}
                                                isRequired
                                                isInvalid={!!errors.slug}
                                                errorMessage={errors.slug}
                                                startContent={<span className="text-default-400 text-sm">/</span>}
                                                radius={getThemeRadius()}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />
                                        </div>

                                        {/* SEO Settings */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">SEO Settings</h3>
                                            
                                            <Input
                                                label="Meta Title"
                                                placeholder="Page title for search engines"
                                                value={formData.meta_title}
                                                onValueChange={(value) => updateField('meta_title', value)}
                                                isInvalid={!!errors.meta_title}
                                                errorMessage={errors.meta_title}
                                                radius={getThemeRadius()}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />

                                            <Textarea
                                                label="Meta Description"
                                                placeholder="Brief description for search engines (150-160 characters recommended)"
                                                value={formData.meta_description}
                                                onValueChange={(value) => updateField('meta_description', value)}
                                                isInvalid={!!errors.meta_description}
                                                errorMessage={errors.meta_description}
                                                minRows={3}
                                                radius={getThemeRadius()}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />

                                            <Input
                                                label="Meta Keywords"
                                                placeholder="keyword1, keyword2, keyword3"
                                                value={formData.meta_keywords}
                                                onValueChange={(value) => updateField('meta_keywords', value)}
                                                radius={getThemeRadius()}
                                                classNames={{ inputWrapper: "bg-default-100" }}
                                            />
                                        </div>

                                        {/* Navigation Settings */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">Navigation Settings</h3>
                                            
                                            <div className="flex flex-col gap-4">
                                                <Switch
                                                    isSelected={formData.is_homepage}
                                                    onValueChange={(value) => updateField('is_homepage', value)}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">Set as Homepage</span>
                                                        <span className="text-xs text-default-400">
                                                            This page will be shown at the root URL
                                                        </span>
                                                    </div>
                                                </Switch>

                                                <Switch
                                                    isSelected={formData.show_in_nav}
                                                    onValueChange={(value) => updateField('show_in_nav', value)}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">Show in Navigation</span>
                                                        <span className="text-xs text-default-400">
                                                            Display this page in the main navigation menu
                                                        </span>
                                                    </div>
                                                </Switch>

                                                {formData.show_in_nav && (
                                                    <Input
                                                        type="number"
                                                        label="Navigation Order"
                                                        placeholder="0"
                                                        value={String(formData.nav_order)}
                                                        onValueChange={(value) => updateField('nav_order', parseInt(value) || 0)}
                                                        className="max-w-xs"
                                                        radius={getThemeRadius()}
                                                        classNames={{ inputWrapper: "bg-default-100" }}
                                                    />
                                                )}
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

CmsCreate.layout = (page) => <App children={page} />;
export default CmsCreate;
