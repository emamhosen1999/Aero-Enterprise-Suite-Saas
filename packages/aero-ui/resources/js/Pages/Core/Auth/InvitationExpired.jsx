import React from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';

export default function InvitationExpired() {
    return (
        <GuestLayout>
            <Head title="Invitation Expired" />
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-4">Invitation Expired</h1>
                <p>This invitation has expired.</p>
            </div>
        </GuestLayout>
    );
}
