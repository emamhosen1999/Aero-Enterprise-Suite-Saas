import React, { useState } from 'react';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import StandaloneInstallationLayout from '@/Layouts/StandaloneInstallationLayout';
import { Card, CardHeader, CardBody, CardFooter, Button, Input } from '@heroui/react';
import { 
    UserCircleIcon, 
    ArrowLeftIcon,
    CheckCircleIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

export default function Admin() {
    const { title, step, totalSteps } = usePage().props;
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [processing, setProcessing] = useState(false);

    const { data, setData, errors, setError, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);
    const toggleConfirmPasswordVisibility = () => setIsConfirmPasswordVisible(!isConfirmPasswordVisible);

    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 8) errors.push('Minimum 8 characters');
        if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
        if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
        if (!/[0-9]/.test(password)) errors.push('At least one number');
        return errors;
    };

    const handleSubmit = async () => {
        clearErrors();
        
        // Validate
        let hasErrors = false;
        
        if (!data.name.trim()) {
            setError('name', 'Name is required');
            hasErrors = true;
        }
        
        if (!data.email.trim()) {
            setError('email', 'Email is required');
            hasErrors = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            setError('email', 'Please enter a valid email address');
            hasErrors = true;
        }
        
        const passwordErrors = validatePassword(data.password);
        if (passwordErrors.length > 0) {
            setError('password', passwordErrors.join(', '));
            hasErrors = true;
        }
        
        if (data.password !== data.password_confirmation) {
            setError('password_confirmation', 'Passwords do not match');
            hasErrors = true;
        }
        
        if (hasErrors) return;

        setProcessing(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('installation.admin.store'), data);
                
                if (response.data.success) {
                    // Disable the beforeunload warning
                    if (window.disableInstallationWarning) {
                        window.disableInstallationWarning();
                    }
                    resolve(['Super Administrator created successfully!']);
                    
                    // Redirect to complete page
                    setTimeout(() => {
                        router.visit(route('installation.complete'));
                    }, 1000);
                } else {
                    reject([response.data.message || 'Failed to create admin']);
                }
            } catch (error) {
                const errors = error.response?.data?.errors;
                if (errors) {
                    Object.keys(errors).forEach(key => {
                        setError(key, errors[key][0]);
                    });
                    reject(Object.values(errors).flat());
                } else {
                    reject([error.response?.data?.message || 'An error occurred']);
                }
            } finally {
                setProcessing(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Creating Super Administrator...',
            success: (data) => data.join(', '),
            error: (err) => Array.isArray(err) ? err.join(', ') : err,
        });
    };

    const handleBack = () => {
        router.visit(route('installation.seeding'));
    };

    return (
        <StandaloneInstallationLayout currentStep={step} totalSteps={totalSteps}>
            <Head title={title} />
            
            <Card 
                className="transition-all duration-200"
                style={{
                    border: `var(--borderWidth, 2px) solid transparent`,
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}
            >
                <CardHeader className="flex flex-col items-center gap-4 pt-8 pb-6 border-b border-divider">
                    <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                        <UserCircleIcon className="w-10 h-10 text-success-600" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Create Super Administrator
                        </h2>
                        <p className="text-default-600">
                            Set up your first administrator account
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 py-8">
                    <div className="space-y-6">
                        {/* Security notice */}
                        <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 border border-warning-200 dark:border-warning-800">
                            <p className="text-sm text-warning-800 dark:text-warning-200">
                                <strong>Important:</strong> This account will have full system access with Super Administrator privileges. 
                                Choose a strong password and keep your credentials secure.
                            </p>
                        </div>

                        {/* Admin account fields */}
                        <div className="space-y-5">
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
                                placeholder="admin@example.com"
                                value={data.email}
                                onValueChange={(value) => setData('email', value)}
                                isInvalid={!!errors.email}
                                errorMessage={errors.email}
                                isRequired
                                description="You will use this email to log in"
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Input
                                type={isPasswordVisible ? "text" : "password"}
                                label="Password"
                                placeholder="Enter a strong password"
                                value={data.password}
                                onValueChange={(value) => setData('password', value)}
                                isInvalid={!!errors.password}
                                errorMessage={errors.password}
                                isRequired
                                classNames={{ inputWrapper: "bg-default-100" }}
                                endContent={
                                    <button 
                                        type="button" 
                                        onClick={togglePasswordVisibility}
                                        className="focus:outline-none"
                                    >
                                        {isPasswordVisible ? (
                                            <EyeSlashIcon className="w-5 h-5 text-default-400" />
                                        ) : (
                                            <EyeIcon className="w-5 h-5 text-default-400" />
                                        )}
                                    </button>
                                }
                            />

                            <Input
                                type={isConfirmPasswordVisible ? "text" : "password"}
                                label="Confirm Password"
                                placeholder="Re-enter your password"
                                value={data.password_confirmation}
                                onValueChange={(value) => setData('password_confirmation', value)}
                                isInvalid={!!errors.password_confirmation}
                                errorMessage={errors.password_confirmation}
                                isRequired
                                classNames={{ inputWrapper: "bg-default-100" }}
                                endContent={
                                    <button 
                                        type="button" 
                                        onClick={toggleConfirmPasswordVisibility}
                                        className="focus:outline-none"
                                    >
                                        {isConfirmPasswordVisible ? (
                                            <EyeSlashIcon className="w-5 h-5 text-default-400" />
                                        ) : (
                                            <EyeIcon className="w-5 h-5 text-default-400" />
                                        )}
                                    </button>
                                }
                            />
                        </div>

                        {/* Password requirements */}
                        <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-4">
                            <h4 className="font-semibold text-foreground mb-3 text-sm">
                                Password Requirements:
                            </h4>
                            <ul className="text-sm text-default-600 space-y-1">
                                <li className={`flex items-center gap-2 ${data.password.length >= 8 ? 'text-success' : ''}`}>
                                    {data.password.length >= 8 ? (
                                        <CheckCircleIcon className="w-4 h-4" />
                                    ) : (
                                        <span className="w-4 h-4 rounded-full border border-default-300" />
                                    )}
                                    Minimum 8 characters
                                </li>
                                <li className={`flex items-center gap-2 ${/[A-Z]/.test(data.password) ? 'text-success' : ''}`}>
                                    {/[A-Z]/.test(data.password) ? (
                                        <CheckCircleIcon className="w-4 h-4" />
                                    ) : (
                                        <span className="w-4 h-4 rounded-full border border-default-300" />
                                    )}
                                    At least one uppercase letter
                                </li>
                                <li className={`flex items-center gap-2 ${/[a-z]/.test(data.password) ? 'text-success' : ''}`}>
                                    {/[a-z]/.test(data.password) ? (
                                        <CheckCircleIcon className="w-4 h-4" />
                                    ) : (
                                        <span className="w-4 h-4 rounded-full border border-default-300" />
                                    )}
                                    At least one lowercase letter
                                </li>
                                <li className={`flex items-center gap-2 ${/[0-9]/.test(data.password) ? 'text-success' : ''}`}>
                                    {/[0-9]/.test(data.password) ? (
                                        <CheckCircleIcon className="w-4 h-4" />
                                    ) : (
                                        <span className="w-4 h-4 rounded-full border border-default-300" />
                                    )}
                                    At least one number
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardBody>

                <CardFooter className="flex justify-between items-center border-t border-divider px-8 py-6">
                    <Button
                        variant="flat"
                        color="default"
                        onPress={handleBack}
                        startContent={<ArrowLeftIcon className="w-4 h-4" />}
                        isDisabled={processing}
                    >
                        Back
                    </Button>
                    <Button
                        color="success"
                        onPress={handleSubmit}
                        isLoading={processing}
                        endContent={!processing && <CheckCircleIcon className="w-4 h-4" />}
                    >
                        {processing ? 'Creating...' : 'Create Administrator'}
                    </Button>
                </CardFooter>
            </Card>
        </StandaloneInstallationLayout>
    );
}
