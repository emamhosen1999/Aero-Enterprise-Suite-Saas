import React, { useEffect, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Button, Card, CardBody, CardHeader, Chip, Input, Spinner } from "@heroui/react";
import { 
    EnvelopeIcon, 
    LockClosedIcon, 
    UserIcon, 
    EyeIcon, 
    EyeSlashIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
} from "@heroicons/react/24/outline";

export default function AcceptInvitation({ invitation, token, errors: serverErrors }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token || '',
        password: '',
        password_confirmation: '',
    });

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

    const themeRadius = getThemeRadius();

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('invitation.accept', { token }), {
            onSuccess: () => {
                // Will redirect to dashboard on success
            },
            onError: () => {
                reset('password', 'password_confirmation');
            },
        });
    };

    // Password strength indicator
    const getPasswordStrength = (password) => {
        if (!password) return { score: 0, label: '', color: '' };
        
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        if (score <= 2) return { score, label: 'Weak', color: 'danger' };
        if (score <= 3) return { score, label: 'Fair', color: 'warning' };
        if (score <= 4) return { score, label: 'Good', color: 'primary' };
        return { score, label: 'Strong', color: 'success' };
    };

    const passwordStrength = getPasswordStrength(data.password);

    if (!invitation) {
        return (
            <GuestLayout>
                <Head title="Invalid Invitation" />
                <Card className="w-full max-w-md mx-auto">
                    <CardBody className="text-center py-12">
                        <ExclamationCircleIcon className="w-16 h-16 text-danger mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-danger mb-2">Invalid Invitation</h2>
                        <p className="text-default-500">
                            This invitation link is invalid or has expired.
                        </p>
                    </CardBody>
                </Card>
            </GuestLayout>
        );
    }

    return (
        <GuestLayout>
            <Head title="Accept Invitation" />
            
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card 
                    className="w-full max-w-lg transition-all duration-200"
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
                    <CardHeader 
                        className="flex flex-col items-center gap-3 pt-8 pb-4"
                        style={{
                            borderBottom: `1px solid var(--theme-divider, #E4E4E7)`,
                        }}
                    >
                        <div 
                            className="p-4 rounded-full"
                            style={{
                                background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                            }}
                        >
                            <EnvelopeIcon 
                                className="w-10 h-10" 
                                style={{ color: 'var(--theme-primary)' }}
                            />
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-bold">Welcome!</h1>
                            <p className="text-default-500 mt-1">
                                You've been invited to join the team
                            </p>
                        </div>
                    </CardHeader>

                    <CardBody className="p-6">
                        {/* Invitation Details */}
                        <div className="bg-default-100 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-3 mb-3">
                                <UserIcon className="w-5 h-5 text-default-500" />
                                <div>
                                    <p className="text-sm text-default-500">Invited as</p>
                                    <p className="font-medium">{invitation.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <EnvelopeIcon className="w-5 h-5 text-default-500" />
                                <div>
                                    <p className="text-sm text-default-500">Email</p>
                                    <p className="font-medium">{invitation.email}</p>
                                </div>
                            </div>
                            {invitation.roles && invitation.roles.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="text-sm text-default-500">Roles:</span>
                                    {invitation.roles.map((role, index) => (
                                        <Chip 
                                            key={index} 
                                            size="sm" 
                                            color="primary" 
                                            variant="flat"
                                        >
                                            {role}
                                        </Chip>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Password Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-sm text-default-600 mb-4">
                                Please create a secure password for your account.
                            </p>

                            <Input
                                label="Password"
                                placeholder="Create a strong password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onValueChange={(value) => setData('password', value)}
                                isInvalid={!!errors.password}
                                errorMessage={errors.password}
                                isRequired
                                radius={themeRadius}
                                startContent={<LockClosedIcon className="w-4 h-4 text-default-400" />}
                                endContent={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="w-4 h-4 text-default-400" />
                                        ) : (
                                            <EyeIcon className="w-4 h-4 text-default-400" />
                                        )}
                                    </button>
                                }
                                classNames={{
                                    inputWrapper: "bg-default-100"
                                }}
                            />

                            {/* Password Strength Indicator */}
                            {data.password && (
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-default-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full bg-${passwordStrength.color} transition-all duration-300`}
                                            style={{ 
                                                width: `${(passwordStrength.score / 5) * 100}%`,
                                                backgroundColor: passwordStrength.color === 'success' ? '#17c964' :
                                                    passwordStrength.color === 'primary' ? '#006FEE' :
                                                    passwordStrength.color === 'warning' ? '#f5a524' : '#f31260'
                                            }}
                                        />
                                    </div>
                                    <Chip 
                                        size="sm" 
                                        color={passwordStrength.color}
                                        variant="flat"
                                    >
                                        {passwordStrength.label}
                                    </Chip>
                                </div>
                            )}

                            <Input
                                label="Confirm Password"
                                placeholder="Confirm your password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={data.password_confirmation}
                                onValueChange={(value) => setData('password_confirmation', value)}
                                isInvalid={!!errors.password_confirmation}
                                errorMessage={errors.password_confirmation}
                                isRequired
                                radius={themeRadius}
                                startContent={<LockClosedIcon className="w-4 h-4 text-default-400" />}
                                endContent={
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="focus:outline-none"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeSlashIcon className="w-4 h-4 text-default-400" />
                                        ) : (
                                            <EyeIcon className="w-4 h-4 text-default-400" />
                                        )}
                                    </button>
                                }
                                classNames={{
                                    inputWrapper: "bg-default-100"
                                }}
                            />

                            {/* Password Requirements */}
                            <div className="text-xs text-default-500 space-y-1">
                                <p className="font-medium">Password must contain:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li className={data.password.length >= 8 ? 'text-success' : ''}>
                                        At least 8 characters
                                    </li>
                                    <li className={/[a-z]/.test(data.password) && /[A-Z]/.test(data.password) ? 'text-success' : ''}>
                                        Upper and lowercase letters
                                    </li>
                                    <li className={/\d/.test(data.password) ? 'text-success' : ''}>
                                        At least one number
                                    </li>
                                    <li className={/[^a-zA-Z0-9]/.test(data.password) ? 'text-success' : ''}>
                                        At least one special character
                                    </li>
                                </ul>
                            </div>

                            {/* Server Errors */}
                            {serverErrors?.general && (
                                <div className="p-3 bg-danger-50 text-danger rounded-lg text-sm">
                                    {serverErrors.general}
                                </div>
                            )}

                            <Button
                                type="submit"
                                color="primary"
                                size="lg"
                                className="w-full mt-4"
                                isLoading={processing}
                                startContent={!processing && <CheckCircleIcon className="w-5 h-5" />}
                            >
                                {processing ? 'Creating Account...' : 'Accept & Create Account'}
                            </Button>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </GuestLayout>
    );
}
