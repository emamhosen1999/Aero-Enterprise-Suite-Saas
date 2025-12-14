import React from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';

export default function AcceptInvitation() {
    return (
        <GuestLayout>
            <Head title="Accept Invitation" />
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-4">Accept Invitation</h1>
                <p>This page is under development.</p>
            </div>
        </GuestLayout>
    );
}
