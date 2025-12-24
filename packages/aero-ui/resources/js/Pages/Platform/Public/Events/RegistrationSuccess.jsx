import React from 'react';
import { Head, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import {
    Card,
    CardBody,
    Button,
    Divider
} from "@heroui/react";
import {
    CheckCircleIcon,
    PrinterIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';

// Helper function to get theme radius from CSS variable
const getThemeRadius = () => {
    const borderRadius = getComputedStyle(document.documentElement)
        .getPropertyValue('--borderRadius')
        .trim();
    return borderRadius || 'md';
};

const RegistrationSuccess = ({ event, registration }) => {
    const handlePrint = () => {
        window.print();
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-background flex items-center justify-center p-4">
            <Head title="Registration Successful" />
            
            <Card className="max-w-2xl w-full" radius={getThemeRadius()}>
                <CardBody className="p-8 text-center">
                    <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon className="w-12 h-12 text-success" />
                    </div>
                    
                    <h1 className="text-3xl font-bold mb-3">Registration Successful!</h1>
                    <p className="text-lg text-default-600 mb-8">
                        Thank you for registering for <span className="font-semibold">{event.title}</span>
                    </p>
                    
                    <Divider className="my-6" />
                    
                    <div className="bg-default-100 p-6 rounded-lg mb-8">
                        <p className="text-sm text-default-600 mb-2">Your Registration Token</p>
                        <p className="text-3xl font-mono font-bold text-primary">{registration.token}</p>
                        <p className="text-xs text-default-500 mt-3">
                            Please save this token. You'll need it to check your registration status.
                        </p>
                    </div>
                    
                    {/* Registration Details */}
                    <div className="text-left space-y-3 mb-8">
                        <div className="flex justify-between">
                            <span className="text-default-600">Name:</span>
                            <span className="font-medium">{registration.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-default-600">Email:</span>
                            <span className="font-medium">{registration.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-default-600">Phone:</span>
                            <span className="font-medium">{registration.phone}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-default-600">Status:</span>
                            <span className="font-medium capitalize">{registration.status}</span>
                        </div>
                        {registration.sub_events && registration.sub_events.length > 0 && (
                            <div>
                                <p className="text-default-600 mb-2">Sub-Events:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    {registration.sub_events.map((se, i) => (
                                        <li key={i} className="text-sm">{se.title}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                        <p className="text-sm text-blue-900">
                            <strong>What's Next?</strong><br />
                            Your registration is currently <strong>{registration.status}</strong>. 
                            {registration.status === 'pending' && ' The organizers will review your registration and notify you via email.'}
                            {registration.status === 'approved' && ' You can now print your registration token for the event.'}
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                            variant="flat"
                            startContent={<ArrowLeftIcon className="w-4 h-4" />}
                            onPress={() => router.get(route('public.events.index'))}
                            radius={getThemeRadius()}
                        >
                            Back to Events
                        </Button>
                        <Button
                            color="primary"
                            startContent={<PrinterIcon className="w-4 h-4" />}
                            onPress={handlePrint}
                            radius={getThemeRadius()}
                        >
                            Print Token
                        </Button>
                    </div>
                    
                    <p className="text-xs text-default-500 mt-6">
                        A confirmation email has been sent to {registration.email}
                    </p>
                </CardBody>
            </Card>
        </div>
    );
};

export default RegistrationSuccess;
