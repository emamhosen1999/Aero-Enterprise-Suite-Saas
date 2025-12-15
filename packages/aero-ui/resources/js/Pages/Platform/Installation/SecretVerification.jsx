import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import InstallationLayout from '@/Layouts/InstallationLayout';
import { Card, CardHeader, CardBody, CardFooter, Button, Input } from '@heroui/react';
import { ShieldCheckIcon, KeyIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';

export default function SecretVerification() {
    const { data, setData, post, processing, errors } = useForm({
        secret_code: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        post(route('installation.verify-secret'), {
            preserveScroll: true,
        });
    };

    return (
        <InstallationLayout currentStep={2}>
            <Head title="Installation - Secret Verification" />
            
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
                    <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900/30 rounded-full flex items-center justify-center">
                        <ShieldCheckIcon className="w-10 h-10 text-warning-600" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Secret Code Verification
                        </h2>
                        <p className="text-default-600">
                            Enter the installation secret code to proceed
                        </p>
                    </div>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardBody className="px-8 py-8">
                        <div className="space-y-6">
                            {/* Security notice */}
                            <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 border border-warning-200 dark:border-warning-800">
                                <div className="flex gap-3">
                                    <KeyIcon className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-warning-800 dark:text-warning-200 mb-1">
                                            Security Required
                                        </p>
                                        <p className="text-warning-700 dark:text-warning-300">
                                            This secret code was provided to you during deployment. 
                                            It ensures only authorized personnel can install the platform.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Secret code input */}
                            <div className="max-w-md mx-auto">
                                <Input
                                    type="password"
                                    label="Secret Code"
                                    placeholder="Enter installation secret code"
                                    value={data.secret_code}
                                    onValueChange={(value) => setData('secret_code', value)}
                                    isInvalid={!!errors.secret_code}
                                    errorMessage={errors.secret_code}
                                    isRequired
                                    size="lg"
                                    startContent={<KeyIcon className="w-5 h-5 text-default-400" />}
                                    classNames={{
                                        inputWrapper: "bg-default-100"
                                    }}
                                    autoFocus
                                />
                            </div>

                            {/* Instructions */}
                            <div className="bg-default-50 dark:bg-default-100/10 rounded-lg p-4">
                                <h4 className="font-semibold text-foreground mb-2 text-sm">
                                    Where to find the secret code:
                                </h4>
                                <ul className="text-sm text-default-600 space-y-1">
                                    <li>• Check your deployment documentation</li>
                                    <li>• Contact your system administrator</li>
                                    <li>• Review the installation guide provided</li>
                                </ul>
                            </div>
                        </div>
                    </CardBody>

                    <CardFooter className="flex justify-between items-center border-t border-divider px-8 py-6">
                        <Button
                            as={Link}
                            href={route('installation.index')}
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
                            isDisabled={!data.secret_code || processing}
                        >
                            Verify & Continue
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </InstallationLayout>
    );
}
