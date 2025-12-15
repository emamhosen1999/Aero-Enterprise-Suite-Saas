import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Divider,
    Chip,
} from '@heroui/react';
import {
    UserPlus,
    Mail,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    Building2,
} from 'lucide-react';
import { showToast } from '@/utils/toastUtils';

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

export default function AcceptInvitation({ invitation, organization_name }) {
    const [themeRadius, setThemeRadius] = useState('lg');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setThemeRadius(getThemeRadius());
        }
    }, []);

    const form = useForm({
        name: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        form.post(route('team.invitation.process', { token: invitation.token }), {
            onSuccess: () => {
                showToast.success('Welcome! Your account has been created.');
            },
            onError: (errors) => {
                if (errors.token) {
                    showToast.error(errors.token);
                }
            },
        });
    };

    return (
        <>
            <Head title="Accept Invitation" />
            
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-50 to-default-100 dark:from-default-900 dark:to-black p-4">
                <Card
                    className="w-full max-w-md"
                    radius={themeRadius}
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
                    <CardHeader className="flex flex-col items-center gap-3 pt-8 pb-4">
                        <div className="p-4 rounded-full bg-primary/10">
                            <UserPlus className="w-8 h-8 text-primary" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-foreground">Join {organization_name}</h1>
                            <p className="text-sm text-default-500 mt-1">
                                You've been invited by {invitation.inviter_name}
                            </p>
                        </div>
                    </CardHeader>

                    <Divider />

                    <CardBody className="px-6 py-6">
                        {/* Invitation Details */}
                        <div className="mb-6 p-4 rounded-lg bg-default-50 dark:bg-default-100/50 space-y-2">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-default-400" />
                                <span className="text-sm text-default-600">{invitation.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-default-400" />
                                <span className="text-sm text-default-600">Role: </span>
                                <Chip size="sm" color="primary" variant="flat" className="capitalize">
                                    {invitation.role.replace(/-/g, ' ')}
                                </Chip>
                            </div>
                            <p className="text-xs text-default-400">
                                Invitation expires on {invitation.expires_at}
                            </p>
                        </div>

                        {/* Registration Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Your Name"
                                placeholder="Enter your full name"
                                value={form.data.name}
                                onValueChange={(v) => form.setData('name', v)}
                                isInvalid={!!form.errors.name}
                                errorMessage={form.errors.name}
                                isRequired
                                radius={themeRadius}
                                startContent={<UserPlus className="w-4 h-4 text-default-400" />}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Input
                                label="Password"
                                placeholder="Create a password"
                                type={showPassword ? 'text' : 'password'}
                                value={form.data.password}
                                onValueChange={(v) => form.setData('password', v)}
                                isInvalid={!!form.errors.password}
                                errorMessage={form.errors.password}
                                isRequired
                                radius={themeRadius}
                                startContent={<Lock className="w-4 h-4 text-default-400" />}
                                endContent={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4 text-default-400" />
                                        ) : (
                                            <Eye className="w-4 h-4 text-default-400" />
                                        )}
                                    </button>
                                }
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Input
                                label="Confirm Password"
                                placeholder="Confirm your password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={form.data.password_confirmation}
                                onValueChange={(v) => form.setData('password_confirmation', v)}
                                isInvalid={!!form.errors.password_confirmation}
                                errorMessage={form.errors.password_confirmation}
                                isRequired
                                radius={themeRadius}
                                startContent={<Lock className="w-4 h-4 text-default-400" />}
                                endContent={
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="focus:outline-none"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-4 h-4 text-default-400" />
                                        ) : (
                                            <Eye className="w-4 h-4 text-default-400" />
                                        )}
                                    </button>
                                }
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            {form.errors.error && (
                                <p className="text-sm text-danger">{form.errors.error}</p>
                            )}

                            <Button
                                type="submit"
                                color="primary"
                                size="lg"
                                radius={themeRadius}
                                className="w-full mt-6"
                                isLoading={form.processing}
                                startContent={!form.processing && <CheckCircle2 className="w-5 h-5" />}
                            >
                                Create Account & Join
                            </Button>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </>
    );
}
