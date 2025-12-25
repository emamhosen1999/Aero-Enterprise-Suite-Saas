import React, { useState, useRef } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import App from '@/Layouts/App';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Textarea,
    Divider,
    Image,
    Chip,
} from '@heroui/react';
import { showToast } from '@/utils/toastUtils';
import {
    PhotoIcon,
    SwatchIcon,
    BuildingOffice2Icon,
    EnvelopeIcon,
    PhoneIcon,
    GlobeAltIcon,
    DocumentTextIcon,
    CreditCardIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';

const InvoiceBrandingSettings = () => {
    const { branding = {}, previewUrl = '' } = usePage().props;
    
    const [logoPreview, setLogoPreview] = useState(branding.logo_url || null);
    const [previewing, setPreviewing] = useState(false);
    const fileInputRef = useRef(null);

    const form = useForm({
        company_name: branding.company_name || '',
        logo: null,
        remove_logo: false,
        primary_color: branding.primary_color || '#2563eb',
        secondary_color: branding.secondary_color || '#1e40af',
        address: branding.address || '',
        phone: branding.phone || '',
        email: branding.email || '',
        website: branding.website || '',
        tax_id: branding.tax_id || '',
        bank_name: branding.bank_name || '',
        account_number: branding.account_number || '',
        routing_number: branding.routing_number || '',
        swift_code: branding.swift_code || '',
        payment_instructions: branding.payment_instructions || '',
        thank_you_message: branding.thank_you_message || 'Thank you for your business!',
        footer_text: branding.footer_text || '',
        terms: branding.terms || '',
    });

    const { data, setData, post, processing, errors, reset } = form;

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast.error('Logo file must be less than 2MB');
                return;
            }
            
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
            if (!allowedTypes.includes(file.type)) {
                showToast.error('Logo must be a JPG, PNG, GIF, or SVG file');
                return;
            }

            setData('logo', file);
            setData('remove_logo', false);
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setData('logo', null);
        setData('remove_logo', true);
        setLogoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'logo' && data[key]) {
                formData.append(key, data[key]);
            } else if (data[key] !== null) {
                formData.append(key, data[key]);
            }
        });

        post(route('settings.invoice-branding.save'), {
            forceFormData: true,
            onSuccess: () => {
                showToast.success('Invoice branding settings saved successfully');
            },
            onError: () => {
                showToast.error('Failed to save settings');
            },
        });
    };

    const handlePreview = async () => {
        setPreviewing(true);
        try {
            window.open(route('settings.invoice-branding.preview'), '_blank');
        } finally {
            setPreviewing(false);
        }
    };

    return (
        <App>
            <Head title="Invoice Branding Settings" />

            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Invoice Branding
                    </h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Customize the appearance of your invoices and receipts with your company branding.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Logo & Colors */}
                    <Card>
                        <CardHeader className="flex gap-3">
                            <SwatchIcon className="h-6 w-6 text-primary" />
                            <div className="flex flex-col">
                                <p className="text-md font-semibold">Logo & Colors</p>
                                <p className="text-small text-default-500">
                                    Upload your company logo and set brand colors
                                </p>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="gap-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Logo Upload */}
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Company Logo
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-32 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800">
                                            {logoPreview ? (
                                                <Image
                                                    src={logoPreview}
                                                    alt="Logo preview"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            ) : (
                                                <PhotoIcon className="h-8 w-8 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/gif,image/svg+xml"
                                                onChange={handleLogoChange}
                                                className="hidden"
                                                id="logo-upload"
                                            />
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                Upload Logo
                                            </Button>
                                            {logoPreview && (
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    color="danger"
                                                    onClick={handleRemoveLogo}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                Max 2MB. JPG, PNG, GIF, SVG
                                            </p>
                                        </div>
                                    </div>
                                    {errors.logo && (
                                        <p className="mt-1 text-sm text-danger">{errors.logo}</p>
                                    )}
                                </div>

                                {/* Colors */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Primary Color
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={data.primary_color}
                                                onChange={(e) => setData('primary_color', e.target.value)}
                                                className="w-10 h-10 rounded cursor-pointer border-0"
                                            />
                                            <Input
                                                value={data.primary_color}
                                                onChange={(e) => setData('primary_color', e.target.value)}
                                                size="sm"
                                                className="flex-1"
                                                placeholder="#2563eb"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Secondary Color
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={data.secondary_color}
                                                onChange={(e) => setData('secondary_color', e.target.value)}
                                                className="w-10 h-10 rounded cursor-pointer border-0"
                                            />
                                            <Input
                                                value={data.secondary_color}
                                                onChange={(e) => setData('secondary_color', e.target.value)}
                                                size="sm"
                                                className="flex-1"
                                                placeholder="#1e40af"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Company Information */}
                    <Card>
                        <CardHeader className="flex gap-3">
                            <BuildingOffice2Icon className="h-6 w-6 text-primary" />
                            <div className="flex flex-col">
                                <p className="text-md font-semibold">Company Information</p>
                                <p className="text-small text-default-500">
                                    Business details to display on invoices
                                </p>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="gap-4">
                            <Input
                                label="Company Name"
                                value={data.company_name}
                                onChange={(e) => setData('company_name', e.target.value)}
                                placeholder="Acme Corporation"
                                isInvalid={!!errors.company_name}
                                errorMessage={errors.company_name}
                            />

                            <Textarea
                                label="Address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="123 Business St&#10;Suite 456&#10;City, State 12345"
                                minRows={3}
                                isInvalid={!!errors.address}
                                errorMessage={errors.address}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="+1 (555) 123-4567"
                                    startContent={<PhoneIcon className="h-4 w-4 text-gray-400" />}
                                    isInvalid={!!errors.phone}
                                    errorMessage={errors.phone}
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="billing@company.com"
                                    startContent={<EnvelopeIcon className="h-4 w-4 text-gray-400" />}
                                    isInvalid={!!errors.email}
                                    errorMessage={errors.email}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Website"
                                    value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                    placeholder="https://www.company.com"
                                    startContent={<GlobeAltIcon className="h-4 w-4 text-gray-400" />}
                                    isInvalid={!!errors.website}
                                    errorMessage={errors.website}
                                />
                                <Input
                                    label="Tax ID / VAT Number"
                                    value={data.tax_id}
                                    onChange={(e) => setData('tax_id', e.target.value)}
                                    placeholder="XX-XXXXXXX"
                                    isInvalid={!!errors.tax_id}
                                    errorMessage={errors.tax_id}
                                />
                            </div>
                        </CardBody>
                    </Card>

                    {/* Payment Information */}
                    <Card>
                        <CardHeader className="flex gap-3">
                            <CreditCardIcon className="h-6 w-6 text-primary" />
                            <div className="flex flex-col">
                                <p className="text-md font-semibold">Payment Information</p>
                                <p className="text-small text-default-500">
                                    Bank details and payment instructions for customers
                                </p>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Bank Name"
                                    value={data.bank_name}
                                    onChange={(e) => setData('bank_name', e.target.value)}
                                    placeholder="First National Bank"
                                    isInvalid={!!errors.bank_name}
                                    errorMessage={errors.bank_name}
                                />
                                <Input
                                    label="Account Number"
                                    value={data.account_number}
                                    onChange={(e) => setData('account_number', e.target.value)}
                                    placeholder="XXXX-XXXX-XXXX"
                                    isInvalid={!!errors.account_number}
                                    errorMessage={errors.account_number}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Routing Number"
                                    value={data.routing_number}
                                    onChange={(e) => setData('routing_number', e.target.value)}
                                    placeholder="XXXXXXXXX"
                                    isInvalid={!!errors.routing_number}
                                    errorMessage={errors.routing_number}
                                />
                                <Input
                                    label="SWIFT/BIC Code"
                                    value={data.swift_code}
                                    onChange={(e) => setData('swift_code', e.target.value)}
                                    placeholder="BANKUSXX"
                                    isInvalid={!!errors.swift_code}
                                    errorMessage={errors.swift_code}
                                />
                            </div>

                            <Textarea
                                label="Payment Instructions"
                                value={data.payment_instructions}
                                onChange={(e) => setData('payment_instructions', e.target.value)}
                                placeholder="Additional payment instructions for customers..."
                                minRows={2}
                                isInvalid={!!errors.payment_instructions}
                                errorMessage={errors.payment_instructions}
                            />
                        </CardBody>
                    </Card>

                    {/* Footer & Terms */}
                    <Card>
                        <CardHeader className="flex gap-3">
                            <DocumentTextIcon className="h-6 w-6 text-primary" />
                            <div className="flex flex-col">
                                <p className="text-md font-semibold">Footer & Terms</p>
                                <p className="text-small text-default-500">
                                    Customize thank you message, footer, and terms
                                </p>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="gap-4">
                            <Input
                                label="Thank You Message"
                                value={data.thank_you_message}
                                onChange={(e) => setData('thank_you_message', e.target.value)}
                                placeholder="Thank you for your business!"
                                isInvalid={!!errors.thank_you_message}
                                errorMessage={errors.thank_you_message}
                            />

                            <Textarea
                                label="Footer Text"
                                value={data.footer_text}
                                onChange={(e) => setData('footer_text', e.target.value)}
                                placeholder="Optional footer text for invoices..."
                                minRows={2}
                                isInvalid={!!errors.footer_text}
                                errorMessage={errors.footer_text}
                            />

                            <Textarea
                                label="Default Terms & Conditions"
                                value={data.terms}
                                onChange={(e) => setData('terms', e.target.value)}
                                placeholder="Payment is due within 30 days of invoice date..."
                                minRows={3}
                                isInvalid={!!errors.terms}
                                errorMessage={errors.terms}
                            />
                        </CardBody>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="flat"
                            onClick={handlePreview}
                            isLoading={previewing}
                            startContent={!previewing && <EyeIcon className="h-4 w-4" />}
                        >
                            Preview Invoice
                        </Button>
                        <Button
                            variant="flat"
                            onClick={() => reset()}
                            isDisabled={processing}
                            startContent={<ArrowPathIcon className="h-4 w-4" />}
                        >
                            Reset
                        </Button>
                        <Button
                            type="submit"
                            color="primary"
                            isLoading={processing}
                            startContent={!processing && <CheckCircleIcon className="h-4 w-4" />}
                        >
                            Save Settings
                        </Button>
                    </div>
                </form>
            </div>
        </App>
    );
};

export default InvoiceBrandingSettings;
