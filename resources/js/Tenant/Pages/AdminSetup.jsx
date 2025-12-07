import React, { useEffect, useState, useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { 
    Button, 
    Input, 
    Card, 
    CardHeader, 
    CardBody, 
    CardFooter,
    Chip,
    Progress
} from '@heroui/react';
import { 
    UserIcon, 
    EnvelopeIcon, 
    LockClosedIcon, 
    BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';

/**
 * AdminSetup - Create initial admin user for newly provisioned tenant
 * 
 * This page is shown after a tenant has been provisioned but before
 * they have an admin user. It's the final step of tenant registration.
 * 
 * The admin can use any email/phone - no verification is required.
 * The company email/phone verification (done during registration) is separate.
 */
export default function AdminSetup({ 
    title = 'Complete Your Account Setup',
    tenant = {},
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        user_name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    // Auto-generate username from email
    useEffect(() => {
        if (data.email && !data.user_name) {
            const generatedUsername = data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
            setData('user_name', generatedUsername);
        }
    }, [data.email]);

    // Get theme radius from CSS variables
    const [themeRadius, setThemeRadius] = useState('lg');
    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) setThemeRadius('none');
        else if (radiusValue <= 4) setThemeRadius('sm');
        else if (radiusValue <= 8) setThemeRadius('md');
        else if (radiusValue <= 12) setThemeRadius('lg');
        else setThemeRadius('full');
    }, []);

    // Password strength calculation
    const passwordStrength = useMemo(() => {
        const password = data.password;
        if (!password) return { score: 0, label: '', color: 'default' };

        let score = 0;
        
        // Length check
        if (password.length >= 8) score += 25;
        if (password.length >= 12) score += 10;
        if (password.length >= 16) score += 10;
        
        // Character variety checks
        if (/[a-z]/.test(password)) score += 15;
        if (/[A-Z]/.test(password)) score += 15;
        if (/[0-9]/.test(password)) score += 15;
        if (/[^a-zA-Z0-9]/.test(password)) score += 10; // Special chars
        
        // Determine label and color
        let label = '';
        let color = 'default';
        
        if (score < 40) {
            label = 'Weak';
            color = 'danger';
        } else if (score < 60) {
            label = 'Fair';
            color = 'warning';
        } else if (score < 80) {
            label = 'Good';
            color = 'primary';
        } else {
            label = 'Strong';
            color = 'success';
        }
        
        return { score, label, color };
    }, [data.password]);

    const handleSubmit = (event) => {
        event.preventDefault();
        
        const promise = new Promise((resolve, reject) => {
            post(route('admin.setup.store'), {
                onSuccess: () => {
                    resolve(['Admin account created successfully!']);
                },
                onError: (formErrors) => {
                    const errorMessages = Object.values(formErrors).flat();
                    reject(errorMessages.length > 0 ? errorMessages : ['Failed to create admin account']);
                },
            });
        });

        showToast.promise(promise, {
            loading: 'Creating your admin account...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const getCardStyle = () => ({
        border: `var(--borderWidth, 2px) solid transparent`,
        borderRadius: `var(--borderRadius, 12px)`,
        fontFamily: `var(--fontFamily, "Inter")`,
        transform: `scale(var(--scale, 1))`,
        background: `linear-gradient(135deg, 
            var(--theme-content1, #FAFAFA) 20%, 
            var(--theme-content2, #F4F4F5) 10%, 
            var(--theme-content3, #F1F3F4) 20%)`,
    });

    return (
        <>
            <Head title={title} />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                            <BuildingOfficeIcon className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Welcome to {tenant.name || 'Your Organization'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Complete your account setup to get started
                        </p>
                    </div>

                    {/* Setup Form Card */}
                    <Card style={getCardStyle()} className="shadow-xl">
                        <CardHeader 
                            className="flex flex-col gap-2 px-6 pt-6"
                            style={{ borderBottom: `1px solid var(--theme-divider, #E4E4E7)` }}
                        >
                            <h2 className="text-lg font-semibold text-foreground">
                                Create Admin Account
                            </h2>
                            <p className="text-sm text-default-500">
                                Set up your super administrator account. Use any email and phone - no verification required!
                            </p>
                        </CardHeader>

                        <form onSubmit={handleSubmit}>
                            <CardBody className="px-6 py-6 space-y-5">
                                {/* Full Name */}
                                <Input
                                    type="text"
                                    label="Full Name"
                                    placeholder="Enter your full name"
                                    value={data.name}
                                    onValueChange={(value) => setData('name', value)}
                                    isInvalid={Boolean(errors.name)}
                                    errorMessage={errors.name}
                                    isRequired
                                    radius={themeRadius}
                                    startContent={<UserIcon className="w-4 h-4 text-default-400" />}
                                    classNames={{
                                        inputWrapper: "bg-default-100"
                                    }}
                                />

                                {/* Email */}
                                <Input
                                    type="email"
                                    label="Your Email Address"
                                    placeholder="your.email@example.com"
                                    value={data.email}
                                    onValueChange={(value) => setData('email', value)}
                                    isInvalid={Boolean(errors.email)}
                                    errorMessage={errors.email}
                                    description="Your personal email for login - no verification needed"
                                    isRequired
                                    radius={themeRadius}
                                    startContent={<EnvelopeIcon className="w-4 h-4 text-default-400" />}
                                    classNames={{
                                        inputWrapper: "bg-default-100"
                                    }}
                                />

                                {/* Username */}
                                <Input
                                    type="text"
                                    label="Username"
                                    placeholder="johndoe"
                                    value={data.user_name}
                                    onValueChange={(value) => setData('user_name', value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    isInvalid={Boolean(errors.user_name)}
                                    errorMessage={errors.user_name}
                                    description="Used for internal identification (auto-generated from email)"
                                    isRequired
                                    radius={themeRadius}
                                    classNames={{
                                        inputWrapper: "bg-default-100",
                                        input: "font-mono"
                                    }}
                                />

                                {/* Phone (optional) */}
                                <Input
                                    type="tel"
                                    label="Phone Number (Optional)"
                                    placeholder="+1 234 567 8900"
                                    value={data.phone}
                                    onValueChange={(value) => setData('phone', value)}
                                    isInvalid={Boolean(errors.phone)}
                                    errorMessage={errors.phone}
                                    description="Your personal contact number - optional"
                                    radius={themeRadius}
                                    classNames={{
                                        inputWrapper: "bg-default-100"
                                    }}
                                />

                                {/* Password Fields */}
                                <div className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Input
                                            type="password"
                                            label="Password"
                                            placeholder="Create a secure password"
                                            value={data.password}
                                            onValueChange={(value) => setData('password', value)}
                                            isInvalid={Boolean(errors.password)}
                                            errorMessage={errors.password}
                                            isRequired
                                            radius={themeRadius}
                                            startContent={<LockClosedIcon className="w-4 h-4 text-default-400" />}
                                            classNames={{
                                                inputWrapper: "bg-default-100"
                                            }}
                                        />
                                        <Input
                                            type="password"
                                            label="Confirm Password"
                                            placeholder="Repeat your password"
                                            value={data.password_confirmation}
                                            onValueChange={(value) => setData('password_confirmation', value)}
                                            isInvalid={Boolean(errors.password_confirmation)}
                                            errorMessage={errors.password_confirmation}
                                            isRequired
                                            radius={themeRadius}
                                            startContent={<LockClosedIcon className="w-4 h-4 text-default-400" />}
                                            classNames={{
                                                inputWrapper: "bg-default-100"
                                            }}
                                        />
                                    </div>

                                    {/* Password Strength Indicator */}
                                    {data.password && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-default-500">Password Strength:</span>
                                                <Chip size="sm" color={passwordStrength.color} variant="flat">
                                                    {passwordStrength.label}
                                                </Chip>
                                            </div>
                                            <Progress 
                                                value={passwordStrength.score} 
                                                color={passwordStrength.color}
                                                size="sm"
                                                className="max-w-full"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Password Requirements */}
                                <div className="text-xs text-default-500 bg-default-50 p-3 rounded-lg">
                                    <p className="font-medium mb-1">Password Requirements:</p>
                                    <ul className="list-disc list-inside space-y-0.5">
                                        <li>At least 8 characters long</li>
                                        <li>Contains uppercase and lowercase letters</li>
                                        <li>Contains at least one number</li>
                                    </ul>
                                </div>
                            </CardBody>

                            <CardFooter 
                                className="px-6 pb-6"
                                style={{ borderTop: `1px solid var(--theme-divider, #E4E4E7)` }}
                            >
                                <Button 
                                    type="submit" 
                                    color="primary" 
                                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
                                    size="lg"
                                    isLoading={processing}
                                    radius={themeRadius}
                                >
                                    {processing ? 'Creating Account...' : 'Create Admin Account'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    {/* Footer */}
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                        Already have an account?{' '}
                        <a 
                            href={route('login')} 
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                        >
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </>
    );
}
