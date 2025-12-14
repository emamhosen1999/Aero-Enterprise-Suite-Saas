import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function HRMDashboard({ auth }) {
    return (
        <AuthenticatedLayout user={auth?.user}>
            <Head title="HRM Dashboard" />
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-4">HRM Dashboard</h1>
                <p>This page is under development.</p>
            </div>
        </AuthenticatedLayout>
    );
}
