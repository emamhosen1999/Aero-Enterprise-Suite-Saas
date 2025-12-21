/**
 * Authentication Settings Page
 * 
 * Configure authentication settings for the platform.
 */

import React from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Switch, Input, Button, Divider } from '@heroui/react';
import { ShieldCheckIcon, KeyIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function Index() {
    return (
        <>
            <Head title="Authentication Settings" />
            
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <ShieldCheckIcon className="w-8 h-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold">Authentication Settings</h1>
                        <p className="text-default-500">Configure platform authentication options</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <KeyIcon className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-semibold">Password Policy</h2>
                            </div>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <Input
                                type="number"
                                label="Minimum Password Length"
                                defaultValue="8"
                                min={6}
                                max={32}
                            />
                            <Switch defaultSelected>Require uppercase letters</Switch>
                            <Switch defaultSelected>Require lowercase letters</Switch>
                            <Switch defaultSelected>Require numbers</Switch>
                            <Switch defaultSelected>Require special characters</Switch>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ClockIcon className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-semibold">Session Settings</h2>
                            </div>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <Input
                                type="number"
                                label="Session Timeout (minutes)"
                                defaultValue="120"
                            />
                            <Input
                                type="number"
                                label="Max Login Attempts"
                                defaultValue="5"
                            />
                            <Input
                                type="number"
                                label="Lockout Duration (minutes)"
                                defaultValue="15"
                            />
                            <Switch defaultSelected>Enable Remember Me</Switch>
                        </CardBody>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <Switch>Require 2FA for all admin users</Switch>
                            <Switch defaultSelected>Allow TOTP (Authenticator Apps)</Switch>
                            <Switch>Allow SMS verification</Switch>
                            <Switch>Allow Email verification</Switch>
                        </CardBody>
                    </Card>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="flat">Reset to Defaults</Button>
                    <Button color="primary">Save Changes</Button>
                </div>
            </div>
        </>
    );
}
