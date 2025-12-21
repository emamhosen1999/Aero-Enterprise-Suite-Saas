/**
 * Create User Page
 * 
 * Form for creating a new user.
 * TODO: Implement full create user form with HeroUI components.
 */

import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button, Input, Card, CardBody, CardHeader, Select, SelectItem } from '@heroui/react';
import { UserIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function Create({ roles }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [],
    });

    const submit = (e) => {
        e.preventDefault();
        post('/users');
    };

    return (
        <>
            <Head title="Create User" />
            
            <div className="p-6">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <h1 className="text-2xl font-bold">Create User</h1>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={submit} className="flex flex-col gap-4">
                            <Input
                                label="Name"
                                placeholder="Enter name"
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
                                placeholder="Enter email"
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
                                placeholder="Enter password"
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
                                placeholder="Confirm password"
                                value={data.password_confirmation}
                                onValueChange={(value) => setData('password_confirmation', value)}
                                isInvalid={!!errors.password_confirmation}
                                errorMessage={errors.password_confirmation}
                                startContent={<LockClosedIcon className="w-5 h-5 text-default-400" />}
                                isRequired
                            />

                            {roles && (
                                <Select
                                    label="Roles"
                                    placeholder="Select roles"
                                    selectionMode="multiple"
                                    selectedKeys={new Set(data.roles)}
                                    onSelectionChange={(keys) => setData('roles', Array.from(keys))}
                                    isInvalid={!!errors.roles}
                                    errorMessage={errors.roles}
                                >
                                    {roles.map((role) => (
                                        <SelectItem key={role.name}>{role.name}</SelectItem>
                                    ))}
                                </Select>
                            )}
                            
                            <div className="flex gap-2 mt-4">
                                <Button
                                    type="submit"
                                    color="primary"
                                    isLoading={processing}
                                >
                                    Create User
                                </Button>
                                <Link href="/users">
                                    <Button variant="flat">Cancel</Button>
                                </Link>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </>
    );
}
