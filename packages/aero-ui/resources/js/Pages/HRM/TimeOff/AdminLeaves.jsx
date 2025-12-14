import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function AdminLeaves({ auth }) {
    return (
        <AuthenticatedLayout user={auth?.user}>
            <Head title="Leave Administration" />
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-4">Leave Administration</h1>
                <p>This page is under development.</p>
            </div>
        </AuthenticatedLayout>
    );
}
