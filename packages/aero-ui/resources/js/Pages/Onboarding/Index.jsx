import React, { useState, useMemo, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Textarea,
    Switch,
    Progress,
    Avatar,
    Chip,
    Divider,
    Select,
    SelectItem,
} from '@heroui/react';
import {
    Building2,
    Palette,
    Users,
    Puzzle,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Rocket,
    Mail,
    Globe,
    MapPin,
    Phone,
    Clock,
    Upload,
    Plus,
    X,
    Sparkles,
    SkipForward,
} from 'lucide-react';
import { showToast, toastStyles } from '@/utils/toastUtils';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Helper function to convert theme borderRadius to HeroUI radius values
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

/**
 * Tenant Onboarding Wizard
 *
 * Multi-step setup wizard for new tenants after their first login.
 * Guides admins through essential organization setup:
 * - Company information
 * - Branding & appearance
 * - Team invitations
 * - Module configuration
 */
export default function OnboardingWizard({
    title,
    steps,
    currentStep,
    completedSteps,
    tenant,
    systemSettings,
    user,
    roles = [],
}) {
    const [activeStep, setActiveStep] = useState(currentStep || 'welcome');
    const [teamInvites, setTeamInvites] = useState([{ email: '', role: roles[0]?.name || 'employee' }]);
    const [themeRadius, setThemeRadius] = useState('lg');
    
    // Theme context for dark mode toggle
    const { themeSettings, toggleMode } = useTheme();
    const isDarkMode = themeSettings?.mode === 'dark';

    // Set theme radius on mount (client-side only)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setThemeRadius(getThemeRadius());
        }
    }, []);

    // Step order for navigation
    const stepOrder = ['welcome', 'company', 'branding', 'team', 'modules', 'complete'];
    const currentStepIndex = stepOrder.indexOf(activeStep);

    // Company form
    const companyForm = useForm({
        company_name: systemSettings?.organization?.company_name || tenant?.name || '',
        legal_name: systemSettings?.organization?.legal_name || '',
        tagline: systemSettings?.organization?.tagline || '',
        industry: systemSettings?.organization?.industry || '',
        company_size: systemSettings?.organization?.company_size || '',
        timezone: systemSettings?.organization?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        address_line1: systemSettings?.organization?.address_line1 || '',
        address_line2: systemSettings?.organization?.address_line2 || '',
        city: systemSettings?.organization?.city || '',
        state: systemSettings?.organization?.state || '',
        postal_code: systemSettings?.organization?.postal_code || '',
        country: systemSettings?.organization?.country || '',
        support_email: systemSettings?.organization?.support_email || '',
        support_phone: systemSettings?.organization?.support_phone || '',
        website_url: systemSettings?.organization?.website_url || '',
    });

    // Branding form
    const brandingForm = useForm({
        primary_color: systemSettings?.branding?.primary_color || '#0f172a',
        accent_color: systemSettings?.branding?.accent_color || '#6366f1',
        login_background: systemSettings?.branding?.login_background || 'pattern-1',
        dark_mode: systemSettings?.branding?.dark_mode || false,
        logo_light: null,
        logo_dark: null,
        logo: null, // Horizontal logo (legacy/fallback)
        square_logo: null,
        favicon: null,
    });

    // Logo preview state
    const [logoPreviews, setLogoPreviews] = useState({
        logo_light: systemSettings?.branding?.logo_light ? `/storage/${systemSettings.branding.logo_light}` : null,
        logo_dark: systemSettings?.branding?.logo_dark ? `/storage/${systemSettings.branding.logo_dark}` : null,
        logo: systemSettings?.branding?.logo ? `/storage/${systemSettings.branding.logo}` : null,
        square_logo: systemSettings?.branding?.square_logo ? `/storage/${systemSettings.branding.square_logo}` : null,
        favicon: systemSettings?.branding?.favicon ? `/storage/${systemSettings.branding.favicon}` : null,
    });

    // Handle file selection with preview
    const handleLogoSelect = (field, file) => {
        if (file) {
            brandingForm.setData(field, file);
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setLogoPreviews(prev => ({ ...prev, [field]: previewUrl }));
        }
    };

    // Remove logo
    const handleLogoRemove = (field) => {
        brandingForm.setData(field, null);
        setLogoPreviews(prev => ({ ...prev, [field]: null }));
    };

    // Progress calculation
    const progress = useMemo(() => {
        return ((currentStepIndex + 1) / stepOrder.length) * 100;
    }, [currentStepIndex]);

    // Step icons
    const stepIcons = {
        welcome: Rocket,
        company: Building2,
        branding: Palette,
        team: Users,
        modules: Puzzle,
        complete: CheckCircle2,
    };

    // Navigation handlers
    const goToStep = (step, syncWithServer = false) => {
        setActiveStep(step);
        // Only sync with server when explicitly needed (e.g., manual step navigation)
        if (syncWithServer) {
            safePost('onboarding.step', { step }, { preserveState: true, preserveScroll: true });
        }
    };

    const nextStep = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < stepOrder.length) {
            // Just update local state - the step is already marked complete by the form submission
            setActiveStep(stepOrder[nextIndex]);
        }
    };

    const prevStep = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            goToStep(stepOrder[prevIndex]);
        }
    };

    // Form submit handlers
    const handleCompanySubmit = (e) => {
        e.preventDefault();
        companyForm.post(route('onboarding.company'), {
            preserveScroll: true,
            onSuccess: () => {
                showToast.success('Company information saved!');
                nextStep();
            },
        });
    };

    const handleBrandingSubmit = (e) => {
        e.preventDefault();
        brandingForm.post(route('onboarding.branding'), {
            preserveScroll: true,
            onSuccess: () => {
                showToast.success('Branding settings saved!');
                nextStep();
            },
        });
    };

    const handleTeamSubmit = (e) => {
        e.preventDefault();
        
        const validInvites = teamInvites.filter(inv => inv.email);
        console.log('Submitting team invitations:', validInvites);
        
        if (validInvites.length === 0) {
            showToast.info('No invitations to send. Skipping to next step.');
            nextStep();
            return;
        }
        
        safePost('onboarding.team', {
            invitations: validInvites,
        }, {
            preserveScroll: true,
            onSuccess: (page) => {
                console.log('Team submission success, page props:', page.props);
                
                // Check for flash messages
                const flash = page.props.flash || {};
                console.log('Flash messages:', flash);
                
                const emailResults = flash.email_results || [];
                const invitationErrors = flash.invitation_errors || [];
                
                // Track if we have any feedback to show
                let hasMessages = false;
                
                // Show individual results for sent emails
                emailResults.forEach(result => {
                    hasMessages = true;
                    if (result.sent) {
                        showToast.success(`Invitation sent to ${result.email}`);
                    } else {
                        showToast.error(`Failed to send invitation to ${result.email}`);
                    }
                });
                
                // Show skip/error messages for skipped invitations
                invitationErrors.forEach(error => {
                    hasMessages = true;
                    showToast.warning(error);
                });
                
                // Show summary message
                if (flash.success) {
                    showToast.info(flash.success);
                }
                
                // Delay moving to next step so user can see the toasts
                setTimeout(() => {
                    nextStep();
                }, hasMessages ? 1500 : 300);
            },
            onError: (errors) => {
                console.error('Team submission errors:', errors);
                Object.values(errors).flat().forEach(error => {
                    showToast.error(error);
                });
            },
        });
    };

    const handleModulesSubmit = (e) => {
        e.preventDefault();
        safePost('onboarding.modules', {
            enabled_modules: ['hr', 'project'], // Default modules
        }, {
            preserveScroll: true,
            onSuccess: () => {
                nextStep();
            },
        });
    };

    const handleComplete = () => {
        safePost('onboarding.complete', {}, {
            // Let Inertia handle the redirect from the backend
            onError: () => {
                showToast.error('Something went wrong. Please try again.');
            },
        });
    };

    const handleSkip = () => {
        safePost('onboarding.skip', {}, {
            // Let Inertia handle the redirect from the backend
            onError: () => {
                showToast.error('Something went wrong. Please try again.');
            },
        });
    };

    // Team invite handlers
    const addTeamInvite = () => {
        const defaultRole = roles.length > 0 ? roles[roles.length - 1].name : 'employee'; // Use last role (usually most basic)
        setTeamInvites([...teamInvites, { email: '', role: defaultRole }]);
    };

    const removeTeamInvite = (index) => {
        setTeamInvites(teamInvites.filter((_, i) => i !== index));
    };

    const updateTeamInvite = (index, field, value) => {
        const updated = [...teamInvites];
        updated[index][field] = value;
        setTeamInvites(updated);
    };

    // Animation variants
    const pageVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.4 } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
    };

    // Render step content
    const renderStepContent = () => {
        switch (activeStep) {
            case 'welcome':
                return (
                    <motion.div
                        key="welcome"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="text-center py-12"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                            <Rocket className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-4">
                            Welcome to {tenant?.name || 'Your Organization'}!
                        </h1>
                        <p className="text-lg text-default-500 mb-8 max-w-lg mx-auto">
                            Hi {user?.name}! Let's set up your workspace in just a few steps.
                            This will only take about 5 minutes.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Button
                                color="primary"
                                size="lg"
                                radius={themeRadius}
                                endContent={<ArrowRight className="w-5 h-5" />}
                                onPress={nextStep}
                            >
                                Let's Get Started
                            </Button>
                            <Button
                                variant="flat"
                                size="lg"
                                radius={themeRadius}
                                startContent={<SkipForward className="w-5 h-5" />}
                                onPress={handleSkip}
                            >
                                Skip for Now
                            </Button>
                        </div>
                    </motion.div>
                );

            case 'company':
                return (
                    <motion.div
                        key="company"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <form onSubmit={handleCompanySubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Company Name"
                                    placeholder="Acme Corporation"
                                    value={companyForm.data.company_name}
                                    onValueChange={(v) => companyForm.setData('company_name', v)}
                                    isRequired
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                    startContent={<Building2 className="w-4 h-4 text-default-400" />}
                                />
                                <Input
                                    label="Legal Name"
                                    placeholder="Acme Corp Ltd."
                                    value={companyForm.data.legal_name}
                                    onValueChange={(v) => companyForm.setData('legal_name', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                                <Input
                                    label="Tagline"
                                    placeholder="Making the world better"
                                    value={companyForm.data.tagline}
                                    onValueChange={(v) => companyForm.setData('tagline', v)}
                                    className="md:col-span-2"
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                                <Input
                                    label="Industry"
                                    placeholder="Technology"
                                    value={companyForm.data.industry}
                                    onValueChange={(v) => companyForm.setData('industry', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                                <Input
                                    label="Company Size"
                                    placeholder="10-50 employees"
                                    value={companyForm.data.company_size}
                                    onValueChange={(v) => companyForm.setData('company_size', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            </div>

                            <Divider />

                            <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Support Email"
                                    type="email"
                                    placeholder="support@company.com"
                                    value={companyForm.data.support_email}
                                    onValueChange={(v) => companyForm.setData('support_email', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                    startContent={<Mail className="w-4 h-4 text-default-400" />}
                                />
                                <Input
                                    label="Support Phone"
                                    placeholder="+1 (555) 123-4567"
                                    value={companyForm.data.support_phone}
                                    onValueChange={(v) => companyForm.setData('support_phone', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                    startContent={<Phone className="w-4 h-4 text-default-400" />}
                                />
                                <Input
                                    label="Website"
                                    placeholder="https://company.com"
                                    value={companyForm.data.website_url}
                                    onValueChange={(v) => companyForm.setData('website_url', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                    startContent={<Globe className="w-4 h-4 text-default-400" />}
                                />
                                <Input
                                    label="Timezone"
                                    placeholder="America/New_York"
                                    value={companyForm.data.timezone}
                                    onValueChange={(v) => companyForm.setData('timezone', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                    startContent={<Clock className="w-4 h-4 text-default-400" />}
                                />
                            </div>

                            <Divider />

                            <h3 className="text-lg font-semibold text-foreground">Address</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Address Line 1"
                                    placeholder="123 Main Street"
                                    value={companyForm.data.address_line1}
                                    onValueChange={(v) => companyForm.setData('address_line1', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                    startContent={<MapPin className="w-4 h-4 text-default-400" />}
                                />
                                <Input
                                    label="Address Line 2"
                                    placeholder="Suite 100"
                                    value={companyForm.data.address_line2}
                                    onValueChange={(v) => companyForm.setData('address_line2', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                                <Input
                                    label="City"
                                    placeholder="New York"
                                    value={companyForm.data.city}
                                    onValueChange={(v) => companyForm.setData('city', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                                <Input
                                    label="State/Province"
                                    placeholder="NY"
                                    value={companyForm.data.state}
                                    onValueChange={(v) => companyForm.setData('state', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                                <Input
                                    label="Postal Code"
                                    placeholder="10001"
                                    value={companyForm.data.postal_code}
                                    onValueChange={(v) => companyForm.setData('postal_code', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                                <Input
                                    label="Country"
                                    placeholder="United States"
                                    value={companyForm.data.country}
                                    onValueChange={(v) => companyForm.setData('country', v)}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            </div>

                            <div className="flex justify-between pt-6">
                                <Button
                                    variant="flat"
                                    radius={themeRadius}
                                    startContent={<ArrowLeft className="w-4 h-4" />}
                                    onPress={prevStep}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    radius={themeRadius}
                                    endContent={<ArrowRight className="w-4 h-4" />}
                                    isLoading={companyForm.processing}
                                >
                                    Save & Continue
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                );

            case 'branding':
                return (
                    <motion.div
                        key="branding"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <form onSubmit={handleBrandingSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-2 block">
                                        Primary Color
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={brandingForm.data.primary_color}
                                            onChange={(e) => brandingForm.setData('primary_color', e.target.value)}
                                            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-divider"
                                        />
                                        <Input
                                            value={brandingForm.data.primary_color}
                                            onValueChange={(v) => brandingForm.setData('primary_color', v)}
                                            size="sm"
                                            radius={themeRadius}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-2 block">
                                        Accent Color
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={brandingForm.data.accent_color}
                                            onChange={(e) => brandingForm.setData('accent_color', e.target.value)}
                                            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-divider"
                                        />
                                        <Input
                                            value={brandingForm.data.accent_color}
                                            onValueChange={(v) => brandingForm.setData('accent_color', v)}
                                            size="sm"
                                            radius={themeRadius}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Card
                                radius={themeRadius}
                                classNames={{
                                    base: "bg-default-100 border border-divider"
                                }}
                            >
                                <CardBody className="flex flex-row items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-foreground">Dark Mode</h4>
                                        <p className="text-sm text-default-500">Enable dark theme by default</p>
                                    </div>
                                    <Switch
                                        isSelected={isDarkMode}
                                        onValueChange={() => {
                                            toggleMode();
                                            brandingForm.setData('dark_mode', !isDarkMode);
                                        }}
                                    />
                                </CardBody>
                            </Card>

                            <Divider />

                            {/* Logo Upload Section */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Brand Assets</h3>
                                    <p className="text-sm text-default-500">
                                        Upload your organization's logos and favicon. All fields are required for consistent branding.
                                    </p>
                                </div>

                                {/* Theme-Aware Logos */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-default-700 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-primary" />
                                        Theme-Aware Logos
                                        <Chip size="sm" color="danger" variant="flat">Required</Chip>
                                    </h4>
                                    <p className="text-xs text-default-500">
                                        These logos automatically switch based on user's theme preference.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Logo Light */}
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="logo_light"
                                                accept="image/svg+xml,image/png,image/webp"
                                                className="hidden"
                                                onChange={(e) => handleLogoSelect('logo_light', e.target.files[0])}
                                            />
                                            <Card
                                                radius={themeRadius}
                                                classNames={{
                                                    base: `bg-white border-2 ${brandingForm.errors.logo_light ? 'border-danger' : logoPreviews.logo_light ? 'border-success' : 'border-dashed border-divider hover:border-primary'} transition-colors cursor-pointer`
                                                }}
                                                isPressable
                                                onPress={() => document.getElementById('logo_light').click()}
                                            >
                                                <CardBody className="flex flex-col items-center justify-center py-6 min-h-[140px]">
                                                    {logoPreviews.logo_light ? (
                                                        <>
                                                            <img 
                                                                src={logoPreviews.logo_light} 
                                                                alt="Light Logo Preview" 
                                                                className="max-h-16 max-w-full object-contain mb-2"
                                                            />
                                                            <p className="text-xs text-success">Logo uploaded</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-8 h-8 text-default-400 mb-2" />
                                                            <p className="text-sm font-medium text-foreground">Light Mode Logo</p>
                                                            <p className="text-xs text-default-400">200x50px recommended</p>
                                                        </>
                                                    )}
                                                </CardBody>
                                            </Card>
                                            {logoPreviews.logo_light && (
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    color="danger"
                                                    variant="flat"
                                                    className="absolute -top-2 -right-2 z-10"
                                                    onPress={() => handleLogoRemove('logo_light')}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {brandingForm.errors.logo_light && (
                                                <p className="text-xs text-danger mt-1">{brandingForm.errors.logo_light}</p>
                                            )}
                                        </div>

                                        {/* Logo Dark */}
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="logo_dark"
                                                accept="image/svg+xml,image/png,image/webp"
                                                className="hidden"
                                                onChange={(e) => handleLogoSelect('logo_dark', e.target.files[0])}
                                            />
                                            <Card
                                                radius={themeRadius}
                                                classNames={{
                                                    base: `bg-gray-800 border-2 ${brandingForm.errors.logo_dark ? 'border-danger' : logoPreviews.logo_dark ? 'border-success' : 'border-dashed border-divider hover:border-primary'} transition-colors cursor-pointer`
                                                }}
                                                isPressable
                                                onPress={() => document.getElementById('logo_dark').click()}
                                            >
                                                <CardBody className="flex flex-col items-center justify-center py-6 min-h-[140px]">
                                                    {logoPreviews.logo_dark ? (
                                                        <>
                                                            <img 
                                                                src={logoPreviews.logo_dark} 
                                                                alt="Dark Logo Preview" 
                                                                className="max-h-16 max-w-full object-contain mb-2"
                                                            />
                                                            <p className="text-xs text-success">Logo uploaded</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                            <p className="text-sm font-medium text-white">Dark Mode Logo</p>
                                                            <p className="text-xs text-gray-400">200x50px recommended</p>
                                                        </>
                                                    )}
                                                </CardBody>
                                            </Card>
                                            {logoPreviews.logo_dark && (
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    color="danger"
                                                    variant="flat"
                                                    className="absolute -top-2 -right-2 z-10"
                                                    onPress={() => handleLogoRemove('logo_dark')}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {brandingForm.errors.logo_dark && (
                                                <p className="text-xs text-danger mt-1">{brandingForm.errors.logo_dark}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Logos */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-default-700 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-secondary" />
                                        Additional Brand Assets
                                        <Chip size="sm" color="danger" variant="flat">Required</Chip>
                                    </h4>
                                    <p className="text-xs text-default-500">
                                        Square logo for mobile apps, horizontal logo for documents, and favicon for browser tabs.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Square Logo */}
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="square_logo"
                                                accept="image/svg+xml,image/png,image/webp"
                                                className="hidden"
                                                onChange={(e) => handleLogoSelect('square_logo', e.target.files[0])}
                                            />
                                            <Card
                                                radius={themeRadius}
                                                classNames={{
                                                    base: `bg-default-100 border-2 ${brandingForm.errors.square_logo ? 'border-danger' : logoPreviews.square_logo ? 'border-success' : 'border-dashed border-divider hover:border-primary'} transition-colors cursor-pointer`
                                                }}
                                                isPressable
                                                onPress={() => document.getElementById('square_logo').click()}
                                            >
                                                <CardBody className="flex flex-col items-center justify-center py-6 min-h-[140px]">
                                                    {logoPreviews.square_logo ? (
                                                        <>
                                                            <img 
                                                                src={logoPreviews.square_logo} 
                                                                alt="Square Logo Preview" 
                                                                className="w-16 h-16 object-contain mb-2"
                                                            />
                                                            <p className="text-xs text-success">Logo uploaded</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-12 h-12 border-2 border-dashed border-default-300 rounded-lg flex items-center justify-center mb-2">
                                                                <Upload className="w-6 h-6 text-default-400" />
                                                            </div>
                                                            <p className="text-sm font-medium text-foreground">Square Logo</p>
                                                            <p className="text-xs text-default-400">100x100px recommended</p>
                                                        </>
                                                    )}
                                                </CardBody>
                                            </Card>
                                            {logoPreviews.square_logo && (
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    color="danger"
                                                    variant="flat"
                                                    className="absolute -top-2 -right-2 z-10"
                                                    onPress={() => handleLogoRemove('square_logo')}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {brandingForm.errors.square_logo && (
                                                <p className="text-xs text-danger mt-1">{brandingForm.errors.square_logo}</p>
                                            )}
                                        </div>

                                        {/* Horizontal Logo */}
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="logo"
                                                accept="image/svg+xml,image/png,image/webp"
                                                className="hidden"
                                                onChange={(e) => handleLogoSelect('logo', e.target.files[0])}
                                            />
                                            <Card
                                                radius={themeRadius}
                                                classNames={{
                                                    base: `bg-default-100 border-2 ${brandingForm.errors.logo ? 'border-danger' : logoPreviews.logo ? 'border-success' : 'border-dashed border-divider hover:border-primary'} transition-colors cursor-pointer`
                                                }}
                                                isPressable
                                                onPress={() => document.getElementById('logo').click()}
                                            >
                                                <CardBody className="flex flex-col items-center justify-center py-6 min-h-[140px]">
                                                    {logoPreviews.logo ? (
                                                        <>
                                                            <img 
                                                                src={logoPreviews.logo} 
                                                                alt="Horizontal Logo Preview" 
                                                                className="max-h-12 max-w-full object-contain mb-2"
                                                            />
                                                            <p className="text-xs text-success">Logo uploaded</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-20 h-10 border-2 border-dashed border-default-300 rounded-lg flex items-center justify-center mb-2">
                                                                <Upload className="w-5 h-5 text-default-400" />
                                                            </div>
                                                            <p className="text-sm font-medium text-foreground">Horizontal Logo</p>
                                                            <p className="text-xs text-default-400">200x50px recommended</p>
                                                        </>
                                                    )}
                                                </CardBody>
                                            </Card>
                                            {logoPreviews.logo && (
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    color="danger"
                                                    variant="flat"
                                                    className="absolute -top-2 -right-2 z-10"
                                                    onPress={() => handleLogoRemove('logo')}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {brandingForm.errors.logo && (
                                                <p className="text-xs text-danger mt-1">{brandingForm.errors.logo}</p>
                                            )}
                                        </div>

                                        {/* Favicon */}
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="favicon"
                                                accept="image/x-icon,image/svg+xml,image/png,image/webp"
                                                className="hidden"
                                                onChange={(e) => handleLogoSelect('favicon', e.target.files[0])}
                                            />
                                            <Card
                                                radius={themeRadius}
                                                classNames={{
                                                    base: `bg-default-100 border-2 ${brandingForm.errors.favicon ? 'border-danger' : logoPreviews.favicon ? 'border-success' : 'border-dashed border-divider hover:border-primary'} transition-colors cursor-pointer`
                                                }}
                                                isPressable
                                                onPress={() => document.getElementById('favicon').click()}
                                            >
                                                <CardBody className="flex flex-col items-center justify-center py-6 min-h-[140px]">
                                                    {logoPreviews.favicon ? (
                                                        <>
                                                            <img 
                                                                src={logoPreviews.favicon} 
                                                                alt="Favicon Preview" 
                                                                className="w-8 h-8 object-contain mb-2"
                                                            />
                                                            <p className="text-xs text-success">Favicon uploaded</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-8 h-8 border-2 border-dashed border-default-300 rounded flex items-center justify-center mb-2">
                                                                <Upload className="w-4 h-4 text-default-400" />
                                                            </div>
                                                            <p className="text-sm font-medium text-foreground">Favicon</p>
                                                            <p className="text-xs text-default-400">32x32px or 64x64px</p>
                                                        </>
                                                    )}
                                                </CardBody>
                                            </Card>
                                            {logoPreviews.favicon && (
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    color="danger"
                                                    variant="flat"
                                                    className="absolute -top-2 -right-2 z-10"
                                                    onPress={() => handleLogoRemove('favicon')}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {brandingForm.errors.favicon && (
                                                <p className="text-xs text-danger mt-1">{brandingForm.errors.favicon}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Tips */}
                                <Card radius={themeRadius} classNames={{ base: "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800" }}>
                                    <CardBody className="py-3">
                                        <div className="flex items-start gap-3">
                                            <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                                            <div className="text-xs text-primary-700 dark:text-primary-300 space-y-1">
                                                <p className="font-medium">Pro Tips:</p>
                                                <ul className="list-disc list-inside space-y-0.5">
                                                    <li>Use SVG format for crisp logos at any size</li>
                                                    <li>Light logo should have dark text/elements for light backgrounds</li>
                                                    <li>Dark logo should have light text/elements for dark backgrounds</li>
                                                    <li>Square logo is used in mobile navigation and app icons</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>

                            <div className="flex justify-between pt-6">
                                <Button
                                    variant="flat"
                                    radius={themeRadius}
                                    startContent={<ArrowLeft className="w-4 h-4" />}
                                    onPress={prevStep}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    radius={themeRadius}
                                    endContent={<ArrowRight className="w-4 h-4" />}
                                    isLoading={brandingForm.processing}
                                >
                                    Save & Continue
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                );

            case 'team':
                return (
                    <motion.div
                        key="team"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <form onSubmit={handleTeamSubmit} className="space-y-6">
                            <p className="text-default-500">
                                Invite your team members to join the platform. They'll receive an email invitation.
                            </p>

                            <div className="space-y-3">
                                {teamInvites.map((invite, index) => (
                                    <div key={index} className="flex gap-3 items-start">
                                        <Input
                                            placeholder="email@example.com"
                                            type="email"
                                            value={invite.email}
                                            onValueChange={(v) => updateTeamInvite(index, 'email', v)}
                                            startContent={<Mail className="w-4 h-4 text-default-400" />}
                                            radius={themeRadius}
                                            classNames={{ inputWrapper: "bg-default-100" }}
                                            className="flex-1"
                                        />
                                        <Select
                                            selectedKeys={[invite.role]}
                                            onSelectionChange={(keys) => updateTeamInvite(index, 'role', Array.from(keys)[0])}
                                            radius={themeRadius}
                                            classNames={{ trigger: "bg-default-100" }}
                                            className="w-40"
                                            aria-label="Select role"
                                        >
                                            {roles.map((role) => (
                                                <SelectItem key={role.name} textValue={role.name}>
                                                    <span className="capitalize">{role.name.replace(/-/g, ' ')}</span>
                                                </SelectItem>
                                            ))}
                                        </Select>
                                        {teamInvites.length > 1 && (
                                            <Button
                                                isIconOnly
                                                variant="flat"
                                                color="danger"
                                                radius={themeRadius}
                                                onPress={() => removeTeamInvite(index)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant="flat"
                                radius={themeRadius}
                                startContent={<Plus className="w-4 h-4" />}
                                onPress={addTeamInvite}
                            >
                                Add Another
                            </Button>

                            <div className="flex justify-between pt-6">
                                <Button
                                    variant="flat"
                                    radius={themeRadius}
                                    startContent={<ArrowLeft className="w-4 h-4" />}
                                    onPress={prevStep}
                                >
                                    Back
                                </Button>
                                <div className="flex gap-3">
                                    <Button
                                        variant="flat"
                                        radius={themeRadius}
                                        onPress={nextStep}
                                    >
                                        Skip
                                    </Button>
                                    <Button
                                        type="submit"
                                        color="primary"
                                        radius={themeRadius}
                                        endContent={<ArrowRight className="w-4 h-4" />}
                                    >
                                        Send Invites & Continue
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                );

            case 'modules':
                return (
                    <motion.div
                        key="modules"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <form onSubmit={handleModulesSubmit} className="space-y-6">
                            <p className="text-default-500">
                                These modules are included in your plan. You can enable or disable them anytime.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'hr', name: 'HR Management', description: 'Employee management, leaves, attendance', icon: Users },
                                    { id: 'project', name: 'Project Management', description: 'Tasks, projects, timelines', icon: Puzzle },
                                    { id: 'dms', name: 'Document Management', description: 'File storage and sharing', icon: Building2 },
                                    { id: 'crm', name: 'CRM', description: 'Customer relationship management', icon: Users },
                                ].map((module) => (
                                    <Card
                                        key={module.id}
                                        className="transition-all duration-200"
                                        style={{
                                            border: `var(--borderWidth, 2px) solid transparent`,
                                            borderRadius: `var(--borderRadius, 12px)`,
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                            background: `linear-gradient(135deg, 
                                                var(--theme-content1, #FAFAFA) 20%, 
                                                var(--theme-content2, #F4F4F5) 10%, 
                                                var(--theme-content3, #F1F3F4) 20%)`,
                                        }}
                                    >
                                        <CardBody className="flex flex-row items-center gap-4">
                                            <div className="p-3 rounded-lg bg-primary/10">
                                                <module.icon className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-foreground">{module.name}</h4>
                                                <p className="text-sm text-default-500">{module.description}</p>
                                            </div>
                                            <Switch defaultSelected />
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>

                            <div className="flex justify-between pt-6">
                                <Button
                                    variant="flat"
                                    radius={themeRadius}
                                    startContent={<ArrowLeft className="w-4 h-4" />}
                                    onPress={prevStep}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    radius={themeRadius}
                                    endContent={<ArrowRight className="w-4 h-4" />}
                                >
                                    Continue
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                );

            case 'complete':
                return (
                    <motion.div
                        key="complete"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="text-center py-12"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
                            <CheckCircle2 className="w-10 h-10 text-success" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-4">
                            You're All Set!
                        </h1>
                        <p className="text-lg text-default-500 mb-8 max-w-lg mx-auto">
                            Your organization is ready to go. You can always adjust these settings later.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button
                                color="primary"
                                size="lg"
                                radius={themeRadius}
                                endContent={<Sparkles className="w-5 h-5" />}
                                onPress={handleComplete}
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <Head title={title || 'Setup Your Organization'} />

            <div className="min-h-screen bg-gradient-to-br from-background to-default-100">
                {/* Header */}
                <div className="border-b border-divider bg-content1/80 backdrop-blur-lg sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    name={tenant?.name || 'O'}
                                    className="bg-primary text-primary-foreground"
                                    radius={themeRadius}
                                />
                                <div>
                                    <h2 className="font-semibold text-foreground">{tenant?.name}</h2>
                                    <p className="text-sm text-default-500">Organization Setup</p>
                                </div>
                            </div>
                            <Button
                                variant="flat"
                                size="sm"
                                radius={themeRadius}
                                onPress={handleSkip}
                            >
                                Skip Setup
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Progress */}
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <Progress
                        value={progress}
                        color="primary"
                        size="sm"
                        radius={themeRadius}
                        classNames={{
                            track: "bg-default-100",
                            indicator: "bg-primary"
                        }}
                        className="mb-4"
                    />
                    <div className="flex justify-between">
                        {stepOrder.map((step, index) => {
                            const Icon = stepIcons[step];
                            const isActive = step === activeStep;
                            const isCompleted = completedSteps?.includes(step) || index < currentStepIndex;

                            return (
                                <button
                                    key={step}
                                    onClick={() => goToStep(step)}
                                    className={`flex flex-col items-center gap-1 transition-colors ${
                                        isActive
                                            ? 'text-primary'
                                            : isCompleted
                                            ? 'text-success'
                                            : 'text-default-400'
                                    }`}
                                >
                                    <div className={`p-2 rounded-lg ${
                                        isActive
                                            ? 'bg-primary/10'
                                            : isCompleted
                                            ? 'bg-success/10'
                                            : 'bg-default-100'
                                    }`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-medium hidden sm:block">
                                        {steps[step]?.title || step}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto px-4 pb-12">
                    <Card
                        className="transition-all duration-200"
                        style={{
                            border: `var(--borderWidth, 2px) solid transparent`,
                            borderRadius: `var(--borderRadius, 12px)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                            transform: `scale(var(--scale, 1))`,
                            background: `linear-gradient(135deg, 
                                var(--theme-content1, #FAFAFA) 20%, 
                                var(--theme-content2, #F4F4F5) 10%, 
                                var(--theme-content3, #F1F3F4) 20%)`,
                        }}
                    >
                        <CardHeader 
                            className="flex-col items-start gap-1 px-6 pt-6"
                            style={{
                                borderBottom: `1px solid var(--theme-divider, #E4E4E7)`,
                            }}
                        >
                            <h2 className="text-2xl font-bold text-foreground">
                                {steps[activeStep]?.title}
                            </h2>
                            <p className="text-default-500">
                                {steps[activeStep]?.description}
                            </p>
                        </CardHeader>
                        <CardBody className="px-6 pb-6">
                            <AnimatePresence mode="wait">
                                {renderStepContent()}
                            </AnimatePresence>
                        </CardBody>
                    </Card>
                </div>
            </div>
            
            {/* Toast Container for notifications */}
            <ToastContainer
                position="top-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                toastStyle={toastStyles.base}
            />
        </>
    );
}
