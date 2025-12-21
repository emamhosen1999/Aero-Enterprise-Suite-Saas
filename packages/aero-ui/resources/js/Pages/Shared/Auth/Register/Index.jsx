/**
 * Register Page
 * 
 * User registration page for new tenant users.
 * TODO: Implement registration form with HeroUI components.
 */

import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button, Input, Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <>
            <Head title="Register" />
            
            <div className="min-h-screen flex items-center justify-center p-4 bg-default-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="flex flex-col gap-1 pb-0">
                        <h1 className="text-2xl font-bold">Create Account</h1>
                        <p className="text-default-500">Sign up for a new account</p>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={submit} className="flex flex-col gap-4">
                            <Input
                                label="Name"
                                placeholder="Enter your name"
                                value={data.name}
                                onValueChange={(value) => setData('name', value)}
                                isInvalid={!!errors.name}
                                errorMessage={errors.name}
                                startContent={<UserIcon className="w-5 h-5 text-default-400" />}
                                isRequired
                            />
                            
                            <Input
                                type="email"
                                label="Email"
                                placeholder="Enter your email"
                                value={data.email}
                                onValueChange={(value) => setData('email', value)}
                                isInvalid={!!errors.email}
                                errorMessage={errors.email}
                                startContent={<EnvelopeIcon className="w-5 h-5 text-default-400" />}
                                isRequired
                            />
                            
                            <Input
                                type="password"
                                label="Password"
                                placeholder="Create a password"
                                value={data.password}
                                onValueChange={(value) => setData('password', value)}
                                isInvalid={!!errors.password}
                                errorMessage={errors.password}
                                startContent={<LockClosedIcon className="w-5 h-5 text-default-400" />}
                                isRequired
                            />
                            
                            <Input
                                type="password"
                                label="Confirm Password"
                                placeholder="Confirm your password"
                                value={data.password_confirmation}
                                onValueChange={(value) => setData('password_confirmation', value)}
                                isInvalid={!!errors.password_confirmation}
                                errorMessage={errors.password_confirmation}
                                startContent={<LockClosedIcon className="w-5 h-5 text-default-400" />}
                                isRequired
                            />
                            
                            <Button
                                type="submit"
                                color="primary"
                                isLoading={processing}
                                className="w-full mt-2"
                            >
                                Register
                            </Button>
                            
                            <Divider className="my-2" />
                            
                            <p className="text-center text-default-500">
                                Already have an account?{' '}
                                <Link href="/login" className="text-primary hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </>
    );
}
