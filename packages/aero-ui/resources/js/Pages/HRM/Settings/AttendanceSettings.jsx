import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function AttendanceSettings({ auth }) {
    return (
        <AuthenticatedLayout user={auth?.user}>
            <Head title="Attendance Settings" />
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-4">Attendance Settings</h1>
                <p>This page is under development.</p>
            </div>
        </AuthenticatedLayout>
    );
}
