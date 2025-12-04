import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import InstallationLayout from '@/Layouts/InstallationLayout';
import { Card, CardHeader, CardBody, CardFooter, Button, Input } from '@heroui/react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';

export default function AdminAccount({ adminConfig = {} }) {
    const { data, setData, post, processing, errors } = useForm({
        name: adminConfig.name || '',
        email: adminConfig.email || '',
        password: adminConfig.password || '',
        password_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const promise = new Promise(async (resolve, reject) => {
            post(route('installation.save-admin'), {
                onSuccess: () => resolve(['Admin account configured successfully']),
                onError: (errors) => reject(Object.values(errors)),
                preserveState: true,
            });
        });

        showToast.promise(promise, {
            loading: 'Saving admin account...',
            success: (data) => data.join(', '),
            error: (err) => Array.isArray(err) ? err.join(', ') : 'Failed to save admin account',
        });
    };

    return (
        <InstallationLayout currentStep={6}>
            <Head title="Installation - Admin Account" />
            
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
                <CardHeader className="flex flex-col items-center gap-4 pt-8 pb-6 border-b border-divider">
                    <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                        <UserCircleIcon className="w-10 h-10 text-success-600" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Create Admin Account
                        </h2>
                        <p className="text-default-600">
                            Set up your platform super administrator account
                        </p>
                    </div>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardBody className="px-8 py-8">
                        <div className="space-y-6">
                            {/* Security notice */}
                            <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 border border-warning-200 dark:border-warning-800">
                                <p className="text-sm text-warning-800 dark:text-warning-200">
                                    <strong>Important:</strong> This account will have full platform access with Super Administrator privileges. 
                                    Choose a strong password and keep credentials secure.
                                </p>
                            </div>

                            {/* Admin account fields */}
                            <div className="space-y-4">
                                <Input
                                    label="Full Name"
                                    placeholder="John Doe"
                                    value={data.name}
                                    onValueChange={(value) => setData('name', value)}
                                    isInvalid={!!errors.name}
                                    errorMessage={errors.name}
                                    isRequired
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />

                                <Input
                                    type="email"
                                    label="Email Address"
                                    placeholder="admin@your-domain.com"
                                    value={data.email}
                                    onValueChange={(value) => setData('email', value)}
                                    isInvalid={!!errors.email}
                                    errorMessage={errors.email}
                                    isRequired
                                    description="You will use this email to log in"
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />

                                <Input
                                    type="password"
                                    label="Password"
                                    placeholder="Enter a strong password"
                                    value={data.password}
                                    onValueChange={(value) => setData('password', value)}
                                    isInvalid={!!errors.password}
                                    errorMessage={errors.password}
                                    isRequired
                                    description="Minimum 8 characters, include letters and numbers"
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />

                                <Input
                                    type="password"
                                    label="Confirm Password"
                                    placeholder="Re-enter your password"
                                    value={data.password_confirmation}
                                    onValueChange={(value) => setData('password_confirmation', value)}
                                    isInvalid={!!errors.password_confirmation}
                                    errorMessage={errors.password_confirmation}
                                    isRequired
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            </div>

                            {/* Password requirements */}
                            <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-4">
                                <h4 className="font-semibold text-foreground mb-2 text-sm">
                                    Password Requirements:
                                </h4>
                                <ul className="text-sm text-default-600 space-y-1">
                                    <li>• Minimum 8 characters</li>
                                    <li>• At least one uppercase letter</li>
                                    <li>• At least one lowercase letter</li>
                                    <li>• At least one number</li>
                                    <li>• Special characters recommended</li>
                                </ul>
                            </div>
                        </div>
                    </CardBody>

                    <CardFooter className="flex justify-between items-center border-t border-divider px-8 py-6">
                        <Button
                            as="a"
                            href={route('installation.platform')}
                            variant="flat"
                            color="default"
                            isDisabled={processing}
                        >
                            Back
                        </Button>
                        <Button
                            type="submit"
                            color="primary"
                            isLoading={processing}
                            isDisabled={processing}
                        >
                            Continue
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </InstallationLayout>
    );
}
