/**
 * Show User Page
 * 
 * Display user details.
 * TODO: Implement full user detail view with HeroUI components.
 */

import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, CardBody, CardHeader, Chip, Divider } from '@heroui/react';
import { UserIcon, EnvelopeIcon, ShieldCheckIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function Show({ user }) {
    return (
        <>
            <Head title={user?.name || 'User Details'} />
            
            <div className="p-6">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">{user?.name || 'User Details'}</h1>
                        <Link href={`/users/${user?.id}/edit`}>
                            <Button color="primary" startContent={<PencilIcon className="w-4 h-4" />}>
                                Edit
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardBody className="gap-4">
                        <div className="flex items-center gap-3">
                            <UserIcon className="w-5 h-5 text-default-400" />
                            <div>
                                <p className="text-sm text-default-500">Name</p>
                                <p className="font-medium">{user?.name}</p>
                            </div>
                        </div>
                        
                        <Divider />
                        
                        <div className="flex items-center gap-3">
                            <EnvelopeIcon className="w-5 h-5 text-default-400" />
                            <div>
                                <p className="text-sm text-default-500">Email</p>
                                <p className="font-medium">{user?.email}</p>
                            </div>
                        </div>
                        
                        <Divider />
                        
                        <div className="flex items-start gap-3">
                            <ShieldCheckIcon className="w-5 h-5 text-default-400 mt-1" />
                            <div>
                                <p className="text-sm text-default-500 mb-2">Roles</p>
                                <div className="flex flex-wrap gap-2">
                                    {user?.roles?.map((role) => (
                                        <Chip key={role.id || role.name} color="primary" variant="flat">
                                            {role.name}
                                        </Chip>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <Divider />
                        
                        <div className="flex gap-2 mt-4">
                            <Link href="/users">
                                <Button variant="flat">Back to Users</Button>
                            </Link>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </>
    );
}
