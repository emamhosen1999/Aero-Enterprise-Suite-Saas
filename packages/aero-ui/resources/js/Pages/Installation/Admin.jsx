import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UnifiedInstallationLayout from '@/Layouts/UnifiedInstallationLayout';
import { 
    Card, 
    CardHeader, 
    CardBody, 
    CardFooter, 
    Button, 
    Input,
    Avatar,
    Divider,
    Chip
} from '@heroui/react';
import { 
    UserCircleIcon, 
    ArrowRightIcon, 
    ArrowLeftIcon,
    EyeIcon,
    EyeSlashIcon,
    CheckIcon,
    XMarkIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

/**
 * Admin Account Creation Page
 * 
 * Creates the initial admin/superuser account
 * Same UI for both SaaS and Standalone modes
 */
export default function Admin() {
    const { 
        mode = 'standalone',
        savedAdmin = null
    } = usePage().props;

    // Current step depends on mode
    const currentStep = mode === 'saas' ? 5 : 6;

    const [themeRadius, setThemeRadius] = useState('lg');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        first_name: savedAdmin?.first_name || '',
        last_name: savedAdmin?.last_name || '',
        email: savedAdmin?.email || '',
        password: '',
        password_confirmation: '',
    });

    // Password strength indicator
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

    useEffect(() => {
        const themeRadius = useThemeRadius();
        setThemeRadius(themeRadius);
    }, []);

    // Calculate password strength
    useEffect(() => {
        const password = formData.password;
        let score = 0;
        
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        const strengths = [
            { score: 0, label: '', color: 'default' },
            { score: 1, label: 'Very Weak', color: 'danger' },
            { score: 2, label: 'Weak', color: 'warning' },
            { score: 3, label: 'Fair', color: 'primary' },
            { score: 4, label: 'Strong', color: 'success' },
            { score: 5, label: 'Very Strong', color: 'success' },
        ];

        setPasswordStrength(strengths[score] || strengths[0]);
    }, [formData.password]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: null }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.first_name?.trim()) {
            newErrors.first_name = 'First name is required';
        }

        if (!formData.last_name?.trim()) {
            newErrors.last_name = 'Last name is required';
        }

        if (!formData.email?.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!formData.password_confirmation) {
            newErrors.password_confirmation = 'Please confirm your password';
        } else if (formData.password !== formData.password_confirmation) {
            newErrors.password_confirmation = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = async () => {
        if (!validateForm()) {
            showToast.warning('Please fill in all required fields correctly');
            return;
        }

        setSaving(true);
        try {
            const response = await axios.post('/install/save-admin', formData);

            if (response.data.success) {
                router.visit('/install/review');
            } else {
                showToast.error(response.data.message || 'Failed to save admin account');
            }
        } catch (error) {
            const errorData = error.response?.data;
            if (errorData?.errors) {
                setErrors(errorData.errors);
            } else {
                showToast.error(errorData?.message || 'Failed to save admin account');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        router.visit('/install/settings');
    };

    const getPasswordRequirement = (met, text) => (
        <div className="flex items-center gap-2 text-sm">
            {met ? (
                <CheckIcon className="w-4 h-4 text-success" />
            ) : (
                <XMarkIcon className="w-4 h-4 text-default-400" />
            )}
            <span className={met ? 'text-success' : 'text-default-500'}>{text}</span>
        </div>
    );

    const accountLabel = mode === 'saas' ? 'Platform Administrator' : 'Super Administrator';

    return (
        <UnifiedInstallationLayout currentStep={currentStep} mode={mode}>
            <Head title="Installation - Admin Account" />
            
            <Card 
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
                <CardHeader className="flex flex-col items-center gap-4 pt-8 pb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <UserCircleIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            Create Admin Account
                        </h1>
                        <p className="text-default-600">
                            Set up your {accountLabel} account
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 pb-6">
                    {/* Account Role Badge */}
                    <div className="flex justify-center mb-6">
                        <Chip
                            startContent={<ShieldCheckIcon className="w-4 h-4" />}
                            color="primary"
                            variant="flat"
                            size="lg"
                        >
                            {accountLabel}
                        </Chip>
                    </div>

                    {/* Preview Avatar */}
                    <div className="flex flex-col items-center mb-6">
                        <Avatar
                            name={`${formData.first_name} ${formData.last_name}`}
                            size="lg"
                            className="w-20 h-20 text-xl"
                            color="primary"
                        />
                        {(formData.first_name || formData.last_name) && (
                            <p className="mt-2 font-medium text-foreground">
                                {formData.first_name} {formData.last_name}
                            </p>
                        )}
                        {formData.email && (
                            <p className="text-sm text-default-500">{formData.email}</p>
                        )}
                    </div>

                    <Divider className="my-4" />

                    {/* Form Fields */}
                    <div className="space-y-4 max-w-md mx-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="First Name"
                                placeholder="John"
                                value={formData.first_name}
                                onValueChange={(v) => handleChange('first_name', v)}
                                isInvalid={!!errors.first_name}
                                errorMessage={errors.first_name}
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                            <Input
                                label="Last Name"
                                placeholder="Doe"
                                value={formData.last_name}
                                onValueChange={(v) => handleChange('last_name', v)}
                                isInvalid={!!errors.last_name}
                                errorMessage={errors.last_name}
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                        </div>

                        <Input
                            type="email"
                            label="Email Address"
                            placeholder="admin@example.com"
                            value={formData.email}
                            onValueChange={(v) => handleChange('email', v)}
                            isInvalid={!!errors.email}
                            errorMessage={errors.email}
                            isRequired
                            radius={themeRadius}
                            classNames={{ inputWrapper: "bg-default-100" }}
                            description="This will be used to log in"
                        />

                        <Input
                            type={showPassword ? 'text' : 'password'}
                            label="Password"
                            placeholder="Create a strong password"
                            value={formData.password}
                            onValueChange={(v) => handleChange('password', v)}
                            isInvalid={!!errors.password}
                            errorMessage={errors.password}
                            isRequired
                            radius={themeRadius}
                            classNames={{ inputWrapper: "bg-default-100" }}
                            endContent={
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="w-5 h-5 text-default-400" />
                                    ) : (
                                        <EyeIcon className="w-5 h-5 text-default-400" />
                                    )}
                                </button>
                            }
                        />

                        {/* Password Strength Indicator */}
                        {formData.password && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-default-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-300 bg-${passwordStrength.color}`}
                                            style={{ 
                                                width: `${(passwordStrength.score / 5) * 100}%`,
                                                backgroundColor: passwordStrength.color === 'danger' ? '#f31260' :
                                                    passwordStrength.color === 'warning' ? '#f5a524' :
                                                    passwordStrength.color === 'primary' ? '#006FEE' :
                                                    passwordStrength.color === 'success' ? '#17c964' : '#d4d4d8'
                                            }}
                                        />
                                    </div>
                                    <span className={`text-xs text-${passwordStrength.color}`}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {getPasswordRequirement(formData.password.length >= 8, 'At least 8 characters')}
                                    {getPasswordRequirement(/[A-Z]/.test(formData.password), 'Uppercase letter')}
                                    {getPasswordRequirement(/[a-z]/.test(formData.password), 'Lowercase letter')}
                                    {getPasswordRequirement(/\d/.test(formData.password), 'Number')}
                                    {getPasswordRequirement(/[^a-zA-Z0-9]/.test(formData.password), 'Special character')}
                                </div>
                            </div>
                        )}

                        <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            label="Confirm Password"
                            placeholder="Confirm your password"
                            value={formData.password_confirmation}
                            onValueChange={(v) => handleChange('password_confirmation', v)}
                            isInvalid={!!errors.password_confirmation}
                            errorMessage={errors.password_confirmation}
                            isRequired
                            radius={themeRadius}
                            classNames={{ inputWrapper: "bg-default-100" }}
                            endContent={
                                <button 
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="focus:outline-none"
                                >
                                    {showConfirmPassword ? (
                                        <EyeSlashIcon className="w-5 h-5 text-default-400" />
                                    ) : (
                                        <EyeIcon className="w-5 h-5 text-default-400" />
                                    )}
                                </button>
                            }
                        />

                        {/* Passwords match indicator */}
                        {formData.password && formData.password_confirmation && (
                            <div className="flex items-center gap-2 text-sm">
                                {formData.password === formData.password_confirmation ? (
                                    <>
                                        <CheckIcon className="w-4 h-4 text-success" />
                                        <span className="text-success">Passwords match</span>
                                    </>
                                ) : (
                                    <>
                                        <XMarkIcon className="w-4 h-4 text-danger" />
                                        <span className="text-danger">Passwords do not match</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </CardBody>

                <CardFooter className="px-8 pb-8 pt-4 border-t border-divider">
                    <div className="w-full flex justify-between">
                        <Button
                            variant="flat"
                            startContent={<ArrowLeftIcon className="w-4 h-4" />}
                            onPress={handleBack}
                        >
                            Back
                        </Button>
                        <Button
                            color="primary"
                            size="lg"
                            endContent={<ArrowRightIcon className="w-5 h-5" />}
                            onPress={handleNext}
                            isLoading={saving}
                        >
                            {saving ? 'Saving...' : 'Continue'}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </UnifiedInstallationLayout>
    );
}