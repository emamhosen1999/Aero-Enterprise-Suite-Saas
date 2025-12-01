import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
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
import { showToast } from '@/utils/toastUtils';

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
}) {
    const [activeStep, setActiveStep] = useState(currentStep || 'welcome');
    const [teamInvites, setTeamInvites] = useState([{ email: '', role: 'employee' }]);

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
        favicon: null,
    });

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
    const goToStep = (step) => {
        setActiveStep(step);
        router.post(route('onboarding.step'), { step }, { preserveState: true });
    };

    const nextStep = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < stepOrder.length) {
            goToStep(stepOrder[nextIndex]);
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
                showToast('success', 'Company information saved!');
                nextStep();
            },
        });
    };

    const handleBrandingSubmit = (e) => {
        e.preventDefault();
        brandingForm.post(route('onboarding.branding'), {
            preserveScroll: true,
            onSuccess: () => {
                showToast('success', 'Branding settings saved!');
                nextStep();
            },
        });
    };

    const handleTeamSubmit = (e) => {
        e.preventDefault();
        router.post(route('onboarding.team'), {
            invitations: teamInvites.filter(inv => inv.email),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                showToast('success', 'Team invitations sent!');
                nextStep();
            },
        });
    };

    const handleModulesSubmit = (e) => {
        e.preventDefault();
        router.post(route('onboarding.modules'), {
            enabled_modules: ['hr', 'project'], // Default modules
        }, {
            preserveScroll: true,
            onSuccess: () => {
                nextStep();
            },
        });
    };

    const handleComplete = () => {
        router.post(route('onboarding.complete'), {}, {
            onSuccess: () => {
                showToast('success', 'Welcome! Your organization is all set up.');
            },
        });
    };

    const handleSkip = () => {
        router.post(route('onboarding.skip'), {}, {
            onSuccess: () => {
                showToast('info', 'You can complete the setup later in Settings.');
            },
        });
    };

    // Team invite handlers
    const addTeamInvite = () => {
        setTeamInvites([...teamInvites, { email: '', role: 'employee' }]);
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
                                endContent={<ArrowRight className="w-5 h-5" />}
                                onPress={nextStep}
                            >
                                Let's Get Started
                            </Button>
                            <Button
                                variant="ghost"
                                size="lg"
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
                                    startContent={<Building2 className="w-4 h-4 text-default-400" />}
                                />
                                <Input
                                    label="Legal Name"
                                    placeholder="Acme Corp Ltd."
                                    value={companyForm.data.legal_name}
                                    onValueChange={(v) => companyForm.setData('legal_name', v)}
                                />
                                <Input
                                    label="Tagline"
                                    placeholder="Making the world better"
                                    value={companyForm.data.tagline}
                                    onValueChange={(v) => companyForm.setData('tagline', v)}
                                    className="md:col-span-2"
                                />
                                <Input
                                    label="Industry"
                                    placeholder="Technology"
                                    value={companyForm.data.industry}
                                    onValueChange={(v) => companyForm.setData('industry', v)}
                                />
                                <Input
                                    label="Company Size"
                                    placeholder="10-50 employees"
                                    value={companyForm.data.company_size}
                                    onValueChange={(v) => companyForm.setData('company_size', v)}
                                />
                            </div>

                            <Divider />

                            <h3 className="text-lg font-semibold">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Support Email"
                                    type="email"
                                    placeholder="support@company.com"
                                    value={companyForm.data.support_email}
                                    onValueChange={(v) => companyForm.setData('support_email', v)}
                                    startContent={<Mail className="w-4 h-4 text-default-400" />}
                                />
                                <Input
                                    label="Support Phone"
                                    placeholder="+1 (555) 123-4567"
                                    value={companyForm.data.support_phone}
                                    onValueChange={(v) => companyForm.setData('support_phone', v)}
                                    startContent={<Phone className="w-4 h-4 text-default-400" />}
                                />
                                <Input
                                    label="Website"
                                    placeholder="https://company.com"
                                    value={companyForm.data.website_url}
                                    onValueChange={(v) => companyForm.setData('website_url', v)}
                                    startContent={<Globe className="w-4 h-4 text-default-400" />}
                                />
                                <Input
                                    label="Timezone"
                                    placeholder="America/New_York"
                                    value={companyForm.data.timezone}
                                    onValueChange={(v) => companyForm.setData('timezone', v)}
                                    startContent={<Clock className="w-4 h-4 text-default-400" />}
                                />
                            </div>

                            <Divider />

                            <h3 className="text-lg font-semibold">Address</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Address Line 1"
                                    placeholder="123 Main Street"
                                    value={companyForm.data.address_line1}
                                    onValueChange={(v) => companyForm.setData('address_line1', v)}
                                    startContent={<MapPin className="w-4 h-4 text-default-400" />}
                                />
                                <Input
                                    label="Address Line 2"
                                    placeholder="Suite 100"
                                    value={companyForm.data.address_line2}
                                    onValueChange={(v) => companyForm.setData('address_line2', v)}
                                />
                                <Input
                                    label="City"
                                    placeholder="New York"
                                    value={companyForm.data.city}
                                    onValueChange={(v) => companyForm.setData('city', v)}
                                />
                                <Input
                                    label="State/Province"
                                    placeholder="NY"
                                    value={companyForm.data.state}
                                    onValueChange={(v) => companyForm.setData('state', v)}
                                />
                                <Input
                                    label="Postal Code"
                                    placeholder="10001"
                                    value={companyForm.data.postal_code}
                                    onValueChange={(v) => companyForm.setData('postal_code', v)}
                                />
                                <Input
                                    label="Country"
                                    placeholder="United States"
                                    value={companyForm.data.country}
                                    onValueChange={(v) => companyForm.setData('country', v)}
                                />
                            </div>

                            <div className="flex justify-between pt-6">
                                <Button
                                    variant="ghost"
                                    startContent={<ArrowLeft className="w-4 h-4" />}
                                    onPress={prevStep}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
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
                                            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-default-200"
                                        />
                                        <Input
                                            value={brandingForm.data.primary_color}
                                            onValueChange={(v) => brandingForm.setData('primary_color', v)}
                                            size="sm"
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
                                            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-default-200"
                                        />
                                        <Input
                                            value={brandingForm.data.accent_color}
                                            onValueChange={(v) => brandingForm.setData('accent_color', v)}
                                            size="sm"
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-default-100">
                                <div>
                                    <h4 className="font-medium">Dark Mode</h4>
                                    <p className="text-sm text-default-500">Enable dark theme by default</p>
                                </div>
                                <Switch
                                    isSelected={brandingForm.data.dark_mode}
                                    onValueChange={(v) => brandingForm.setData('dark_mode', v)}
                                />
                            </div>

                            <Divider />

                            <h3 className="text-lg font-semibold">Logo Upload</h3>
                            <p className="text-sm text-default-500 mb-4">
                                You can skip this for now and add logos later in Settings.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="border-2 border-dashed border-default-200 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                                    <Upload className="w-8 h-8 mx-auto text-default-400 mb-2" />
                                    <p className="text-sm text-default-500">Light Logo</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => brandingForm.setData('logo_light', e.target.files[0])}
                                    />
                                </div>
                                <div className="border-2 border-dashed border-default-200 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                                    <Upload className="w-8 h-8 mx-auto text-default-400 mb-2" />
                                    <p className="text-sm text-default-500">Dark Logo</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => brandingForm.setData('logo_dark', e.target.files[0])}
                                    />
                                </div>
                                <div className="border-2 border-dashed border-default-200 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                                    <Upload className="w-8 h-8 mx-auto text-default-400 mb-2" />
                                    <p className="text-sm text-default-500">Favicon</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => brandingForm.setData('favicon', e.target.files[0])}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between pt-6">
                                <Button
                                    variant="ghost"
                                    startContent={<ArrowLeft className="w-4 h-4" />}
                                    onPress={prevStep}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
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
                                            className="flex-1"
                                        />
                                        <select
                                            value={invite.role}
                                            onChange={(e) => updateTeamInvite(index, 'role', e.target.value)}
                                            className="px-3 py-2 rounded-lg border border-default-200 bg-default-100 text-sm"
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="manager">Manager</option>
                                            <option value="employee">Employee</option>
                                        </select>
                                        {teamInvites.length > 1 && (
                                            <Button
                                                isIconOnly
                                                variant="ghost"
                                                color="danger"
                                                onPress={() => removeTeamInvite(index)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant="ghost"
                                startContent={<Plus className="w-4 h-4" />}
                                onPress={addTeamInvite}
                            >
                                Add Another
                            </Button>

                            <div className="flex justify-between pt-6">
                                <Button
                                    variant="ghost"
                                    startContent={<ArrowLeft className="w-4 h-4" />}
                                    onPress={prevStep}
                                >
                                    Back
                                </Button>
                                <div className="flex gap-3">
                                    <Button
                                        variant="ghost"
                                        onPress={nextStep}
                                    >
                                        Skip
                                    </Button>
                                    <Button
                                        type="submit"
                                        color="primary"
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
                                    <Card key={module.id} className="border border-default-200">
                                        <CardBody className="flex flex-row items-center gap-4">
                                            <div className="p-3 rounded-lg bg-primary/10">
                                                <module.icon className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium">{module.name}</h4>
                                                <p className="text-sm text-default-500">{module.description}</p>
                                            </div>
                                            <Switch defaultSelected />
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>

                            <div className="flex justify-between pt-6">
                                <Button
                                    variant="ghost"
                                    startContent={<ArrowLeft className="w-4 h-4" />}
                                    onPress={prevStep}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
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
                <div className="border-b border-default-200 bg-background/80 backdrop-blur-lg sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    name={tenant?.name || 'O'}
                                    className="bg-primary text-primary-foreground"
                                />
                                <div>
                                    <h2 className="font-semibold text-foreground">{tenant?.name}</h2>
                                    <p className="text-sm text-default-500">Organization Setup</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
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
                        className="mb-2"
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
                                    <div className={`p-2 rounded-full ${
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
                    <Card className="shadow-lg">
                        <CardHeader className="flex-col items-start gap-1 px-6 pt-6">
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
        </>
    );
}
